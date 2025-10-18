import { OrgRole, TeamRole } from '../../core/models/auth.model';

/**
 * 組織數據模型
 * 單一職責：組織數據結構定義
 */
export interface OrganizationModel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  website?: string;
  location?: string;
  type: 'organization';
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  teamCount: number;
  repositoryCount: number;
  isPublic: boolean;
}

/**
 * 組織建立請求模型
 */
export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  location?: string;
  isPublic?: boolean;
}

/**
 * 組織更新請求模型
 */
export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  website?: string;
  location?: string;
  isPublic?: boolean;
}

/**
 * 組織統計模型
 */
export interface OrganizationStats {
  memberCount: number;
  teamCount: number;
  repositoryCount: number;
  activeMembers: number;
  recentActivity: number;
}

/**
 * 組織設定模型
 */
export interface OrganizationSettings {
  defaultMemberRole: OrgRole;
  visibility: 'public' | 'private';
  allowMemberInvites: boolean;
  requireTwoFactorAuth: boolean;
  allowRepositoryCreation: boolean;
  allowTeamCreation: boolean;
}

/**
 * 組織驗證結果模型
 */
export interface OrganizationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 組織搜尋結果模型
 */
export interface OrganizationSearchResult {
  organizations: OrganizationModel[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * 組織過濾器模型
 */
export interface OrganizationFilter {
  search?: string;
  type?: 'public' | 'private';
  sortBy?: 'name' | 'createdAt' | 'memberCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
