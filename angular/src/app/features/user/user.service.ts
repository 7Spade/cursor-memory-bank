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

