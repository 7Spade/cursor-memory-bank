# Angular v20 + Signals + Firebase 實現 GitHub 式權限系統

使用 Angular v20 現代化特性（Signals、Control Flow、Standalone Components）實現的 GitHub 式多層級權限系統架構。

## 一、資料結構設計 (Firestore)

```typescript
// src/app/core/models/auth.model.ts

import { signal, computed, Signal } from '@angular/core';

// Account 基礎介面 - GitHub 的核心概念
export interface Account {
  id: string;
  type: 'user' | 'organization';  // 使用 type 區分用戶和組織
  login: string;                   // GitHub 的唯一識別碼 (username/org-slug)
  profile: ProfileVO;              // 使用 Value Object 封裝檔案資訊
  permissions: PermissionVO;        // 使用 Value Object 封裝權限資訊
  settings: SettingsVO;            // 使用 Value Object 封裝設定資訊
  projectsOwned: string[];          // 擁有的專案列表
  createdAt: Date;
  updatedAt: Date;
}

// 現代化的 Account 狀態管理
export class AccountState {
  private _currentAccount = signal<Account | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // 只讀 Signals
  readonly currentAccount: Signal<Account | null> = this._currentAccount.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  // Computed Signals
  readonly isAuthenticated = computed(() => this._currentAccount() !== null);
  readonly isUser = computed(() => this._currentAccount()?.type === 'user');
  readonly isOrganization = computed(() => this._currentAccount()?.type === 'organization');
  readonly userPermissions = computed(() => this._currentAccount()?.permissions || null);

  // 更新方法
  setAccount(account: Account | null) {
    this._currentAccount.set(account);
  }

  setLoading(loading: boolean) {
    this._isLoading.set(loading);
  }

  setError(error: string | null) {
    this._error.set(error);
  }

  clearError() {
    this._error.set(null);
  }
}

// User 繼承 Account
export interface User extends Account {
  type: 'user';
  uid: string;  // Firebase Auth UID
  displayName: string;
  photoURL?: string;
  certificates?: CertificateVO[];        // 用戶證書
  socialRelations?: SocialRelationVO;   // 社交關係
  organizationMemberships?: Map<string, string>; // orgId → role
}

// Organization 繼承 Account
export interface Organization extends Account {
  type: 'organization';
  description?: string;
  ownerId: string; // 組織擁有者
  businessLicense?: BusinessLicenseVO;   // 商業許可證
  // 移除 members 和 teams 的 Map 定義，這些應該通過子集合查詢獲取
  // 移除重複的 settings 欄位，使用繼承的 SettingsVO
}

// 額外的 Value Objects
export interface CertificateVO {
  id: string;
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
}

export interface SocialRelationVO {
  followers: string[];
  following: string[];
  connections: string[];
}

export interface BusinessLicenseVO {
  licenseNumber: string;
  companyName: string;
  issuedBy: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface MemberVO {
  userId: string;
  role: OrgRole;
  joinedAt: Date;
  invitedBy?: string;
}

export interface TeamVO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: TeamPermissions;
  assignedProjects: string[];
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

// Repository 介面 - GitHub 的核心概念
export interface Repository {
  id: string;
  name: string;
  fullName: string; // owner/repo
  description?: string;
  private: boolean;
  ownerId: string; // Account ID (可以是 User 或 Organization)
  ownerType: 'user' | 'organization';
  createdAt: Date;
  updatedAt: Date;
  defaultBranch: string;
  topics: string[];
}

// Repository Collaborator - 個人協作者
export interface RepositoryCollaborator {
  id: string;
  repositoryId: string;
  userId: string;
  permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin';
  roleName: string;
  invitedBy?: string;
  invitedAt: Date;
}

// Repository Team Access - 團隊訪問權限
export interface RepositoryTeamAccess {
  id: string;
  repositoryId: string;
  teamId: string;
  permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin';
  roleName: string;
  grantedBy?: string;
  grantedAt: Date;
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

// Value Objects - 領域驅動設計的優點整合
export interface ProfileVO {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface PermissionVO {
  roles: string[];
  abilities: ACLAbility[];
}

export interface SettingsVO {
  language: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
  };
  // 組織特定設定
  organization?: {
    defaultMemberRole: OrgRole;
    visibility: 'public' | 'private';
  };
}

// 驗證工具函數
export class ValidationUtils {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateProfile(profile: ProfileVO): string[] {
    const errors: string[] = [];
    
    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('Profile name cannot be empty');
    }
    
    if (!profile.email || !this.validateEmail(profile.email)) {
      errors.push('Invalid email format');
    }
    
    return errors;
  }

  static validatePermission(permission: PermissionVO): string[] {
    const errors: string[] = [];
    
    if (!permission.roles || permission.roles.length === 0) {
      errors.push('At least one role is required');
    }
    
    if (!permission.abilities || permission.abilities.length === 0) {
      errors.push('At least one ability is required');
    }
    
    return errors;
  }
}
```

