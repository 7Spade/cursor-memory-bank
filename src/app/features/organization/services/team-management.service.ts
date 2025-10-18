import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData, addDoc, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Team, TeamMember, TeamRole } from '../../../core/models/auth.model';
import { ValidationUtils } from '../../../core/utils/validation.utils';

/**
 * 團隊管理服務
 * 單一職責：團隊 CRUD 操作
 */
@Injectable({ providedIn: 'root' })
export class TeamManagementService {
  private firestore = inject(Firestore);

  // Signals for state management
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _teams = signal<Team[]>([]);

  // Readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly teams = this._teams.asReadonly();

  // Computed signals
  readonly hasTeams = computed(() => this._teams().length > 0);

  /**
   * 建立團隊
   */
  async createTeam(
    orgId: string,
    name: string,
    slug: string,
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

      // 驗證團隊 slug
      const slugValidation = ValidationUtils.validateTeamSlug(slug);
      if (!slugValidation.isValid) {
        throw new Error(`團隊 slug 驗證失敗: ${slugValidation.errors.join(', ')}`);
      }

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
    } catch (error) {
      this._error.set(`創建團隊失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 取得組織的所有團隊
   */
  getOrganizationTeams(orgId: string): Observable<Team[]> {
    const teamsCol = collection(this.firestore, `accounts/${orgId}/teams`);
    return collectionData(teamsCol, { idField: 'id' }) as Observable<Team[]>;
  }

  /**
   * 取得團隊詳情
   */
  getTeam(orgId: string, teamId: string): Observable<Team | undefined> {
    const teamDoc = doc(this.firestore, `accounts/${orgId}/teams/${teamId}`);
    return docData(teamDoc, { idField: 'id' }) as Observable<Team | undefined>;
  }

  /**
   * 更新團隊
   */
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

  /**
   * 刪除團隊
   */
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

  /**
   * 取得團隊成員
   */
  getTeamMembers(orgId: string, teamId: string): Observable<TeamMember[]> {
    const membersCol = collection(
      this.firestore, 
      `accounts/${orgId}/teams/${teamId}/members`
    );
    return collectionData(membersCol, { idField: 'id' }) as Observable<TeamMember[]>;
  }

  /**
   * 新增團隊成員
   */
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
      this._error.set(`添加團隊成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 更新團隊成員角色
   */
  async updateTeamMemberRole(
    orgId: string,
    teamId: string,
    userId: string,
    newRole: TeamRole
  ): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const memberRef = doc(
        this.firestore,
        `accounts/${orgId}/teams/${teamId}/members/${userId}`
      );
      await updateDoc(memberRef, { role: newRole });
    } catch (error) {
      this._error.set(`更新團隊成員角色失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 移除團隊成員
   */
  async removeTeamMember(
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
      this._error.set(`移除團隊成員失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 清除錯誤
   */
  clearError(): void {
    this._error.set(null);
  }
}
