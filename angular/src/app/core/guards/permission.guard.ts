// src/app/core/guards/permission.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { OrgRole } from '../models/auth.model';

/**
 * 通用權限守衛
 * 從路由數據中讀取權限配置
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentAccount = authService.currentAccount();
  
  if (!currentAccount) {
    router.navigate(['/login']);
    return false;
  }

  // 從路由數據中獲取權限配置
  const permission = route.data['permission'] as { action: string; resource: string };
  
  if (!permission) {
    console.warn('No permission configuration found in route data');
    return true; // 如果沒有權限配置，允許訪問
  }

  // 檢查權限
  if (permissionService.can(permission.action, permission.resource)) {
    return true;
  }

  // 沒有權限，重定向到未授權頁面
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * 權限守衛工廠函數
 * @param action 權限動作 (read, write, admin, delete)
 * @param resource 資源類型 (organization, team, repository, member)
 * @returns CanActivateFn
 */
export function createPermissionGuard(action: string, resource: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查權限
    if (permissionService.can(action, resource)) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * 組織權限守衛工廠函數
 * @param role 組織角色
 * @returns CanActivateFn
 */
export function orgRoleGuard(role: OrgRole): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查組織角色
    if (permissionService.hasOrgRole(role)) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * 組織管理員守衛
 * 檢查用戶是否為組織管理員或擁有者
 */
export const orgAdminGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentAccount = authService.currentAccount();
  
  if (!currentAccount) {
    router.navigate(['/login']);
    return false;
  }

  // 檢查是否為組織管理員
  if (permissionService.isOrganizationAdmin()) {
    return true;
  }

  // 沒有權限，重定向到未授權頁面
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * 組織擁有者守衛
 * 檢查用戶是否為組織擁有者
 */
export const orgOwnerGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentAccount = authService.currentAccount();
  
  if (!currentAccount) {
    router.navigate(['/login']);
    return false;
  }

  // 檢查是否為組織擁有者
  if (permissionService.isOrganizationOwner()) {
    return true;
  }

  // 沒有權限，重定向到未授權頁面
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Repository 讀取權限守衛
 * @param repositoryId Repository ID
 * @returns CanActivateFn
 */
export function repositoryReadGuard(repositoryId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查 Repository 讀取權限
    const canAccess = await permissionService.canAccessRepository(repositoryId);
    
    if (canAccess) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Repository 寫入權限守衛
 * @param repositoryId Repository ID
 * @returns CanActivateFn
 */
export function repositoryWriteGuard(repositoryId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查 Repository 寫入權限
    const canWrite = await permissionService.canWriteRepository(repositoryId);
    
    if (canWrite) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Repository 管理權限守衛
 * @param repositoryId Repository ID
 * @returns CanActivateFn
 */
export function repositoryManageGuard(repositoryId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查 Repository 管理權限
    const canManage = await permissionService.canManageRepository(repositoryId);
    
    if (canManage) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * 團隊管理權限守衛
 * @param teamId 團隊 ID
 * @returns CanActivateFn
 */
export function teamManageGuard(teamId: string): CanActivateFn {
  return async () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查團隊管理權限
    const canManage = await permissionService.canManageTeam(teamId);
    
    if (canManage) {
      return true;
    }

    // 沒有權限，重定向到未授權頁面
    router.navigate(['/unauthorized']);
    return false;
  };
}