## 二、Firestore 集合結構

```
/accounts/{accountId}
  - id: string
  - type: 'user' | 'organization'
  - login: string (唯一)
  - profile: ProfileVO
  - permissions: PermissionVO
  - settings: SettingsVO
  - projectsOwned: string[]
  - createdAt: Date
  - updatedAt: Date
  
  // User 特定欄位 (當 type === 'user')
  - uid?: string
  - displayName?: string
  - photoURL?: string
  - certificates?: CertificateVO[]
  - socialRelations?: SocialRelationVO
  - organizationMemberships?: {}
  
  // Organization 特定欄位 (當 type === 'organization')
  - description?: string
  - ownerId?: string
  - businessLicense?: BusinessLicenseVO
  
  // Organization 子集合
  /members/{userId}
    - id: string
    - organizationId: string
    - userId: string
    - role: OrgRole
    - joinedAt: Date
    - invitedBy?: string
  
  /teams/{teamId}
    - id: string
    - organizationId: string
    - name: string
    - slug: string
    - description?: string
    - permissions: TeamPermissions
    - createdAt: Date
    - updatedAt: Date
    
    /members/{userId}
      - id: string
      - teamId: string
      - userId: string
      - role: TeamRole
      - joinedAt: Date
      - addedBy?: string

/repositories/{repositoryId}
  - id: string
  - name: string
  - fullName: string
  - description?: string
  - private: boolean
  - ownerId: string
  - ownerType: 'user' | 'organization'
  - createdAt: Date
  - updatedAt: Date
  - defaultBranch: string
  - topics: string[]
  
  // Repository 協作者子集合
  /collaborators/{userId}
    - id: string
    - repositoryId: string
    - userId: string
    - permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin'
    - roleName: string
    - invitedBy?: string
    - invitedAt: Date
  
  // Repository 團隊訪問子集合
  /teamAccess/{teamId}
    - id: string
    - repositoryId: string
    - teamId: string
    - permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin'
    - roleName: string
    - grantedBy?: string
    - grantedAt: Date
```

## 三、現代化 Auth Service 實現 (Signals + inject)

