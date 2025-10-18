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
          if (data && (data as any)['type'] === 'user') {
            return data as User;
          }
          return null;
        })
      ).toPromise();
      
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