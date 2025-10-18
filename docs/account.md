# Angular Fire + Delon ACL 實現 GitHub 式權限系統

完整的 GitHub 式多層級權限系統架構，使用 Account 統一模型。

## 一、資料結構設計 (Firestore)

```typescript
// src/app/core/models/auth.model.ts

// Account 基礎介面 - GitHub 的核心概念
export interface Account {
  id: string;
  type: 'user' | 'organization';  // 使用 type 區分用戶和組織
  login: string;                   // GitHub 的唯一識別碼 (username/org-slug)
  name: string;
  avatarURL?: string;
  email?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User 繼承 Account
export interface User extends Account {
  type: 'user';
  uid: string;  // Firebase Auth UID
  displayName: string;
  photoURL?: string;
}

// Organization 繼承 Account
export interface Organization extends Account {
  type: 'organization';
  description?: string;
  ownerId: string; // 組織擁有者
  settings: {
    defaultMemberRole: OrgRole;
    visibility: 'public' | 'private';
  };
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: TeamPermissions;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: Date;
  invitedBy?: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  addedBy?: string;
}

// 組織層級角色
export enum OrgRole {
  OWNER = 'owner',           // 擁有者 - 完整控制權
  ADMIN = 'admin',           // 管理員 - 可管理成員和設定
  MEMBER = 'member',         // 成員 - 基本權限
  BILLING = 'billing',       // 帳務管理員
  OUTSIDE_COLLABORATOR = 'outside_collaborator' // 外部協作者
}

// 團隊層級角色
export enum TeamRole {
  MAINTAINER = 'maintainer', // 維護者
  MEMBER = 'member'          // 成員
}

// 細粒度權限
export interface TeamPermissions {
  repository: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  issues: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  pullRequests: {
    read: boolean;
    write: boolean;
    merge: boolean;
  };
}

// ACL 能力定義
export interface ACLAbility {
  action: string;      // 'read', 'write', 'delete', 'admin'
  resource: string;    // 'organization', 'team', 'repository', 'member'
}
```

## 二、Firestore 集合結構

```
/accounts/{accountId}
  - type: 'user' | 'organization'
  - login: string (唯一)
  - name: string
  - ...

/accounts/{orgId}/members/{memberId}
  - organizationId: string
  - userId: string
  - role: OrgRole
  - joinedAt: Date

/accounts/{orgId}/teams/{teamId}
  - organizationId: string
  - name: string
  - slug: string
  - permissions: TeamPermissions

/accounts/{orgId}/teams/{teamId}/members/{memberId}
  - teamId: string
  - userId: string
  - role: TeamRole
```

## 三、Auth Service 實現

```typescript
// src/app/core/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  authState, 
  signInWithPopup, 
  signOut,
  GoogleAuthProvider,
  User as FirebaseUser
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  collection,
  collectionData,
  query,
  where,
  setDoc,
  DocumentData
} from '@angular/fire/firestore';
import { Observable, of, switchMap, map, combineLatest } from 'rxjs';
import { User, Organization, Account } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // 當前登入用戶
  currentUser$ = authState(this.auth).pipe(
    switchMap(firebaseUser => {
      if (!firebaseUser) return of(null);
      const userDoc = doc(this.firestore, `accounts/${firebaseUser.uid}`);
      return docData(userDoc, { idField: 'id' }).pipe(
        map(data => {
          if (data && data['type'] === 'user') {
            return data as User;
          }
          return null;
        })
      );
    })
  );

  // 用戶所屬的所有組織
  userOrganizations$ = this.currentUser$.pipe(
    switchMap(user => {
      if (!user) return of([]);
      
      // 查詢所有組織類型的 accounts
      const orgsQuery = query(
        collection(this.firestore, 'accounts'),
        where('type', '==', 'organization')
      );
      
      return collectionData(orgsQuery, { idField: 'id' }).pipe(
        switchMap((orgs: DocumentData[]) => {
          if (orgs.length === 0) return of([]);
          
          // 檢查用戶在每個組織的成員資格
          const memberChecks = orgs.map(org =>
            this.checkMembership(org['id'], user.uid).pipe(
              map(isMember => ({ org: org as Organization, isMember }))
            )
          );
          return combineLatest(memberChecks);
        }),
        map(results => results.filter(r => r.isMember).map(r => r.org))
      );
    })
  );

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    await this.syncUserProfile(credential.user);
    return credential;
  }

  async signOut() {
    await signOut(this.auth);
  }

  private async syncUserProfile(firebaseUser: FirebaseUser) {
    const userRef = doc(this.firestore, `accounts/${firebaseUser.uid}`);
    const login = firebaseUser.email?.split('@')[0] || firebaseUser.uid;
    
    await setDoc(userRef, {
      id: firebaseUser.uid,
      type: 'user',
      login: login,
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || login,
      displayName: firebaseUser.displayName || login,
      email: firebaseUser.email,
      avatarURL: firebaseUser.photoURL,
      photoURL: firebaseUser.photoURL,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
  }

  private checkMembership(orgId: string, userId: string): Observable<boolean> {
    const memberDoc = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    return docData(memberDoc).pipe(
      map(data => !!data)
    );
  }
}
```