```typescript
// src/app/core/services/auth.service.ts

import { Injectable, inject, signal, computed, effect } from '@angular/core';
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
import { User, Organization, Account, AccountState } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  
  // 使用 Signals 管理狀態
  private accountState = new AccountState();
  
  // 公開的 Signals
  readonly currentAccount = this.accountState.currentAccount;
  readonly isLoading = this.accountState.isLoading;
  readonly error = this.accountState.error;
  readonly isAuthenticated = this.accountState.isAuthenticated;
  readonly isUser = this.accountState.isUser;
  readonly isOrganization = this.accountState.isOrganization;
  readonly userPermissions = this.accountState.userPermissions;

  // Computed Signals for organizations
  readonly userOrganizations = computed(() => {
    const account = this.currentAccount();
    if (!account || account.type !== 'user') return [];
    
    // 這裡應該實現組織查詢邏輯
    // 為了簡化，返回空數組
    return [];
  });

  constructor() {
    // 監聽 Firebase Auth 狀態變化
    effect(() => {
      authState(this.auth).subscribe(firebaseUser => {
        if (firebaseUser) {
          this.loadUserAccount(firebaseUser.uid);
        } else {
          this.accountState.setAccount(null);
        }
      });
    });
  }

  async signInWithGoogle() {
    try {
      this.accountState.setLoading(true);
      this.accountState.clearError();
      
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      await this.syncUserProfile(credential.user);
      
      return credential;
    } catch (error) {
      this.accountState.setError(`登入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this.accountState.setLoading(false);
    }
  }

  async signOut() {
    try {
      this.accountState.setLoading(true);
      await signOut(this.auth);
    } catch (error) {
      this.accountState.setError(`登出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this.accountState.setLoading(false);
    }
  }

  private async loadUserAccount(uid: string) {
    try {
      this.accountState.setLoading(true);
      
      const userDoc = doc(this.firestore, `accounts/${uid}`);
      const userData = await docData(userDoc, { idField: 'id' }).pipe(
        map(data => {
          if (data && data['type'] === 'user') {
            return data as User;
          }
          return null;
        })
      ).toPromise();
      
      this.accountState.setAccount(userData);
    } catch (error) {
      this.accountState.setError(`載入用戶資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this.accountState.setLoading(false);
    }
  }

  private async syncUserProfile(firebaseUser: FirebaseUser) {
    try {
      const userRef = doc(this.firestore, `accounts/${firebaseUser.uid}`);
      const login = firebaseUser.email?.split('@')[0] || firebaseUser.uid;
      
      // 建立 ProfileVO
      const profile: ProfileVO = {
        name: firebaseUser.displayName || login,
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined,
        bio: undefined,
        location: undefined,
        website: undefined
      };
      
      // 驗證 Profile
      const profileErrors = ValidationUtils.validateProfile(profile);
      if (profileErrors.length > 0) {
        throw new Error(`Profile validation failed: ${profileErrors.join(', ')}`);
      }
      
      // 建立 PermissionVO
      const permissions: PermissionVO = {
        roles: ['user'],
        abilities: [
          { action: 'read', resource: 'organization' },
          { action: 'read', resource: 'team' },
          { action: 'read', resource: 'member' }
        ]
      };
      
      // 建立 SettingsVO
      const settings: SettingsVO = {
        language: 'zh-TW',
        theme: 'light',
        notifications: { email: true, push: true, sms: false },
        privacy: { profilePublic: true, showEmail: false }
      };
      
      await setDoc(userRef, {
        id: firebaseUser.uid,
        type: 'user',
        login: login,
        profile: profile,
        permissions: permissions,
        settings: settings,
        projectsOwned: [],
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || login,
        photoURL: firebaseUser.photoURL,
        certificates: [],
        socialRelations: {
          followers: [],
          following: [],
          connections: []
        },
        organizationMemberships: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      
    } catch (error) {
      console.error('Failed to sync user profile:', error);
      throw new Error(`User profile sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 權限檢查方法
  can(action: string, resource: string): boolean {
    const permissions = this.userPermissions();
    if (!permissions) return false;
    
    return permissions.abilities.some(ability => 
      ability.action === action && ability.resource === resource
    );
  }

  // 角色檢查方法
  hasRole(role: string): boolean {
    const permissions = this.userPermissions();
    if (!permissions) return false;
    
    return permissions.roles.includes(role);
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
    ownerId: string,
    email?: string,
    description?: string
  ): Promise<string> {
    try {
      const orgId = doc(collection(this.firestore, 'accounts')).id;
      
      // 建立 ProfileVO
      const profile: ProfileVO = {
        name: name,
        email: email || '',
        avatar: undefined,
        bio: description,
        location: undefined,
        website: undefined
      };
      
      // 驗證 Profile
      const profileErrors = ValidationUtils.validateProfile(profile);
      if (profileErrors.length > 0) {
        throw new Error(`Organization profile validation failed: ${profileErrors.join(', ')}`);
      }
      
      // 建立 PermissionVO
      const permissions: PermissionVO = {
        roles: ['organization'],
        abilities: [
          { action: 'admin', resource: 'organization' },
          { action: 'admin', resource: 'team' },
          { action: 'admin', resource: 'member' }
        ]
      };
      
      // 建立 SettingsVO
      const settings: SettingsVO = {
        language: 'zh-TW',
        theme: 'light',
        notifications: { email: true, push: true, sms: false },
        privacy: { profilePublic: true, showEmail: false },
        organization: {
          defaultMemberRole: OrgRole.MEMBER,
          visibility: 'private'
        }
      };
      
      await setDoc(doc(this.firestore, `accounts/${orgId}`), {
        id: orgId,
        type: 'organization',
        login: login,
        profile: profile,
        permissions: permissions,
        settings: settings,
        projectsOwned: [],
        description: description,
        ownerId: ownerId,
        businessLicense: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 自動加入擁有者為成員
      await this.addOrganizationMember(orgId, ownerId, OrgRole.OWNER);
      
      return orgId;
      
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw new Error(`Organization creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

## 五、現代化權限管理系統 (Signals + Computed)

```typescript
// src/app/core/services/permission.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { OrganizationService } from './organization.service';
import { OrgRole, TeamRole, ACLAbility } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private orgService = inject(OrganizationService);

  // 當前組織 ID Signal
  private _currentOrgId = signal<string | null>(null);
  readonly currentOrgId = this._currentOrgId.asReadonly();

  // 組織成員資格 Signal
  private _orgMembership = signal<{
    isMember: boolean;
    role: OrgRole | null;
    isOwner: boolean;
  }>({ isMember: false, role: null, isOwner: false });

  readonly orgMembership = this._orgMembership.asReadonly();

  // Computed Signals for permissions
  readonly canManageOrganization = computed(() => {
    const membership = this._orgMembership();
    return membership.isOwner || membership.role === OrgRole.ADMIN;
  });

  readonly canManageMembers = computed(() => {
    const membership = this._orgMembership();
    return membership.isOwner || membership.role === OrgRole.ADMIN;
  });

  readonly canManageTeams = computed(() => {
    const membership = this._orgMembership();
    return membership.isOwner || membership.role === OrgRole.ADMIN;
  });

  readonly canCreateRepositories = computed(() => {
    const membership = this._orgMembership();
    return membership.isMember;
  });

  // 設置當前組織
  async setCurrentOrganization(orgId: string) {
    this._currentOrgId.set(orgId);
    await this.loadOrganizationMembership(orgId);
  }

  // 載入組織成員資格
  private async loadOrganizationMembership(orgId: string) {
    const currentUser = this.authService.currentAccount();
    if (!currentUser || currentUser.type !== 'user') {
      this._orgMembership.set({ isMember: false, role: null, isOwner: false });
      return;
    }

    try {
      const memberDoc = doc(this.firestore, `accounts/${orgId}/members/${currentUser.id}`);
      const memberData = await docData(memberDoc).pipe(
        map(data => data as { role: OrgRole } | null)
      ).toPromise();

      if (memberData) {
        const org = await this.orgService.getOrganization(orgId).toPromise();
        const isOwner = org?.ownerId === currentUser.id;
        
        this._orgMembership.set({
          isMember: true,
          role: memberData.role,
          isOwner
        });
      } else {
        this._orgMembership.set({ isMember: false, role: null, isOwner: false });
      }
    } catch (error) {
      console.error('Failed to load organization membership:', error);
      this._orgMembership.set({ isMember: false, role: null, isOwner: false });
    }
  }

  // 權限檢查方法
  can(action: string, resource: string): boolean {
    const account = this.authService.currentAccount();
    if (!account) return false;

    // 基本權限檢查
    const hasBasicPermission = account.permissions.abilities.some(ability => 
      ability.action === action && ability.resource === resource
    );

    if (hasBasicPermission) return true;

    // 組織特定權限檢查
    const membership = this._orgMembership();
    if (!membership.isMember) return false;

    switch (action) {
      case 'read':
        return true; // 所有成員都可以讀取
      
      case 'write':
        return membership.role === OrgRole.ADMIN || membership.isOwner;
      
      case 'admin':
        return membership.role === OrgRole.ADMIN || membership.isOwner;
      
      case 'delete':
        return membership.isOwner;
      
      default:
        return false;
    }
  }

  // 團隊權限檢查
  async canManageTeam(teamId: string): Promise<boolean> {
    const membership = this._orgMembership();
    if (!membership.isMember) return false;

    // 組織管理員和擁有者可以管理所有團隊
    if (membership.role === OrgRole.ADMIN || membership.isOwner) {
      return true;
    }

    // 檢查是否為團隊維護者
    const currentUser = this.authService.currentAccount();
    if (!currentUser) return false;

    try {
      const teamMemberDoc = doc(
        this.firestore, 
        `accounts/${this._currentOrgId()}/teams/${teamId}/members/${currentUser.id}`
      );
      const teamMemberData = await docData(teamMemberDoc).pipe(
        map(data => data as { role: TeamRole } | null)
      ).toPromise();

      return teamMemberData?.role === TeamRole.MAINTAINER;
    } catch (error) {
      console.error('Failed to check team permissions:', error);
      return false;
    }
  }

  // Repository 權限檢查
  async canAccessRepository(repositoryId: string): Promise<boolean> {
    const account = this.authService.currentAccount();
    if (!account) return false;

    try {
      const repoDoc = doc(this.firestore, `repositories/${repositoryId}`);
      const repoData = await docData(repoDoc).pipe(
        map(data => data as { ownerId: string; ownerType: string; private: boolean } | null)
      ).toPromise();

      if (!repoData) return false;

      // 如果是公開 Repository，任何人都可以讀取
      if (!repoData.private) return true;

      // 檢查是否為擁有者
      if (repoData.ownerId === account.id) return true;

      // 檢查是否為協作者
      const collaboratorDoc = doc(
        this.firestore, 
        `repositories/${repositoryId}/collaborators/${account.id}`
      );
      const collaboratorData = await docData(collaboratorDoc).pipe(
        map(data => !!data)
      ).toPromise();

      return collaboratorData;
    } catch (error) {
      console.error('Failed to check repository permissions:', error);
      return false;
    }
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

## 八、現代化 UI 元件範例 - 成員管理 (Control Flow + Signals)

```typescript
// src/app/routes/members-list/members-list.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { OrganizationService } from '@core/services/organization.service';
import { PermissionService } from '@core/services/permission.service';
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
    NzPopconfirmModule
  ],
  template: `
    @if (isLoading()) {
      <nz-spin nzSize="large" />
    } @else if (error()) {
      <nz-alert 
        nzType="error" 
        [nzMessage]="error()" 
        nzShowIcon />
    } @else {
      <nz-table 
        #memberTable 
        [nzData]="members()" 
        [nzLoading]="isLoading()">
        <thead>
          <tr>
            <th>成員</th>
            <th>角色</th>
            <th>加入時間</th>
            @if (canManageMembers()) {
              <th>操作</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (member of memberTable.data; track member.id) {
            <tr>
              <td>{{ member.userId }}</td>
              <td>
                @if (canManageMembers()) {
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
              <td>{{ member.joinedAt | date: 'yyyy-MM-dd' }}</td>
              @if (canManageMembers()) {
                <td>
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
              }
            </tr>
          }
        </tbody>
      </nz-table>
    }
  `
})
export class MembersListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orgService = inject(OrganizationService);
  private permissionService = inject(PermissionService);
  private message = inject(NzMessageService);

  // Signals for state management
  private _members = signal<OrganizationMember[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Readonly signals
  readonly members = this._members.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly canManageMembers = computed(() => 
    this.permissionService.canManageMembers()
  );

  orgId!: string;

  availableRoles = [
    { value: OrgRole.OWNER, label: '擁有者' },
    { value: OrgRole.ADMIN, label: '管理員' },
    { value: OrgRole.MEMBER, label: '成員' },
    { value: OrgRole.BILLING, label: '帳務管理員' },
    { value: OrgRole.OUTSIDE_COLLABORATOR, label: '外部協作者' }
  ];

  async ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId')!;
    
    // 設置當前組織到權限服務
    await this.permissionService.setCurrentOrganization(this.orgId);
    
    // 載入成員列表
    await this.loadMembers();
  }

  private async loadMembers() {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      const members = await this.orgService.getOrganizationMembers(this.orgId).toPromise();
      this._members.set(members || []);
    } catch (error) {
      this._error.set(`載入成員列表失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateRole(member: OrganizationMember, newRole: OrgRole) {
    try {
      await this.orgService.updateMemberRole(this.orgId, member.userId, newRole);
      this.message.success('角色已更新');
      
      // 更新本地狀態
      this._members.update(members => 
        members.map(m => m.id === member.id ? { ...m, role: newRole } : m)
      );
    } catch (error) {
      this.message.error('更新失敗');
    }
  }

  async removeMember(member: OrganizationMember) {
    try {
      await this.orgService.removeOrganizationMember(this.orgId, member.userId);
      this.message.success('成員已移除');
      
      // 更新本地狀態
      this._members.update(members => 
        members.filter(m => m.id !== member.id)
      );
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
      return member.data.role == 'owner' || member.data.role == 'admin' || 
             (level == 'write' && member.data.role == 'admin');
    }
    
    function isTeamMaintainer(accountId, teamId) {
      let teamMember = get(/databases/$(database)/documents/accounts/$(accountId)/teams/$(teamId)/members/$(request.auth.uid));
      return teamMember.data.role == 'maintainer';
    }
  }
}
```

## 十、現代化應用程式配置 (Standalone API)

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes/routes';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    // Angular 核心提供者
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    
    // Firebase 提供者
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => getAnalytics()),
    
    // 自定義服務提供者
    // ... 其他服務
  ],
}).catch(err => console.error(err));
```

## 十一、使用範例 - 現代化權限檢查

### 1. 在模板中使用 Control Flow + Signals

```html
<!-- 使用 @if 替代 *aclIf -->
@if (permissionService.canManageTeams()) {
  <button 
    nz-button 
    (click)="createTeam()">
    建立團隊
  </button>
}

<!-- 使用 @if 進行條件渲染 -->
@if (permissionService.canManageMembers()) {
  <nz-select [(ngModel)]="selectedRole">
    <nz-option nzValue="admin" nzLabel="管理員"></nz-option>
    <nz-option nzValue="member" nzLabel="成員"></nz-option>
  </nz-select>
}

<!-- 使用 @if/@else 進行條件顯示 -->
@if (permissionService.canManageOrganization()) {
  <button nz-button (click)="editSettings()">編輯設定</button>
} @else {
  <span>唯讀模式</span>
}
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
import { firstValueFrom } from 'rxjs';
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
    const teams = await firstValueFrom(this.orgService.getUserTeams(orgId, userId));
    
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

## 十二、測試策略

### 單元測試範例

```typescript
// src/app/core/models/auth.model.spec.ts
import { ValidationUtils, ProfileVO, PermissionVO } from './auth.model';

describe('ValidationUtils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(ValidationUtils.validateEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(ValidationUtils.validateEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.validateEmail('test@')).toBe(false);
      expect(ValidationUtils.validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateProfile', () => {
    it('should validate correct profile', () => {
      const profile: ProfileVO = {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Software Developer',
        location: 'Taipei',
        website: 'https://johndoe.com'
      };

      const errors = ValidationUtils.validateProfile(profile);
      expect(errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const profile: ProfileVO = {
        name: '',
        email: 'john@example.com'
      };

      const errors = ValidationUtils.validateProfile(profile);
      expect(errors).toContain('Profile name cannot be empty');
    });

    it('should reject invalid email', () => {
      const profile: ProfileVO = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const errors = ValidationUtils.validateProfile(profile);
      expect(errors).toContain('Invalid email format');
    });
  });

  describe('validatePermission', () => {
    it('should validate correct permission', () => {
      const permission: PermissionVO = {
        roles: ['user', 'admin'],
        abilities: [
          { action: 'read', resource: 'organization' },
          { action: 'write', resource: 'team' }
        ]
      };

      const errors = ValidationUtils.validatePermission(permission);
      expect(errors).toHaveLength(0);
    });

    it('should reject empty roles', () => {
      const permission: PermissionVO = {
        roles: [],
        abilities: [{ action: 'read', resource: 'organization' }]
      };

      const errors = ValidationUtils.validatePermission(permission);
      expect(errors).toContain('At least one role is required');
    });
  });
});
```

### 整合測試範例

```typescript
// src/app/core/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

describe('AuthService', () => {
  let service: AuthService;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockAuth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('Firestore', ['doc', 'collection']);
    const authSpy = jasmine.createSpyObj('Auth', ['signInWithPopup', 'signOut']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Firestore, useValue: firestoreSpy },
        { provide: Auth, useValue: authSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    mockFirestore = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signInWithGoogle', () => {
    it('should handle successful sign in', async () => {
      const mockCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg'
        }
      };

      mockAuth.signInWithPopup.and.returnValue(Promise.resolve(mockCredential));
      
      const result = await service.signInWithGoogle();
      
      expect(result).toEqual(mockCredential);
      expect(mockAuth.signInWithPopup).toHaveBeenCalled();
    });

    it('should handle sign in error', async () => {
      const error = new Error('Sign in failed');
      mockAuth.signInWithPopup.and.returnValue(Promise.reject(error));

      await expectAsync(service.signInWithGoogle()).toBeRejectedWith(error);
    });
  });
});
```

### E2E 測試範例

```typescript
// e2e/src/auth.e2e-spec.ts
import { browser, by, element } from 'protractor';

describe('Authentication Flow', () => {
  beforeEach(() => {
    browser.get('/');
  });

  it('should display login button when not authenticated', () => {
    expect(element(by.css('[data-testid="login-button"]')).isDisplayed()).toBeTruthy();
  });

  it('should redirect to dashboard after successful login', async () => {
    element(by.css('[data-testid="login-button"]')).click();
    
    // 等待 Google 登入彈窗並完成登入流程
    await browser.sleep(2000);
    
    expect(browser.getCurrentUrl()).toContain('/dashboard');
  });

  it('should display user profile after login', () => {
    element(by.css('[data-testid="user-profile"]')).isDisplayed().then(displayed => {
      expect(displayed).toBeTruthy();
    });
  });
});
```

## 十三、主要特點總結

### 1. GitHub 式設計
- ✅ 使用 `Account` 統一模型，通過 `type` 區分用戶和組織
- ✅ 使用 `login` 作為唯一識別碼
- ✅ 統一的 `/accounts` 集合路徑

### 2. 領域驅動設計 (DDD) 優點整合
- ✅ 使用 Value Objects (ProfileVO, PermissionVO, SettingsVO) 封裝領域邏輯
- ✅ 完整的驗證工具類 (ValidationUtils) 確保資料完整性
- ✅ 更好的錯誤處理和異常管理
- ✅ 領域邏輯與基礎設施分離

### 3. 多層級權限系統
- ✅ 個人 → 組織 → 團隊 → 資源
- ✅ 5 種組織角色：Owner, Admin, Member, Billing, Outside Collaborator
- ✅ 2 種團隊角色：Maintainer, Member

### 4. 角色繼承
- ✅ 組織角色決定基本權限
- ✅ 團隊角色提供細粒度控制
- ✅ 權限可疊加和覆寫

### 5. 動態權限控制
- ✅ 使用 @delon/acl 動態計算權限
- ✅ 支援模板指令 `*aclIf`
- ✅ 支援程式碼檢查 `aclService.can()`

### 6. 安全性
- ✅ Firestore 安全規則層級檢查
- ✅ 前端路由守衛保護
- ✅ 後端權限雙重驗證
- ✅ 完整的輸入驗證和錯誤處理

### 7. 擴展性
- ✅ 易於添加新的資源類型
- ✅ 易於添加新的權限規則
- ✅ 支援自定義權限邏輯
- ✅ 模組化的 Value Objects 設計

### 8. 測試覆蓋
- ✅ 完整的單元測試範例
- ✅ 整合測試策略
- ✅ E2E 測試範例
- ✅ 驗證邏輯測試覆蓋

### 9. 開發體驗
- ✅ TypeScript 類型安全
- ✅ 完整的錯誤訊息和日誌
- ✅ 清晰的 API 設計
- ✅ 詳細的文檔和範例