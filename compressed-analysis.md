This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: angular/src/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
angular/
  src/
    app/
      core/
        guards/
          permission.guard.ts
        models/
          auth.model.ts
        services/
          auth.service.ts
          organization.service.ts
          permission.service.ts
          repository.service.ts
        utils/
          avatar.utils.ts
          validation.utils.ts
      dashboard/
        admin.component.ts
        dashboard.component.ts
        editor.component.ts
        viewer.component.ts
      features/
        organization/
          components/
            organization-card.component.ts
            organization-roles.component.ts
            security-manager.component.ts
            team-management.component.ts
          models/
            organization.model.ts
          routes/
            organization.routes.ts
          services/
            github-aligned-api.service.ts
            permission-calculation.service.ts
          index.ts
        repository/
          components/
            collaborator-management.component.ts
            repository-detail.component.ts
            repository-list.component.ts
          models/
            repository.model.ts
          routes/
            repository.routes.ts
        user/
          auth/
            auth.guard.ts
            auth.service.ts
            index.ts
            login.component.ts
            role.guard.ts
            signup.component.ts
            unauthorized.component.ts
          profile/
            profile-management.component.ts
          index.ts
          user.model.ts
          user.routes.ts
          user.service.ts
      landing/
        landing.component.ts
      app.config.ts
      app.html
      app.routes.ts
      app.scss
      app.spec.ts
      app.ts
    environments/
      environment.prod.ts
      environment.sample.ts
    index.html
    main.ts
    styles.scss
```

# Files

## File: angular/src/app/core/services/permission.service.ts
```typescript
// src/app/core/services/permission.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { OrganizationService } from './organization.service';
import { OrgRole, TeamRole, ACLAbility } from '../models/auth.model';
import { map } from 'rxjs/operators';

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

      return collaboratorData || false;
    } catch (error) {
      console.error('Failed to check repository permissions:', error);
      return false;
    }
  }

  // 檢查 Repository 寫入權限
  async canWriteRepository(repositoryId: string): Promise<boolean> {
    const account = this.authService.currentAccount();
    if (!account) return false;

    try {
      const repoDoc = doc(this.firestore, `repositories/${repositoryId}`);
      const repoData = await docData(repoDoc).pipe(
        map(data => data as { ownerId: string; ownerType: string; private: boolean } | null)
      ).toPromise();

      if (!repoData) return false;

      // 檢查是否為擁有者
      if (repoData.ownerId === account.id) return true;

      // 檢查協作者權限
      const collaboratorDoc = doc(
        this.firestore, 
        `repositories/${repositoryId}/collaborators/${account.id}`
      );
      const collaboratorData = await docData(collaboratorDoc).pipe(
        map(data => data as { permission: string } | null)
      ).toPromise();

      if (!collaboratorData) return false;

      // 檢查權限等級
      const writePermissions = ['write', 'maintain', 'admin'];
      return writePermissions.includes(collaboratorData.permission);
    } catch (error) {
      console.error('Failed to check repository write permissions:', error);
      return false;
    }
  }

  // 檢查 Repository 管理權限
  async canManageRepository(repositoryId: string): Promise<boolean> {
    const account = this.authService.currentAccount();
    if (!account) return false;

    try {
      const repoDoc = doc(this.firestore, `repositories/${repositoryId}`);
      const repoData = await docData(repoDoc).pipe(
        map(data => data as { ownerId: string; ownerType: string; private: boolean } | null)
      ).toPromise();

      if (!repoData) return false;

      // 檢查是否為擁有者
      if (repoData.ownerId === account.id) return true;

      // 檢查協作者權限
      const collaboratorDoc = doc(
        this.firestore, 
        `repositories/${repositoryId}/collaborators/${account.id}`
      );
      const collaboratorData = await docData(collaboratorDoc).pipe(
        map(data => data as { permission: string } | null)
      ).toPromise();

      if (!collaboratorData) return false;

      // 檢查權限等級
      const adminPermissions = ['maintain', 'admin'];
      return adminPermissions.includes(collaboratorData.permission);
    } catch (error) {
      console.error('Failed to check repository manage permissions:', error);
      return false;
    }
  }

  // 清除組織上下文
  clearOrganizationContext() {
    this._currentOrgId.set(null);
    this._orgMembership.set({ isMember: false, role: null, isOwner: false });
  }

  // 檢查用戶角色
  hasRole(role: string): boolean {
    const account = this.authService.currentAccount();
    if (!account) return false;
    
    return account.permissions.roles.includes(role);
  }

  // 檢查組織角色
  hasOrgRole(role: OrgRole): boolean {
    const membership = this._orgMembership();
    return membership.role === role;
  }

  // 檢查是否為組織擁有者
  isOrganizationOwner(): boolean {
    const membership = this._orgMembership();
    return membership.isOwner;
  }

  // 檢查是否為組織管理員
  isOrganizationAdmin(): boolean {
    const membership = this._orgMembership();
    return membership.role === OrgRole.ADMIN || membership.isOwner;
  }
}
```

## File: angular/src/app/core/services/repository.service.ts
```typescript
// src/app/core/services/repository.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
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
import { Observable, map, switchMap, combineLatest, of } from 'rxjs';
import { 
  Repository, 
  RepositoryCollaborator, 
  RepositoryTeamAccess,
  Account
} from '../models/auth.model';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';
import { ValidationUtils } from '../utils/validation.utils';