## 四、Organization Service

```typescript
// src/app/core/services/organization.service.ts

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  collection,
  collectionData,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  DocumentData
} from '@angular/fire/firestore';
import { Observable, map, switchMap, combineLatest, from, of } from 'rxjs';
import { 
  Organization, 
  OrganizationMember, 
  Team,
  TeamMember,
  OrgRole,
  TeamRole 
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private firestore = inject(Firestore);

  // 建立組織
  async createOrganization(
    name: string, 
    login: string, 
    ownerId: string
  ): Promise<string> {
    const orgId = doc(collection(this.firestore, 'accounts')).id;
    
    await setDoc(doc(this.firestore, `accounts/${orgId}`), {
      id: orgId,
      type: 'organization',
      login: login,
      name: name,
      ownerId: ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        defaultMemberRole: OrgRole.MEMBER,
        visibility: 'private'
      }
    });

    // 自動加入擁有者為成員
    await this.addOrganizationMember(orgId, ownerId, OrgRole.OWNER);
    
    return orgId;
  }

  // 取得組織詳情
  getOrganization(orgId: string): Observable<Organization | undefined> {
    const orgDoc = doc(this.firestore, `accounts/${orgId}`);
    return docData(orgDoc, { idField: 'id' }).pipe(
      map(data => {
        if (data && data['type'] === 'organization') {
          return data as Organization;
        }
        return undefined;
      })
    );
  }

  // 取得組織成員列表
  getOrganizationMembers(orgId: string): Observable<OrganizationMember[]> {
    const membersCol = collection(this.firestore, `accounts/${orgId}/members`);
    return collectionData(membersCol, { idField: 'id' }) as Observable<OrganizationMember[]>;
  }

  // 新增組織成員
  async addOrganizationMember(
    orgId: string, 
    userId: string, 
    role: OrgRole,
    invitedBy?: string
  ): Promise<void> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    await setDoc(memberRef, {
      id: userId,
      organizationId: orgId,
      userId,
      role,
      joinedAt: new Date(),
      invitedBy
    });
  }

  // 更新成員角色
  async updateMemberRole(
    orgId: string, 
    userId: string, 
    newRole: OrgRole
  ): Promise<void> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    await updateDoc(memberRef, { role: newRole });
  }

  // 移除組織成員
  async removeOrganizationMember(orgId: string, userId: string): Promise<void> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    await deleteDoc(memberRef);
  }

  // 建立團隊
  async createTeam(
    orgId: string,
    name: string,
    slug: string,
    description?: string
  ): Promise<string> {
    const teamRef = await addDoc(
      collection(this.firestore, `accounts/${orgId}/teams`),
      {
        organizationId: orgId,
        name,
        slug,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          repository: { read: true, write: false, admin: false },
          issues: { read: true, write: false, delete: false },
          pullRequests: { read: true, write: false, merge: false }
        }
      }
    );
    return teamRef.id;
  }

  // 取得組織的所有團隊
  getOrganizationTeams(orgId: string): Observable<Team[]> {
    const teamsCol = collection(this.firestore, `accounts/${orgId}/teams`);
    return collectionData(teamsCol, { idField: 'id' }) as Observable<Team[]>;
  }

  // 取得團隊成員
  getTeamMembers(orgId: string, teamId: string): Observable<TeamMember[]> {
    const membersCol = collection(
      this.firestore, 
      `accounts/${orgId}/teams/${teamId}/members`
    );
    return collectionData(membersCol, { idField: 'id' }) as Observable<TeamMember[]>;
  }

  // 新增團隊成員
  async addTeamMember(
    orgId: string,
    teamId: string,
    userId: string,
    role: TeamRole,
    addedBy?: string
  ): Promise<void> {
    const memberRef = doc(
      this.firestore,
      `accounts/${orgId}/teams/${teamId}/members/${userId}`
    );
    await setDoc(memberRef, {
      id: userId,
      teamId,
      userId,
      role,
      joinedAt: new Date(),
      addedBy
    });
  }

  // 移除團隊成員
  async removeTeamMember(
    orgId: string,
    teamId: string,
    userId: string
  ): Promise<void> {
    const memberRef = doc(
      this.firestore,
      `accounts/${orgId}/teams/${teamId}/members/${userId}`
    );
    await deleteDoc(memberRef);
  }

  // 檢查用戶在組織中的角色
  async getUserOrgRole(orgId: string, userId: string): Promise<OrgRole | null> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    const memberSnap = await getDoc(memberRef);
    
    if (!memberSnap.exists()) return null;
    
    const data = memberSnap.data() as OrganizationMember;
    return data.role;
  }

  // 檢查用戶所屬的團隊
  getUserTeams(orgId: string, userId: string): Observable<Team[]> {
    return this.getOrganizationTeams(orgId).pipe(
      switchMap(teams => {
        if (teams.length === 0) return of([]);
        
        const teamObservables = teams.map(team =>
          this.getTeamMembers(orgId, team.id).pipe(
            map(members => ({
              team,
              isMember: members.some(m => m.userId === userId)
            }))
          )
        );
        return combineLatest(teamObservables);
      }),
      map(results => results.filter(r => r.isMember).map(r => r.team))
    );
  }
}
```

