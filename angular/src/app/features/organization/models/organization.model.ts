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
