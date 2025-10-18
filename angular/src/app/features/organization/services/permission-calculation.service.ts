import { Injectable, signal, computed } from '@angular/core';
import { 
  GitHubAlignedOrganization, 
  Team, 
  SecurityManager, 
  OrganizationRole, 
  PermissionResult 
} from '../models/github-aligned-organization.model';

/**
 * 權限計算服務
 * 實作混合權限系統：結合遞迴計算和選擇性快取
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionCalculationService {
  private permissionCache = new Map<string, PermissionResult>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分鐘快取

  // 使用 signals 進行響應式狀態管理
  private _organizations = signal<GitHubAlignedOrganization[]>([]);
  private _currentOrganization = signal<GitHubAlignedOrganization | null>(null);
  private _teams = signal<Team[]>([]);
  private _securityManagers = signal<SecurityManager[]>([]);
  private _organizationRoles = signal<OrganizationRole[]>([]);

  // 公開的只讀 signals
  readonly organizations = this._organizations.asReadonly();
  readonly currentOrganization = this._currentOrganization.asReadonly();
  readonly teams = this._teams.asReadonly();
  readonly securityManagers = this._securityManagers.asReadonly();
  readonly organizationRoles = this._organizationRoles.asReadonly();

  // 計算屬性
  readonly teamHierarchy = computed(() => this.buildTeamHierarchy(this.teams()));

  /**
   * 主要權限檢查方法
   */
  async checkPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<boolean> {
    const cacheKey = `${userId}:${resourceId}:${action}`;
    
    // 檢查快取
    if (this.isCacheValid(cacheKey)) {
      return this.permissionCache.get(cacheKey)!.granted;
    }
    
    // 計算權限
    const result = await this.calculatePermission(userId, resourceId, action);
    
    // 更新快取
    this.updateCache(cacheKey, result);
    
    return result.granted;
  }

  /**
   * 遞迴權限計算
   */
  private async calculatePermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    // 1. 檢查直接權限
    const directPermission = await this.checkDirectPermission(userId, resourceId, action);
    if (directPermission.granted) {
      return directPermission;
    }
    
    // 2. 檢查團隊繼承權限
    const teamPermission = await this.checkTeamInheritedPermission(userId, resourceId, action);
    if (teamPermission.granted) {
      return teamPermission;
    }
    
    // 3. 檢查組織角色權限
    const rolePermission = await this.checkOrganizationRolePermission(userId, resourceId, action);
    if (rolePermission.granted) {
      return rolePermission;
    }
    
    // 4. 檢查安全管理器權限
    const securityPermission = await this.checkSecurityManagerPermission(userId, resourceId, action);
    
    return securityPermission;
  }

  /**
   * 檢查直接權限
   */
  private async checkDirectPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const org = this._currentOrganization();
    if (!org) {
      return { granted: false, reason: 'No organization context' };
    }

    // 檢查是否為組織擁有者
    if (org.members.some(member => member.userId === userId && member.role.level === 10)) {
      return { granted: true, level: 'admin', reason: 'Organization owner' };
    }

    // 檢查直接成員權限
    const member = org.members.find(m => m.userId === userId);
    if (member && member.status === 'active') {
      const hasPermission = member.role.permissions.some(
        p => p.resource === resourceId && p.action === action
      );
      if (hasPermission) {
        return { 
          granted: true, 
          level: this.mapRoleLevelToPermission(member.role.level),
          reason: 'Direct member permission' 
        };
      }
    }

    return { granted: false, reason: 'No direct permission' };
  }

  /**
   * 檢查團隊繼承權限
   */
  private async checkTeamInheritedPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const teams = this._teams();
    const userTeams = teams.filter(team => 
      team.members.some(member => member.userId === userId)
    );

    for (const team of userTeams) {
      const teamPermission = await this.calculateTeamPermissions(userId, team.id, action);
      if (teamPermission.granted) {
        return teamPermission;
      }
    }

    return { granted: false, reason: 'No team permission found' };
  }

  /**
   * 計算團隊權限
   */
  private async calculateTeamPermissions(
    userId: string, 
    teamId: string, 
    action: string
  ): Promise<PermissionResult> {
    const team = this._teams().find(t => t.id === teamId);
    if (!team) {
      return { granted: false, reason: 'Team not found' };
    }

    // 檢查直接團隊成員權限
    const teamMember = team.members.find(member => member.userId === userId);
    if (teamMember) {
      const permissionLevel = this.mapTeamRoleToPermission(teamMember.role);
      return this.applyTeamPermissionLevel(
        { granted: true, level: permissionLevel, reason: 'Team member' },
        team.permission
      );
    }

    // 檢查父團隊繼承權限
    if (team.parentTeamId) {
      const parentPermission = await this.calculateTeamPermissions(userId, team.parentTeamId, action);
      if (parentPermission.granted) {
        // 父團隊權限會降級一級
        return this.downgradePermissionLevel(parentPermission);
      }
    }

    return { granted: false, reason: 'No team permission found' };
  }

  /**
   * 檢查組織角色權限
   */
  private async checkOrganizationRolePermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const org = this._currentOrganization();
    if (!org) {
      return { granted: false, reason: 'No organization context' };
    }

    const member = org.members.find(m => m.userId === userId);
    if (!member || member.status !== 'active') {
      return { granted: false, reason: 'Not an active member' };
    }

    const role = this._organizationRoles().find(r => r.id === member.role.id);
    if (!role) {
      return { granted: false, reason: 'Role not found' };
    }

    const hasPermission = role.permissions.some(
      p => p.resource === resourceId && p.action === action
    );

    if (hasPermission) {
      return {
        granted: true,
        level: this.mapRoleLevelToPermission(role.level),
        reason: 'Organization role permission'
      };
    }

    return { granted: false, reason: 'No role permission' };
  }

  /**
   * 檢查安全管理器權限
   */
  private async checkSecurityManagerPermission(
    userId: string, 
    resourceId: string, 
    action: string
  ): Promise<PermissionResult> {
    const securityManagers = this._securityManagers();
    const userSecurityRole = securityManagers.find(
      sm => sm.type === 'user' && sm.entityId === userId
    );

    if (!userSecurityRole) {
      return { granted: false, reason: 'Not a security manager' };
    }

    // 檢查安全管理器權限範圍
    const scopePermission = await this.checkSecurityScope(userSecurityRole, resourceId);
    if (!scopePermission) {
      return { granted: false, reason: 'Outside security scope' };
    }

    // 檢查特定安全管理權限
    const specificPermission = await this.checkSpecificSecurityPermission(
      userSecurityRole, 
      action
    );

    return specificPermission;
  }

  /**
   * 檢查安全管理器權限範圍
   */
  private async checkSecurityScope(
    securityRole: SecurityManager, 
    resourceId: string
  ): Promise<boolean> {
    switch (securityRole.type) {
      case 'user':
        return await this.checkUserSecurityScope(securityRole.entityId, resourceId);
      case 'team':
        return await this.checkTeamSecurityScope(securityRole.entityId, resourceId);
      default:
        return false;
    }
  }

  /**
   * 檢查用戶安全管理範圍
   */
  private async checkUserSecurityScope(userId: string, resourceId: string): Promise<boolean> {
    // 實作用戶安全管理範圍檢查邏輯
    return true; // 簡化實作
  }

  /**
   * 檢查團隊安全管理範圍
   */
  private async checkTeamSecurityScope(teamId: string, resourceId: string): Promise<boolean> {
    // 實作團隊安全管理範圍檢查邏輯
    return true; // 簡化實作
  }

  /**
   * 檢查特定安全管理權限
   */
  private async checkSpecificSecurityPermission(
    securityRole: SecurityManager, 
    action: string
  ): Promise<PermissionResult> {
    const hasPermission = securityRole.permissions.some(
      p => p.action === action
    );

    if (hasPermission) {
      return {
        granted: true,
        level: 'admin',
        reason: 'Security manager permission'
      };
    }

    return { granted: false, reason: 'No security manager permission' };
  }

  /**
   * 權限等級降級邏輯
   */
  private downgradePermissionLevel(permission: PermissionResult): PermissionResult {
    const levelMap: Record<string, 'read' | 'write' | 'admin' | 'none'> = { 
      'admin': 'write', 
      'write': 'read', 
      'read': 'none' 
    };
    const newLevel = levelMap[permission.level || 'read'] || 'none';
    
    return {
      ...permission,
      level: newLevel,
      granted: newLevel !== 'none'
    };
  }

  /**
   * 應用團隊權限等級
   */
  private applyTeamPermissionLevel(
    permission: PermissionResult, 
    teamPermission: 'read' | 'write' | 'admin'
  ): PermissionResult {
    const teamLevelMap: Record<string, 'read' | 'write' | 'admin'> = { 
      'read': 'read', 
      'write': 'write', 
      'admin': 'admin' 
    };
    const finalLevel = teamLevelMap[teamPermission];
    
    return {
      ...permission,
      level: finalLevel,
      granted: true
    };
  }

  /**
   * 映射角色等級到權限等級
   */
  private mapRoleLevelToPermission(level: number): 'read' | 'write' | 'admin' {
    if (level >= 8) return 'admin';
    if (level >= 5) return 'write';
    return 'read';
  }

  /**
   * 映射團隊角色到權限等級
   */
  private mapTeamRoleToPermission(role: 'member' | 'maintainer' | 'admin'): 'read' | 'write' | 'admin' {
    switch (role) {
      case 'admin': return 'admin';
      case 'maintainer': return 'write';
      case 'member': return 'read';
      default: return 'read';
    }
  }

  /**
   * 建立團隊層級結構
   */
  private buildTeamHierarchy(teams: Team[]): Team[] {
    const teamMap = new Map<string, Team & { children: Team[] }>();
    const rootTeams: (Team & { children: Team[] })[] = [];

    // 初始化所有團隊
    teams.forEach(team => {
      teamMap.set(team.id, { ...team, children: [] });
    });

    // 建立層級關係
    teams.forEach(team => {
      const teamWithChildren = teamMap.get(team.id)!;
      if (team.parentTeamId) {
        const parent = teamMap.get(team.parentTeamId);
        if (parent) {
          parent.children.push(teamWithChildren);
        }
      } else {
        rootTeams.push(teamWithChildren);
      }
    });

    return rootTeams;
  }

  /**
   * 檢查快取是否有效
   */
  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * 更新快取
   */
  private updateCache(cacheKey: string, result: PermissionResult): void {
    this.permissionCache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.permissionCache.clear();
    this.cacheExpiry.clear();
  }

  // ==================== 狀態管理方法 ====================

  /**
   * 設定組織列表
   */
  setOrganizations(orgs: GitHubAlignedOrganization[]): void {
    this._organizations.set(orgs);
  }

  /**
   * 設定當前組織
   */
  setCurrentOrganization(org: GitHubAlignedOrganization | null): void {
    this._currentOrganization.set(org);
    if (org) {
      this._teams.set(org.teams);
      this._securityManagers.set(org.securityManagers);
      this._organizationRoles.set(org.organizationRoles);
    }
  }

  /**
   * 新增團隊
   */
  addTeam(team: Team): void {
    this._teams.update(teams => [...teams, team]);
  }

  /**
   * 更新團隊
   */
  updateTeam(teamId: string, updates: Partial<Team>): void {
    this._teams.update(teams => 
      teams.map(team => team.id === teamId ? { ...team, ...updates } : team)
    );
  }

  /**
   * 移除團隊
   */
  removeTeam(teamId: string): void {
    this._teams.update(teams => teams.filter(team => team.id !== teamId));
  }
}