## 五、ACL Service - 權限控制核心

```typescript
// src/app/core/services/acl.service.ts

import { Injectable, inject } from '@angular/core';
import { ACLService as DelonACLService } from '@delon/acl';
import { Observable, combineLatest, map } from 'rxjs';
import { AuthService } from './auth.service';
import { OrganizationService } from './organization.service';
import { OrgRole, TeamRole, ACLAbility } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class ACLService {
  private aclService = inject(DelonACLService);
  private authService = inject(AuthService);
  private orgService = inject(OrganizationService);

  /**
   * 初始化用戶的 ACL 權限
   * 根據用戶在各組織和團隊中的角色動態設定權限
   */
  initializeACL(orgId: string): Observable<void> {
    return combineLatest([
      this.authService.currentUser$,
      this.orgService.getOrganization(orgId),
      this.orgService.getOrganizationMembers(orgId)
    ]).pipe(
      map(([user, org, members]) => {
        if (!user || !org) {
          this.aclService.setFull(false);
          return;
        }

        const userMembership = members.find(m => m.userId === user.uid);
        
        if (!userMembership) {
          this.aclService.setFull(false);
          return;
        }

        const abilities = this.calculateAbilities(userMembership.role, org.ownerId === user.uid);
        this.aclService.setAbility(abilities);
      })
    );
  }

  /**
   * 根據組織角色計算權限能力
   */
  private calculateAbilities(role: OrgRole, isOwner: boolean): ACLAbility[] {
    const abilities: ACLAbility[] = [];

    // 擁有者擁有所有權限
    if (isOwner) {
      return [
        { action: 'admin', resource: 'organization' },
        { action: 'admin', resource: 'team' },
        { action: 'admin', resource: 'member' },
        { action: 'delete', resource: 'organization' }
      ];
    }

    switch (role) {
      case OrgRole.OWNER:
        abilities.push(
          { action: 'admin', resource: 'organization' },
          { action: 'admin', resource: 'team' },
          { action: 'admin', resource: 'member' }
        );
        break;

      case OrgRole.ADMIN:
        abilities.push(
          { action: 'write', resource: 'organization' },
          { action: 'admin', resource: 'team' },
          { action: 'write', resource: 'member' }
        );
        break;

      case OrgRole.MEMBER:
        abilities.push(
          { action: 'read', resource: 'organization' },
          { action: 'read', resource: 'team' },
          { action: 'read', resource: 'member' }
        );
        break;

      case OrgRole.BILLING:
        abilities.push(
          { action: 'read', resource: 'organization' },
          { action: 'admin', resource: 'billing' }
        );
        break;

      case OrgRole.OUTSIDE_COLLABORATOR:
        abilities.push(
          { action: 'read', resource: 'organization' }
        );
        break;
    }

    return abilities;
  }

  /**
   * 檢查用戶是否有特定權限
   */
  can(action: string, resource: string): boolean {
    return this.aclService.can({ action, resource });
  }

  /**
   * 檢查用戶是否為組織擁有者
   */
  async isOrganizationOwner(orgId: string, userId: string): Promise<boolean> {
    const org = await this.orgService.getOrganization(orgId).toPromise();
    return org?.ownerId === userId;
  }

  /**
   * 檢查用戶是否為團隊維護者
   */
  async isTeamMaintainer(orgId: string, teamId: string, userId: string): Promise<boolean> {
    const members = await this.orgService.getTeamMembers(orgId, teamId).toPromise();
    const userMember = members?.find(m => m.userId === userId);
    return userMember?.role === TeamRole.MAINTAINER;
  }
}
```

