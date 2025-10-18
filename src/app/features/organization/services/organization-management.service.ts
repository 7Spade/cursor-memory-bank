import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData, query, where, addDoc, setDoc, updateDoc, deleteDoc, getDoc } from '@angular/fire/firestore';
import { Observable, map, switchMap, combineLatest, from, of } from 'rxjs';
import { Organization, OrganizationMember, Team, TeamMember, OrgRole, TeamRole } from '../../../core/models/auth.model';
import { ValidationUtils } from '../../../core/utils/validation.utils';

/**
 * 組織管理服務
 * 單一職責：組織 CRUD 操作
 */
@Injectable({ providedIn: 'root' })
export class OrganizationManagementService {
  private firestore = inject(Firestore);

  // Signals for state management
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _organizations = signal<Organization[]>([]);

  // Readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly organizations = this._organizations.asReadonly();

  // Computed signals
  readonly hasOrganizations = computed(() => this._organizations().length > 0);

  /**
   * 建立組織
   */
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
      const profile = {
        name: name,
        email: '', // 組織沒有電子郵件
        avatar: undefined,
        bio: description,
        location: undefined,
        website: undefined
      };

      // 建立 PermissionVO
      const permissions = {
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
      const settings = {
        language: 'zh-TW',
        theme: 'light' as const,
        notifications: { email: true, push: true, sms: false },
        privacy: { profilePublic: true, showEmail: false },
        organization: {
          defaultMemberRole: OrgRole.MEMBER,
          visibility: 'private' as const
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
      this._error.set(`創建組織失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 取得組織詳情
   */
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

  /**
   * 取得用戶的所有組織
   */
  getUserOrganizations(userId: string): Observable<Organization[]> {
    const membersCol = collection(this.firestore, 'accounts');
    const q = query(membersCol, where('type', '==', 'organization'));
    
    return collectionData(q, { idField: 'id' }).pipe(
      map(orgs => orgs as Organization[])
    );
  }

  /**
   * 更新組織
   */
  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const orgRef = doc(this.firestore, `accounts/${orgId}`);
      await updateDoc(orgRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      this._error.set(`更新組織失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 刪除組織
   */
  async deleteOrganization(orgId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const orgRef = doc(this.firestore, `accounts/${orgId}`);
      await deleteDoc(orgRef);
    } catch (error) {
      this._error.set(`刪除組織失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 取得組織成員列表
   */
  getOrganizationMembers(orgId: string): Observable<OrganizationMember[]> {
    const membersCol = collection(this.firestore, `accounts/${orgId}/members`);
    return collectionData(membersCol, { idField: 'id' }) as Observable<OrganizationMember[]>;
  }

  /**
   * 新增組織成員
   */
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

  /**
   * 更新成員角色
   */
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

  /**
   * 移除組織成員
   */
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

  /**
   * 檢查用戶在組織中的角色
   */
  async getUserOrgRole(orgId: string, userId: string): Promise<OrgRole | null> {
    const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
    const memberSnap = await getDoc(memberRef);
    
    if (!memberSnap.exists()) return null;
    
    const data = memberSnap.data() as OrganizationMember;
    return data.role;
  }

  /**
   * 清除錯誤
   */
  clearError(): void {
    this._error.set(null);
  }
}
