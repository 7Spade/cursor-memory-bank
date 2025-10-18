import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationManagementService } from '../services/organization-management.service';
import { map, switchMap, catchError, of } from 'rxjs';

/**
 * 組織擁有者守衛
 * 單一職責：檢查組織擁有者權限
 */
export const organizationOwnerGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const orgService = inject(OrganizationManagementService);
  const router = inject(Router);

  const orgId = route.paramMap.get('orgId');
  if (!orgId) {
    router.navigate(['/organizations']);
    return false;
  }

  const currentUser = authService.currentAccount();
  if (!currentUser || currentUser.type !== 'user') {
    router.navigate(['/login']);
    return false;
  }

  return orgService.getOrganization(orgId).pipe(
    map(org => {
      if (!org) {
        router.navigate(['/organizations']);
        return false;
      }

      if (org.ownerId !== currentUser.id) {
        router.navigate(['/organizations', orgId]);
        return false;
      }

      return true;
    }),
    catchError(() => {
      router.navigate(['/organizations']);
      return of(false);
    })
  );
};

/**
 * 組織管理員守衛
 * 單一職責：檢查組織管理員權限
 */
export const organizationAdminGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const orgService = inject(OrganizationManagementService);
  const router = inject(Router);

  const orgId = route.paramMap.get('orgId');
  if (!orgId) {
    router.navigate(['/organizations']);
    return false;
  }

  const currentUser = authService.currentAccount();
  if (!currentUser || currentUser.type !== 'user') {
    router.navigate(['/login']);
    return false;
  }

  return orgService.getUserOrgRole(orgId, currentUser.id).then(role => {
    if (!role || (role !== 'owner' && role !== 'admin')) {
      router.navigate(['/organizations', orgId]);
      return false;
    }
    return true;
  }).catch(() => {
    router.navigate(['/organizations']);
    return false;
  });
};

/**
 * 組織成員守衛
 * 單一職責：檢查組織成員權限
 */
export const organizationMemberGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const orgService = inject(OrganizationManagementService);
  const router = inject(Router);

  const orgId = route.paramMap.get('orgId');
  if (!orgId) {
    router.navigate(['/organizations']);
    return false;
  }

  const currentUser = authService.currentAccount();
  if (!currentUser || currentUser.type !== 'user') {
    router.navigate(['/login']);
    return false;
  }

  return orgService.getUserOrgRole(orgId, currentUser.id).then(role => {
    if (!role) {
      router.navigate(['/organizations', orgId]);
      return false;
    }
    return true;
  }).catch(() => {
    router.navigate(['/organizations']);
    return false;
  });
};