## 六、ACL Guard - 路由守衛

```typescript
// src/app/core/guards/acl.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { ACLService } from '../services/acl.service';
import { NzMessageService } from 'ng-zorro-antd/message';

export const aclGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const aclService = inject(ACLService);
  const router = inject(Router);
  const message = inject(NzMessageService);

  const requiredAbility = route.data['ability'] as { action: string; resource: string };
  const orgId = route.paramMap.get('orgId');

  if (!orgId) {
    message.error('無效的組織 ID');
    router.navigate(['/organizations']);
    return false;
  }

  return aclService.initializeACL(orgId).pipe(
    map(() => {
      const hasPermission = aclService.can(
        requiredAbility.action,
        requiredAbility.resource
      );

      if (!hasPermission) {
        message.error('您沒有權限執行此操作');
        router.navigate([`/organizations/${orgId}`]);
      }

      return hasPermission;
    })
  );
};
```

## 七、路由配置範例

```typescript
// src/app/routes/routes.ts

import { Routes } from '@angular/router';
import { aclGuard } from '@core/guards/acl.guard';
import { authGuard } from '@delon/auth';

export const routes: Routes = [
  {
    path: 'organizations/:orgId',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./organization-detail/organization-detail.component')
      },
      {
        path: 'settings',
        canActivate: [aclGuard],
        data: { ability: { action: 'write', resource: 'organization' } },
        loadComponent: () => import('./organization-settings/organization-settings.component')
      },
      {
        path: 'members',
        canActivate: [aclGuard],
        data: { ability: { action: 'read', resource: 'member' } },
        loadComponent: () => import('./members-list/members-list.component')
      },
      {
        path: 'teams',
        children: [
          {
            path: '',
            canActivate: [aclGuard],
            data: { ability: { action: 'read', resource: 'team' } },
            loadComponent: () => import('./teams-list/teams-list.component')
          },
          {
            path: 'new',
            canActivate: [aclGuard],
            data: { ability: { action: 'admin', resource: 'team' } },
            loadComponent: () => import('./team-create/team-create.component')
          }
        ]
      }
    ]
  }
];
```

## 八、UI 元件範例 - 成員管理

