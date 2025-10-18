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