import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData, addDoc, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { OrganizationMember, TeamMember, OrgRole, TeamRole } from '../../../core/models/auth.model';
import { ValidationUtils } from '../../../core/utils/validation.utils';

/**
 * 成員管理服務
 * 單一職責：成員管理操作
 */
@Injectable({ providedIn: 'root' })
export class MemberManagementService {
  private firestore = inject(Firestore);

  // Signals for state management
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _members = signal<OrganizationMember[]>([]);

  // Readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly members = this._members.asReadonly();

  // Computed signals
  readonly hasMembers = computed(() => this._members().length > 0);
  readonly memberCount = computed(() => this._members().length);

  /**
   * 邀請成員加入組織
   */
  async inviteMember(
    orgId: string,
    email: string,
    role: OrgRole = OrgRole.MEMBER,
    invitedBy?: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 驗證電子郵件
      if (!ValidationUtils.validateEmail(email)) {
        throw new Error('無效的電子郵件格式');
      }

      // 建立邀請記錄
      const invitationRef = await addDoc(
        collection(this.firestore, `accounts/${orgId}/invitations`),
        {
          email,
          role,
          invitedBy,
          invitedAt: new Date(),
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天後過期
        }
      );

      // TODO: 發送邀請郵件
      console.log('邀請已發送:', invitationRef.id);
    } catch (error) {
      this._error.set(`邀請成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 接受邀請
   */
  async acceptInvitation(
    orgId: string,
    invitationId: string,
    userId: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 取得邀請詳情
      const invitationDoc = doc(this.firestore, `accounts/${orgId}/invitations/${invitationId}`);
      const invitationData = await docData(invitationDoc).toPromise();

      if (!invitationData) {
        throw new Error('邀請不存在');
      }

      // 添加成員到組織
      const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
      await setDoc(memberRef, {
        id: userId,
        organizationId: orgId,
        userId,
        role: invitationData['role'],
        joinedAt: new Date(),
        invitedBy: invitationData['invitedBy']
      });

      // 更新邀請狀態
      await updateDoc(invitationDoc, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: userId
      });
    } catch (error) {
      this._error.set(`接受邀請失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 拒絕邀請
   */
  async rejectInvitation(
    orgId: string,
    invitationId: string,
    userId: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const invitationDoc = doc(this.firestore, `accounts/${orgId}/invitations/${invitationId}`);
      await updateDoc(invitationDoc, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: userId
      });
    } catch (error) {
      this._error.set(`拒絕邀請失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
   * 移除成員
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(this.firestore, `accounts/${orgId}/members/${userId}`);
      await deleteDoc(memberRef);
    } catch (error) {
      this._error.set(`移除成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 將成員添加到團隊
   */
  async addMemberToTeam(
    orgId: string,
    teamId: string,
    userId: string,
    role: TeamRole = TeamRole.MEMBER,
    addedBy?: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

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
    } catch (error) {
      this._error.set(`添加成員到團隊失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 從團隊移除成員
   */
  async removeMemberFromTeam(
    orgId: string,
    teamId: string,
    userId: string
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(
        this.firestore,
        `accounts/${orgId}/teams/${teamId}/members/${userId}`
      );
      await deleteDoc(memberRef);
    } catch (error) {
      this._error.set(`從團隊移除成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 取得成員的團隊列表
   */
  getMemberTeams(orgId: string, userId: string): Observable<TeamMember[]> {
    // 這裡需要查詢所有團隊，然後過濾出包含該成員的團隊
    // 為了簡化，返回空數組
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  /**
   * 清除錯誤
   */
  clearError(): void {
    this._error.set(null);
  }
}