```typescript
// src/app/routes/members-list/members-list.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ACLModule } from '@delon/acl';
import { Observable } from 'rxjs';
import { OrganizationService } from '@core/services/organization.service';
import { ACLService } from '@core/services/acl.service';
import { OrganizationMember, OrgRole } from '@core/models/auth.model';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzSelectModule,
    NzPopconfirmModule,
    ACLModule
  ],
  template: `
    <nz-table 
      #memberTable 
      [nzData]="(members$ | async) || []" 
      [nzLoading]="loading">
      <thead>
        <tr>
          <th>成員</th>
          <th>角色</th>
          <th>加入時間</th>
          <th *aclIf="{ action: 'write', resource: 'member' }">操作</th>
        </tr>
      </thead>
      <tbody>
        @for (member of memberTable.data; track member.id) {
          <tr>
            <td>{{ member.userId }}</td>
            <td>
              @if (canManageMembers) {
                <nz-select 
                  [(ngModel)]="member.role"
                  (ngModelChange)="updateRole(member, $event)"
                  style="width: 150px">
                  @for (role of availableRoles; track role.value) {
                    <nz-option 
                      [nzValue]="role.value" 
                      [nzLabel]="role.label">
                    </nz-option>
                  }
                </nz-select>
              } @else {
                <span>{{ getRoleLabel(member.role) }}</span>
              }
            </td>
            <td>{{ member.joinedAt.toDate() | date: 'yyyy-MM-dd' }}</td>
            <td *aclIf="{ action: 'write', resource: 'member' }">
              <button 
                nz-button 
                nzType="link" 
                nzDanger
                nz-popconfirm
                nzPopconfirmTitle="確定要移除此成員嗎?"
                (nzOnConfirm)="removeMember(member)">
                移除
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class MembersListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orgService = inject(OrganizationService);
  private aclService = inject(ACLService);
  private message = inject(NzMessageService);

  orgId!: string;
  members$!: Observable<OrganizationMember[]>;
  loading = false;
  canManageMembers = false;

  availableRoles = [
    { value: OrgRole.OWNER, label: '擁有者' },
    { value: OrgRole.ADMIN, label: '管理員' },
    { value: OrgRole.MEMBER, label: '成員' },
    { value: OrgRole.BILLING, label: '帳務管理員' },
    { value: OrgRole.OUTSIDE_COLLABORATOR, label: '外部協作者' }
  ];

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId')!;
    this.members$ = this.orgService.getOrganizationMembers(this.orgId);
    this.canManageMembers = this.aclService.can('write', 'member');
  }

  async updateRole(member: OrganizationMember, newRole: OrgRole) {
    try {
      await this.orgService.updateMemberRole(this.orgId, member.userId, newRole);
      this.message.success('角色已更新');
    } catch (error) {
      this.message.error('更新失敗');
    }
  }

  async removeMember(member: OrganizationMember) {
    try {
      await this.orgService.removeOrganizationMember(this.orgId, member.userId);
      this.message.success('成員已移除');
    } catch (error) {
      this.message.error('移除失敗');
    }
  }

  getRoleLabel(role: OrgRole): string {
    return this.availableRoles.find(r => r.value === role)?.label || role;
  }
}
```

## 九、Firestore 安全規則

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 統一的 accounts 集合
    match /accounts/{accountId} {
      // 讀取：用戶可以讀取自己，或讀取自己所屬組織
      allow read: if request.auth != null && (
        request.auth.uid == accountId ||
        (resource.data.type == 'organization' && isOrganizationMember(accountId))
      );
      
      // 創建用戶 account
      allow create: if request.auth != null && 
                      request.resource.data.type == 'user' &&
                      request.auth.uid == accountId;
      
      // 創建組織 account
      allow create: if request.auth != null && 
                      request.resource.data.type == 'organization';
      
      // 更新：用戶更新自己 or 組織管理員更新組織
      allow update: if request.auth != null && (
        (request.auth.uid == accountId && resource.data.type == 'user') ||
        (resource.data.type == 'organization' && hasOrgPermission(accountId, 'write'))
      );
      
      // 刪除：只有組織擁有者可以刪除組織
      allow delete: if request.auth != null &&
                       resource.data.type == 'organization' && 
                       isOrganizationOwner(accountId);
      
      // 組織成員
      match /members/{memberId} {
        allow read: if request.auth != null && isOrganizationMember(accountId);
        allow write: if request.auth != null && hasOrgPermission(accountId, 'admin');
      }
      
      // 團隊
      match /teams/{teamId} {
        allow read: if request.auth != null && isOrganizationMember(accountId);
        allow create: if request.auth != null && hasOrgPermission(accountId, 'admin');
        allow update: if request.auth != null && (
          hasOrgPermission(accountId, 'admin') || 
          isTeamMaintainer(accountId, teamId)
        );
        allow delete: if request.auth != null && hasOrgPermission(accountId, 'admin');
        
        // 團隊成員
        match /members/{memberId} {
          allow read: if request.auth != null && isOrganizationMember(accountId);
          allow write: if request.auth != null && (
            hasOrgPermission(accountId, 'admin') || 
            isTeamMaintainer(accountId, teamId)
          );
        }
      }
    }
    
    // 輔助函數
    function isOrganizationMember(accountId) {
      return exists(/databases/$(database)/documents/accounts/$(accountId)/members/$(request.auth.uid));
    }
    
    function isOrganizationOwner(accountId) {
      return get(/databases/$(database)/documents/accounts/$(accountId)).data.ownerId == request.auth.uid;
    }
    
    function hasOrgPermission(accountId, level) {
      let member = get(/databases/$(database)/documents/accounts/$(accountId)/members/$(request.auth.uid));
      return member.data.role in ['owner', 'admin'] || 
             (level == 'write' && member.data.role == 'admin');
    }
    
    function isTeamMaintainer(accountId, teamId) {
      let teamMember = get(/databases/$(database)/documents/accounts/$(accountId)/teams/$(teamId)/members/$(request.auth.uid));
      return teamMember.data.role == 'maintainer';
    }
  }
}
```

