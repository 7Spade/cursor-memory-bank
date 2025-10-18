import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { OrgRole } from '../../../core/models/auth.model';

export function roleGuard(expectedRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查用戶角色
    if (currentAccount.type === 'user') {
      const user = currentAccount;
      const permissions = user.permissions;
      
      // 檢查是否有預期角色
      if (permissions.roles.includes(expectedRole)) {
        return true;
      }
      
      // 如果沒有預期角色，重定向到未授權頁面
      router.navigate(['/unauthorized']);
      return false;
    }

    // 組織帳戶不支援角色守衛
    router.navigate(['/unauthorized']);
    return false;
  };
}

// 組織角色守衛
export function orgRoleGuard(expectedRole: OrgRole): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const currentAccount = authService.currentAccount();
    
    if (!currentAccount) {
      router.navigate(['/login']);
      return false;
    }

    // 檢查用戶是否為組織成員
    if (currentAccount.type === 'user') {
      const user = currentAccount;
      
      // 檢查組織角色
      if (permissionService.hasOrgRole(expectedRole)) {
        return true;
      }
      
      // 沒有權限，重定向到未授權頁面
      router.navigate(['/unauthorized']);
      return false;
    }

    // 組織帳戶不支援此守衛
    router.navigate(['/unauthorized']);
    return false;
  };
}

// 權限守衛
export function permissionGuard(action: string, resource: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const permissionService = inject(PermissionService);
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