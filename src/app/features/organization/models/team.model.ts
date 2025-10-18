import { TeamRole } from '../../core/models/auth.model';

/**
 * 團隊數據模型
 * 單一職責：團隊數據結構定義
 */
export interface TeamModel {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  repositoryCount: number;
  isPublic: boolean;
  parentTeamId?: string;
  permissions: TeamPermissions;
}

/**
 * 團隊權限模型
 */
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

/**
 * 團隊建立請求模型
 */
export interface CreateTeamRequest {
  name: string;
  slug: string;
  description?: string;
  isPublic?: boolean;
  parentTeamId?: string;
  permissions?: Partial<TeamPermissions>;
}

/**
 * 團隊更新請求模型
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  permissions?: Partial<TeamPermissions>;
}

/**
 * 團隊成員模型
 */
export interface TeamMemberModel {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  addedBy?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

/**
 * 團隊統計模型
 */
export interface TeamStats {
  memberCount: number;
  repositoryCount: number;
  activeMembers: number;
  recentActivity: number;
}

/**
 * 團隊層級模型
 */
export interface TeamHierarchy {
  team: TeamModel;
  children: TeamHierarchy[];
  level: number;
  parent?: TeamHierarchy;
}

/**
 * 團隊搜尋結果模型
 */
export interface TeamSearchResult {
  teams: TeamModel[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * 團隊過濾器模型
 */
export interface TeamFilter {
  search?: string;
  isPublic?: boolean;
  parentTeamId?: string;
  sortBy?: 'name' | 'createdAt' | 'memberCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 團隊驗證結果模型
 */
export interface TeamValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