## 十、使用範例 - 在元件中檢查權限

### 1. 在模板中使用 ACL 指令

```html
<!-- 只有管理員可見的按鈕 -->
<button 
  nz-button 
  *aclIf="{ action: 'admin', resource: 'team' }"
  (click)="createTeam()">
  建立團隊
</button>

<!-- 只有有寫入權限的用戶可見 -->
<nz-select 
  *aclIf="{ action: 'write', resource: 'member' }"
  [(ngModel)]="selectedRole">
  <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
  <nz-option nzValue="member" nzLabel="成員"></nz-option>
</nz-select>

<!-- 根據權限顯示不同內容 -->
<div *aclIf="{ action: 'admin', resource: 'organization' }; else readOnly">
  <button nz-button (click)="editSettings()">編輯設定</button>
</div>
<ng-template #readOnly>
  <span>唯讀模式</span>
</ng-template>
```

### 2. 在程式碼中檢查權限

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { ACLService } from '@core/services/acl.service';

@Component({
  selector: 'app-organization-settings',
  template: `...`
})
export class OrganizationSettingsComponent implements OnInit {
  private aclService = inject(ACLService);
  
  canEditSettings = false;
  canManageMembers = false;
  isOwner = false;

  ngOnInit() {
    // 檢查各種權限
    this.canEditSettings = this.aclService.can('write', 'organization');
    this.canManageMembers = this.aclService.can('admin', 'member');
    this.isOwner = this.aclService.can('delete', 'organization');
  }

  async deleteOrganization() {
    if (!this.isOwner) {
      console.error('只有擁有者可以刪除組織');
      return;
    }
    // 執行刪除
  }

  async inviteMember() {
    if (!this.canManageMembers) {
      console.error('沒有權限邀請成員');
      return;
    }
    // 執行邀請
  }
}
```

### 3. 組織管理完整範例

```typescript
// src/app/routes/organization-dashboard/organization-dashboard.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ACLModule } from '@delon/acl';
import { Observable, combineLatest, map } from 'rxjs';
import { OrganizationService } from '@core/services/organization.service';
import { ACLService } from '@core/services/acl.service';
import { AuthService } from '@core/services/auth.service';
import { Organization, Team, OrganizationMember } from '@core/models/auth.model';

