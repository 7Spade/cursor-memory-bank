// Account 與權限模型（GitHub 對齊）

export interface Account {
  id: string;
  type: 'user' | 'organization';
  login: string; // 唯一識別 (username/org-slug)
  name: string;
  avatarURL?: string;
  email?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Account {
  type: 'user';
  uid: string; // Firebase Auth UID
  displayName: string;
  photoURL?: string;
}

export interface Organization extends Account {
  type: 'organization';
  description?: string;
  ownerId: string; // 組織擁有者
  settings: {
    defaultMemberRole: OrgRole;
    visibility: 'public' | 'private';
  };
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

export enum OrgRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  BILLING = 'billing',
  OUTSIDE_COLLABORATOR = 'outside_collaborator'
}

export enum TeamRole {
  MAINTAINER = 'maintainer',
  MEMBER = 'member'
}

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

export interface ACLAbility {
  action: string; // 'read', 'write', 'delete', 'admin'
  resource: string; // 'organization', 'team', 'repository', 'member'
}