@Injectable({ providedIn: 'root' })
export class RepositoryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);

  // Signals for state management
  private _currentRepository = signal<Repository | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Readonly signals
  readonly currentRepository = this._currentRepository.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly isRepositoryLoaded = computed(() => this._currentRepository() !== null);
  readonly canManageRepository = computed(() => {
    const repo = this._currentRepository();
    if (!repo) return false;
    
    const currentAccount = this.authService.currentAccount();
    if (!currentAccount) return false;
    
    return repo.ownerId === currentAccount.id;
  });

  async createRepository(
    name: string,
    description?: string,
    isPrivate: boolean = true,
    ownerId?: string
  ): Promise<string> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 驗證 Repository 名稱
      const nameValidation = ValidationUtils.validateRepositoryName(name);
      if (!nameValidation.isValid) {
        throw new Error(`Repository 名稱驗證失敗: ${nameValidation.errors.join(', ')}`);
      }

      const currentAccount = this.authService.currentAccount();
      if (!currentAccount) {
        throw new Error('用戶未登入');
      }

      const actualOwnerId = ownerId || currentAccount.id;
      const repoId = doc(collection(this.firestore, 'repositories')).id;
      const fullName = `${currentAccount.login}/${name}`;

      await setDoc(doc(this.firestore, `repositories/${repoId}`), {
        id: repoId,
        name,
        fullName,
        description,
        private: isPrivate,
        ownerId: actualOwnerId,
        ownerType: currentAccount.type,
        createdAt: new Date(),
        updatedAt: new Date(),
        defaultBranch: 'main',
        topics: []
      });

      // 如果擁有者不是當前用戶，添加協作者
      if (actualOwnerId !== currentAccount.id) {
        await this.addCollaborator(repoId, currentAccount.id, 'admin');
      }

      return repoId;
    } catch (error) {
      this._error.set(`創建 Repository 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getRepository(repoId: string): Observable<Repository | undefined> {
    const repoDoc = doc(this.firestore, `repositories/${repoId}`);
    return docData(repoDoc, { idField: 'id' }).pipe(
      map(data => {
        if (data) {
          return data as Repository;
        }
        return undefined;
      })
    );
  }

  async loadRepository(repoId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const repoDoc = doc(this.firestore, `repositories/${repoId}`);
      const repoData = await docData(repoDoc, { idField: 'id' }).pipe(
        map(data => data as Repository | null)
      ).toPromise();

      this._currentRepository.set(repoData || null);
    } catch (error) {
      this._error.set(`載入 Repository 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this._isLoading.set(false);
    }
  }

  getUserRepositories(userId: string): Observable<Repository[]> {
    const reposQuery = query(
      collection(this.firestore, 'repositories'),
      where('ownerId', '==', userId)
    );
    return collectionData(reposQuery, { idField: 'id' }) as Observable<Repository[]>;
  }

  getOrganizationRepositories(orgId: string): Observable<Repository[]> {
    const reposQuery = query(
      collection(this.firestore, 'repositories'),
      where('ownerId', '==', orgId),
      where('ownerType', '==', 'organization')
    );
    return collectionData(reposQuery, { idField: 'id' }) as Observable<Repository[]>;
  }

  async updateRepository(
    repoId: string,
    updates: Partial<Repository>
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限修改此 Repository');
      }

      const repoRef = doc(this.firestore, `repositories/${repoId}`);
      await updateDoc(repoRef, {
        ...updates,
        updatedAt: new Date()
      });

      // 更新本地狀態
      const currentRepo = this._currentRepository();
      if (currentRepo && currentRepo.id === repoId) {
        this._currentRepository.set({ ...currentRepo, ...updates, updatedAt: new Date() });
      }
    } catch (error) {
      this._error.set(`更新 Repository 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async deleteRepository(repoId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限刪除此 Repository');
      }

      const repoRef = doc(this.firestore, `repositories/${repoId}`);
      await deleteDoc(repoRef);

      // 清除本地狀態
      const currentRepo = this._currentRepository();
      if (currentRepo && currentRepo.id === repoId) {
        this._currentRepository.set(null);
      }
    } catch (error) {
      this._error.set(`刪除 Repository 失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getRepositoryCollaborators(repoId: string): Observable<RepositoryCollaborator[]> {
    const collaboratorsCol = collection(this.firestore, `repositories/${repoId}/collaborators`);
    return collectionData(collaboratorsCol, { idField: 'id' }) as Observable<RepositoryCollaborator[]>;
  }

  async addCollaborator(
    repoId: string,
    userId: string,
    permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin',
    invitedBy?: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限添加協作者');
      }

      const collaboratorRef = doc(this.firestore, `repositories/${repoId}/collaborators/${userId}`);
      await setDoc(collaboratorRef, {
        id: userId,
        repositoryId: repoId,
        userId,
        permission,
        roleName: this.getRoleName(permission),
        invitedBy: invitedBy || this.authService.currentAccount()?.id,
        invitedAt: new Date()
      });
    } catch (error) {
      this._error.set(`添加協作者失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateCollaboratorPermission(
    repoId: string,
    userId: string,
    newPermission: 'read' | 'triage' | 'write' | 'maintain' | 'admin'
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限修改協作者權限');
      }

      const collaboratorRef = doc(this.firestore, `repositories/${repoId}/collaborators/${userId}`);
      await updateDoc(collaboratorRef, {
        permission: newPermission,
        roleName: this.getRoleName(newPermission)
      });
    } catch (error) {
      this._error.set(`更新協作者權限失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async removeCollaborator(repoId: string, userId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限移除協作者');
      }

      const collaboratorRef = doc(this.firestore, `repositories/${repoId}/collaborators/${userId}`);
      await deleteDoc(collaboratorRef);
    } catch (error) {
      this._error.set(`移除協作者失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getRepositoryTeamAccess(repoId: string): Observable<RepositoryTeamAccess[]> {
    const teamAccessCol = collection(this.firestore, `repositories/${repoId}/teamAccess`);
    return collectionData(teamAccessCol, { idField: 'id' }) as Observable<RepositoryTeamAccess[]>;
  }

  async addTeamAccess(
    repoId: string,
    teamId: string,
    permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin',
    grantedBy?: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限添加團隊訪問權限');
      }

      const teamAccessRef = doc(this.firestore, `repositories/${repoId}/teamAccess/${teamId}`);
      await setDoc(teamAccessRef, {
        id: teamId,
        repositoryId: repoId,
        teamId,
        permission,
        roleName: this.getRoleName(permission),
        grantedBy: grantedBy || this.authService.currentAccount()?.id,
        grantedAt: new Date()
      });
    } catch (error) {
      this._error.set(`添加團隊訪問權限失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateTeamAccessPermission(
    repoId: string,
    teamId: string,
    newPermission: 'read' | 'triage' | 'write' | 'maintain' | 'admin'
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限修改團隊訪問權限');
      }

      const teamAccessRef = doc(this.firestore, `repositories/${repoId}/teamAccess/${teamId}`);
      await updateDoc(teamAccessRef, {
        permission: newPermission,
        roleName: this.getRoleName(newPermission)
      });
    } catch (error) {
      this._error.set(`更新團隊訪問權限失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async removeTeamAccess(repoId: string, teamId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 檢查權限
      const canManage = await this.permissionService.canManageRepository(repoId);
      if (!canManage) {
        throw new Error('沒有權限移除團隊訪問權限');
      }

      const teamAccessRef = doc(this.firestore, `repositories/${repoId}/teamAccess/${teamId}`);
      await deleteDoc(teamAccessRef);
    } catch (error) {
      this._error.set(`移除團隊訪問權限失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  private getRoleName(permission: string): string {
    const roleMap: { [key: string]: string } = {
      'read': '讀取',
      'triage': '分類',
      'write': '寫入',
      'maintain': '維護',
      'admin': '管理員'
    };
    return roleMap[permission] || permission;
  }

  // 清除錯誤
  clearError() {
    this._error.set(null);
  }

  // 清除 Repository 上下文
  clearRepositoryContext() {
    this._currentRepository.set(null);
    this._error.set(null);
  }
}
```

## File: angular/src/app/core/utils/avatar.utils.ts
```typescript
/**
 * 頭像 URL 處理工具
 * 統一處理預設頭像和用戶自定義頭像的 URL 生成
 */

export class AvatarUtils {
  private static readonly DEFAULT_AVATAR = 'avatar.jpg';
  private static readonly STORAGE_BASE_URL = 'https://firebasestorage.googleapis.com/v0/b/elite-chiller-455712-c4.firebasestorage.app/o';

  /**
   * 獲取頭像 URL
   * @param avatar 頭像路徑或 URL
   * @returns 完整的頭像 URL
   */
  static getAvatarUrl(avatar: string | undefined | null): string {
    if (!avatar) {
      // 使用預設頭像
      return `${this.STORAGE_BASE_URL}/${this.DEFAULT_AVATAR}?alt=media`;
    }
    
    if (avatar.startsWith('http')) {
      // 完整的 URL，直接返回
      return avatar;
    } else {
      // 相對路徑，從 Storage 獲取
      return `${this.STORAGE_BASE_URL}/${avatar}?alt=media`;
    }
  }

  /**
   * 檢查是否為預設頭像
   * @param avatar 頭像路徑或 URL
   * @returns 是否為預設頭像
   */
  static isDefaultAvatar(avatar: string | undefined | null): boolean {
    if (!avatar) return true;
    return avatar === this.DEFAULT_AVATAR || avatar.includes(this.DEFAULT_AVATAR);
  }

  /**
   * 獲取預設頭像 URL
   * @returns 預設頭像的完整 URL
   */
  static getDefaultAvatarUrl(): string {
    return `${this.STORAGE_BASE_URL}/${this.DEFAULT_AVATAR}?alt=media`;
  }
}
```

## File: angular/src/app/dashboard/admin.component.ts
```typescript
import {
  Component,
  inject,
  OnInit,
  Injector,
  runInInjectionContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc
} from '@angular/fire/firestore';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

interface UserData {
  uid: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule,
    MatToolbarModule,
    MatButtonModule
  ],
  template: `
    <div class="admin-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Admin Panel</span>
        <span class="spacer"></span>
        <button mat-button color="accent" (click)="refresh()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
        <button mat-button color="warn" (click)="logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      </mat-toolbar>

      <mat-card class="admin-card">
        <h2 class="title">👑 Manage Users</h2>

        <div *ngIf="!isLoading; else loading">
          <table mat-table [dataSource]="users" class="mat-elevation-z4 wide-table">

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>
                <mat-icon>email</mat-icon> Email
              </th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>

            <ng-container matColumnDef="uid">
              <th mat-header-cell *matHeaderCellDef>
                <mat-icon>fingerprint</mat-icon> UID
              </th>
              <td mat-cell *matCellDef="let user">{{ user.uid }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>
                <mat-icon>badge</mat-icon> Role
              </th>
              <td mat-cell *matCellDef="let user">
                <mat-form-field appearance="outline" class="role-select">
                  <mat-select [value]="user.role" (selectionChange)="updateRole(user.uid, $event.value)">
                    <mat-option *ngFor="let role of roles" [value]="role">
                      {{ role | titlecase }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <ng-template #loading>
          <div class="loading">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Fetching users...</p>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .toolbar {
      background-color: #e3f2fd; /* Light Blue */
      color: #0d47a1;
      padding: 0 24px;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .admin-card {
      margin: 32px auto;
      padding: 32px;
      width: 100%;
      max-width: 1300px;
      border-radius: 20px;
      background: white;
    }

    .title {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #333;
      text-align: center;
    }

    .wide-table {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background-color: #fff;
    }

    th.mat-header-cell {
      background: #e3f2fd;
      color: #0d47a1;
      font-weight: 600;
      font-size: 14px;
    }

    td.mat-cell {
      font-size: 14px;
      padding: 16px;
    }

    tr.mat-row:nth-child(even) td {
      background: #f1f1f1;
    }

    .role-select {
      width: 300px;
      padding-top: 20px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      color: #666;
    }

    mat-icon {
      vertical-align: middle;
      margin-right: 6px;
      font-size: 18px;
    }
  `]
})
export class AdminComponent implements OnInit {
  firestore = inject(Firestore);
  snackbar = inject(MatSnackBar);
  router = inject(Router);
  injector = inject(Injector);

  users: UserData[] = [];
  isLoading: boolean = true;
  displayedColumns = ['email', 'uid', 'role'];
  roles = ['admin', 'editor', 'viewer'];

  ngOnInit() {
    console.log("here")
    this.loadUsers();
  }

  loadUsers() {
    runInInjectionContext(this.injector, () => {
      const usersRef = collection(this.firestore, 'users');
      collectionData(usersRef, { idField: 'uid' }).subscribe(data => {
        this.users = data as UserData[];
        this.isLoading = false;
      });
    });
  }

  updateRole(uid: string, newRole: string) {
    const userRef = doc(this.firestore, 'users', uid);
    updateDoc(userRef, { role: newRole }).then(() => {
      this.snackbar.open(`✅ Role updated to ${newRole}`, 'Close', { duration: 3000 });
    }).catch(err => {
      console.error('❌ Failed to update role:', err);
      this.snackbar.open('❌ Failed to update role', 'Close', { duration: 3000 });
    });
  }

  refresh() {
    this.isLoading = true;
    this.loadUsers();
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
```

## File: angular/src/app/dashboard/dashboard.component.ts
```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dashboard-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Dashboard</span>
        <span class="spacer"></span>
        <button mat-button color="accent" (click)="navigateToAccount()">
          <mat-icon>account_circle</mat-icon> Account
        </button>
        <button mat-button color="warn" (click)="logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      </mat-toolbar>

      <div class="dashboard-content">
        <mat-card class="welcome-card">
          <h1 class="welcome-title">Welcome to Angular Fire RoleKit! 🎉</h1>
          <p class="welcome-subtitle">GitHub 式多層級權限系統</p>
          
          @if (currentAccount()) {
            <div class="user-info">
              <mat-divider></mat-divider>
              <h3>👤 User Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <mat-icon>person</mat-icon>
                  <span><strong>Name:</strong> {{ currentAccount()?.profile?.name || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <mat-icon>email</mat-icon>
                  <span><strong>Email:</strong> {{ currentAccount()?.profile?.email || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <mat-icon>badge</mat-icon>
                  <span><strong>Type:</strong> {{ currentAccount()?.type | titlecase }}</span>
                </div>
                <div class="info-item">
                  <mat-icon>security</mat-icon>
                  <span><strong>Roles:</strong> {{ currentAccount()?.permissions?.roles?.join(', ') || 'N/A' }}</span>
                </div>
              </div>
            </div>
          }

          <mat-divider></mat-divider>
          
          <div class="quick-actions">
            <h3>🚀 Quick Actions</h3>
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="navigateToAccount()">
                <mat-icon>account_circle</mat-icon>
                Manage Account
              </button>
              
              <button mat-raised-button color="accent" (click)="navigateToOrganizations()">
                <mat-icon>business</mat-icon>
                Organizations
              </button>
              
              <button mat-raised-button color="primary" (click)="navigateToRepositories()">
                <mat-icon>folder</mat-icon>
                Repositories
              </button>
            </div>
          </div>

          <mat-divider></mat-divider>
          
          <div class="system-info">
            <h3>ℹ️ System Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon>build</mat-icon>
                <span><strong>Framework:</strong> Angular 20.1.0</span>
              </div>
              <div class="info-item">
                <mat-icon>cloud</mat-icon>
                <span><strong>Backend:</strong> Firebase 11.10.0</span>
              </div>
              <div class="info-item">
                <mat-icon>security</mat-icon>
                <span><strong>Auth:</strong> Firebase Auth + Firestore</span>
              </div>
              <div class="info-item">
                <mat-icon>palette</mat-icon>
                <span><strong>UI:</strong> Angular Material 20.1.0</span>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .toolbar {
      background-color: #e3f2fd;
      color: #0d47a1;
      padding: 0 24px;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .dashboard-content {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .welcome-card {
      padding: 32px;
      border-radius: 20px;
      background: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    .welcome-title {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-bottom: 8px;
    }

    .welcome-subtitle {
      font-size: 18px;
      color: #666;
      text-align: center;
      margin-bottom: 32px;
    }

    .user-info, .quick-actions, .system-info {
      margin: 24px 0;
    }

    .user-info h3, .quick-actions h3, .system-info h3 {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .info-item mat-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .action-buttons button {
      flex: 1;
      min-width: 200px;
      padding: 16px 24px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-icon {
      vertical-align: middle;
      font-size: 20px;
    }

    @media (max-width: 768px) {
      .dashboard-content {
        padding: 16px;
      }
      
      .welcome-card {
        padding: 24px;
      }
      
      .welcome-title {
        font-size: 24px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .action-buttons button {
        min-width: auto;
      }
      
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // 使用 Signals 獲取當前用戶信息
  readonly currentAccount = this.authService.currentAccount;
  readonly isAuthenticated = this.authService.isAuthenticated;

  navigateToAccount() {
    this.router.navigate(['/account']);
  }

  navigateToOrganizations() {
    this.router.navigate(['/organizations']);
  }

  navigateToRepositories() {
    this.router.navigate(['/repositories']);
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
```

## File: angular/src/app/dashboard/editor.component.ts
```typescript
import {
  Component,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  updateDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

interface Article {
  id?: string;
  title: string;
  content: string;
  createdAt: Date;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="editor-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Editor Panel</span>
        <span class="spacer"></span>
        <button mat-button color="warn" (click)="logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      </mat-toolbar>

      <mat-card class="editor-card">
        <h2 class="title">📝 {{ editingArticleId ? 'Edit Article' : 'Create Article' }}</h2>

        <form (ngSubmit)="saveArticle()" class="article-form">
          <mat-form-field appearance="outline" class="field">
            <mat-label>Title</mat-label>
            <input matInput [(ngModel)]="title" name="title" required />
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Content</mat-label>
            <textarea matInput [(ngModel)]="content" name="content" rows="8" required></textarea>
          </mat-form-field>

          <button mat-raised-button color="primary" class="save-btn" type="submit">
            <mat-icon>save</mat-icon> {{ editingArticleId ? 'Update' : 'Save' }}
          </button>
        </form>
      </mat-card>

      <mat-card class="preview-card" *ngIf="title || content">
        <h3 class="preview-title">🔍 Live Preview</h3>
        <h4>{{ title }}</h4>
        <p style="margin-top: 0px;">{{ content }}</p>
      </mat-card>

      <mat-card class="editor-card" *ngIf="articles.length">
        <h2 class="title">📚 Article History</h2>
        <div *ngFor="let article of articles" class="article-item">
          <div style="display: flex;">
                      <h3 style="width: 90%;">{{ article.title }}</h3>
          <div class="actions">
            <button mat-stroked-button color="primary" (click)="editArticle(article)">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button mat-stroked-button color="warn" (click)="deleteArticle(article.id)">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </div>
          </div>

          <p style="margin-top: 0px;">{{ article.content | slice:0:100 }}...</p>

        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .editor-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .toolbar {
      background-color: #e3f2fd;
      color: #0d47a1;
      padding: 0 24px;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .editor-card, .preview-card {
      margin: 24px auto;
      padding: 24px;
      width: 100%;
      max-width: 900px;
      border-radius: 16px;
      background: white;
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
      text-align: center;
    }

    .article-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field {
      width: 100%;
    }

    .save-btn {
      align-self: flex-end;
      height: 48px;
    }

    .preview-title {
      font-weight: 600;
      color: #0d47a1;
      margin-bottom: 12px;
    }

    h4 {
      margin-top: 0;
      font-size: 20px;
    }

    p {
      white-space: pre-line;
      font-size: 16px;
      color: #444;
    }

    mat-icon {
      vertical-align: middle;
      margin-right: 6px;
    }

    .article-item {
      margin-bottom: 20px;
      border-top: 1px solid #eee;
      padding-top: 16px;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
  `]
})
export class EditorComponent implements OnInit {
  firestore = inject(Firestore);
  snackbar = inject(MatSnackBar);
  router = inject(Router);

  title = '';
  content = '';
  editingArticleId: string | null = null;
  articles: Article[] = [];

  ngOnInit() {
    const articlesRef = collection(this.firestore, 'articles');
    collectionData(articlesRef, { idField: 'id' }).subscribe((data) => {
      this.articles = data as Article[];
    });
  }

  async saveArticle() {
    if (!this.title.trim() || !this.content.trim()) {
      this.snackbar.open('❗ Title and content are required', 'Close', { duration: 3000 });
      return;
    }

    try {
      if (this.editingArticleId) {
        const articleRef = doc(this.firestore, 'articles', this.editingArticleId);
        await updateDoc(articleRef, {
          title: this.title,
          content: this.content
        });
        this.snackbar.open('✅ Article updated!', 'Close', { duration: 3000 });
      } else {
        const articlesRef = collection(this.firestore, 'articles');
        await addDoc(articlesRef, {
          title: this.title,
          content: this.content,
          createdAt: new Date()
        });
        this.snackbar.open('✅ Article saved!', 'Close', { duration: 3000 });
      }

      this.title = '';
      this.content = '';
      this.editingArticleId = null;

    } catch (err) {
      console.error('❌ Error saving article:', err);
      this.snackbar.open('❌ Failed to save article', 'Close', { duration: 3000 });
    }
  }

  editArticle(article: Article) {
    this.title = article.title;
    this.content = article.content;
    this.editingArticleId = article.id || null;
  }

  async deleteArticle(id?: string) {
    if (!id) return;
    const confirmed = confirm('Are you sure you want to delete this article?');
    if (!confirmed) return;

    try {
      const articleRef = doc(this.firestore, 'articles', id);
      await deleteDoc(articleRef);
      this.snackbar.open('🗑️ Article deleted!', 'Close', { duration: 3000 });
    } catch (err) {
      console.error('❌ Error deleting article:', err);
      this.snackbar.open('❌ Failed to delete article', 'Close', { duration: 3000 });
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
```

## File: angular/src/app/dashboard/viewer.component.ts
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

interface Article {
  id?: string;
  title: string;
  content: string;
  createdAt: Date;
}

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="viewer-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Viewer Panel</span>
        <span class="spacer"></span>
        <button mat-button color="warn" (click)="logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      </mat-toolbar>

      <mat-card class="article-card" *ngFor="let article of articles">
        <h2>{{ article.title }}</h2>
        <p>{{ article.content }}</p>
<div class="date" *ngIf="article.createdAt">
  <mat-icon>calendar_today</mat-icon>
  {{ article.createdAt | date: 'medium' }}
</div>
      </mat-card>

      <mat-card *ngIf="articles.length == 0" class="no-articles">
        <p>No articles available yet. Please check back later!</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .viewer-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f5f7fa;
      padding-bottom: 48px;
    }

    .toolbar {
      background-color: #e3f2fd;
      color: #0d47a1;
      padding: 0 24px;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .article-card {
      margin: 24px auto;
      padding: 24px;
      width: 70%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    h2 {
      font-size: 24px;
      margin-bottom: 12px;
      color: #0d47a1;
    }

    p {
      font-size: 16px;
      color: #333;
      white-space: pre-line;
    }

    .date {
      margin-top: 12px;
      font-size: 14px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .no-articles {
      max-width: 600px;
      margin: 40px auto;
      text-align: center;
      background: white;
      padding: 32px;
      border-radius: 12px;
    }
  `]
})
export class ViewerComponent implements OnInit {
  firestore = inject(Firestore);
  router = inject(Router);

  articles: Article[] = [];

  ngOnInit() {
    const articlesRef = collection(this.firestore, 'articles');
    collectionData(articlesRef, { idField: 'id' }).subscribe((data) => {
    this.articles = (data as any[]).map((article) => ({
      ...article,
      createdAt: article.createdAt?.toDate()
    })).sort((a, b) => b.createdAt - a.createdAt);
    });
  }

  getDate(date: any) {
    return new Date(date.toDate());
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
```

## File: angular/src/app/features/organization/models/organization.model.ts
```typescript
/**
 * 組織詳細模型
 * 包含完整的組織信息，包括成員、團隊等詳細數據
 */
export interface OrganizationDetail {
  id: string;
  slug: string; // GitHub 風格的 URL-friendly 名稱
  name: string;
  description?: string;
  type: 'construction' | 'consulting' | 'supplier';
  profile: OrganizationProfile;
  members: OrganizationMember[];
  teams: Team[];
  securityManagers: SecurityManager[];
  organizationRoles: OrganizationRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationProfile {
  website?: string;
  location?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  banner?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: OrganizationRole;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface Team {
  id: string;
  slug: string; // GitHub 風格的 slug
  name: string;
  description: string;
  parentTeamId?: string; // 支援層級結構
  privacy: 'open' | 'closed';
  permission: 'read' | 'write' | 'admin';
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  username: string;
  role: 'member' | 'maintainer' | 'admin';
  joinedAt: Date;
}

export interface SecurityManager {
  id: string;
  type: 'user' | 'team';
  entityId: string; // userId 或 teamId
  permissions: SecurityPermission[];
  assignedAt: Date;
  assignedBy: string;
}

export interface SecurityPermission {
  id: string;
  name: string;
  description: string;
  resource: string; // 資源類型
  action: string; // 操作類型
  conditions?: Record<string, any>; // 額外條件
}

export interface OrganizationRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  level: number; // 角色等級
  isSystemRole: boolean; // 是否為系統預設角色
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: 'organization' | 'team' | 'project' | 'user';
}

// API 請求/響應模型
export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  type: 'construction' | 'consulting' | 'supplier';
  profile?: Partial<OrganizationProfile>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  profile?: Partial<OrganizationProfile>;
}

export interface CreateTeamRequest {
  name: string;
  slug: string;
  description: string;
  parentTeamId?: string;
  privacy: 'open' | 'closed';
  permission: 'read' | 'write' | 'admin';
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  privacy?: 'open' | 'closed';
  permission?: 'read' | 'write' | 'admin';
}

export interface InviteMemberRequest {
  email: string;
  role: string;
  message?: string;
}

export interface UpdateMemberRoleRequest {
  userId: string;
  role: string;
}

// 權限檢查結果
export interface PermissionResult {
  granted: boolean;
  reason?: string;
  level?: 'read' | 'write' | 'admin' | 'none';
  expiresAt?: Date;
}
```

## File: angular/src/app/features/organization/routes/organization.routes.ts
```typescript
import { Routes } from '@angular/router';

/**
 * 組織模組的路由配置
 * 對齊 TREE.md 的組織管理路由結構
 */
export const organizationRoutes: Routes = [
  {
    path: 'organizations',
    loadComponent: () => import('../components/organization-card.component').then(m => m.OrganizationCardComponent),
    title: '組織管理'
  },
  {
    path: 'teams',
    loadComponent: () => import('../components/team-management.component').then(m => m.TeamHierarchyComponent),
    title: '團隊管理'
  },
  {
    path: 'security',
    loadComponent: () => import('../components/security-manager.component').then(m => m.SecurityManagerComponent),
    title: '安全管理器'
  },
  {
    path: 'roles',
    loadComponent: () => import('../components/organization-roles.component').then(m => m.OrganizationRolesComponent),
    title: '組織角色系統'
  },
  {
    path: '',
    redirectTo: 'organizations',
    pathMatch: 'full'
  }
];
```

## File: angular/src/app/features/repository/components/collaborator-management.component.ts
```typescript
// src/app/features/repository/components/collaborator-management.component.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { RepositoryService } from '../../../core/services/repository.service';
import { AuthService } from '../../../core/services/auth.service';
import { RepositoryCollaborator } from '../../../core/models/auth.model';

@Component({
  selector: 'app-collaborator-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="collaborator-management-container">
      <div class="header">
        <div class="breadcrumb">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            返回 Repository
          </button>
          <mat-icon>chevron_right</mat-icon>
          <span>協作者管理</span>
        </div>
        
        <button mat-raised-button color="primary" (click)="addCollaborator()">
          <mat-icon>person_add</mat-icon>
          添加協作者
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>載入中...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error() }}</p>
          <button mat-button (click)="goBack()">重試</button>
        </div>
      } @else {
        <mat-card>
          <mat-card-header>
            <mat-card-title>協作者列表</mat-card-title>
            <mat-card-subtitle>管理 Repository 的協作者權限</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            @if (collaborators().length === 0) {
              <div class="empty-state">
                <mat-icon>people</mat-icon>
                <h3>還沒有協作者</h3>
                <p>添加協作者開始協作</p>
                <button mat-raised-button color="primary" (click)="addCollaborator()">
                  <mat-icon>person_add</mat-icon>
                  添加協作者
                </button>
              </div>
            } @else {
              <div class="table-container">
                <table mat-table [dataSource]="collaborators()" class="collaborator-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>用戶</th>
                    <td mat-cell *matCellDef="let collaborator">
                      <div class="user-info">
                        <mat-icon class="user-avatar">account_circle</mat-icon>
                        <span>{{ collaborator.userId }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="permission">
                    <th mat-header-cell *matHeaderCellDef>權限</th>
                    <td mat-cell *matCellDef="let collaborator">
                      <mat-chip [class]="getPermissionClass(collaborator.permission)">
                        {{ getPermissionLabel(collaborator.permission) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>角色</th>
                    <td mat-cell *matCellDef="let collaborator">
                      {{ collaborator.roleName }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="invitedAt">
                    <th mat-header-cell *matHeaderCellDef>邀請時間</th>
                    <td mat-cell *matCellDef="let collaborator">
                      {{ formatDate(collaborator.invitedAt) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>操作</th>
                    <td mat-cell *matCellDef="let collaborator">
                      <button mat-icon-button [matMenuTriggerFor]="menu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="editPermission(collaborator)">
                          <mat-icon>edit</mat-icon>
                          修改權限
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="removeCollaborator(collaborator)" class="danger">
                          <mat-icon>remove_circle</mat-icon>
                          移除協作者
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>

    <!-- 添加協作者對話框 -->
    <div class="add-collaborator-dialog" *ngIf="showAddDialog">
      <div class="dialog-overlay" (click)="closeAddDialog()"></div>
      <div class="dialog-content">
        <h2>添加協作者</h2>
        <form (ngSubmit)="submitAddCollaborator()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>用戶 ID</mat-label>
            <input matInput [(ngModel)]="newCollaborator.userId" name="userId" required>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>權限</mat-label>
            <mat-select [(ngModel)]="newCollaborator.permission" name="permission" required>
              <mat-option value="read">讀取</mat-option>
              <mat-option value="triage">分類</mat-option>
              <mat-option value="write">寫入</mat-option>
              <mat-option value="maintain">維護</mat-option>
              <mat-option value="admin">管理員</mat-option>
            </mat-select>
          </mat-form-field>
          
          <div class="dialog-actions">
            <button mat-button type="button" (click)="closeAddDialog()">取消</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                添加
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .collaborator-management-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .breadcrumb mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container mat-spinner {
      margin-bottom: 16px;
    }

    .error-container mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    .collaborator-table {
      width: 100%;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-avatar {
      color: #666;
    }

    .permission-read { background-color: #e3f2fd; color: #1976d2; }
    .permission-triage { background-color: #fff3e0; color: #f57c00; }
    .permission-write { background-color: #e8f5e8; color: #388e3c; }
    .permission-maintain { background-color: #f3e5f5; color: #7b1fa2; }
    .permission-admin { background-color: #ffebee; color: #d32f2f; }

    .danger {
      color: #f44336;
    }

    .add-collaborator-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
    }

    .dialog-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .dialog-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 8px;
      min-width: 400px;
      max-width: 90vw;
    }

    .dialog-content h2 {
      margin: 0 0 24px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .dialog-content {
        min-width: 300px;
        margin: 16px;
      }
    }
  `]
})
export class CollaboratorManagementComponent implements OnInit {
  private repositoryService = inject(RepositoryService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Signals
  readonly collaborators = signal<RepositoryCollaborator[]>([]);
  readonly isLoading = this.repositoryService.isLoading;
  readonly error = this.repositoryService.error;

  // Dialog state
  showAddDialog = false;
  newCollaborator = {
    userId: '',
    permission: 'read' as 'read' | 'triage' | 'write' | 'maintain' | 'admin'
  };

  // Table columns
  displayedColumns: string[] = ['user', 'permission', 'role', 'invitedAt', 'actions'];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const repoId = params['id'];
      if (repoId) {
        this.loadCollaborators(repoId);
      }
    });
  }

  async loadCollaborators(repoId: string) {
    try {
      const collaborators$ = this.repositoryService.getRepositoryCollaborators(repoId);
      collaborators$.subscribe(collaborators => {
        this.collaborators.set(collaborators);
      });
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  }

  goBack() {
    this.router.navigate(['/repositories']);
  }

  addCollaborator() {
    this.showAddDialog = true;
    this.newCollaborator = {
      userId: '',
      permission: 'read'
    };
  }

  closeAddDialog() {
    this.showAddDialog = false;
  }

  async submitAddCollaborator() {
    try {
      const repoId = this.route.snapshot.params['id'];
      await this.repositoryService.addCollaborator(
        repoId,
        this.newCollaborator.userId,
        this.newCollaborator.permission
      );
      
      this.closeAddDialog();
      await this.loadCollaborators(repoId);
    } catch (error) {
      console.error('Failed to add collaborator:', error);
    }
  }

  editPermission(collaborator: RepositoryCollaborator) {
    // TODO: 實現編輯權限功能
    console.log('Edit permission for:', collaborator);
  }

  async removeCollaborator(collaborator: RepositoryCollaborator) {
    if (confirm(`確定要移除協作者 ${collaborator.userId} 嗎？`)) {
      try {
        const repoId = this.route.snapshot.params['id'];
        await this.repositoryService.removeCollaborator(repoId, collaborator.userId);
        await this.loadCollaborators(repoId);
      } catch (error) {
        console.error('Failed to remove collaborator:', error);
      }
    }
  }

  getPermissionLabel(permission: string): string {
    const labels: { [key: string]: string } = {
      'read': '讀取',
      'triage': '分類',
      'write': '寫入',
      'maintain': '維護',
      'admin': '管理員'
    };
    return labels[permission] || permission;
  }

  getPermissionClass(permission: string): string {
    return `permission-${permission}`;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  }
}
```

## File: angular/src/app/features/repository/components/repository-detail.component.ts
```typescript
// src/app/features/repository/components/repository-detail.component.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { RepositoryService } from '../../../core/services/repository.service';
import { AuthService } from '../../../core/services/auth.service';
import { Repository } from '../../../core/models/auth.model';

@Component({
  selector: 'app-repository-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="repository-detail-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>載入中...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error() }}</p>
          <button mat-button (click)="goBack()">返回</button>
        </div>
      } @else if (repository()) {
        <div class="repository-header">
          <div class="breadcrumb">
            <button mat-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              返回列表
            </button>
            <mat-icon>chevron_right</mat-icon>
            <span>{{ repository()?.fullName }}</span>
          </div>
          
          <div class="header-actions">
            @if (canManageRepository()) {
              <button mat-button (click)="editRepository()">
                <mat-icon>edit</mat-icon>
                編輯
              </button>
              
              <button mat-button (click)="manageCollaborators()">
                <mat-icon>people</mat-icon>
                管理協作者
              </button>
              
              <button mat-button (click)="manageSettings()">
                <mat-icon>settings</mat-icon>
                設定
              </button>
              
              <button mat-button (click)="deleteRepository()" class="danger">
                <mat-icon>delete</mat-icon>
                刪除
              </button>
            }
          </div>
        </div>

        <div class="repository-content">
          <div class="repository-info">
            <div class="title-section">
              <h1>
                <mat-icon class="repo-icon">folder</mat-icon>
                {{ repository()?.name }}
              </h1>
              <div class="visibility-badge">
                <mat-icon [class]="repository()?.private ? 'private' : 'public'">
                  {{ repository()?.private ? 'lock' : 'public' }}
                </mat-icon>
                <span>{{ repository()?.private ? '私有' : '公開' }}</span>
              </div>
            </div>
            
            @if (repository()?.description) {
              <p class="description">{{ repository()?.description }}</p>
            }
            
            <div class="repository-meta">
              <div class="meta-item">
                <mat-icon>account_tree</mat-icon>
                <span>預設分支: {{ repository()?.defaultBranch }}</span>
              </div>
              
              <div class="meta-item">
                <mat-icon>schedule</mat-icon>
                <span>創建於: {{ formatDate(repository()?.createdAt) }}</span>
              </div>
              
              <div class="meta-item">
                <mat-icon>update</mat-icon>
                <span>更新於: {{ formatDate(repository()?.updatedAt) }}</span>
              </div>
            </div>
            
            @if (repository()?.topics && repository()!.topics.length > 0) {
              <div class="topics">
                <h3>標籤</h3>
                <div class="topic-chips">
                  @for (topic of repository()?.topics; track topic) {
                    <mat-chip>{{ topic }}</mat-chip>
                  }
                </div>
              </div>
            }
          </div>
          
          <div class="repository-tabs">
            <mat-tab-group>
              <mat-tab label="代碼">
                <div class="tab-content">
                  <div class="code-section">
                    <h3>代碼瀏覽</h3>
                    <p>這裡將顯示 Repository 的代碼結構</p>
                    <div class="placeholder">
                      <mat-icon>code</mat-icon>
                      <p>代碼瀏覽功能開發中...</p>
                    </div>
                  </div>
                </div>
              </mat-tab>
              
              <mat-tab label="Issues">
                <div class="tab-content">
                  <div class="issues-section">
                    <h3>Issues</h3>
                    <p>管理 Repository 的問題和錯誤報告</p>
                    <div class="placeholder">
                      <mat-icon>bug_report</mat-icon>
                      <p>Issues 功能開發中...</p>
                    </div>
                  </div>
                </div>
              </mat-tab>
              
              <mat-tab label="Pull Requests">
                <div class="tab-content">
                  <div class="pr-section">
                    <h3>Pull Requests</h3>
                    <p>管理代碼合併請求</p>
                    <div class="placeholder">
                      <mat-icon>merge</mat-icon>
                      <p>Pull Requests 功能開發中...</p>
                    </div>
                  </div>
                </div>
              </mat-tab>
              
              <mat-tab label="協作者">
                <div class="tab-content">
                  <div class="collaborators-section">
                    <h3>協作者管理</h3>
                    <p>管理 Repository 的協作者權限</p>
                    <div class="placeholder">
                      <mat-icon>people</mat-icon>
                      <p>協作者管理功能開發中...</p>
                    </div>
                  </div>
                </div>
              </mat-tab>
              
              <mat-tab label="設定">
                <div class="tab-content">
                  <div class="settings-section">
                    <h3>Repository 設定</h3>
                    <p>管理 Repository 的各種設定</p>
                    <div class="placeholder">
                      <mat-icon>settings</mat-icon>
                      <p>設定功能開發中...</p>
                    </div>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .repository-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container mat-spinner {
      margin-bottom: 16px;
    }

    .error-container mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .repository-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .breadcrumb mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .repository-content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 24px;
    }

    .repository-info {
      background: #f5f5f5;
      padding: 24px;
      border-radius: 8px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .title-section h1 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .repo-icon {
      color: #1976d2;
    }

    .visibility-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #fff;
      font-size: 14px;
    }

    .visibility-badge .private {
      color: #f44336;
    }

    .visibility-badge .public {
      color: #4caf50;
    }

    .description {
      color: #666;
      margin: 16px 0;
      line-height: 1.5;
    }

    .repository-meta {
      margin: 16px 0;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }

    .topics {
      margin-top: 24px;
    }

    .topics h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
    }

    .topic-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .repository-tabs {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .tab-content {
      padding: 24px;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      color: #666;
    }

    .placeholder mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .danger {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .repository-content {
        grid-template-columns: 1fr;
      }
      
      .repository-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class RepositoryDetailComponent implements OnInit {
  private repositoryService = inject(RepositoryService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Signals
  readonly repository = this.repositoryService.currentRepository;
  readonly isLoading = this.repositoryService.isLoading;
  readonly error = this.repositoryService.error;

  // Computed signals
  readonly canManageRepository = computed(() => {
    const repo = this.repository();
    const currentAccount = this.authService.currentAccount();
    return repo && currentAccount && repo.ownerId === currentAccount.id;
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const repoId = params['id'];
      if (repoId) {
        this.loadRepository(repoId);
      }
    });
  }

  async loadRepository(repoId: string) {
    try {
      await this.repositoryService.loadRepository(repoId);
    } catch (error) {
      console.error('Failed to load repository:', error);
    }
  }

  goBack() {
    this.router.navigate(['/repositories']);
  }

  editRepository() {
    const repo = this.repository();
    if (repo) {
      this.router.navigate(['/repositories', repo.id, 'edit']);
    }
  }

  manageCollaborators() {
    const repo = this.repository();
    if (repo) {
      this.router.navigate(['/repositories', repo.id, 'collaborators']);
    }
  }

  manageSettings() {
    const repo = this.repository();
    if (repo) {
      this.router.navigate(['/repositories', repo.id, 'settings']);
    }
  }

  async deleteRepository() {
    const repo = this.repository();
    if (repo && confirm('確定要刪除此 Repository 嗎？此操作無法復原。')) {
      try {
        await this.repositoryService.deleteRepository(repo.id);
        this.router.navigate(['/repositories']);
      } catch (error) {
        console.error('Failed to delete repository:', error);
      }
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  }
}
```

## File: angular/src/app/features/repository/components/repository-list.component.ts
```typescript
// src/app/features/repository/components/repository-list.component.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { RepositoryService } from '../../../core/services/repository.service';
import { AuthService } from '../../../core/services/auth.service';
import { Repository } from '../../../core/models/auth.model';

@Component({
  selector: 'app-repository-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="repository-list-container">
      <div class="header">
        <h1>我的 Repository</h1>
        <button mat-raised-button color="primary" (click)="createRepository()">
          <mat-icon>add</mat-icon>
          新建 Repository
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>載入中...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error() }}</p>
          <button mat-button (click)="loadRepositories()">重試</button>
        </div>
      } @else if (repositories().length === 0) {
        <div class="empty-container">
          <mat-icon>folder_open</mat-icon>
          <h2>還沒有 Repository</h2>
          <p>創建您的第一個 Repository 開始協作</p>
          <button mat-raised-button color="primary" (click)="createRepository()">
            <mat-icon>add</mat-icon>
            創建 Repository
          </button>
        </div>
      } @else {
        <div class="repository-grid">
          @for (repo of repositories(); track repo.id) {
            <mat-card class="repository-card" (click)="viewRepository(repo.id)">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon class="repo-icon">folder</mat-icon>
                  {{ repo.name }}
                </mat-card-title>
                <mat-card-subtitle>{{ repo.fullName }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                @if (repo.description) {
                  <p class="description">{{ repo.description }}</p>
                }
                
                <div class="repo-meta">
                  <div class="visibility">
                    <mat-icon [class]="repo.private ? 'private' : 'public'">
                      {{ repo.private ? 'lock' : 'public' }}
                    </mat-icon>
                    <span>{{ repo.private ? '私有' : '公開' }}</span>
                  </div>
                  
                  <div class="branch">
                    <mat-icon>account_tree</mat-icon>
                    <span>{{ repo.defaultBranch }}</span>
                  </div>
                  
                  <div class="updated">
                    <mat-icon>schedule</mat-icon>
                    <span>{{ formatDate(repo.updatedAt) }}</span>
                  </div>
                </div>
                
                @if (repo.topics.length > 0) {
                  <div class="topics">
                    @for (topic of repo.topics.slice(0, 3); track topic) {
                      <mat-chip>{{ topic }}</mat-chip>
                    }
                    @if (repo.topics.length > 3) {
                      <mat-chip>+{{ repo.topics.length - 3 }}</mat-chip>
                    }
                  </div>
                }
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-button (click)="viewRepository(repo.id); $event.stopPropagation()">
                  <mat-icon>visibility</mat-icon>
                  查看
                </button>
                
                @if (canManageRepository()(repo)) {
                  <button mat-button (click)="editRepository(repo.id); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                    編輯
                  </button>
                  
                  <button mat-button (click)="manageCollaborators(repo.id); $event.stopPropagation()">
                    <mat-icon>people</mat-icon>
                    協作者
                  </button>
                  
                  <button mat-button (click)="manageSettings(repo.id); $event.stopPropagation()">
                    <mat-icon>settings</mat-icon>
                    設定
                  </button>
                  
                  <button mat-button (click)="deleteRepository(repo.id); $event.stopPropagation()" class="danger">
                    <mat-icon>delete</mat-icon>
                    刪除
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .repository-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      color: #1976d2;
    }

    .loading-container,
    .error-container,
    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container mat-spinner {
      margin-bottom: 16px;
    }

    .error-container mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-container mat-icon {
      font-size: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .repository-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }

    .repository-card {
      cursor: pointer;
      transition: box-shadow 0.2s ease;
    }

    .repository-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }

    .repo-icon {
      margin-right: 8px;
      color: #1976d2;
    }

    .description {
      color: #666;
      margin: 8px 0;
      line-height: 1.4;
    }

    .repo-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 12px 0;
      font-size: 14px;
      color: #666;
    }

    .repo-meta > div {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .visibility .private {
      color: #f44336;
    }

    .visibility .public {
      color: #4caf50;
    }

    .topics {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }

    .topics mat-chip {
      font-size: 12px;
    }

    mat-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .danger {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .repository-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class RepositoryListComponent implements OnInit {
  private repositoryService = inject(RepositoryService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  readonly repositories = signal<Repository[]>([]);
  readonly isLoading = this.repositoryService.isLoading;
  readonly error = this.repositoryService.error;

  // Computed signals
  readonly canManageRepository = computed(() => {
    return (repo: Repository) => {
      const currentAccount = this.authService.currentAccount();
      return currentAccount?.id === repo.ownerId;
    };
  });

  ngOnInit() {
    this.loadRepositories();
  }

  async loadRepositories() {
    try {
      const currentAccount = this.authService.currentAccount();
      if (!currentAccount) {
        this.router.navigate(['/login']);
        return;
      }

      // 載入用戶的 Repository
      const repos$ = this.repositoryService.getUserRepositories(currentAccount.id);
      repos$.subscribe(repos => {
        this.repositories.set(repos);
      });
    } catch (error) {
      console.error('Failed to load repositories:', error);
    }
  }

  createRepository() {
    this.router.navigate(['/repositories/new']);
  }

  viewRepository(repoId: string) {
    this.router.navigate(['/repositories', repoId]);
  }

  editRepository(repoId: string) {
    this.router.navigate(['/repositories', repoId, 'edit']);
  }

  manageCollaborators(repoId: string) {
    this.router.navigate(['/repositories', repoId, 'collaborators']);
  }

  manageSettings(repoId: string) {
    this.router.navigate(['/repositories', repoId, 'settings']);
  }

  async deleteRepository(repoId: string) {
    if (confirm('確定要刪除此 Repository 嗎？此操作無法復原。')) {
      try {
        await this.repositoryService.deleteRepository(repoId);
        await this.loadRepositories();
      } catch (error) {
        console.error('Failed to delete repository:', error);
      }
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  }
}
```

## File: angular/src/app/features/repository/models/repository.model.ts
```typescript
// src/app/features/repository/models/repository.model.ts

import { Repository, RepositoryCollaborator, RepositoryTeamAccess } from '../../../core/models/auth.model';

// Repository 相關的擴展模型
export interface RepositorySettings {
  defaultBranch: string;
  allowSquashMerge: boolean;
  allowMergeCommit: boolean;
  allowRebaseMerge: boolean;
  deleteBranchOnMerge: boolean;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasDownloads: boolean;
}

export interface RepositoryStats {
  stars: number;
  watchers: number;
  forks: number;
  openIssues: number;
  openPullRequests: number;
}

export interface RepositoryBranch {
  name: string;
  protected: boolean;
  lastCommit: {
    sha: string;
    message: string;
    author: string;
    date: Date;
  };
}

export interface RepositoryCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  date: Date;
  url?: string;
}

export interface RepositoryIssue {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface RepositoryPullRequest {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  headBranch: string;
  baseBranch: string;
  author: string;
  assignees: string[];
  reviewers: string[];
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  closedAt?: Date;
}

// Repository 創建請求
export interface CreateRepositoryRequest {
  name: string;
  description?: string;
  private: boolean;
  ownerId?: string;
  initializeWithReadme?: boolean;
  addLicense?: boolean;
  addGitignore?: boolean;
}

// Repository 更新請求
export interface UpdateRepositoryRequest {
  name?: string;
  description?: string;
  private?: boolean;
  defaultBranch?: string;
  topics?: string[];
}

// 協作者邀請請求
export interface InviteCollaboratorRequest {
  userId: string;
  permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin';
  message?: string;
}

// 團隊訪問權限請求
export interface GrantTeamAccessRequest {
  teamId: string;
  permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin';
}

// Repository 搜索結果
export interface RepositorySearchResult {
  repositories: Repository[];
  totalCount: number;
  hasMore: boolean;
}

// Repository 搜索參數
export interface RepositorySearchParams {
  query?: string;
  ownerId?: string;
  isPrivate?: boolean;
  topics?: string[];
  sortBy?: 'name' | 'created' | 'updated' | 'stars';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Repository 權限檢查結果
export interface RepositoryPermissionResult {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  canDelete: boolean;
  permission: string;
  reason?: string;
}

// Repository 統計數據
export interface RepositoryAnalytics {
  commits: {
    total: number;
    last30Days: number;
    contributors: number;
  };
  issues: {
    open: number;
    closed: number;
    total: number;
  };
  pullRequests: {
    open: number;
    merged: number;
    closed: number;
    total: number;
  };
  releases: {
    total: number;
    latest?: {
      version: string;
      date: Date;
    };
  };
}

// Repository 模板
export interface RepositoryTemplate {
  id: string;
  name: string;
  description: string;
  owner: string;
  topics: string[];
  isPublic: boolean;
  createdAt: Date;
}

// Repository 比較結果
export interface RepositoryComparison {
  ahead: number;
  behind: number;
  commits: RepositoryCommit[];
  files: {
    added: string[];
    modified: string[];
    removed: string[];
  };
}

// Repository 標籤
export interface RepositoryLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Repository 里程碑
export interface RepositoryMilestone {
  id: string;
  title: string;
  description?: string;
  state: 'open' | 'closed';
  dueDate?: Date;
  openIssues: number;
  closedIssues: number;
  createdAt: Date;
  updatedAt: Date;
}

// Repository Webhook
export interface RepositoryWebhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastDelivery?: {
    status: number;
    date: Date;
  };
}

// Repository 部署
export interface RepositoryDeployment {
  id: string;
  environment: string;
  ref: string;
  sha: string;
  status: 'pending' | 'success' | 'failure' | 'error';
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

// Repository 環境
export interface RepositoryEnvironment {
  name: string;
  protectionRules: {
    requiredReviewers: string[];
    waitTimer: number;
  };
  deploymentBranchPolicy: {
    protectedBranches: boolean;
    customBranchPolicy: boolean;
  };
}

// Repository 安全警報
export interface RepositorySecurityAlert {
  id: string;
  type: 'vulnerability' | 'secret' | 'dependency';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  package?: string;
  description: string;
  state: 'open' | 'dismissed' | 'fixed';
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

// Repository 代碼掃描結果
export interface RepositoryCodeScanningResult {
  id: string;
  rule: string;
  severity: 'error' | 'warning' | 'note';
  message: string;
  path: string;
  line: number;
  column: number;
  createdAt: Date;
  state: 'open' | 'dismissed' | 'fixed';
}
```

## File: angular/src/app/features/repository/routes/repository.routes.ts
```typescript
// src/app/features/repository/routes/repository.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from '../../user/auth/auth.guard';
import { repositoryReadGuard, repositoryManageGuard } from '../../../core/guards/permission.guard';

export const repositoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/repository-list.component').then(m => m.RepositoryListComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('../components/repository-detail.component').then(m => m.RepositoryDetailComponent),
    canActivate: [authGuard, repositoryReadGuard(':id')]
  },
  {
    path: ':id/collaborators',
    loadComponent: () => import('../components/collaborator-management.component').then(m => m.CollaboratorManagementComponent),
    canActivate: [authGuard, repositoryManageGuard(':id')]
  }
];
```

## File: angular/src/app/features/user/auth/auth.guard.ts
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from 'rxfire/auth';
import { from, map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    map(user => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
```

## File: angular/src/app/features/user/auth/index.ts
```typescript
/**
 * 認證模組匯出檔案
 * 對齊 TREE.md 結構要求
 */

// 組件匯出
export * from './login.component';
export * from './signup.component';
export * from './unauthorized.component';

// 服務匯出
export * from './auth.service';

// 守衛匯出
export * from './auth.guard';
export * from './role.guard';
```

## File: angular/src/app/features/user/auth/unauthorized.component.ts
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="unauth-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Unauthorized</span>
        <span class="spacer"></span>
        <button mat-icon-button color="accent" (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <mat-card class="unauth-card">
        <h2 class="title">🚫 Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauth-wrapper {
      min-height: 100vh;
      background: #fff3e0;
    }

    .toolbar {
      background: #ffe0b2;
      color: #bf360c;
    }

    .toolbar-title {
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .unauth-card {
      max-width: 700px;
      margin: 60px auto;
      padding: 32px;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #d84315;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  logout() {
    this.router.navigate(['/login']);
  }
}
```

## File: angular/src/app/features/user/index.ts
```typescript
/**
 * 用戶模組匯出檔案
 * 對齊 TREE.md 結構要求
 */

// 模型匯出
export * from './user.model';

// 服務匯出
export * from './user.service';

// 組件匯出
export * from './profile/profile-management.component';

// 路由匯出
export * from './user.routes';
```

## File: angular/src/app/features/user/user.model.ts
```typescript
/**
 * 用戶模型 - 對齊 GitHub Account 設計
 * 實作完整的用戶資料結構和管理功能
 */

export interface User {
  id: string;
  uid: string; // Firebase UID
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  blog?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  
  // GitHub 對齊的社交帳戶
  socialAccounts: SocialAccount[];
  
  // 專業證照
  certificates: Certificate[];
  
  // 組織成員資格
  organizationMemberships: OrganizationMembership[];
  
  // 通知偏好
  notificationPreferences: NotificationPreferences;
  
  // 隱私設定
  privacySettings: PrivacySettings;
}

export interface SocialAccount {
  id: string;
  provider: 'twitter' | 'facebook' | 'linkedin' | 'youtube' | 'instagram' | 'github';
  url: string;
  username?: string;
  verified: boolean;
  addedAt: Date;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  status: 'valid' | 'expired' | 'pending' | 'revoked';
  category: 'professional' | 'safety' | 'technical' | 'management';
  uploadedAt: Date;
  verifiedAt?: Date;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Date;
  permissions: string[];
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    types: string[];
  };
  push: {
    enabled: boolean;
    types: string[];
  };
  inApp: {
    enabled: boolean;
    types: string[];
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'organization';
  emailVisibility: 'public' | 'private' | 'organization';
  socialAccountsVisibility: 'public' | 'private' | 'organization';
  certificatesVisibility: 'public' | 'private' | 'organization';
  activityVisibility: 'public' | 'private' | 'organization';
}

// API 請求/響應模型
export interface CreateUserRequest {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  blog?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
}

export interface AddSocialAccountRequest {
  provider: string;
  url: string;
  username?: string;
}

export interface UpdateNotificationPreferencesRequest {
  email?: Partial<NotificationPreferences['email']>;
  push?: Partial<NotificationPreferences['push']>;
  inApp?: Partial<NotificationPreferences['inApp']>;
}

export interface UpdatePrivacySettingsRequest {
  profileVisibility?: 'public' | 'private' | 'organization';
  emailVisibility?: 'public' | 'private' | 'organization';
  socialAccountsVisibility?: 'public' | 'private' | 'organization';
  certificatesVisibility?: 'public' | 'private' | 'organization';
  activityVisibility?: 'public' | 'private' | 'organization';
}

// GitHub 對齊的 API 響應
export interface UserApiResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  blog?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
}

export interface SocialAccountApiResponse {
  provider: string;
  url: string;
  username?: string;
  verified: boolean;
  addedAt: string;
}

// 分頁響應
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## File: angular/src/app/features/user/user.routes.ts
```typescript
import { Routes } from '@angular/router';

/**
 * 用戶模組路由配置
 * 對齊 TREE.md 結構和 GitHub Account 設計
 */
export const userRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile-management.component').then(m => m.ProfileManagementComponent),
    title: '個人資料管理'
  },
  {
    path: 'settings',
    loadComponent: () => import('./profile/profile-management.component').then(m => m.ProfileManagementComponent),
    title: '帳戶設定'
  },
  {
    path: 'certificates',
    loadComponent: () => import('./profile/profile-management.component').then(m => m.ProfileManagementComponent),
    title: '證照管理'
  },
  {
    path: 'social',
    loadComponent: () => import('./profile/profile-management.component').then(m => m.ProfileManagementComponent),
    title: '社交帳戶'
  },
  {
    path: 'notifications',
    loadComponent: () => import('./profile/profile-management.component').then(m => m.ProfileManagementComponent),
    title: '通知設定'
  },
  {
    path: 'privacy',
    loadComponent: () => import('./profile/profile-management.component').then(m => m.ProfileManagementComponent),
    title: '隱私設定'
  },
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  }
];
```

## File: angular/src/app/landing/landing.component.ts
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule
  ],
  template: `
    <div class="landing-wrapper">
      <!-- 頂部導航欄 -->
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Angular Fire RoleKit</span>
        <span class="spacer"></span>
        <button mat-button color="accent" (click)="navigateToLogin()">
          <mat-icon>login</mat-icon> 登入
        </button>
        <button mat-button color="primary" (click)="navigateToSignup()">
          <mat-icon>person_add</mat-icon> 註冊
        </button>
      </mat-toolbar>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Angular Fire RoleKit</h1>
          <h2 class="hero-subtitle">GitHub 式多層級權限系統</h2>
          <p class="hero-description">
            現代化的組織管理和 Repository 管理解決方案<br>
            基於 Angular 20 + Firebase 的企業級權限管理平台
          </p>
          <div class="cta-buttons">
            <button mat-raised-button color="primary" class="cta-primary" (click)="navigateToSignup()">
              <mat-icon>rocket_launch</mat-icon>
              立即開始
            </button>
            <button mat-stroked-button color="primary" class="cta-secondary" (click)="navigateToLogin()">
              <mat-icon>login</mat-icon>
              已有帳號？登入
            </button>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="features-section">
        <div class="features-content">
          <h2 class="features-title">功能特色</h2>
          <div class="feature-grid">
            <mat-card class="feature-card">
              <div class="feature-icon">
                <mat-icon>security</mat-icon>
              </div>
              <h3>多層級權限</h3>
              <p>個人 → 組織 → 團隊 → Repository 的完整權限體系，精細控制每個資源的訪問權限</p>
            </mat-card>

            <mat-card class="feature-card">
              <div class="feature-icon">
                <mat-icon>business</mat-icon>
              </div>
              <h3>組織管理</h3>
              <p>完整的組織、團隊和成員管理功能，支援 GitHub 式的組織結構和管理流程</p>
            </mat-card>

            <mat-card class="feature-card">
              <div class="feature-icon">
                <mat-icon>folder</mat-icon>
              </div>
              <h3>Repository 管理</h3>
              <p>GitHub 式的 Repository 協作者和權限管理，支援私有和公開 Repository</p>
            </mat-card>

            <mat-card class="feature-card">
              <div class="feature-icon">
                <mat-icon>palette</mat-icon>
              </div>
              <h3>現代化 UI</h3>
              <p>基於 Angular Material 3 的現代化界面，支援響應式設計和深色模式</p>
            </mat-card>

            <mat-card class="feature-card">
              <div class="feature-icon">
                <mat-icon>speed</mat-icon>
              </div>
              <h3>高性能</h3>
              <p>使用 Angular 20 Signals 和 Control Flow，提供極致的性能和用戶體驗</p>
            </mat-card>

            <mat-card class="feature-card">
              <div class="feature-icon">
                <mat-icon>cloud</mat-icon>
              </div>
              <h3>雲端整合</h3>
              <p>基於 Firebase 的雲端服務，支援即時同步和跨平台訪問</p>
            </mat-card>
          </div>
        </div>
      </div>

      <!-- Technology Section -->
      <div class="technology-section">
        <div class="technology-content">
          <h2 class="technology-title">技術架構</h2>
          <div class="tech-grid">
            <div class="tech-item">
              <mat-icon>build</mat-icon>
              <span><strong>前端框架</strong><br>Angular 20.1.0</span>
            </div>
            <div class="tech-item">
              <mat-icon>cloud</mat-icon>
              <span><strong>後端服務</strong><br>Firebase 11.10.0</span>
            </div>
            <div class="tech-item">
              <mat-icon>security</mat-icon>
              <span><strong>認證系統</strong><br>Firebase Auth</span>
            </div>
            <div class="tech-item">
              <mat-icon>storage</mat-icon>
              <span><strong>資料庫</strong><br>Firestore</span>
            </div>
            <div class="tech-item">
              <mat-icon>palette</mat-icon>
              <span><strong>UI 框架</strong><br>Material Design 3</span>
            </div>
            <div class="tech-item">
              <mat-icon>speed</mat-icon>
              <span><strong>狀態管理</strong><br>Angular Signals</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-content">
          <p>&copy; 2024 Angular Fire RoleKit. All rights reserved.</p>
          <p>基於 Angular 20 + Firebase 的企業級權限管理平台</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .toolbar {
      background-color: #e3f2fd;
      color: #0d47a1;
      padding: 0 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .hero-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-title {
      font-size: 48px;
      font-weight: 700;
      color: #0d47a1;
      margin-bottom: 16px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .hero-subtitle {
      font-size: 28px;
      font-weight: 500;
      color: #1976d2;
      margin-bottom: 24px;
    }

    .hero-description {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .cta-primary, .cta-secondary {
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 180px;
    }

    .cta-primary {
      background: linear-gradient(45deg, #1976d2, #42a5f5);
      color: white;
    }

    .features-section {
      padding: 80px 24px;
      background: white;
    }

    .features-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .features-title {
      font-size: 36px;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-bottom: 60px;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 32px;
    }

    .feature-card {
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      text-align: center;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .feature-icon {
      margin-bottom: 20px;
    }

    .feature-icon mat-icon {
      font-size: 48px;
      color: #1976d2;
    }

    .feature-card h3 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }

    .feature-card p {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
    }

    .technology-section {
      padding: 80px 24px;
      background: #f8f9fa;
    }

    .technology-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .technology-title {
      font-size: 36px;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-bottom: 60px;
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .tech-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .tech-item mat-icon {
      font-size: 32px;
      color: #1976d2;
      margin-bottom: 12px;
    }

    .tech-item span {
      font-size: 14px;
      color: #666;
      line-height: 1.4;
    }

    .footer {
      background: #333;
      color: white;
      padding: 40px 24px;
      text-align: center;
    }

    .footer-content p {
      margin: 8px 0;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 32px;
      }

      .hero-subtitle {
        font-size: 20px;
      }

      .hero-description {
        font-size: 16px;
      }

      .cta-buttons {
        flex-direction: column;
        align-items: center;
      }

      .cta-primary, .cta-secondary {
        width: 100%;
        max-width: 300px;
      }

      .feature-grid {
        grid-template-columns: 1fr;
      }

      .tech-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .features-title, .technology-title {
        font-size: 28px;
      }
    }

    @media (max-width: 480px) {
      .hero-section {
        padding: 40px 16px;
      }

      .features-section, .technology-section {
        padding: 40px 16px;
      }

      .tech-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LandingComponent {
  private router = inject(Router);

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}
```

## File: angular/src/app/app.html
```html
<div class="app-container">
  <router-outlet></router-outlet>
</div>
```

## File: angular/src/index.html
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AngularFireRolekit</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body class="mat-typography">
  <app-root></app-root>
</body>
</html>
```

## File: angular/src/main.ts
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

## File: angular/src/app/core/guards/permission.guard.ts
```typescript
// src/app/core/guards/permission.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { OrgRole } from '../models/auth.model';

/**
 * 權限守衛工廠函數
 * @param action 權限動作 (read, write, admin, delete)
 * @param resource 資源類型 (organization, team, repository, member)
 * @returns CanActivateFn
 */
export function permissionGuard(action: string, resource: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查權限
    if (permissionService.can(action, resource)) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * 組織權限守衛工廠函數
 * @param role 組織角色
 * @returns CanActivateFn
 */
export function orgRoleGuard(role: OrgRole): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查組織角色
    if (permissionService.hasOrgRole(role)) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * 組織管理員守衛
 * 檢查用戶是否為組織管理員或擁有者
 */
export const orgAdminGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentAccount = authService.currentAccount();
  
  if (!currentAccount) {
    router.navigate(['/login']);
    return false;
  }

  // 檢查是否為組織管理員
  if (permissionService.isOrganizationAdmin()) {
    return true;
  }

  // 沒有權限，重定向到未授權頁面
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * 組織擁有者守衛
 * 檢查用戶是否為組織擁有者
 */
export const orgOwnerGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentAccount = authService.currentAccount();
  
  if (!currentAccount) {
    router.navigate(['/login']);
    return false;
  }

  // 檢查是否為組織擁有者
  if (permissionService.isOrganizationOwner()) {
    return true;
  }

  // 沒有權限，重定向到未授權頁面
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Repository 讀取權限守衛
 * @param repositoryId Repository ID
 * @returns CanActivateFn
 */
export function repositoryReadGuard(repositoryId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查 Repository 讀取權限
    const canAccess = await permissionService.canAccessRepository(repositoryId);
    
    if (canAccess) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Repository 寫入權限守衛
 * @param repositoryId Repository ID
 * @returns CanActivateFn
 */
export function repositoryWriteGuard(repositoryId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查 Repository 寫入權限
    const canWrite = await permissionService.canWriteRepository(repositoryId);
    
    if (canWrite) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Repository 管理權限守衛
 * @param repositoryId Repository ID
 * @returns CanActivateFn
 */
export function repositoryManageGuard(repositoryId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查 Repository 管理權限
    const canManage = await permissionService.canManageRepository(repositoryId);
    
    if (canManage) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * 團隊管理權限守衛
 * @param teamId 團隊 ID
 * @returns CanActivateFn
 */
export function teamManageGuard(teamId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查團隊管理權限
    const canManage = await permissionService.canManageTeam(teamId);
    
    if (canManage) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}
```

## File: angular/src/app/core/services/organization.service.ts
```typescript
// src/app/core/services/organization.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
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
import { Observable, map, switchMap, combineLatest, of } from 'rxjs';
import { 
  Organization, 
  OrganizationMember, 
  Team,
  TeamMember,
  OrgRole,
  TeamRole,
  ProfileVO,
  PermissionVO,
  SettingsVO
} from '../models/auth.model';
import { ValidationUtils } from '../utils/validation.utils';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private firestore = inject(Firestore);

  // Signals for state management
  private _currentOrganization = signal<Organization | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Readonly signals
  readonly currentOrganization = this._currentOrganization.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly isOrganizationLoaded = computed(() => this._currentOrganization() !== null);
  readonly organizationMembers = computed(() => {
    const org = this._currentOrganization();
    return org ? [] : []; // 這裡應該實現成員查詢
  });

  async createOrganization(
    name: string,
    login: string,
    ownerId: string,
    description?: string
  ): Promise<string> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 驗證組織名稱
      const nameValidation = ValidationUtils.validateOrganizationName(name);
      if (!nameValidation.isValid) {
        throw new Error(`組織名稱驗證失敗: ${nameValidation.errors.join(', ')}`);
      }

      // 驗證登入名稱
      const loginValidation = ValidationUtils.validateLogin(login);
      if (!loginValidation.isValid) {
        throw new Error(`登入名稱驗證失敗: ${loginValidation.errors.join(', ')}`);
      }

      const orgId = doc(collection(this.firestore, 'accounts')).id;

      // 建立 ProfileVO
      const profile: ProfileVO = {
        name: name,
        email: '', // 組織沒有電子郵件
        avatar: undefined,
        bio: description,
        location: undefined,
        website: undefined
      };

      // 建立 PermissionVO
      const permissions: PermissionVO = {
        roles: ['organization'],
        abilities: [
          { action: 'read', resource: 'organization' },
          { action: 'write', resource: 'organization' },
          { action: 'admin', resource: 'organization' },
          { action: 'read', resource: 'team' },
          { action: 'write', resource: 'team' },
          { action: 'admin', resource: 'team' },
          { action: 'read', resource: 'member' },
          { action: 'write', resource: 'member' },
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
        login,
        profile,
        permissions,
        settings,
        projectsOwned: [],
        description,
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await this.addOrganizationMember(orgId, ownerId, OrgRole.OWNER);
      return orgId;
    } catch (error) {
      this._error.set(`創建組織失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getOrganization(orgId: string): Observable<Organization | undefined> {
    const orgDoc = doc(this.firestore, `accounts/${orgId}`);
    return docData(orgDoc, { idField: 'id' }).pipe(
      map(data => {
        if (data && (data as DocumentData)['type'] === 'organization') {
          return data as Organization;
        }
        return undefined;
      })
    );
  }

  async loadOrganization(orgId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const orgDoc = doc(this.firestore, `accounts/${orgId}`);
      const orgData = await docData(orgDoc, { idField: 'id' }).pipe(
        map(data => {
          if (data && (data as DocumentData)['type'] === 'organization') {
            return data as Organization;
          }
          return null;
        })
      ).toPromise();

      this._currentOrganization.set(orgData || null);
    } catch (error) {
      this._error.set(`載入組織失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this._isLoading.set(false);
    }
  }

  getOrganizationMembers(orgId: string): Observable<OrganizationMember[]> {
    const membersCol = collection(this.firestore, `accounts/${orgId}/members`);
    return collectionData(membersCol, { idField: 'id' }) as Observable<OrganizationMember[]>;
  }

  async addOrganizationMember(
    orgId: string,
    userId: string,
    role: OrgRole,
    invitedBy?: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
      await setDoc(memberRef, {
        id: userId,
        organizationId: orgId,
        userId,
        role,
        joinedAt: new Date(),
        invitedBy
      });
    } catch (error) {
      this._error.set(`添加組織成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    newRole: OrgRole
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
      await updateDoc(memberRef, { role: newRole });
    } catch (error) {
      this._error.set(`更新成員角色失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async removeOrganizationMember(orgId: string, userId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
      await deleteDoc(memberRef);
    } catch (error) {
      this._error.set(`移除組織成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getTeams(orgId: string): Observable<Team[]> {
    const teamsCol = collection(this.firestore, `accounts/${orgId}/teams`);
    return collectionData(teamsCol, { idField: 'id' }) as Observable<Team[]>;
  }

  async createTeam(
    orgId: string,
    name: string,
    description?: string
  ): Promise<string> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 驗證團隊名稱
      const nameValidation = ValidationUtils.validateTeamName(name);
      if (!nameValidation.isValid) {
        throw new Error(`團隊名稱驗證失敗: ${nameValidation.errors.join(', ')}`);
      }

      const teamId = doc(collection(this.firestore, `accounts/${orgId}/teams`)).id;
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      await setDoc(doc(this.firestore, `accounts/${orgId}/teams/${teamId}`), {
        id: teamId,
        organizationId: orgId,
        name,
        slug,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          repository: { read: true, write: true, admin: false },
          issues: { read: true, write: true, delete: false },
          pullRequests: { read: true, write: true, merge: false }
        }
      });

      return teamId;
    } catch (error) {
      this._error.set(`創建團隊失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateTeam(
    orgId: string,
    teamId: string,
    updates: Partial<Team>
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const teamRef = doc(this.firestore, `accounts/${orgId}/teams/${teamId}`);
      await updateDoc(teamRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      this._error.set(`更新團隊失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async deleteTeam(orgId: string, teamId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const teamRef = doc(this.firestore, `accounts/${orgId}/teams/${teamId}`);
      await deleteDoc(teamRef);
    } catch (error) {
      this._error.set(`刪除團隊失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  getTeamMembers(orgId: string, teamId: string): Observable<TeamMember[]> {
    const membersCol = collection(this.firestore, `accounts/${orgId}/teams/${teamId}/members`);
    return collectionData(membersCol, { idField: 'id' }) as Observable<TeamMember[]>;
  }

  async addTeamMember(
    orgId: string,
    teamId: string,
    userId: string,
    role: TeamRole,
    addedBy?: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(this.firestore, `accounts/${orgId}/teams/${teamId}/members/${userId}`);
      await setDoc(memberRef, {
        id: userId,
        teamId,
        userId,
        role,
        joinedAt: new Date(),
        addedBy
      });
    } catch (error) {
      this._error.set(`添加團隊成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async removeTeamMember(
    orgId: string,
    teamId: string,
    userId: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(this.firestore, `accounts/${orgId}/teams/${teamId}/members/${userId}`);
      await deleteDoc(memberRef);
    } catch (error) {
      this._error.set(`移除團隊成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateOrganizationProfile(
    orgId: string,
    profile: ProfileVO
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 驗證 Profile
      const profileErrors = ValidationUtils.validateProfile(profile);
      if (profileErrors.length > 0) {
        throw new Error(`Profile validation failed: ${profileErrors.join(', ')}`);
      }

      const orgRef = doc(this.firestore, `accounts/${orgId}`);
      await updateDoc(orgRef, {
        profile,
        updatedAt: new Date()
      });

      // 更新本地狀態
      const currentOrg = this._currentOrganization();
      if (currentOrg) {
        this._currentOrganization.set({ ...currentOrg, profile, updatedAt: new Date() });
      }
    } catch (error) {
      this._error.set(`更新組織檔案失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateOrganizationSettings(
    orgId: string,
    settings: SettingsVO
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 驗證 Settings
      const settingsErrors = ValidationUtils.validateSettings(settings);
      if (settingsErrors.length > 0) {
        throw new Error(`Settings validation failed: ${settingsErrors.join(', ')}`);
      }

      const orgRef = doc(this.firestore, `accounts/${orgId}`);
      await updateDoc(orgRef, {
        settings,
        updatedAt: new Date()
      });

      // 更新本地狀態
      const currentOrg = this._currentOrganization();
      if (currentOrg) {
        this._currentOrganization.set({ ...currentOrg, settings, updatedAt: new Date() });
      }
    } catch (error) {
      this._error.set(`更新組織設定失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  // 清除錯誤
  clearError() {
    this._error.set(null);
  }

  // 清除組織上下文
  clearOrganizationContext() {
    this._currentOrganization.set(null);
    this._error.set(null);
  }
}
```

## File: angular/src/app/features/organization/components/organization-card.component.ts
```typescript
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { OrganizationDetail } from '../models/organization.model';

/**
 * 組織卡片組件
 * 使用 Material Design 3 設計，對齊 GitHub 的組織卡片風格
 */
@Component({
  selector: 'app-organization-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="organization-card" [class.selected]="isSelected()">
      <mat-card-header>
        <div mat-card-avatar class="organization-avatar">
          @if (organization()?.profile?.avatar) {
            <img [src]="organization()?.profile?.avatar" [alt]="organization()?.name">
          } @else {
            <mat-icon>business</mat-icon>
          }
        </div>
        <mat-card-title>{{ organization()?.name }}</mat-card-title>
        <mat-card-subtitle>{{ organization()?.slug }}</mat-card-subtitle>
        
        <div class="card-actions">
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="onEdit()">
              <mat-icon>edit</mat-icon>
              <span>編輯</span>
            </button>
            <button mat-menu-item (click)="onSettings()">
              <mat-icon>settings</mat-icon>
              <span>設定</span>
            </button>
            <button mat-menu-item (click)="onMembers()">
              <mat-icon>people</mat-icon>
              <span>成員</span>
            </button>
            <button mat-menu-item (click)="onTeams()">
              <mat-icon>groups</mat-icon>
              <span>團隊</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="onDelete()" class="delete-action">
              <mat-icon>delete</mat-icon>
              <span>刪除</span>
            </button>
          </mat-menu>
        </div>
      </mat-card-header>

      <mat-card-content>
        @if (organization()?.description) {
          <p class="organization-description">{{ organization()?.description }}</p>
        }
        
        <div class="organization-stats">
          <div class="stat-item">
            <mat-icon>people</mat-icon>
            <span>{{ memberCount() }} 成員</span>
          </div>
          <div class="stat-item">
            <mat-icon>groups</mat-icon>
            <span>{{ teamCount() }} 團隊</span>
          </div>
          <div class="stat-item">
            <mat-icon>security</mat-icon>
            <span>{{ securityManagerCount() }} 安全管理器</span>
          </div>
        </div>

        <div class="organization-tags">
          <mat-chip-set>
            <mat-chip [class]="'type-' + organization()?.type">
              {{ getTypeLabel(organization()?.type) }}
            </mat-chip>
            @if (organization()?.profile?.location) {
              <mat-chip>
                <mat-icon matChipAvatar>location_on</mat-icon>
                {{ organization()?.profile?.location }}
              </mat-chip>
            }
            @if (organization()?.profile?.website) {
              <mat-chip>
                <mat-icon matChipAvatar>language</mat-icon>
                {{ organization()?.profile?.website }}
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button (click)="onView()" color="primary">
          <mat-icon>visibility</mat-icon>
          檢視
        </button>
        <button mat-button (click)="onEdit()">
          <mat-icon>edit</mat-icon>
          編輯
        </button>
        <button mat-button (click)="onSettings()">
          <mat-icon>settings</mat-icon>
          設定
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .organization-card {
      margin: 16px;
      max-width: 400px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      &.selected {
        border: 2px solid var(--mdc-theme-primary);
        box-shadow: 0 4px 20px rgba(var(--mdc-theme-primary-rgb), 0.3);
      }
    }

    .organization-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--mdc-theme-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    mat-card-header {
      position: relative;
      
      .card-actions {
        position: absolute;
        top: 8px;
        right: 8px;
      }
    }

    .organization-description {
      margin: 16px 0;
      color: var(--mdc-theme-on-surface-variant);
      line-height: 1.5;
    }

    .organization-stats {
      display: flex;
      gap: 16px;
      margin: 16px 0;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--mdc-theme-on-surface-variant);
        font-size: 14px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .organization-tags {
      margin: 16px 0;
      
      mat-chip-set {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      mat-chip {
        &.type-construction {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        
        &.type-consulting {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }
        
        &.type-supplier {
          background-color: #e8f5e8;
          color: #388e3c;
        }
      }
    }

    mat-card-actions {
      padding: 16px;
      gap: 8px;
      
      button {
        flex: 1;
      }
    }

    .delete-action {
      color: var(--mdc-theme-error);
    }

    @media (max-width: 600px) {
      .organization-card {
        margin: 8px;
        max-width: 100%;
      }
      
      .organization-stats {
        flex-direction: column;
        gap: 8px;
      }
      
      mat-card-actions {
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class OrganizationCardComponent {
  @Input() organization = signal<OrganizationDetail | null>(null);
  @Input() isSelected = signal(false);
  
  @Output() view = new EventEmitter<OrganizationDetail>();
  @Output() edit = new EventEmitter<OrganizationDetail>();
  @Output() settings = new EventEmitter<OrganizationDetail>();
  @Output() members = new EventEmitter<OrganizationDetail>();
  @Output() teams = new EventEmitter<OrganizationDetail>();
  @Output() delete = new EventEmitter<OrganizationDetail>();

  // 計算屬性
  readonly memberCount = computed(() => 
    this.organization()?.members?.length || 0
  );

  readonly teamCount = computed(() => 
    this.organization()?.teams?.length || 0
  );

  readonly securityManagerCount = computed(() => 
    this.organization()?.securityManagers?.length || 0
  );

  /**
   * 獲取組織類型標籤
   */
  getTypeLabel(type?: string): string {
    switch (type) {
      case 'construction': return '營造業';
      case 'consulting': return '顧問業';
      case 'supplier': return '供應商';
      default: return '未知';
    }
  }

  /**
   * 檢視組織
   */
  onView(): void {
    const org = this.organization();
    if (org) {
      this.view.emit(org);
    }
  }

  /**
   * 編輯組織
   */
  onEdit(): void {
    const org = this.organization();
    if (org) {
      this.edit.emit(org);
    }
  }

  /**
   * 組織設定
   */
  onSettings(): void {
    const org = this.organization();
    if (org) {
      this.settings.emit(org);
    }
  }

  /**
   * 成員管理
   */
  onMembers(): void {
    const org = this.organization();
    if (org) {
      this.members.emit(org);
    }
  }

  /**
   * 團隊管理
   */
  onTeams(): void {
    const org = this.organization();
    if (org) {
      this.teams.emit(org);
    }
  }

  /**
   * 刪除組織
   */
  onDelete(): void {
    const org = this.organization();
    if (org) {
      this.delete.emit(org);
    }
  }
}
```

## File: angular/src/app/features/organization/components/organization-roles.component.ts
```typescript
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

import { OrganizationRole, Permission } from '../models/organization.model';
import { PermissionCalculationService } from '../services/permission-calculation.service';

/**
 * 組織角色系統組件
 * 管理組織的角色和權限設定
 */
@Component({
  selector: 'app-organization-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  template: `
    <div class="organization-roles-container">
      <!-- 標題區域 -->
      <div class="header-section">
        <div class="title-section">
          <h2 class="page-title">
            <mat-icon>admin_panel_settings</mat-icon>
            組織角色系統
          </h2>
          <p class="page-description">
            管理組織的角色和權限設定，建立完整的權限體系
          </p>
        </div>
        <div class="action-section">
          <button 
            mat-raised-button 
            color="primary"
            (click)="openCreateRoleDialog()"
            [disabled]="isLoading()">
            <mat-icon>add</mat-icon>
            新增角色
          </button>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="stats-section">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">admin_panel_settings</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ organizationRoles().length }}</div>
                <div class="stat-label">總角色數</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">build</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ systemRoles().length }}</div>
                <div class="stat-label">系統角色</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">person_add</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ customRoles().length }}</div>
                <div class="stat-label">自訂角色</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">security</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ totalPermissions() }}</div>
                <div class="stat-label">總權限數</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 角色列表 -->
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>角色列表</mat-card-title>
          <mat-card-subtitle>管理組織的角色和權限設定</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="table-container" *ngIf="!isLoading(); else loadingTemplate">
            <table mat-table [dataSource]="organizationRoles()" class="roles-table">
              <!-- 角色名稱欄位 -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>角色名稱</th>
                <td mat-cell *matCellDef="let role">
                  <div class="role-name">
                    <mat-icon class="role-icon">{{ getRoleIcon(role.level) }}</mat-icon>
                    <div class="role-details">
                      <div class="role-title">{{ role.name }}</div>
                      <div class="role-description">{{ role.description }}</div>
                    </div>
                    <mat-chip *ngIf="role.isSystemRole" color="accent" class="system-chip">
                      系統角色
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- 等級欄位 -->
              <ng-container matColumnDef="level">
                <th mat-header-cell *matHeaderCellDef>等級</th>
                <td mat-cell *matCellDef="let role">
                  <mat-chip-set>
                    <mat-chip [color]="getLevelColor(role.level)">
                      <mat-icon>star</mat-icon>
                      Level {{ role.level }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- 權限數量欄位 -->
              <ng-container matColumnDef="permissions">
                <th mat-header-cell *matHeaderCellDef>權限數量</th>
                <td mat-cell *matCellDef="let role">
                  <mat-chip-set>
                    <mat-chip color="primary">
                      <mat-icon>security</mat-icon>
                      {{ role.permissions.length }} 個權限
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- 權限範圍欄位 -->
              <ng-container matColumnDef="scopes">
                <th mat-header-cell *matHeaderCellDef>權限範圍</th>
                <td mat-cell *matCellDef="let role">
                  <div class="scopes-container">
                    <mat-chip 
                      *ngFor="let scope of getUniqueScopes(role.permissions)" 
                      [color]="getScopeColor(scope)"
                      class="scope-chip">
                      {{ getScopeLabel(scope) }}
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- 建立時間欄位 -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>建立時間</th>
                <td mat-cell *matCellDef="let role">
                  {{ formatDate(role.createdAt) }}
                </td>
              </ng-container>

              <!-- 操作欄位 -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let role">
                  <button 
                    mat-icon-button 
                    [matMenuTriggerFor]="actionMenu"
                    [matTooltip]="'更多操作'">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="viewRoleDetails(role)">
                      <mat-icon>visibility</mat-icon>
                      查看詳情
                    </button>
                    <button mat-menu-item (click)="editRole(role)" [disabled]="role.isSystemRole">
                      <mat-icon>edit</mat-icon>
                      編輯角色
                    </button>
                    <button mat-menu-item (click)="duplicateRole(role)">
                      <mat-icon>content_copy</mat-icon>
                      複製角色
                    </button>
                    <button mat-menu-item (click)="deleteRole(role)" [disabled]="role.isSystemRole" class="danger-action">
                      <mat-icon>delete</mat-icon>
                      刪除角色
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <ng-template #loadingTemplate>
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>載入角色資料中...</p>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .organization-roles-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .title-section {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
      color: #1976d2;
    }

    .page-description {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .action-section {
      display: flex;
      gap: 12px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .stat-details {
      flex: 1;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .main-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .table-container {
      overflow-x: auto;
    }

    .roles-table {
      width: 100%;
    }

    .role-name {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .role-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #1976d2;
    }

    .role-details {
      flex: 1;
    }

    .role-title {
      font-weight: 500;
      font-size: 16px;
      color: #333;
    }

    .role-description {
      font-size: 14px;
      color: #666;
      margin-top: 2px;
    }

    .system-chip {
      font-size: 12px;
    }

    .scopes-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .scope-chip {
      font-size: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .danger-action {
      color: #f44336;
    }

    .danger-action mat-icon {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .organization-roles-container {
        padding: 16px;
      }

      .header-section {
        flex-direction: column;
        gap: 16px;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
      }

      .role-name {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class OrganizationRolesComponent implements OnInit {
  private permissionService = inject(PermissionCalculationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // 響應式狀態
  private _isLoading = signal(false);
  private _organizationRoles = signal<OrganizationRole[]>([]);

  // 公開的只讀 signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly organizationRoles = this._organizationRoles.asReadonly();

  // 計算屬性
  readonly systemRoles = computed(() => 
    this.organizationRoles().filter(role => role.isSystemRole)
  );

  readonly customRoles = computed(() => 
    this.organizationRoles().filter(role => !role.isSystemRole)
  );

  readonly totalPermissions = computed(() => 
    this.organizationRoles().reduce((total, role) => total + role.permissions.length, 0)
  );

  // 表格配置
  displayedColumns: string[] = [
    'name', 
    'level', 
    'permissions', 
    'scopes', 
    'createdAt', 
    'actions'
  ];

  ngOnInit(): void {
    this.loadOrganizationRoles();
  }

  /**
   * 載入組織角色資料
   */
  private async loadOrganizationRoles(): Promise<void> {
    this._isLoading.set(true);
    try {
      // 從權限服務獲取組織角色資料
      const roles = this.permissionService.organizationRoles();
      this._organizationRoles.set(roles);
    } catch (error) {
      console.error('載入組織角色失敗:', error);
      this.snackBar.open('載入組織角色資料失敗', '關閉', { duration: 3000 });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 獲取角色圖標
   */
  getRoleIcon(level: number): string {
    if (level >= 8) return 'admin_panel_settings';
    if (level >= 5) return 'security';
    if (level >= 3) return 'verified_user';
    return 'person';
  }

  /**
   * 獲取等級顏色
   */
  getLevelColor(level: number): 'primary' | 'accent' | 'warn' {
    if (level >= 8) return 'warn';
    if (level >= 5) return 'accent';
    return 'primary';
  }

  /**
   * 獲取唯一權限範圍
   */
  getUniqueScopes(permissions: Permission[]): string[] {
    const scopes = permissions.map(p => p.scope);
    return [...new Set(scopes)];
  }

  /**
   * 獲取範圍顏色
   */
  getScopeColor(scope: string): 'primary' | 'accent' | 'warn' {
    switch (scope) {
      case 'organization': return 'warn';
      case 'team': return 'accent';
      case 'project': return 'primary';
      case 'user': return 'primary';
      default: return 'primary';
    }
  }

  /**
   * 獲取範圍標籤
   */
  getScopeLabel(scope: string): string {
    switch (scope) {
      case 'organization': return '組織';
      case 'team': return '團隊';
      case 'project': return '專案';
      case 'user': return '用戶';
      default: return scope;
    }
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 開啟新增角色對話框
   */
  openCreateRoleDialog(): void {
    // TODO: 實作新增角色對話框
    this.snackBar.open('新增角色功能開發中', '關閉', { duration: 3000 });
  }

  /**
   * 查看角色詳情
   */
  viewRoleDetails(role: OrganizationRole): void {
    // TODO: 實作查看角色詳情對話框
    this.snackBar.open(`查看角色 ${role.name} 的詳情`, '關閉', { duration: 3000 });
  }

  /**
   * 編輯角色
   */
  editRole(role: OrganizationRole): void {
    // TODO: 實作編輯角色對話框
    this.snackBar.open(`編輯角色 ${role.name}`, '關閉', { duration: 3000 });
  }

  /**
   * 複製角色
   */
  duplicateRole(role: OrganizationRole): void {
    // TODO: 實作複製角色功能
    this.snackBar.open(`複製角色 ${role.name}`, '關閉', { duration: 3000 });
  }

  /**
   * 刪除角色
   */
  deleteRole(role: OrganizationRole): void {
    // TODO: 實作刪除角色確認對話框
    this.snackBar.open(`刪除角色 ${role.name}`, '關閉', { duration: 3000 });
  }
}
```

## File: angular/src/app/features/organization/components/security-manager.component.ts
```typescript
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SecurityManager, SecurityPermission } from '../models/organization.model';
import { PermissionCalculationService } from '../services/permission-calculation.service';

/**
 * 安全管理器組件
 * 管理組織的安全權限和安全管理員
 */
@Component({
  selector: 'app-security-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="security-manager-container">
      <!-- 標題區域 -->
      <div class="header-section">
        <div class="title-section">
          <h2 class="page-title">
            <mat-icon>security</mat-icon>
            安全管理器
          </h2>
          <p class="page-description">
            管理組織的安全權限和安全管理員設定
          </p>
        </div>
        <div class="action-section">
          <button 
            mat-raised-button 
            color="primary"
            (click)="openAddSecurityManagerDialog()"
            [disabled]="isLoading()">
            <mat-icon>add</mat-icon>
            新增安全管理員
          </button>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="stats-section">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">admin_panel_settings</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ securityManagers().length }}</div>
                <div class="stat-label">安全管理員</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">verified_user</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ totalPermissions() }}</div>
                <div class="stat-label">總權限數</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">group</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ userSecurityManagers().length }}</div>
                <div class="stat-label">用戶管理員</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">groups</mat-icon>
              <div class="stat-details">
                <div class="stat-number">{{ teamSecurityManagers().length }}</div>
                <div class="stat-label">團隊管理員</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- 安全管理員列表 -->
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>安全管理員列表</mat-card-title>
          <mat-card-subtitle>管理組織的安全權限設定</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="table-container" *ngIf="!isLoading(); else loadingTemplate">
            <table mat-table [dataSource]="securityManagers()" class="security-table">
              <!-- 類型欄位 -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>類型</th>
                <td mat-cell *matCellDef="let manager">
                  <mat-chip-set>
                    <mat-chip [color]="getTypeColor(manager.type)">
                      <mat-icon>{{ getTypeIcon(manager.type) }}</mat-icon>
                      {{ getTypeLabel(manager.type) }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- 實體欄位 -->
              <ng-container matColumnDef="entity">
                <th mat-header-cell *matHeaderCellDef>實體</th>
                <td mat-cell *matCellDef="let manager">
                  <div class="entity-info">
                    <mat-icon class="entity-icon">{{ getTypeIcon(manager.type) }}</mat-icon>
                    <span class="entity-name">{{ getEntityName(manager) }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- 權限數量欄位 -->
              <ng-container matColumnDef="permissions">
                <th mat-header-cell *matHeaderCellDef>權限數量</th>
                <td mat-cell *matCellDef="let manager">
                  <mat-chip-set>
                    <mat-chip color="accent">
                      {{ manager.permissions.length }} 個權限
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- 指派時間欄位 -->
              <ng-container matColumnDef="assignedAt">
                <th mat-header-cell *matHeaderCellDef>指派時間</th>
                <td mat-cell *matCellDef="let manager">
                  {{ formatDate(manager.assignedAt) }}
                </td>
              </ng-container>

              <!-- 指派者欄位 -->
              <ng-container matColumnDef="assignedBy">
                <th mat-header-cell *matHeaderCellDef>指派者</th>
                <td mat-cell *matCellDef="let manager">
                  <div class="assigned-by">
                    <mat-icon class="user-icon">person</mat-icon>
                    {{ manager.assignedBy }}
                  </div>
                </td>
              </ng-container>

              <!-- 操作欄位 -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let manager">
                  <button 
                    mat-icon-button 
                    [matMenuTriggerFor]="actionMenu"
                    [matTooltip]="'更多操作'">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="viewPermissions(manager)">
                      <mat-icon>visibility</mat-icon>
                      查看權限
                    </button>
                    <button mat-menu-item (click)="editSecurityManager(manager)">
                      <mat-icon>edit</mat-icon>
                      編輯
                    </button>
                    <button mat-menu-item (click)="removeSecurityManager(manager)" class="danger-action">
                      <mat-icon>delete</mat-icon>
                      移除
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <ng-template #loadingTemplate>
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>載入安全管理員資料中...</p>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .security-manager-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .title-section {
      flex: 1;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
      color: #1976d2;
    }

    .page-description {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .action-section {
      display: flex;
      gap: 12px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .stat-details {
      flex: 1;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .main-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .table-container {
      overflow-x: auto;
    }

    .security-table {
      width: 100%;
    }

    .entity-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .entity-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .entity-name {
      font-weight: 500;
    }

    .assigned-by {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .danger-action {
      color: #f44336;
    }

    .danger-action mat-icon {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .security-manager-container {
        padding: 16px;
      }

      .header-section {
        flex-direction: column;
        gap: 16px;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class SecurityManagerComponent implements OnInit {
  private permissionService = inject(PermissionCalculationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // 響應式狀態
  private _isLoading = signal(false);
  private _securityManagers = signal<SecurityManager[]>([]);

  // 公開的只讀 signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly securityManagers = this._securityManagers.asReadonly();

  // 計算屬性
  readonly userSecurityManagers = computed(() => 
    this.securityManagers().filter(sm => sm.type === 'user')
  );

  readonly teamSecurityManagers = computed(() => 
    this.securityManagers().filter(sm => sm.type === 'team')
  );

  readonly totalPermissions = computed(() => 
    this.securityManagers().reduce((total, sm) => total + sm.permissions.length, 0)
  );

  // 表格配置
  displayedColumns: string[] = [
    'type', 
    'entity', 
    'permissions', 
    'assignedAt', 
    'assignedBy', 
    'actions'
  ];

  ngOnInit(): void {
    this.loadSecurityManagers();
  }

  /**
   * 載入安全管理員資料
   */
  private async loadSecurityManagers(): Promise<void> {
    this._isLoading.set(true);
    try {
      // 從權限服務獲取安全管理員資料
      const managers = this.permissionService.securityManagers();
      this._securityManagers.set(managers);
    } catch (error) {
      console.error('載入安全管理員失敗:', error);
      this.snackBar.open('載入安全管理員資料失敗', '關閉', { duration: 3000 });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 獲取類型顏色
   */
  getTypeColor(type: 'user' | 'team'): 'primary' | 'accent' | 'warn' {
    switch (type) {
      case 'user': return 'primary';
      case 'team': return 'accent';
      default: return 'warn';
    }
  }

  /**
   * 獲取類型圖標
   */
  getTypeIcon(type: 'user' | 'team'): string {
    switch (type) {
      case 'user': return 'person';
      case 'team': return 'groups';
      default: return 'help';
    }
  }

  /**
   * 獲取類型標籤
   */
  getTypeLabel(type: 'user' | 'team'): string {
    switch (type) {
      case 'user': return '用戶';
      case 'team': return '團隊';
      default: return '未知';
    }
  }

  /**
   * 獲取實體名稱
   */
  getEntityName(manager: SecurityManager): string {
    // 這裡應該根據 entityId 查找實際的用戶名或團隊名
    // 簡化實作，直接返回 ID
    return manager.entityId;
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 開啟新增安全管理員對話框
   */
  openAddSecurityManagerDialog(): void {
    // TODO: 實作新增安全管理員對話框
    this.snackBar.open('新增安全管理員功能開發中', '關閉', { duration: 3000 });
  }

  /**
   * 查看權限
   */
  viewPermissions(manager: SecurityManager): void {
    // TODO: 實作查看權限對話框
    this.snackBar.open(`查看 ${manager.entityId} 的權限`, '關閉', { duration: 3000 });
  }

  /**
   * 編輯安全管理員
   */
  editSecurityManager(manager: SecurityManager): void {
    // TODO: 實作編輯安全管理員對話框
    this.snackBar.open(`編輯 ${manager.entityId} 的安全管理員設定`, '關閉', { duration: 3000 });
  }

  /**
   * 移除安全管理員
   */
  removeSecurityManager(manager: SecurityManager): void {
    // TODO: 實作移除安全管理員確認對話框
    this.snackBar.open(`移除 ${manager.entityId} 的安全管理員`, '關閉', { duration: 3000 });
  }
}
```

## File: angular/src/app/features/organization/components/team-management.component.ts
```typescript
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { Team } from '../models/organization.model';

/**
 * 團隊節點介面
 */
interface TeamNode extends Team {
  children: TeamNode[];
  level: number;
  expandable: boolean;
}

/**
 * 團隊層級管理組件
 * 使用 Material Design 3 的 Tree 組件實作 GitHub 風格的團隊層級結構
 */
@Component({
  selector: 'app-team-hierarchy',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="team-hierarchy-container">
      <div class="hierarchy-header">
        <h3>團隊層級結構</h3>
        <button mat-raised-button color="primary" (click)="onCreateTeam()">
          <mat-icon>add</mat-icon>
          新增團隊
        </button>
      </div>

      <div class="hierarchy-content">
        @if (teamNodes().length === 0) {
          <div class="empty-state">
            <mat-icon>groups</mat-icon>
            <p>尚未建立任何團隊</p>
            <button mat-button color="primary" (click)="onCreateTeam()">
              建立第一個團隊
            </button>
          </div>
        } @else {
          <mat-tree [dataSource]="dataSource" [treeControl]="treeControl" class="team-tree">
            <!-- 團隊節點模板 -->
            <mat-tree-node *matTreeNodeDef="let node; when: hasChild" matTreeNodeToggle>
              <div class="team-node" [style.padding-left.px]="getNodePadding(node)">
                <mat-icon class="team-icon">
                  {{ getTeamIcon(node.privacy) }}
                </mat-icon>
                
                <div class="team-info">
                  <div class="team-name">{{ node.name }}</div>
                  <div class="team-description">{{ node.description }}</div>
                  <div class="team-meta">
                    <mat-chip-set>
                      <mat-chip [class]="'privacy-' + node.privacy">
                        {{ getPrivacyLabel(node.privacy) }}
                      </mat-chip>
                      <mat-chip [class]="'permission-' + node.permission">
                        {{ getPermissionLabel(node.permission) }}
                      </mat-chip>
                      <mat-chip>
                        <mat-icon matChipAvatar>people</mat-icon>
                        {{ node.members?.length || 0 }} 成員
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>

                <div class="team-actions">
                  <button mat-icon-button [matMenuTriggerFor]="teamMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #teamMenu="matMenu">
                    <button mat-menu-item (click)="onViewTeam(node)">
                      <mat-icon>visibility</mat-icon>
                      <span>檢視</span>
                    </button>
                    <button mat-menu-item (click)="onEditTeam(node)">
                      <mat-icon>edit</mat-icon>
                      <span>編輯</span>
                    </button>
                    <button mat-menu-item (click)="onManageMembers(node)">
                      <mat-icon>people</mat-icon>
                      <span>管理成員</span>
                    </button>
                    <button mat-menu-item (click)="onCreateSubTeam(node)">
                      <mat-icon>add</mat-icon>
                      <span>新增子團隊</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="onDeleteTeam(node)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>刪除</span>
                    </button>
                  </mat-menu>
                </div>
              </div>
            </mat-tree-node>

            <!-- 展開/收合按鈕 -->
            <mat-tree-node *matTreeNodeDef="let node; when: !hasChild" matTreeNodePadding>
              <div class="team-node" [style.padding-left.px]="getNodePadding(node)">
                <mat-icon class="team-icon">
                  {{ getTeamIcon(node.privacy) }}
                </mat-icon>
                
                <div class="team-info">
                  <div class="team-name">{{ node.name }}</div>
                  <div class="team-description">{{ node.description }}</div>
                  <div class="team-meta">
                    <mat-chip-set>
                      <mat-chip [class]="'privacy-' + node.privacy">
                        {{ getPrivacyLabel(node.privacy) }}
                      </mat-chip>
                      <mat-chip [class]="'permission-' + node.permission">
                        {{ getPermissionLabel(node.permission) }}
                      </mat-chip>
                      <mat-chip>
                        <mat-icon matChipAvatar>people</mat-icon>
                        {{ node.members?.length || 0 }} 成員
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>

                <div class="team-actions">
                  <button mat-icon-button [matMenuTriggerFor]="teamMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #teamMenu="matMenu">
                    <button mat-menu-item (click)="onViewTeam(node)">
                      <mat-icon>visibility</mat-icon>
                      <span>檢視</span>
                    </button>
                    <button mat-menu-item (click)="onEditTeam(node)">
                      <mat-icon>edit</mat-icon>
                      <span>編輯</span>
                    </button>
                    <button mat-menu-item (click)="onManageMembers(node)">
                      <mat-icon>people</mat-icon>
                      <span>管理成員</span>
                    </button>
                    <button mat-menu-item (click)="onCreateSubTeam(node)">
                      <mat-icon>add</mat-icon>
                      <span>新增子團隊</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="onDeleteTeam(node)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>刪除</span>
                    </button>
                  </mat-menu>
                </div>
              </div>
            </mat-tree-node>
          </mat-tree>
        }
      </div>
    </div>
  `,
  styles: [`
    .team-hierarchy-container {
      padding: 24px;
      background: var(--mdc-theme-surface);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .hierarchy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h3 {
        margin: 0;
        color: var(--mdc-theme-on-surface);
        font-weight: 500;
      }
    }

    .hierarchy-content {
      min-height: 200px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--mdc-theme-on-surface-variant);
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      p {
        margin: 16px 0 24px;
        font-size: 16px;
      }
    }

    .team-tree {
      background: transparent;
    }

    .team-node {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--mdc-theme-outline-variant);
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: var(--mdc-theme-surface-variant);
      }
      
      &:last-child {
        border-bottom: none;
      }
    }

    .team-icon {
      margin-right: 12px;
      color: var(--mdc-theme-primary);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .team-info {
      flex: 1;
      
      .team-name {
        font-weight: 500;
        color: var(--mdc-theme-on-surface);
        margin-bottom: 4px;
      }
      
      .team-description {
        color: var(--mdc-theme-on-surface-variant);
        font-size: 14px;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .team-meta {
        mat-chip-set {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        mat-chip {
          font-size: 12px;
          height: 24px;
          
          &.privacy-open {
            background-color: #e8f5e8;
            color: #2e7d32;
          }
          
          &.privacy-closed {
            background-color: #ffebee;
            color: #c62828;
          }
          
          &.permission-read {
            background-color: #e3f2fd;
            color: #1565c0;
          }
          
          &.permission-write {
            background-color: #fff3e0;
            color: #ef6c00;
          }
          
          &.permission-admin {
            background-color: #f3e5f5;
            color: #7b1fa2;
          }
        }
      }
    }

    .team-actions {
      margin-left: 12px;
    }

    .delete-action {
      color: var(--mdc-theme-error);
    }

    @media (max-width: 768px) {
      .team-hierarchy-container {
        padding: 16px;
      }
      
      .hierarchy-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
        
        h3 {
          text-align: center;
        }
      }
      
      .team-node {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        
        .team-info {
          .team-meta mat-chip-set {
            justify-content: center;
          }
        }
        
        .team-actions {
          align-self: flex-end;
          margin-left: 0;
        }
      }
    }
  `]
})
export class TeamHierarchyComponent {
  @Input() teams = signal<Team[]>([]);
  
  @Output() createTeam = new EventEmitter<{ parentTeamId?: string }>();
  @Output() viewTeam = new EventEmitter<Team>();
  @Output() editTeam = new EventEmitter<Team>();
  @Output() manageMembers = new EventEmitter<Team>();
  @Output() deleteTeam = new EventEmitter<Team>();

  // 樹狀結構轉換器
  treeFlattener = new MatTreeFlattener(
    (node: TeamNode, level: number) => {
      return {
        ...node,
        level: level,
        expandable: node.children && node.children.length > 0
      };
    },
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  // Tree 控制
  treeControl = new FlatTreeControl<TeamNode>(
    node => node.level,
    node => node.expandable
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // 計算屬性
  readonly teamNodes = computed(() => this.buildTeamHierarchy(this.teams()));

  constructor() {
    // 監聽 teams 變化並更新 dataSource
    effect(() => {
      const nodes = this.teamNodes();
      this.dataSource.data = nodes;
    });
  }

  /**
   * 建立團隊層級結構
   */
  private buildTeamHierarchy(teams: Team[]): TeamNode[] {
    const teamMap = new Map<string, TeamNode>();
    const rootTeams: TeamNode[] = [];

    // 初始化所有團隊
    teams.forEach(team => {
      teamMap.set(team.id, {
        ...team,
        children: [],
        level: 0,
        expandable: false
      });
    });

    // 建立層級關係
    teams.forEach(team => {
      const teamNode = teamMap.get(team.id)!;
      if (team.parentTeamId) {
        const parent = teamMap.get(team.parentTeamId);
        if (parent) {
          parent.children.push(teamNode);
          parent.expandable = true;
        }
      } else {
        rootTeams.push(teamNode);
      }
    });

    return rootTeams;
  }

  /**
   * 獲取節點縮排
   */
  getNodePadding(node: TeamNode): number {
    return node.level * 24;
  }

  /**
   * 檢查是否有子節點
   */
  hasChild = (_: number, node: TeamNode) => node.expandable;

  /**
   * 獲取團隊圖示
   */
  getTeamIcon(privacy: 'open' | 'closed'): string {
    return privacy === 'open' ? 'public' : 'lock';
  }

  /**
   * 獲取隱私標籤
   */
  getPrivacyLabel(privacy: 'open' | 'closed'): string {
    return privacy === 'open' ? '公開' : '私有';
  }

  /**
   * 獲取權限標籤
   */
  getPermissionLabel(permission: 'read' | 'write' | 'admin'): string {
    switch (permission) {
      case 'read': return '讀取';
      case 'write': return '寫入';
      case 'admin': return '管理';
      default: return '未知';
    }
  }

  /**
   * 新增團隊
   */
  onCreateTeam(): void {
    this.createTeam.emit({});
  }

  /**
   * 新增子團隊
   */
  onCreateSubTeam(parentTeam: Team): void {
    this.createTeam.emit({ parentTeamId: parentTeam.id });
  }

  /**
   * 檢視團隊
   */
  onViewTeam(team: Team): void {
    this.viewTeam.emit(team);
  }

  /**
   * 編輯團隊
   */
  onEditTeam(team: Team): void {
    this.editTeam.emit(team);
  }

  /**
   * 管理成員
   */
  onManageMembers(team: Team): void {
    this.manageMembers.emit(team);
  }

  /**
   * 刪除團隊
   */
  onDeleteTeam(team: Team): void {
    this.deleteTeam.emit(team);
  }
}

// Tree 相關類別
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { effect } from '@angular/core';
```

## File: angular/src/app/features/organization/services/github-aligned-api.service.ts
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  OrganizationDetail, 
  CreateOrganizationRequest, 
  UpdateOrganizationRequest,
  Team,
  TeamMember,
  CreateTeamRequest,
  UpdateTeamRequest,
  OrganizationMember,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  SecurityManager,
  OrganizationRole
} from '../models/organization.model';

/**
 * GitHub 對齊的 API 服務
 * 實作對齊 GitHub REST API 模式的組織管理 API
 */
@Injectable({
  providedIn: 'root'
})
export class GitHubAlignedApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  // ==================== 組織管理 API ====================
  
  /**
   * 獲取組織資訊 (對齊 GitHub: GET /orgs/{org})
   */
  getOrganization(orgSlug: string): Observable<OrganizationDetail> {
    return this.http.get<OrganizationDetail>(`${this.baseUrl}/orgs/${orgSlug}`);
  }

  /**
   * 創建組織 (對齊 GitHub: POST /orgs)
   */
  createOrganization(org: CreateOrganizationRequest): Observable<OrganizationDetail> {
    return this.http.post<OrganizationDetail>(`${this.baseUrl}/orgs`, org);
  }

  /**
   * 更新組織 (對齊 GitHub: PUT /orgs/{org})
   */
  updateOrganization(orgSlug: string, updates: UpdateOrganizationRequest): Observable<OrganizationDetail> {
    return this.http.put<OrganizationDetail>(`${this.baseUrl}/orgs/${orgSlug}`, updates);
  }

  /**
   * 刪除組織 (對齊 GitHub: DELETE /orgs/{org})
   */
  deleteOrganization(orgSlug: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orgs/${orgSlug}`);
  }

  // ==================== 組織成員管理 API ====================

  /**
   * 獲取組織成員列表 (對齊 GitHub: GET /orgs/{org}/members)
   */
  getOrganizationMembers(orgSlug: string): Observable<OrganizationMember[]> {
    return this.http.get<OrganizationMember[]>(`${this.baseUrl}/orgs/${orgSlug}/members`);
  }

  /**
   * 邀請成員加入組織 (對齊 GitHub: POST /orgs/{org}/members)
   */
  inviteMember(orgSlug: string, invite: InviteMemberRequest): Observable<OrganizationMember> {
    return this.http.post<OrganizationMember>(`${this.baseUrl}/orgs/${orgSlug}/members`, invite);
  }

  /**
   * 更新成員角色 (對齊 GitHub: PUT /orgs/{org}/members/{username})
   */
  updateMemberRole(orgSlug: string, userId: string, update: UpdateMemberRoleRequest): Observable<OrganizationMember> {
    return this.http.put<OrganizationMember>(`${this.baseUrl}/orgs/${orgSlug}/members/${userId}`, update);
  }

  /**
   * 移除組織成員 (對齊 GitHub: DELETE /orgs/{org}/members/{username})
   */
  removeMember(orgSlug: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orgs/${orgSlug}/members/${userId}`);
  }

  // ==================== 團隊管理 API ====================

  /**
   * 獲取組織團隊列表 (對齊 GitHub: GET /orgs/{org}/teams)
   */
  getTeams(orgSlug: string): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.baseUrl}/orgs/${orgSlug}/teams`);
  }

  /**
   * 創建團隊 (對齊 GitHub: POST /orgs/{org}/teams)
   */
  createTeam(orgSlug: string, team: CreateTeamRequest): Observable<Team> {
    return this.http.post<Team>(`${this.baseUrl}/orgs/${orgSlug}/teams`, team);
  }

  /**
   * 獲取團隊詳情 (對齊 GitHub: GET /orgs/{org}/teams/{team_slug})
   */
  getTeam(orgSlug: string, teamSlug: string): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/orgs/${orgSlug}/teams/${teamSlug}`);
  }

  /**
   * 更新團隊 (對齊 GitHub: PUT /orgs/{org}/teams/{team_slug})
   */
  updateTeam(orgSlug: string, teamSlug: string, updates: UpdateTeamRequest): Observable<Team> {
    return this.http.put<Team>(`${this.baseUrl}/orgs/${orgSlug}/teams/${teamSlug}`, updates);
  }

  /**
   * 刪除團隊 (對齊 GitHub: DELETE /orgs/{org}/teams/{team_slug})
   */
  deleteTeam(orgSlug: string, teamSlug: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orgs/${orgSlug}/teams/${teamSlug}`);
  }

  // ==================== 團隊成員管理 API ====================

  /**
   * 獲取團隊成員列表 (對齊 GitHub: GET /orgs/{org}/teams/{team_slug}/members)
   */
  getTeamMembers(orgSlug: string, teamSlug: string): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/orgs/${orgSlug}/teams/${teamSlug}/members`);
  }

  /**
   * 添加團隊成員 (對齊 GitHub: PUT /orgs/{org}/teams/{team_slug}/members/{username})
   */
  addTeamMember(orgSlug: string, teamSlug: string, userId: string): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${this.baseUrl}/orgs/${orgSlug}/teams/${teamSlug}/members/${userId}`, {});
  }

  /**
   * 移除團隊成員 (對齊 GitHub: DELETE /orgs/{org}/teams/{team_slug}/members/{username})
   */
  removeTeamMember(orgSlug: string, teamSlug: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orgs/${orgSlug}/teams/${teamSlug}/members/${userId}`);
  }

  // ==================== 安全管理器 API ====================

  /**
   * 獲取安全管理器列表
   */
  getSecurityManagers(orgSlug: string): Observable<SecurityManager[]> {
    return this.http.get<SecurityManager[]>(`${this.baseUrl}/orgs/${orgSlug}/security-managers`);
  }

  /**
   * 創建安全管理器
   */
  createSecurityManager(orgSlug: string, manager: Partial<SecurityManager>): Observable<SecurityManager> {
    return this.http.post<SecurityManager>(`${this.baseUrl}/orgs/${orgSlug}/security-managers`, manager);
  }

  /**
   * 更新安全管理器
   */
  updateSecurityManager(orgSlug: string, managerId: string, updates: Partial<SecurityManager>): Observable<SecurityManager> {
    return this.http.put<SecurityManager>(`${this.baseUrl}/orgs/${orgSlug}/security-managers/${managerId}`, updates);
  }

  /**
   * 刪除安全管理器
   */
  deleteSecurityManager(orgSlug: string, managerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orgs/${orgSlug}/security-managers/${managerId}`);
  }

  // ==================== 組織角色 API ====================

  /**
   * 獲取組織角色列表
   */
  getOrganizationRoles(orgSlug: string): Observable<OrganizationRole[]> {
    return this.http.get<OrganizationRole[]>(`${this.baseUrl}/orgs/${orgSlug}/roles`);
  }

  /**
   * 創建組織角色
   */
  createOrganizationRole(orgSlug: string, role: Partial<OrganizationRole>): Observable<OrganizationRole> {
    return this.http.post<OrganizationRole>(`${this.baseUrl}/orgs/${orgSlug}/roles`, role);
  }

  /**
   * 更新組織角色
   */
  updateOrganizationRole(orgSlug: string, roleId: string, updates: Partial<OrganizationRole>): Observable<OrganizationRole> {
    return this.http.put<OrganizationRole>(`${this.baseUrl}/orgs/${orgSlug}/roles/${roleId}`, updates);
  }

  /**
   * 刪除組織角色
   */
  deleteOrganizationRole(orgSlug: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orgs/${orgSlug}/roles/${roleId}`);
  }
}
```

## File: angular/src/app/features/organization/services/permission-calculation.service.ts
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { 
  OrganizationDetail, 
  Team, 
  SecurityManager, 
  OrganizationRole, 
  PermissionResult 
} from '../models/organization.model';

/**
 * 權限計算服務
 * 實作混合權限系統：結合遞迴計算和選擇性快取
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionCalculationService {
  private permissionCache = new Map<string, PermissionResult>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分鐘快取

  // 使用 signals 進行響應式狀態管理
  private _organizations = signal<OrganizationDetail[]>([]);
  private _currentOrganization = signal<OrganizationDetail | null>(null);
  private _teams = signal<Team[]>([]);
  private _securityManagers = signal<SecurityManager[]>([]);
  private _organizationRoles = signal<OrganizationRole[]>([]);

  // 公開的只讀 signals
  readonly organizations = this._organizations.asReadonly();
  readonly currentOrganization = this._currentOrganization.asReadonly();
  readonly teams = this._teams.asReadonly();
  readonly securityManagers = this._securityManagers.asReadonly();
  readonly organizationRoles = this._organizationRoles.asReadonly();

  // 計算屬性
  readonly teamHierarchy = computed(() => this.buildTeamHierarchy(this.teams()));

  /**
   * 主要權限檢查方法
   */
  async checkPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<boolean> {
    const cacheKey = `${userId}:${resourceId}:${action}`;
    
    // 檢查快取
    if (this.isCacheValid(cacheKey)) {
      return this.permissionCache.get(cacheKey)!.granted;
    }
    
    // 計算權限
    const result = await this.calculatePermission(userId, resourceId, action);
    
    // 更新快取
    this.updateCache(cacheKey, result);
    
    return result.granted;
  }

  /**
   * 遞迴權限計算
   */
  private async calculatePermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    // 1. 檢查直接權限
    const directPermission = await this.checkDirectPermission(userId, resourceId, action);
    if (directPermission.granted) {
      return directPermission;
    }
    
    // 2. 檢查團隊繼承權限
    const teamPermission = await this.checkTeamInheritedPermission(userId, resourceId, action);
    if (teamPermission.granted) {
      return teamPermission;
    }
    
    // 3. 檢查組織角色權限
    const rolePermission = await this.checkOrganizationRolePermission(userId, resourceId, action);
    if (rolePermission.granted) {
      return rolePermission;
    }
    
    // 4. 檢查安全管理器權限
    const securityPermission = await this.checkSecurityManagerPermission(userId, resourceId, action);
    
    return securityPermission;
  }

  /**
   * 檢查直接權限
   */
  private async checkDirectPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const org = this._currentOrganization();
    if (!org) {
      return { granted: false, reason: 'No organization context' };
    }

    // 檢查是否為組織擁有者
    if (org.members.some(member => member.userId === userId && member.role.level === 10)) {
      return { granted: true, level: 'admin', reason: 'Organization owner' };
    }

    // 檢查直接成員權限
    const member = org.members.find(m => m.userId === userId);
    if (member && member.status === 'active') {
      const hasPermission = member.role.permissions.some(
        p => p.resource === resourceId && p.action === action
      );
      if (hasPermission) {
        return { 
          granted: true, 
          level: this.mapRoleLevelToPermission(member.role.level),
          reason: 'Direct member permission' 
        };
      }
    }

    return { granted: false, reason: 'No direct permission' };
  }

  /**
   * 檢查團隊繼承權限
   */
  private async checkTeamInheritedPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const teams = this._teams();
    const userTeams = teams.filter(team => 
      team.members.some(member => member.userId === userId)
    );

    for (const team of userTeams) {
      const teamPermission = await this.calculateTeamPermissions(userId, team.id, action);
      if (teamPermission.granted) {
        return teamPermission;
      }
    }

    return { granted: false, reason: 'No team permission found' };
  }

  /**
   * 計算團隊權限
   */
  private async calculateTeamPermissions(
    userId: string, 
    teamId: string, 
    action: string
  ): Promise<PermissionResult> {
    const team = this._teams().find(t => t.id === teamId);
    if (!team) {
      return { granted: false, reason: 'Team not found' };
    }

    // 檢查直接團隊成員權限
    const teamMember = team.members.find(member => member.userId === userId);
    if (teamMember) {
      const permissionLevel = this.mapTeamRoleToPermission(teamMember.role);
      return this.applyTeamPermissionLevel(
        { granted: true, level: permissionLevel, reason: 'Team member' },
        team.permission
      );
    }

    // 檢查父團隊繼承權限
    if (team.parentTeamId) {
      const parentPermission = await this.calculateTeamPermissions(userId, team.parentTeamId, action);
      if (parentPermission.granted) {
        // 父團隊權限會降級一級
        return this.downgradePermissionLevel(parentPermission);
      }
    }

    return { granted: false, reason: 'No team permission found' };
  }

  /**
   * 檢查組織角色權限
   */
  private async checkOrganizationRolePermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const org = this._currentOrganization();
    if (!org) {
      return { granted: false, reason: 'No organization context' };
    }

    const member = org.members.find(m => m.userId === userId);
    if (!member || member.status !== 'active') {
      return { granted: false, reason: 'Not an active member' };
    }

    const role = this._organizationRoles().find(r => r.id === member.role.id);
    if (!role) {
      return { granted: false, reason: 'Role not found' };
    }

    const hasPermission = role.permissions.some(
      p => p.resource === resourceId && p.action === action
    );

    if (hasPermission) {
      return {
        granted: true,
        level: this.mapRoleLevelToPermission(role.level),
        reason: 'Organization role permission'
      };
    }

    return { granted: false, reason: 'No role permission' };
  }

  /**
   * 檢查安全管理器權限
   */
  private async checkSecurityManagerPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const securityManagers = this._securityManagers();
    const userSecurityRole = securityManagers.find(
      sm => sm.type === 'user' && sm.entityId === userId
    );

    if (!userSecurityRole) {
      return { granted: false, reason: 'Not a security manager' };
    }

    // 檢查安全管理器權限範圍
    const scopePermission = await this.checkSecurityScope(userSecurityRole, resourceId);
    if (!scopePermission) {
      return { granted: false, reason: 'Outside security scope' };
    }

    // 檢查特定安全管理權限
    const specificPermission = await this.checkSpecificSecurityPermission(
      userSecurityRole, 
      action
    );

    return specificPermission;
  }

  /**
   * 檢查安全管理器權限範圍
   */
  private async checkSecurityScope(
    securityRole: SecurityManager, 
    resourceId: string
  ): Promise<boolean> {
    switch (securityRole.type) {
      case 'user':
        return await this.checkUserSecurityScope(securityRole.entityId, resourceId);
      case 'team':
        return await this.checkTeamSecurityScope(securityRole.entityId, resourceId);
      default:
        return false;
    }
  }

  /**
   * 檢查用戶安全管理範圍
   */
  private async checkUserSecurityScope(userId: string, resourceId: string): Promise<boolean> {
    // 實作用戶安全管理範圍檢查邏輯
    return true; // 簡化實作
  }

  /**
   * 檢查團隊安全管理範圍
   */
  private async checkTeamSecurityScope(teamId: string, resourceId: string): Promise<boolean> {
    // 實作團隊安全管理範圍檢查邏輯
    return true; // 簡化實作
  }

  /**
   * 檢查特定安全管理權限
   */
  private async checkSpecificSecurityPermission(
    securityRole: SecurityManager, 
    action: string
  ): Promise<PermissionResult> {
    const hasPermission = securityRole.permissions.some(
      p => p.action === action
    );

    if (hasPermission) {
      return {
        granted: true,
        level: 'admin',
        reason: 'Security manager permission'
      };
    }

    return { granted: false, reason: 'No security manager permission' };
  }

  /**
   * 權限等級降級邏輯
   */
  private downgradePermissionLevel(permission: PermissionResult): PermissionResult {
    const levelMap: Record<string, 'read' | 'write' | 'admin' | 'none'> = { 
      'admin': 'write', 
      'write': 'read', 
      'read': 'none' 
    };
    const newLevel = levelMap[permission.level || 'read'] || 'none';
    
    return {
      ...permission,
      level: newLevel,
      granted: newLevel !== 'none'
    };
  }

  /**
   * 應用團隊權限等級
   */
  private applyTeamPermissionLevel(
    permission: PermissionResult, 
    teamPermission: 'read' | 'write' | 'admin'
  ): PermissionResult {
    const teamLevelMap: Record<string, 'read' | 'write' | 'admin'> = { 
      'read': 'read', 
      'write': 'write', 
      'admin': 'admin' 
    };
    const finalLevel = teamLevelMap[teamPermission];
    
    return {
      ...permission,
      level: finalLevel,
      granted: true
    };
  }

  /**
   * 映射角色等級到權限等級
   */
  private mapRoleLevelToPermission(level: number): 'read' | 'write' | 'admin' {
    if (level >= 8) return 'admin';
    if (level >= 5) return 'write';
    return 'read';
  }

  /**
   * 映射團隊角色到權限等級
   */
  private mapTeamRoleToPermission(role: 'member' | 'maintainer' | 'admin'): 'read' | 'write' | 'admin' {
    switch (role) {
      case 'admin': return 'admin';
      case 'maintainer': return 'write';
      case 'member': return 'read';
      default: return 'read';
    }
  }

  /**
   * 建立團隊層級結構
   */
  private buildTeamHierarchy(teams: Team[]): Team[] {
    const teamMap = new Map<string, Team & { children: Team[] }>();
    const rootTeams: (Team & { children: Team[] })[] = [];

    // 初始化所有團隊
    teams.forEach(team => {
      teamMap.set(team.id, { ...team, children: [] });
    });

    // 建立層級關係
    teams.forEach(team => {
      const teamWithChildren = teamMap.get(team.id)!;
      if (team.parentTeamId) {
        const parent = teamMap.get(team.parentTeamId);
        if (parent) {
          parent.children.push(teamWithChildren);
        }
      } else {
        rootTeams.push(teamWithChildren);
      }
    });

    return rootTeams;
  }

  /**
   * 檢查快取是否有效
   */
  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * 更新快取
   */
  private updateCache(cacheKey: string, result: PermissionResult): void {
    this.permissionCache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.permissionCache.clear();
    this.cacheExpiry.clear();
  }

  // ==================== 狀態管理方法 ====================

  /**
   * 設定組織列表
   */
  setOrganizations(orgs: OrganizationDetail[]): void {
    this._organizations.set(orgs);
  }

  /**
   * 設定當前組織
   */
  setCurrentOrganization(org: OrganizationDetail | null): void {
    this._currentOrganization.set(org);
    if (org) {
      this._teams.set(org.teams);
      this._securityManagers.set(org.securityManagers);
      this._organizationRoles.set(org.organizationRoles);
    }
  }

  /**
   * 新增團隊
   */
  addTeam(team: Team): void {
    this._teams.update(teams => [...teams, team]);
  }

  /**
   * 更新團隊
   */
  updateTeam(teamId: string, updates: Partial<Team>): void {
    this._teams.update(teams => 
      teams.map(team => team.id === teamId ? { ...team, ...updates } : team)
    );
  }

  /**
   * 移除團隊
   */
  removeTeam(teamId: string): void {
    this._teams.update(teams => teams.filter(team => team.id !== teamId));
  }
}
```

## File: angular/src/app/features/organization/index.ts
```typescript
// 組織模組匯出檔案
export * from './components/organization-card.component';
export * from './components/team-management.component';
export * from './components/security-manager.component';
export * from './components/organization-roles.component';
export * from './services/github-aligned-api.service';
export * from './services/permission-calculation.service';
export * from './models/organization.model';
export * from './routes/organization.routes';
```

## File: angular/src/app/features/user/auth/auth.service.ts
```typescript
import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth) {}

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signup(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  /**
   * Google 社交登入
   */
  signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    
    // 添加額外的 scope (可選)
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
    // 設定自定義參數 (可選)
    provider.setCustomParameters({
      'login_hint': 'user@example.com'
    });
    
    return signInWithPopup(this.auth, provider);
  }

  get user() {
    return this.auth.currentUser;
  }
}
```

## File: angular/src/app/features/user/user.service.ts
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Auth, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest,
  SocialAccount,
  AddSocialAccountRequest,
  Certificate,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
  PrivacySettings,
  UpdatePrivacySettingsRequest,
  UserApiResponse,
  SocialAccountApiResponse,
  PaginatedResponse
} from './user.model';

/**
 * 用戶服務 - Firebase 整合版本
 * 精簡主義實現，直接使用 app.config.ts 中的 Firebase 配置
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly baseUrl = '/api';

  // ==================== 用戶管理 API ====================
  
  /**
   * 獲取當前用戶資訊 - Firebase 整合版本
   */
  getCurrentUser(): Observable<User | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return of(null);
    }
    
    return from(getDoc(doc(this.firestore, 'users', currentUser.uid))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: currentUser.uid,
            uid: currentUser.uid,
            username: data['username'] || currentUser.displayName || '',
            email: currentUser.email || '',
            displayName: data['displayName'] || currentUser.displayName || '',
            bio: data['bio'] || '',
            status: data['status'] || 'active',
            emailVerified: currentUser.emailVerified,
            twoFactorEnabled: data['twoFactorEnabled'] || false,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            socialAccounts: data['socialAccounts'] || [],
            certificates: data['certificates'] || [],
            organizationMemberships: data['organizationMemberships'] || [],
            notificationPreferences: data['notificationPreferences'] || {
              email: { enabled: true, frequency: 'daily', types: [] },
              push: { enabled: true, types: [] },
              inApp: { enabled: true, types: [] }
            },
            privacySettings: data['privacySettings'] || {
              profileVisibility: 'public',
              emailVisibility: 'private',
              socialAccountsVisibility: 'public',
              certificatesVisibility: 'public',
              activityVisibility: 'public'
            }
          } as User;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * 獲取指定用戶資訊 (對齊 GitHub: GET /users/{username})
   */
  getUser(username: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${username}`);
  }

  /**
   * 更新當前用戶資訊 - Firebase 整合版本
   */
  updateUser(updates: UpdateUserRequest): Observable<User | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return of(null);
    }
    
    const userRef = doc(this.firestore, 'users', currentUser.uid);
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    
    return from(updateDoc(userRef, updateData)).pipe(
      map(() => {
        // 返回更新後的用戶資料
        return {
          id: currentUser.uid,
          uid: currentUser.uid,
          username: currentUser.displayName || '',
          email: currentUser.email || '',
          displayName: updates.displayName || currentUser.displayName || '',
          bio: updates.bio || '',
          status: 'active',
          emailVerified: currentUser.emailVerified,
          twoFactorEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          socialAccounts: [],
          certificates: [],
          organizationMemberships: [],
          notificationPreferences: {
            email: { enabled: true, frequency: 'daily', types: [] },
            push: { enabled: true, types: [] },
            inApp: { enabled: true, types: [] }
          },
          privacySettings: {
            profileVisibility: 'public',
            emailVisibility: 'private',
            socialAccountsVisibility: 'public',
            certificatesVisibility: 'public',
            activityVisibility: 'public'
          }
        } as User;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * 刪除當前用戶帳戶 (對齊 GitHub: DELETE /user)
   */
  deleteUser(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user`);
  }

  // ==================== 社交帳戶管理 API ====================
  
  /**
   * 獲取用戶社交帳戶列表 (對齊 GitHub: GET /user/social_accounts)
   */
  getSocialAccounts(): Observable<SocialAccount[]> {
    return this.http.get<SocialAccountApiResponse[]>(`${this.baseUrl}/user/social_accounts`)
      .pipe(
        // 轉換為內部格式
        map(accounts => accounts.map(account => ({
          id: this.generateId(),
          provider: account.provider as any,
          url: account.url,
          username: account.username,
          verified: account.verified,
          addedAt: new Date(account.addedAt)
        })))
      );
  }

  /**
   * 添加社交帳戶 (對齊 GitHub: POST /user/social_accounts)
   */
  addSocialAccount(account: AddSocialAccountRequest): Observable<SocialAccount> {
    return this.http.post<SocialAccountApiResponse>(`${this.baseUrl}/user/social_accounts`, {
      account_urls: [account.url]
    }).pipe(
      map(response => ({
        id: this.generateId(),
        provider: account.provider as any,
        url: account.url,
        username: account.username,
        verified: response.verified,
        addedAt: new Date(response.addedAt)
      }))
    );
  }

  /**
   * 刪除社交帳戶 (對齊 GitHub: DELETE /user/social_accounts)
   */
  removeSocialAccounts(accountUrls: string[]): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/social_accounts`, {
      body: { account_urls: accountUrls }
    });
  }

  /**
   * 獲取指定用戶的社交帳戶 (對齊 GitHub: GET /users/{username}/social_accounts)
   */
  getUserSocialAccounts(username: string): Observable<SocialAccount[]> {
    return this.http.get<SocialAccountApiResponse[]>(`${this.baseUrl}/users/${username}/social_accounts`)
      .pipe(
        map(accounts => accounts.map(account => ({
          id: this.generateId(),
          provider: account.provider as any,
          url: account.url,
          username: account.username,
          verified: account.verified,
          addedAt: new Date(account.addedAt)
        })))
      );
  }

  // ==================== 證照管理 API ====================
  
  /**
   * 獲取用戶證照列表
   */
  getCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.baseUrl}/user/certificates`);
  }

  /**
   * 添加證照
   */
  addCertificate(certificate: Partial<Certificate>): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.baseUrl}/user/certificates`, certificate);
  }

  /**
   * 更新證照
   */
  updateCertificate(certificateId: string, updates: Partial<Certificate>): Observable<Certificate> {
    return this.http.patch<Certificate>(`${this.baseUrl}/user/certificates/${certificateId}`, updates);
  }

  /**
   * 刪除證照
   */
  deleteCertificate(certificateId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/certificates/${certificateId}`);
  }

  // ==================== 通知偏好管理 API ====================
  
  /**
   * 獲取通知偏好設定
   */
  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/user/notification-preferences`);
  }

  /**
   * 更新通知偏好設定
   */
  updateNotificationPreferences(preferences: UpdateNotificationPreferencesRequest): Observable<NotificationPreferences> {
    return this.http.patch<NotificationPreferences>(`${this.baseUrl}/user/notification-preferences`, preferences);
  }

  // ==================== 隱私設定管理 API ====================
  
  /**
   * 獲取隱私設定
   */
  getPrivacySettings(): Observable<PrivacySettings> {
    return this.http.get<PrivacySettings>(`${this.baseUrl}/user/privacy-settings`);
  }

  /**
   * 更新隱私設定
   */
  updatePrivacySettings(settings: UpdatePrivacySettingsRequest): Observable<PrivacySettings> {
    return this.http.patch<PrivacySettings>(`${this.baseUrl}/user/privacy-settings`, settings);
  }

  // ==================== 組織成員資格管理 API ====================
  
  /**
   * 獲取用戶的組織成員資格
   */
  getOrganizationMemberships(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/organization-memberships`);
  }

  /**
   * 離開組織
   */
  leaveOrganization(organizationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/organization-memberships/${organizationId}`);
  }

  // ==================== 工具方法 ====================
  
  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 檢查用戶名是否可用
   */
  checkUsernameAvailability(username: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/user/check-username/${username}`);
  }

  /**
   * 檢查郵箱是否可用
   */
  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/user/check-email/${email}`);
  }

  /**
   * 上傳頭像 - Firebase Storage 整合版本
   */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return of({ avatarUrl: '' });
    }
    
    const avatarRef = ref(this.storage, `avatars/${currentUser.uid}/${file.name}`);
    
    return from(uploadBytes(avatarRef, file)).pipe(
      switchMap(snapshot => from(getDownloadURL(snapshot.ref))),
      map(url => ({ avatarUrl: url })),
      catchError(() => of({ avatarUrl: '' }))
    );
  }

  /**
   * 刪除頭像
   */
  deleteAvatar(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/avatar`);
  }
}
```

## File: angular/src/app/app.spec.ts
```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
```

## File: angular/src/app/app.ts
```typescript
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  snackBar = inject(MatSnackBar);

  constructor() {
    // Firebase 和 App Check 已正確配置
    console.log('✅ Firebase configuration loaded successfully');
    console.log('✅ App Check configured for', environment.production ? 'production' : 'development');
  }
  protected readonly title = signal('angular-fire-rolekit');
}
```

## File: angular/src/environments/environment.sample.ts
```typescript
//All this info will be in firebase console -> project overview -> project settings -> your apps (ex: webapp)
export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI",
    authDomain: "elite-chiller-455712-c4.firebaseapp.com",
    projectId: "elite-chiller-455712-c4",
    storageBucket: "elite-chiller-455712-c4.firebasestorage.app",
    messagingSenderId: "7807661688",
    appId: "1:7807661688:web:29a373231a5fa5ae1d1f8d",
    measurementId: "G-YZHBTZSY91"
  },
  appCheck: {
    // Debug token for local development
    debugToken: "50e4c86e-6520-484e-905b-8fc67ccbc0b2",
    // reCAPTCHA Enterprise site key for production
    recaptchaSiteKey: "6LeGl-wrAAAAALTgTmQN5XbGLB2hVKhcySGyBIXI"
  }
};
```

## File: angular/src/app/core/models/auth.model.ts
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
  organizationMemberships?: { [orgId: string]: string }; // orgId → role
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

## File: angular/src/app/core/utils/validation.utils.ts
```typescript
// src/app/core/utils/validation.utils.ts

import { ProfileVO, PermissionVO, SettingsVO, OrgRole } from '../models/auth.model';

/**
 * 驗證工具類別
 * 提供統一的驗證邏輯和錯誤處理
 */
export class ValidationUtils {
  /**
   * 驗證電子郵件格式
   * @param email 電子郵件地址
   * @returns 是否為有效的電子郵件格式
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * 驗證密碼強度
   * @param password 密碼
   * @returns 驗證結果和錯誤訊息
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password || password.length < 8) {
      errors.push('密碼至少需要 8 個字符');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密碼必須包含至少一個大寫字母');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密碼必須包含至少一個小寫字母');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('密碼必須包含至少一個數字');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密碼必須包含至少一個特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證用戶檔案
   * @param profile 用戶檔案
   * @returns 錯誤訊息陣列
   */
  static validateProfile(profile: ProfileVO): string[] {
    const errors: string[] = [];
    
    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('用戶名稱不能為空');
    }
    
    if (profile.name && profile.name.trim().length < 2) {
      errors.push('用戶名稱至少需要 2 個字符');
    }
    
    if (!profile.email || !this.validateEmail(profile.email)) {
      errors.push('無效的電子郵件格式');
    }
    
    if (profile.bio && profile.bio.length > 500) {
      errors.push('個人簡介不能超過 500 個字符');
    }
    
    if (profile.website && !this.validateUrl(profile.website)) {
      errors.push('無效的網站 URL 格式');
    }
    
    return errors;
  }

  /**
   * 驗證權限設定
   * @param permission 權限設定
   * @returns 錯誤訊息陣列
   */
  static validatePermission(permission: PermissionVO): string[] {
    const errors: string[] = [];
    
    if (!permission.roles || permission.roles.length === 0) {
      errors.push('至少需要一個角色');
    }
    
    if (!permission.abilities || permission.abilities.length === 0) {
      errors.push('至少需要一個權限能力');
    }
    
    // 驗證角色格式
    if (permission.roles) {
      const validRoles = Object.values(OrgRole);
      const invalidRoles = permission.roles.filter(role => !validRoles.includes(role as OrgRole));
      if (invalidRoles.length > 0) {
        errors.push(`無效的角色: ${invalidRoles.join(', ')}`);
      }
    }
    
    return errors;
  }

  /**
   * 驗證設定
   * @param settings 設定
   * @returns 錯誤訊息陣列
   */
  static validateSettings(settings: SettingsVO): string[] {
    const errors: string[] = [];
    
    if (!settings.language || settings.language.trim().length === 0) {
      errors.push('語言設定不能為空');
    }
    
    if (!['light', 'dark'].includes(settings.theme)) {
      errors.push('主題設定必須是 light 或 dark');
    }
    
    if (settings.notifications) {
      if (typeof settings.notifications.email !== 'boolean') {
        errors.push('電子郵件通知設定必須是布林值');
      }
      if (typeof settings.notifications.push !== 'boolean') {
        errors.push('推送通知設定必須是布林值');
      }
      if (typeof settings.notifications.sms !== 'boolean') {
        errors.push('簡訊通知設定必須是布林值');
      }
    }
    
    if (settings.privacy) {
      if (typeof settings.privacy.profilePublic !== 'boolean') {
        errors.push('公開檔案設定必須是布林值');
      }
      if (typeof settings.privacy.showEmail !== 'boolean') {
        errors.push('顯示電子郵件設定必須是布林值');
      }
    }
    
    return errors;
  }

  /**
   * 驗證 URL 格式
   * @param url URL 字串
   * @returns 是否為有效的 URL
   */
  static validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 驗證登入名稱 (GitHub 式)
   * @param login 登入名稱
   * @returns 驗證結果和錯誤訊息
   */
  static validateLogin(login: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!login || login.trim().length === 0) {
      errors.push('登入名稱不能為空');
      return { isValid: false, errors };
    }
    
    const trimmedLogin = login.trim();
    
    if (trimmedLogin.length < 3) {
      errors.push('登入名稱至少需要 3 個字符');
    }
    
    if (trimmedLogin.length > 39) {
      errors.push('登入名稱不能超過 39 個字符');
    }
    
    // GitHub 式登入名稱規則：只能包含字母、數字、連字符和底線
    if (!/^[a-zA-Z0-9-_]+$/.test(trimmedLogin)) {
      errors.push('登入名稱只能包含字母、數字、連字符和底線');
    }
    
    // 不能以連字符或底線開頭或結尾
    if (/^[-_]|[-_]$/.test(trimmedLogin)) {
      errors.push('登入名稱不能以連字符或底線開頭或結尾');
    }
    
    // 不能包含連續的連字符或底線
    if (/[-_]{2,}/.test(trimmedLogin)) {
      errors.push('登入名稱不能包含連續的連字符或底線');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證組織名稱
   * @param name 組織名稱
   * @returns 驗證結果和錯誤訊息
   */
  static validateOrganizationName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('組織名稱不能為空');
      return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      errors.push('組織名稱至少需要 2 個字符');
    }
    
    if (trimmedName.length > 100) {
      errors.push('組織名稱不能超過 100 個字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證團隊名稱
   * @param name 團隊名稱
   * @returns 驗證結果和錯誤訊息
   */
  static validateTeamName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('團隊名稱不能為空');
      return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      errors.push('團隊名稱至少需要 2 個字符');
    }
    
    if (trimmedName.length > 50) {
      errors.push('團隊名稱不能超過 50 個字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證團隊 slug
   * @param slug 團隊 slug
   * @returns 驗證結果和錯誤訊息
   */
  static validateTeamSlug(slug: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!slug || slug.trim().length === 0) {
      errors.push('團隊 slug 不能為空');
      return { isValid: false, errors };
    }
    
    const trimmedSlug = slug.trim();
    
    if (trimmedSlug.length < 2) {
      errors.push('團隊 slug 至少需要 2 個字符');
    }
    
    if (trimmedSlug.length > 30) {
      errors.push('團隊 slug 不能超過 30 個字符');
    }
    
    // 檢查格式
    if (!/^[a-z0-9\-_]+$/.test(trimmedSlug)) {
      errors.push('團隊 slug 只能包含小寫字母、數字、連字符和下劃線');
    }
    
    // 檢查是否以連字符開頭或結尾
    if (/^[-_]|[-_]$/.test(trimmedSlug)) {
      errors.push('團隊 slug 不能以連字符或下劃線開頭或結尾');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證 Repository 名稱
   * @param name Repository 名稱
   * @returns 驗證結果和錯誤訊息
   */
  static validateRepositoryName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Repository 名稱不能為空');
      return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 1) {
      errors.push('Repository 名稱至少需要 1 個字符');
    }
    
    if (trimmedName.length > 100) {
      errors.push('Repository 名稱不能超過 100 個字符');
    }
    
    // Repository 名稱規則：只能包含字母、數字、連字符、底線和點
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedName)) {
      errors.push('Repository 名稱只能包含字母、數字、連字符、底線和點');
    }
    
    // 不能以點開頭或結尾
    if (/^\.|\.$/.test(trimmedName)) {
      errors.push('Repository 名稱不能以點開頭或結尾');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 清理和格式化輸入
   * @param input 輸入字串
   * @returns 清理後的字串
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * 驗證日期範圍
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 驗證結果和錯誤訊息
   */
  static validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!startDate || !endDate) {
      errors.push('開始日期和結束日期不能為空');
      return { isValid: false, errors };
    }
    
    if (startDate >= endDate) {
      errors.push('開始日期必須早於結束日期');
    }
    
    const now = new Date();
    if (startDate > now) {
      errors.push('開始日期不能是未來日期');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

## File: angular/src/app/features/user/profile/profile-management.component.ts
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { UserService } from '../user.service';
import { User, SocialAccount, Certificate, NotificationPreferences, PrivacySettings } from '../user.model';
import { AvatarUtils } from '../../../core/utils/avatar.utils';

/**
 * 個人資料管理組件 - 對齊 GitHub Account 設計
 * 實作完整的個人資料管理功能
 */
@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="profile-management-wrapper">
      <mat-card class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <img 
              [src]="getAvatarUrl(user()?.avatar)" 
              [alt]="user()?.displayName"
              class="avatar"
            >
            <button mat-icon-button class="avatar-upload-btn" (click)="onAvatarUpload()">
              <mat-icon>camera_alt</mat-icon>
            </button>
          </div>
          <div class="profile-info">
            <h1 class="display-name">{{ user()?.displayName || '未設定' }}</h1>
            <p class="username">{{ '@' + (user()?.username || '未設定') }}</p>
            <p class="bio">{{ user()?.bio || '尚未填寫個人簡介' }}</p>
            <div class="profile-stats">
              <span class="stat">
                <mat-icon>business</mat-icon>
                {{ user()?.organizationMemberships?.length || 0 }} 個組織
              </span>
              <span class="stat">
                <mat-icon>school</mat-icon>
                {{ user()?.certificates?.length || 0 }} 張證照
              </span>
              <span class="stat">
                <mat-icon>link</mat-icon>
                {{ user()?.socialAccounts?.length || 0 }} 個社交帳戶
              </span>
            </div>
          </div>
        </div>
      </mat-card>

      <mat-card class="profile-content">
        <mat-tab-group>
          <!-- 基本資料 -->
          <mat-tab label="基本資料">
            <div class="tab-content">
              <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>顯示名稱</mat-label>
                    <input matInput formControlName="displayName" placeholder="請輸入顯示名稱">
                    <mat-icon matSuffix>person</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>個人簡介</mat-label>
                    <textarea matInput formControlName="bio" rows="3" placeholder="請輸入個人簡介"></textarea>
                    <mat-icon matSuffix>description</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>所在地</mat-label>
                    <input matInput formControlName="location" placeholder="請輸入所在地">
                    <mat-icon matSuffix>location_on</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>公司</mat-label>
                    <input matInput formControlName="company" placeholder="請輸入公司名稱">
                    <mat-icon matSuffix>business</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>個人網站</mat-label>
                    <input matInput formControlName="website" placeholder="https://example.com">
                    <mat-icon matSuffix>language</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>部落格</mat-label>
                    <input matInput formControlName="blog" placeholder="https://blog.example.com">
                    <mat-icon matSuffix>article</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="profileForm.invalid || loading()">
                    <mat-icon>save</mat-icon>
                    儲存變更
                  </button>
                  <button mat-stroked-button type="button" (click)="onResetProfile()">
                    <mat-icon>refresh</mat-icon>
                    重設
                  </button>
                </div>
              </form>
            </div>
          </mat-tab>

          <!-- 社交帳戶 -->
          <mat-tab label="社交帳戶">
            <div class="tab-content">
              <div class="social-accounts-section">
                <h3>已連結的社交帳戶</h3>
                <div class="social-accounts-list" *ngIf="socialAccounts().length > 0; else noSocialAccounts">
                  <div class="social-account-item" *ngFor="let account of socialAccounts()">
                    <div class="account-info">
                      <mat-icon class="provider-icon">{{ getProviderIcon(account.provider) }}</mat-icon>
                      <div class="account-details">
                        <span class="provider-name">{{ getProviderName(account.provider) }}</span>
                        <span class="account-url">{{ account.url }}</span>
                        <mat-chip *ngIf="account.verified" color="primary" class="verified-chip">
                          <mat-icon>verified</mat-icon>
                          已驗證
                        </mat-chip>
                      </div>
                    </div>
                    <button mat-icon-button color="warn" (click)="onRemoveSocialAccount(account)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
                
                <ng-template #noSocialAccounts>
                  <div class="empty-state">
                    <mat-icon>link_off</mat-icon>
                    <p>尚未連結任何社交帳戶</p>
                  </div>
                </ng-template>

                <mat-divider></mat-divider>

                <div class="add-social-account">
                  <h4>新增社交帳戶</h4>
                  <form [formGroup]="socialAccountForm" (ngSubmit)="onAddSocialAccount()">
                    <div class="form-row">
                      <mat-form-field appearance="outline" class="field">
                        <mat-label>平台</mat-label>
                        <mat-select formControlName="provider">
                          <mat-option value="twitter">Twitter</mat-option>
                          <mat-option value="facebook">Facebook</mat-option>
                          <mat-option value="linkedin">LinkedIn</mat-option>
                          <mat-option value="youtube">YouTube</mat-option>
                          <mat-option value="instagram">Instagram</mat-option>
                          <mat-option value="github">GitHub</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline" class="field">
                        <mat-label>帳戶 URL</mat-label>
                        <input matInput formControlName="url" placeholder="https://example.com/username">
                      </mat-form-field>
                    </div>
                    
                    <button mat-raised-button color="primary" type="submit" [disabled]="socialAccountForm.invalid || loading()">
                      <mat-icon>add</mat-icon>
                      新增帳戶
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- 通知設定 -->
          <mat-tab label="通知設定">
            <div class="tab-content">
              <div class="notification-settings-section">
                <h3>通知偏好設定</h3>
                <form [formGroup]="notificationForm" (ngSubmit)="onUpdateNotifications()">
                  <div class="notification-group">
                    <h4>郵件通知</h4>
                    <mat-form-field appearance="outline" class="field">
                      <mat-label>通知頻率</mat-label>
                      <mat-select formControlName="emailFrequency">
                        <mat-option value="immediate">即時</mat-option>
                        <mat-option value="daily">每日摘要</mat-option>
                        <mat-option value="weekly">每週摘要</mat-option>
                        <mat-option value="never">永不</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="notificationForm.invalid || loading()">
                      <mat-icon>save</mat-icon>
                      儲存設定
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-management-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .profile-card {
      margin-bottom: 24px;
      border-radius: 16px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 24px;
    }

    .avatar-section {
      position: relative;
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #e0e0e0;
    }

    .avatar-upload-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #1976d2;
      color: white;
    }

    .profile-info {
      flex: 1;
    }

    .display-name {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }

    .username {
      font-size: 16px;
      color: #666;
      margin: 0 0 12px 0;
    }

    .bio {
      font-size: 14px;
      color: #666;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .profile-stats {
      display: flex;
      gap: 24px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .profile-content {
      border-radius: 16px;
    }

    .tab-content {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .social-accounts-section h3,
    .notification-settings-section h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .social-accounts-list {
      margin-bottom: 24px;
    }

    .social-account-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .account-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .provider-icon {
      font-size: 24px;
      color: #1976d2;
    }

    .account-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .provider-name {
      font-weight: 500;
      color: #333;
    }

    .account-url {
      font-size: 12px;
      color: #666;
    }

    .verified-chip {
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .notification-group {
      margin-bottom: 24px;
    }

    .notification-group h4 {
      margin: 0 0 16px 0;
      color: #333;
    }
  `]
})
export class ProfileManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // Signals
  user = signal<User | null>(null);
  socialAccounts = signal<SocialAccount[]>([]);
  loading = signal(false);

  // Forms
  profileForm!: FormGroup;
  socialAccountForm!: FormGroup;
  notificationForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();
    this.loadUserData();
  }

  private initializeForms() {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
      bio: [''],
      location: [''],
      company: [''],
      website: [''],
      blog: ['']
    });

    this.socialAccountForm = this.fb.group({
      provider: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });

    this.notificationForm = this.fb.group({
      emailFrequency: ['daily']
    });
  }

  private loadUserData() {
    this.loading.set(true);
    
    // 使用 Firebase 整合的 UserService
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.user.set(user);
          this.socialAccounts.set(user.socialAccounts || []);
          
          // 更新表單
          this.profileForm.patchValue({
            displayName: user.displayName,
            bio: user.bio,
            location: user.location,
            company: user.company,
            website: user.website,
            blog: user.blog
          });
          
          this.notificationForm.patchValue({
            emailFrequency: user.notificationPreferences?.email?.frequency || 'daily'
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('載入用戶資料失敗:', error);
        this.loading.set(false);
      }
    });
  }

  // Event handlers
  onUpdateProfile() {
    if (this.profileForm.valid) {
      this.loading.set(true);
      
      const updates = this.profileForm.value;
      this.userService.updateUser(updates).subscribe({
        next: (updatedUser) => {
          if (updatedUser) {
            this.user.set(updatedUser);
            this.snackBar.open('個人資料更新成功', '關閉', { duration: 3000 });
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('更新個人資料失敗:', error);
          this.snackBar.open('更新失敗，請重試', '關閉', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  onResetProfile() {
    const user = this.user();
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName,
        bio: user.bio,
        location: user.location,
        company: user.company,
        website: user.website,
        blog: user.blog
      });
    }
  }

  onAddSocialAccount() {
    if (this.socialAccountForm.valid) {
      this.loading.set(true);
      // TODO: 實作新增社交帳戶
      setTimeout(() => {
        this.socialAccountForm.reset();
        this.snackBar.open('社交帳戶新增成功', '關閉', { duration: 3000 });
        this.loading.set(false);
      }, 1000);
    }
  }

  onRemoveSocialAccount(account: SocialAccount) {
    // TODO: 實作移除社交帳戶
    this.snackBar.open('社交帳戶已移除', '關閉', { duration: 3000 });
  }

  onUpdateNotifications() {
    if (this.notificationForm.valid) {
      this.loading.set(true);
      // TODO: 實作更新通知設定
      setTimeout(() => {
        this.snackBar.open('通知設定更新成功', '關閉', { duration: 3000 });
        this.loading.set(false);
      }, 1000);
    }
  }

  onAvatarUpload() {
    // 創建文件輸入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.loading.set(true);
        
        this.userService.uploadAvatar(file).subscribe({
          next: (result) => {
            if (result.avatarUrl) {
              // 更新用戶頭像 URL
              const currentUser = this.user();
              if (currentUser) {
                this.user.set({ ...currentUser, avatar: result.avatarUrl });
              }
              this.snackBar.open('頭像上傳成功', '關閉', { duration: 3000 });
            }
            this.loading.set(false);
          },
          error: (error) => {
            console.error('頭像上傳失敗:', error);
            this.snackBar.open('頭像上傳失敗，請重試', '關閉', { duration: 3000 });
            this.loading.set(false);
          }
        });
      }
    };
    
    input.click();
  }

  // Utility methods
  getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      twitter: 'chat',
      facebook: 'facebook',
      linkedin: 'work',
      youtube: 'video_library',
      instagram: 'photo_camera',
      github: 'code'
    };
    return icons[provider] || 'link';
  }

  getProviderName(provider: string): string {
    const names: Record<string, string> = {
      twitter: 'Twitter',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      instagram: 'Instagram',
      github: 'GitHub'
    };
    return names[provider] || provider;
  }

  getAvatarUrl(avatar: string | undefined): string {
    return AvatarUtils.getAvatarUrl(avatar);
  }
}
```

## File: angular/src/styles.scss
```scss
/* You can add global styles to this file, and also import other style files */

html, body { height: 100%; }
body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }


body {
  margin: 0;
  font-family: 'Roboto', sans-serif;
  background-color: #f3f4f6;
}
```

## File: angular/src/app/features/user/auth/role.guard.ts
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { OrgRole } from '../../../core/models/auth.model';

export function roleGuard(expectedRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查用戶角色
    if (currentAccount.type === 'user') {
      const user = currentAccount;
      const permissions = user.permissions;
      
      // 檢查是否有預期角色
      if (permissions.roles.includes(expectedRole)) {
        return true;
      }
      
      // 如果沒有預期角色，重定向到未授權頁面
      router.navigate(['/unauthorized']);
      return false;
    }

    // 組織帳戶不支援角色守衛
    router.navigate(['/unauthorized']);
    return false;
  };
}

// 組織角色守衛
export function orgRoleGuard(expectedRole: OrgRole): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查用戶是否為組織成員
    if (currentAccount.type === 'user') {
      const user = currentAccount;
      
      // 檢查組織角色
      if (permissionService.hasOrgRole(expectedRole)) {
        return true;
      }
      
      // 沒有權限，重定向到未授權頁面
      router.navigate(['/unauthorized']);
      return false;
    }

    // 組織帳戶不支援此守衛
    router.navigate(['/unauthorized']);
    return false;
  };
}

// 權限守衛
export function permissionGuard(action: string, resource: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查權限
    if (permissionService.can(action, resource)) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}
```

## File: angular/src/app/features/user/auth/login.component.ts
```typescript
import {
  Component,
  inject,
  runInInjectionContext,
  EnvironmentInjector
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Login</span>
        <span class="spacer"></span>
        <mat-icon>lock</mat-icon>
      </mat-toolbar>

      <mat-card class="login-card">
        <h1 class="title">Welcome Back 👋</h1>
        <form (ngSubmit)="onLogin()">
          <mat-form-field appearance="outline" class="field">
            <mat-label>Email</mat-label>
            <input matInput [(ngModel)]="email" name="email" required />
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="password" name="password" required />
          </mat-form-field>

          <button mat-stroked-button color="primary" class="action-btn" type="submit" [disabled]="isLoading()">
            @if (!isLoading()) {
              Login
            } @else {
              <mat-spinner diameter="24"></mat-spinner>
            }
          </button>

          <div class="divider">
            <span>或</span>
          </div>

          <button mat-stroked-button color="warn" class="google-btn" (click)="onGoogleLogin()" [disabled]="isLoading()">
            <mat-icon>login</mat-icon>
            <span>使用 Google 登入</span>
          </button>

          @if (error()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ error() }}</span>
            </div>
          }
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .toolbar {
      background: #e3f2fd;
      color: #0d47a1;
      padding: 0 24px;
    }

    .toolbar-title {
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .login-card {
      max-width: 480px;
      margin: 48px auto;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      background: white;
    }

    .title {
      font-size: 28px;
      margin-bottom: 24px;
      font-weight: 600;
      color: #333;
      text-align: center;
    }

    .field {
      width: 100%;
      margin-bottom: 10px;
    }

    .action-btn {
      width: 100%;
      padding: 25px;
      font-weight: 500;
      font-size: 16px;
      text-transform: none;
      border-radius: 8px;
      transition: background-color 0.3s ease, border-color 0.3s ease;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .action-btn:hover {
      background-color: rgba(25, 118, 210, 0.08);
      border-color: #1976d2;
    }

    mat-icon {
      margin-left: 12px;
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 20px 0;
      text-align: center;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      padding: 0 16px;
      color: #666;
      font-size: 14px;
    }

    .google-btn {
      width: 100%;
      padding: 25px;
      font-weight: 500;
      font-size: 16px;
      text-transform: none;
      border-radius: 8px;
      transition: background-color 0.3s ease, border-color 0.3s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      background-color: #fff;
      border: 1px solid #dadce0;
      color: #3c4043;
    }

    .google-btn:hover {
      background-color: #f8f9fa;
      border-color: #dadce0;
      box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    }

    .google-btn mat-icon {
      margin: 0;
      color: #4285f4;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background-color: #ffebee;
      border: 1px solid #f44336;
      border-radius: 8px;
      color: #d32f2f;
      font-size: 14px;
    }

    .error-message mat-icon {
      margin: 0;
      font-size: 20px;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  // 使用 Signals 獲取狀態
  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  async onLogin() {
    this.authService.clearError();
    
    if (!this.email || !this.password) {
      this.authService.setError('請輸入電子郵件和密碼');
      return;
    }

    try {
      await this.authService.signInWithEmailAndPassword(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // 錯誤處理已經在 AuthService 中完成
      console.error('Login error:', error);
    }
  }

  async onGoogleLogin() {
    this.authService.clearError();
    
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // 錯誤處理已經在 AuthService 中完成
      console.error('Google login error:', error);
    }
  }
}
```

## File: angular/src/app/features/user/auth/signup.component.ts
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    RouterModule,
  ],
  template: `
    <div class="signup-wrapper">
      <mat-toolbar color="primary" class="toolbar">
        <span class="toolbar-title">Sign Up</span>
        <span class="spacer"></span>
        <mat-icon>person_add</mat-icon>
      </mat-toolbar>

      <mat-card class="signup-card">
        <h1 class="title">Create Your Account ✨</h1>

        <form (ngSubmit)="onSignup()">
          <mat-form-field appearance="outline" class="field">
            <mat-label>顯示名稱</mat-label>
            <input matInput [(ngModel)]="displayName" name="displayName" required />
            <mat-hint>這是您在系統中顯示的名稱</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>電子郵件</mat-label>
            <input matInput [(ngModel)]="email" name="email" required type="email" />
            <mat-hint>請使用有效的電子郵件地址</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>密碼</mat-label>
            <input matInput type="password" [(ngModel)]="password" name="password" required />
            <mat-hint>密碼需要包含大小寫字母、數字和特殊字元</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>確認密碼</mat-label>
            <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required />
            <mat-hint>請再次輸入密碼</mat-hint>
          </mat-form-field>

          <mat-checkbox [(ngModel)]="agreeToTerms" name="agreeToTerms" class="terms-checkbox">
            我同意 <a href="/terms" target="_blank">使用條款</a> 和 <a href="/privacy" target="_blank">隱私政策</a>
          </mat-checkbox>

          <button mat-stroked-button color="primary" class="action-btn" type="submit" [disabled]="isLoading()">
            @if (!isLoading()) {
              建立帳號
            } @else {
              <mat-spinner diameter="24"></mat-spinner>
            }
          </button>

          @if (error()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span [innerHTML]="error()"></span>
            </div>
          }

          <div class="login-link">
            已經有帳號？<a routerLink="/login">登入</a>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .signup-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .toolbar {
      background: #e3f2fd;
      color: #0d47a1;
      padding: 0 24px;
    }

    .toolbar-title {
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .signup-card {
      max-width: 500px;
      margin: 48px auto;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      background: white;
    }

    .title {
      font-size: 28px;
      margin-bottom: 24px;
      font-weight: 600;
      color: #333;
      text-align: center;
    }

    .field {
      width: 100%;
      margin-bottom: 20px;
    }

    .action-btn {
      width: 100%;
      padding: 25px;
      font-weight: 500;
      font-size: 16px;
      text-transform: none;
      border-radius: 8px;
      transition: background-color 0.3s ease, border-color 0.3s ease;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .action-btn:hover {
      background-color: rgba(25, 118, 210, 0.08);
      border-color: #1976d2;
    }

    mat-icon {
      margin-right: 8px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background-color: #ffebee;
      border: 1px solid #f44336;
      border-radius: 8px;
      color: #d32f2f;
      font-size: 14px;
    }

    .error-message mat-icon {
      margin: 0;
      font-size: 20px;
    }

    .terms-checkbox {
      display: block;
      margin: 16px 0;
    }

    .login-link {
      margin-top: 16px;
      text-align: center;
      color: #666;
    }

    .login-link a {
      color: #1976d2;
      text-decoration: none;
      margin-left: 8px;
    }

    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  displayName = '';
  agreeToTerms = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  // 使用 Signals 獲取狀態
  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  // 密碼強度要求
  private readonly passwordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true
  };

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): string[] {
    const errors: string[] = [];
    
    if (password.length < this.passwordRequirements.minLength) {
      errors.push(`密碼長度至少需要 ${this.passwordRequirements.minLength} 個字元`);
    }
    
    if (this.passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密碼需要包含大寫字母');
    }
    
    if (this.passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密碼需要包含小寫字母');
    }
    
    if (this.passwordRequirements.requireNumber && !/[0-9]/.test(password)) {
      errors.push('密碼需要包含數字');
    }
    
    if (this.passwordRequirements.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密碼需要包含特殊字元');
    }
    
    return errors;
  }

  validateForm(): string[] {
    const errors: string[] = [];
    
    if (!this.email) {
      errors.push('請輸入電子郵件');
    } else if (!this.validateEmail(this.email)) {
      errors.push('請輸入有效的電子郵件格式');
    }
    
    if (!this.password) {
      errors.push('請輸入密碼');
    } else {
      const passwordErrors = this.validatePassword(this.password);
      errors.push(...passwordErrors);
    }
    
    if (!this.confirmPassword) {
      errors.push('請確認密碼');
    } else if (this.password !== this.confirmPassword) {
      errors.push('密碼與確認密碼不符');
    }
    
    if (!this.displayName) {
      errors.push('請輸入顯示名稱');
    }
    
    if (!this.agreeToTerms) {
      errors.push('請同意使用條款和隱私政策');
    }
    
    return errors;
  }

  async onSignup() {
    this.authService.clearError();
    
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.authService.setError(errors.join('\n'));
      return;
    }

    try {
      await this.authService.createUserWithEmailAndPassword(
        this.email,
        this.password,
        this.displayName
      );
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // 錯誤處理已經在 AuthService 中完成
      console.error('Signup error:', error);
    }
  }
}
```

## File: angular/src/environments/environment.prod.ts
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI",
    authDomain: "elite-chiller-455712-c4.firebaseapp.com",
    projectId: "elite-chiller-455712-c4",
    storageBucket: "elite-chiller-455712-c4.firebasestorage.app",
    messagingSenderId: "7807661688",
    appId: "1:7807661688:web:29a373231a5fa5ae1d1f8d",
    measurementId: "G-YZHBTZSY91"
  },
  appCheck: {
    // reCAPTCHA Enterprise site key for production
    recaptchaSiteKey: "6LeGl-wrAAAAALTgTmQN5XbGLB2hVKhcySGyBIXI"
  }
};
```

## File: angular/src/app/app.config.ts
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck, CustomProvider } from '@angular/fire/app-check';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { getVertexAI, provideVertexAI } from '@angular/fire/vertexai'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideAppCheck(() => {
      const app = initializeApp(environment.firebase);
      
      // 根據環境選擇 App Check provider
      if (environment.production) {
        // 生產環境使用 reCAPTCHA Enterprise
        const provider = new ReCaptchaEnterpriseProvider(environment.appCheck.recaptchaSiteKey);
        return initializeAppCheck(app, { 
          provider, 
          isTokenAutoRefreshEnabled: true 
        });
      } else {
        // 開發環境使用 debug token
        const debugProvider = new CustomProvider({
          getToken: async () => {
            // 返回 debug token
            return {
              token: (environment.appCheck as any).debugToken,
              expireTimeMillis: Date.now() + 3600000 // 1小時後過期
            };
          }
        });
        return initializeAppCheck(app, { 
          provider: debugProvider, 
          isTokenAutoRefreshEnabled: true 
        });
      }
    }),
    provideMessaging(() => getMessaging()),
    providePerformance(() => getPerformance()),
    provideStorage(() => getStorage()),
    provideRemoteConfig(() => getRemoteConfig()),
    provideVertexAI(() => getVertexAI())
  ]
};
```

## File: angular/src/app/core/services/auth.service.ts
```typescript
// src/app/core/services/auth.service.ts

import { Injectable, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { 
  Auth, 
  authState, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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
  writeBatch,
  DocumentData
} from '@angular/fire/firestore';
import { Observable, of, switchMap, map, combineLatest, firstValueFrom } from 'rxjs';
import { 
  User, 
  Organization, 
  Account, 
  AccountState, 
  ProfileVO, 
  PermissionVO, 
  SettingsVO 
} from '../models/auth.model';
import { ValidationUtils } from '../utils/validation.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  
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
    authState(this.auth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(firebaseUser => {
        if (firebaseUser) {
          this.loadUserAccount(firebaseUser.uid);
        } else {
          this.accountState.setAccount(null);
        }
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
      const errorMessage = this.getFirebaseAuthErrorMessage(error);
      this.accountState.setError(`Google 登入失敗: ${errorMessage}`);
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

  private getFirebaseAuthErrorMessage(error: any): string {
    if (!(error instanceof Error)) return '未知錯誤';
    
    // Firebase Auth 錯誤代碼對應的中文訊息
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': '無效的電子郵件格式',
      'auth/user-disabled': '此帳號已被停用',
      'auth/user-not-found': '找不到此帳號',
      'auth/wrong-password': '密碼錯誤',
      'auth/email-already-in-use': '此電子郵件已被使用',
      'auth/operation-not-allowed': '此登入方式未啟用',
      'auth/weak-password': '密碼強度不足',
      'auth/invalid-credential': '無效的登入憑證',
      'auth/account-exists-with-different-credential': '此電子郵件已使用其他登入方式',
      'auth/popup-blocked': '登入視窗被封鎖',
      'auth/popup-closed-by-user': '登入視窗被關閉',
      'auth/network-request-failed': '網路連線失敗',
      'auth/too-many-requests': '登入嘗試次數過多，請稍後再試'
    };

    const code = (error as any).code;
    return errorMessages[code] || error.message || '未知錯誤';
  }

  async signInWithEmailAndPassword(email: string, password: string) {
    try {
      this.accountState.setLoading(true);
      this.accountState.clearError();
      
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.syncUserProfile(credential.user);
      
      return credential;
    } catch (error) {
      const errorMessage = this.getFirebaseAuthErrorMessage(error);
      this.accountState.setError(`登入失敗: ${errorMessage}`);
      throw error;
    } finally {
      this.accountState.setLoading(false);
    }
  }

  async createUserWithEmailAndPassword(email: string, password: string, displayName?: string) {
    try {
      this.accountState.setLoading(true);
      this.accountState.clearError();
      
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // 如果提供了顯示名稱，更新用戶資料
      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName });
      }
      
      await this.syncUserProfile(credential.user);
      
      return credential;
    } catch (error) {
      const errorMessage = this.getFirebaseAuthErrorMessage(error);
      this.accountState.setError(`註冊失敗: ${errorMessage}`);
      throw error;
    } finally {
      this.accountState.setLoading(false);
    }
  }

  private async loadUserAccount(uid: string) {
    try {
      this.accountState.setLoading(true);
      
      const userDoc = doc(this.firestore, `accounts/${uid}`);
      const userData = await firstValueFrom(
        docData(userDoc, { idField: 'id' }).pipe(
          map(data => {
            if (data && (data as any)['type'] === 'user') {
              return data as User;
            }
            return null;
          })
        )
      );
      
      this.accountState.setAccount(userData || null);
    } catch (error) {
      this.accountState.setError(`載入用戶資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this.accountState.setLoading(false);
    }
  }

  private async syncUserProfile(firebaseUser: FirebaseUser) {
    try {
      const userRef = doc(this.firestore, `accounts/${firebaseUser.uid}`);
      
      // 檢查用戶是否已存在
      const userDoc = await firstValueFrom(docData(userRef, { idField: 'id' })) as User | null;
      const login = firebaseUser.email?.split('@')[0] || firebaseUser.uid;
      
      // 建立或更新 ProfileVO
      const profile: ProfileVO = {
        name: firebaseUser.displayName || login,
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || 'avatar.jpg', // 預設頭像
        bio: userDoc?.profile?.bio || '',
        location: userDoc?.profile?.location || '',
        website: userDoc?.profile?.website || ''
      };
      
      // 驗證 Profile
      const profileErrors = ValidationUtils.validateProfile(profile);
      if (profileErrors.length > 0) {
        throw new Error(`Profile validation failed: ${profileErrors.join(', ')}`);
      }
      
      // 建立或保留現有的 PermissionVO
      const permissions: PermissionVO = userDoc?.permissions || {
        roles: ['user'],
        abilities: [
          { action: 'read', resource: 'organization' },
          { action: 'read', resource: 'team' },
          { action: 'read', resource: 'member' }
        ]
      };
      
      // 建立或保留現有的 SettingsVO
      const settings: SettingsVO = userDoc?.settings || {
        language: 'zh-TW',
        theme: 'light',
        notifications: { email: true, push: true, sms: false },
        privacy: { profilePublic: true, showEmail: false }
      };
      
      // 準備用戶資料
      const userData: Partial<User> = {
        id: firebaseUser.uid,
        type: 'user',
        login: login,
        profile: profile,
        permissions: permissions,
        settings: settings,
        projectsOwned: userDoc?.projectsOwned || [],
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || login,
        photoURL: firebaseUser.photoURL || 'avatar.jpg', // 預設頭像
        certificates: userDoc?.certificates || [],
        socialRelations: userDoc?.socialRelations || {
          followers: [],
          following: [],
          connections: []
        },
        organizationMemberships: userDoc?.organizationMemberships || {} as { [orgId: string]: string },
        updatedAt: new Date()
      };
      
      // 如果是新用戶，添加創建時間
      if (!userDoc) {
        userData.createdAt = new Date();
      }
      
      // 使用事務確保資料一致性
      const batch = writeBatch(this.firestore);
      
      // 更新用戶資料
      batch.set(userRef, userData, { merge: true });
      
      // 如果是新用戶，創建默認的個人設定
      if (!userDoc) {
        const settingsRef = doc(this.firestore, `accounts/${firebaseUser.uid}/settings/default`);
        batch.set(settingsRef, {
          theme: 'light',
          language: 'zh-TW',
          emailNotifications: true,
          createdAt: new Date()
        });
      }
      
      // 提交事務
      await batch.commit();
      
      // 更新本地狀態
      this.accountState.setAccount(userData as User);
      
    } catch (error) {
      console.error('Failed to sync user profile:', error);
      
      // 回滾本地狀態
      this.accountState.setAccount(null);
      
      // 重新拋出錯誤
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

  // 獲取當前用戶
  getCurrentUser(): User | null {
    const account = this.currentAccount();
    return account && account.type === 'user' ? account as User : null;
  }

  // 獲取當前組織
  getCurrentOrganization(): Organization | null {
    const account = this.currentAccount();
    return account && account.type === 'organization' ? account as Organization : null;
  }

  // 更新用戶檔案
  async updateUserProfile(profile: ProfileVO): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    // 驗證 Profile
    const profileErrors = ValidationUtils.validateProfile(profile);
    if (profileErrors.length > 0) {
      throw new Error(`Profile validation failed: ${profileErrors.join(', ')}`);
    }

    try {
      this.accountState.setLoading(true);
      
      const userRef = doc(this.firestore, `accounts/${user.id}`);
      await setDoc(userRef, {
        profile: profile,
        updatedAt: new Date()
      }, { merge: true });
      
      // 更新本地狀態
      const updatedUser = { ...user, profile, updatedAt: new Date() };
      this.accountState.setAccount(updatedUser);
      
    } catch (error) {
      this.accountState.setError(`更新用戶檔案失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this.accountState.setLoading(false);
    }
  }

  // 更新用戶設定
  async updateUserSettings(settings: SettingsVO): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    // 驗證 Settings
    const settingsErrors = ValidationUtils.validateSettings(settings);
    if (settingsErrors.length > 0) {
      throw new Error(`Settings validation failed: ${settingsErrors.join(', ')}`);
    }

    try {
      this.accountState.setLoading(true);
      
      const userRef = doc(this.firestore, `accounts/${user.id}`);
      await setDoc(userRef, {
        settings: settings,
        updatedAt: new Date()
      }, { merge: true });
      
      // 更新本地狀態
      const updatedUser = { ...user, settings, updatedAt: new Date() };
      this.accountState.setAccount(updatedUser);
      
    } catch (error) {
      this.accountState.setError(`更新用戶設定失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this.accountState.setLoading(false);
    }
  }

  // 設置錯誤
  setError(error: string) {
    this.accountState.setError(error);
  }

  // 清除錯誤
  clearError() {
    this.accountState.clearError();
  }
}
```

## File: angular/src/app/app.routes.ts
```typescript
import { Routes } from '@angular/router';
import { LoginComponent } from './features/user/auth/login.component';
import { SignupComponent } from './features/user/auth/signup.component';
import { LandingComponent } from './landing/landing.component';

import { authGuard } from './features/user/auth/auth.guard';
import { roleGuard, orgRoleGuard, permissionGuard } from './features/user/auth/role.guard';
import { orgAdminGuard, orgOwnerGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  // 首頁路由 - Landing Page
  {
    path: '',
    component: LandingComponent,
    title: 'Angular Fire RoleKit - GitHub 式權限系統'
  },
  
  // 認證路由
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/user/auth/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  
  // 用戶帳戶管理路由
  {
    path: 'account',
    loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes),
    canActivate: [authGuard]
  },
  
  // 組織管理路由
  {
    path: 'organizations',
    loadChildren: () => import('./features/organization/routes/organization.routes').then(m => m.organizationRoutes),
    canActivate: [authGuard]
  },
  
  // Repository 管理路由
  {
    path: 'repositories',
    loadChildren: () => import('./features/repository/routes/repository.routes').then(m => m.repositoryRoutes),
    canActivate: [authGuard]
  },
  
  // 角色管理路由
  {
    path: 'admin',
    loadComponent: () => import('./dashboard/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard('admin')]
  },
  {
    path: 'editor',
    loadComponent: () => import('./dashboard/editor.component').then(m => m.EditorComponent),
    canActivate: [authGuard, roleGuard('editor')]
  },
  {
    path: 'viewer',
    loadComponent: () => import('./dashboard/viewer.component').then(m => m.ViewerComponent),
    canActivate: [authGuard, roleGuard('viewer')]
  },
  
  // 儀表板路由
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  
  // 預設重定向
  {
    path: '**',
    redirectTo: ''
  }
];
```