@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzButtonModule,
    NzStatisticModule,
    NzGridModule,
    ACLModule
  ],
  template: `
    @if (dashboardData$ | async; as data) {
      <div nz-row [nzGutter]="16">
        <!-- 組織資訊 -->
        <div nz-col [nzSpan]="24">
          <nz-card [nzTitle]="data.org.name">
            <p>{{ data.org.description || '暫無描述' }}</p>
            <div class="actions">
              <button 
                nz-button 
                nzType="primary"
                *aclIf="{ action: 'write', resource: 'organization' }"
                (click)="editOrganization()">
                編輯組織
              </button>
              <button 
                nz-button 
                nzDanger
                *aclIf="{ action: 'delete', resource: 'organization' }"
                (click)="deleteOrganization()">
                刪除組織
              </button>
            </div>
          </nz-card>
        </div>

        <!-- 統計資訊 -->
        <div nz-col [nzSpan]="8">
          <nz-card>
            <nz-statistic 
              [nzValue]="data.memberCount" 
              nzTitle="成員數量">
            </nz-statistic>
            <button 
              nz-button 
              nzBlock
              *aclIf="{ action: 'write', resource: 'member' }"
              (click)="goToMembers()">
              管理成員
            </button>
          </nz-card>
        </div>

        <div nz-col [nzSpan]="8">
          <nz-card>
            <nz-statistic 
              [nzValue]="data.teamCount" 
              nzTitle="團隊數量">
            </nz-statistic>
            <button 
              nz-button 
              nzBlock
              *aclIf="{ action: 'read', resource: 'team' }"
              (click)="goToTeams()">
              查看團隊
            </button>
          </nz-card>
        </div>

        <div nz-col [nzSpan]="8">
          <nz-card>
            <nz-statistic 
              [nzValue]="data.userTeamCount" 
              nzTitle="我的團隊">
            </nz-statistic>
            <button 
              nz-button 
              nzBlock
              *aclIf="{ action: 'admin', resource: 'team' }"
              (click)="createTeam()">
              建立團隊
            </button>
          </nz-card>
        </div>

        <!-- 最近活動 -->
        <div nz-col [nzSpan]="24">
          <nz-card nzTitle="最近團隊">
            @if (data.teams.length > 0) {
              <div class="team-list">
                @for (team of data.teams; track team.id) {
                  <div class="team-item">
                    <h4>{{ team.name }}</h4>
                    <p>{{ team.description || '暫無描述' }}</p>
                    <button 
                      nz-button 
                      nzSize="small"
                      (click)="viewTeam(team.id)">
                      查看
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p>尚未建立任何團隊</p>
            }
          </nz-card>
        </div>
      </div>
    }
  `,
  styles: [`
    .actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
    }
    .team-list {
      display: grid;
      gap: 16px;
    }
    .team-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
    }
    .team-item h4 {
      margin: 0 0 8px 0;
    }
  `]
})
export class OrganizationDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private aclService = inject(ACLService);
  private authService = inject(AuthService);

  orgId!: string;
  dashboardData$!: Observable<{
    org: Organization;
    memberCount: number;
    teamCount: number;
    userTeamCount: number;
    teams: Team[];
  }>;

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId')!;
    
    this.dashboardData$ = combineLatest([
      this.orgService.getOrganization(this.orgId),
      this.orgService.getOrganizationMembers(this.orgId),
      this.orgService.getOrganizationTeams(this.orgId),
      this.authService.currentUser$
    ]).pipe(
      map(([org, members, teams, user]) => {
        if (!org || !user) {
          throw new Error('組織或用戶不存在');
        }

        // 計算用戶參與的團隊數量
        // 這裡簡化處理，實際應該查詢用戶在各團隊的成員資格
        const userTeamCount = 0; // TODO: 實作用戶團隊計數

        return {
          org,
          memberCount: members.length,
          teamCount: teams.length,
          userTeamCount,
          teams: teams.slice(0, 5) // 只顯示前 5 個團隊
        };
      })
    );
  }

  editOrganization() {
    this.router.navigate(['settings'], { relativeTo: this.route });
  }

  deleteOrganization() {
    // 實作刪除組織邏輯
    console.log('刪除組織:', this.orgId);
  }

  goToMembers() {
    this.router.navigate(['members'], { relativeTo: this.route });
  }

  goToTeams() {
    this.router.navigate(['teams'], { relativeTo: this.route });
  }

  createTeam() {
    this.router.navigate(['teams', 'new'], { relativeTo: this.route });
  }

  viewTeam(teamId: string) {
    this.router.navigate(['teams', teamId], { relativeTo: this.route });
  }
}
```

## 十一、進階功能 - 權限繼承與覆寫

```typescript
// src/app/core/services/permission.service.ts

