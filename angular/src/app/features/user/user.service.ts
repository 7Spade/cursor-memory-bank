import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
 * 用戶服務 - 對齊 GitHub Account API 設計
 * 實作完整的用戶管理功能
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  // ==================== 用戶管理 API ====================
  
  /**
   * 獲取當前用戶資訊 (對齊 GitHub: GET /user)
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user`);
  }

  /**
   * 獲取指定用戶資訊 (對齊 GitHub: GET /users/{username})
   */
  getUser(username: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${username}`);
  }

  /**
   * 更新當前用戶資訊 (對齊 GitHub: PATCH /user)
   */
  updateUser(updates: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/user`, updates);
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
   * 上傳頭像
   */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ avatarUrl: string }>(`${this.baseUrl}/user/avatar`, formData);
  }

  /**
   * 刪除頭像
   */
  deleteAvatar(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/avatar`);
  }
}

// 導入 map 操作符
import { map } from 'rxjs/operators';
