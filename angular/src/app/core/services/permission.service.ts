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