import { Injectable, inject } from '@angular/core';
import { OrganizationService } from './organization.service';
import { OrgRole, TeamRole, TeamPermissions } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private orgService = inject(OrganizationService);

  /**
   * 計算用戶在特定資源上的有效權限
   * 考慮組織角色和團隊角色的繼承關係
   */
  async getEffectivePermissions(
    orgId: string,
    userId: string,
    resourceType: 'repository' | 'issues' | 'pullRequests'
  ): Promise<any> {
    // 1. 獲取組織角色
    const orgRole = await this.orgService.getUserOrgRole(orgId, userId);
    
    // 2. 獲取用戶所屬團隊
    const teams = await this.orgService.getUserTeams(orgId, userId).toPromise();
    
    // 3. 組織角色的基礎權限
    const basePermissions = this.getOrgRolePermissions(orgRole);
    
    // 4. 團隊權限疊加
    const teamPermissions = teams?.map(team => team.permissions[resourceType]) || [];
    
    // 5. 合併權限（取最高權限）
    return this.mergePermissions(basePermissions[resourceType], teamPermissions);
  }

  private getOrgRolePermissions(role: OrgRole | null): any {
    switch (role) {
      case OrgRole.OWNER:
      case OrgRole.ADMIN:
        return {
          repository: { read: true, write: true, admin: true },
          issues: { read: true, write: true, delete: true },
          pullRequests: { read: true, write: true, merge: true }
        };
      
      case OrgRole.MEMBER:
        return {
          repository: { read: true, write: false, admin: false },
          issues: { read: true, write: true, delete: false },
          pullRequests: { read: true, write: true, merge: false }
        };
      
      default:
        return {
          repository: { read: false, write: false, admin: false },
          issues: { read: false, write: false, delete: false },
          pullRequests: { read: false, write: false, merge: false }
        };
    }
  }

  private mergePermissions(base: any, teamPerms: any[]): any {
    const merged = { ...base };
    
    teamPerms.forEach(perm => {
      Object.keys(perm).forEach(key => {
        merged[key] = merged[key] || perm[key];
      });
    });
    
    return merged;
  }
}
```

## 十二、主要特點總結

### 1. GitHub 式設計
- ✅ 使用 `Account` 統一模型，通過 `type` 區分用戶和組織
- ✅ 使用 `login` 作為唯一識別碼
- ✅ 統一的 `/accounts` 集合路徑

### 2. 多層級權限系統
- ✅ 個人 → 組織 → 團隊 → 資源
- ✅ 5 種組織角色：Owner, Admin, Member, Billing, Outside Collaborator
- ✅ 2 種團隊角色：Maintainer, Member

### 3. 角色繼承
- ✅ 組織角色決定基本權限
- ✅ 團隊角色提供細粒度控制
- ✅ 權限可疊加和覆寫

### 4. 動態權限控制
- ✅ 使用 @delon/acl 動態計算權限
- ✅ 支援模板指令 `*aclIf`
- ✅ 支援程式碼檢查 `aclService.can()`

### 5. 安全性
- ✅ Firestore 安全規則層級檢查
- ✅ 前端路由守衛保護
- ✅ 後端權限雙重驗證

### 6. 擴展性
- ✅ 易於添加新的資源類型
- ✅ 易於添加新的權限規則
- ✅ 支援自定義權限邏輯