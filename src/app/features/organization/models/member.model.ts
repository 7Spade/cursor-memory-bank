import { OrgRole, TeamRole } from '../../core/models/auth.model';

/**
 * 成員數據模型
 * 單一職責：成員數據結構定義
 */
export interface MemberModel {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: Date;
  invitedBy?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    isActive: boolean;
    lastActiveAt?: Date;
  };
  teams?: TeamMemberModel[];
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
 * 成員邀請模型
 */
export interface MemberInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrgRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  acceptedAt?: Date;
  acceptedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
}

/**
 * 成員邀請請求模型
 */
export interface InviteMemberRequest {
  email: string;
  role: OrgRole;
  message?: string;
  teamIds?: string[];
}

/**
 * 成員角色變更請求模型
 */
export interface ChangeMemberRoleRequest {
  userId: string;
  newRole: OrgRole;
  reason?: string;
}

/**
 * 成員統計模型
 */
export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  membersByRole: {
    [key in OrgRole]: number;
  };
  recentJoins: number;
  recentLeaves: number;
}

/**
 * 成員活動模型
 */
export interface MemberActivity {
  id: string;
  memberId: string;
  action: 'joined' | 'left' | 'role_changed' | 'team_added' | 'team_removed';
  description: string;
  timestamp: Date;
  performedBy?: string;
  metadata?: Record<string, any>;
}

/**
 * 成員搜尋結果模型
 */
export interface MemberSearchResult {
  members: MemberModel[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * 成員過濾器模型
 */
export interface MemberFilter {
  search?: string;
  role?: OrgRole;
  isActive?: boolean;
  teamId?: string;
  sortBy?: 'name' | 'joinedAt' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 成員驗證結果模型
 */
export interface MemberValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 成員權限模型
 */
export interface MemberPermissions {
  canManageMembers: boolean;
  canManageTeams: boolean;
  canManageOrganization: boolean;
  canCreateRepositories: boolean;
  canInviteMembers: boolean;
  canDeleteOrganization: boolean;
}
