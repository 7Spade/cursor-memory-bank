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
import { Observable, map, switchMap, combineLatest, of, catchError, throwError } from 'rxjs';
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
        avatar: 'https://firebasestorage.googleapis.com/v0/b/elite-chiller-455712-c4.firebasestorage.app/o/avatar.jpg?alt=media&token=e1474080-6528-4f01-a719-411ea3447060',
        bio: description || '',
        location: '',
        website: ''
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
        description: description || '',
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

  getOrganization(orgId: string): Observable<Organization> {
    const orgDoc = doc(this.firestore, `accounts/${orgId}`);
    return docData(orgDoc, { idField: 'id' }).pipe(
      map(data => {
        if (data && (data as DocumentData)['type'] === 'organization') {
          return data as Organization;
        }
        throw new Error(`組織不存在或類型不正確: ${orgId}`);
      }),
      catchError((error: any) => {
        console.error('獲取組織失敗:', error);
        return throwError(() => new Error('無法載入組織資訊，請稍後再試'));
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
        invitedBy: invitedBy || '系統自動添加'
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