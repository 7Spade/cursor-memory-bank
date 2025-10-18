import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TeamManagementService } from '../services/team-management.service';
import { map, catchError, of } from 'rxjs';

/**
 * 團隊維護者守衛
 * 單一職責：檢查團隊維護者權限
 */
export const teamMaintainerGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const teamService = inject(TeamManagementService);
  const router = inject(Router);

  const orgId = route.paramMap.get('orgId');
  const teamId = route.paramMap.get('teamId');
  
  if (!orgId || !teamId) {
    router.navigate(['/organizations']);
    return false;
  }

  const currentUser = authService.currentAccount();
  if (!currentUser || currentUser.type !== 'user') {
    router.navigate(['/login']);
    return false;
  }

  return teamService.getTeamMembers(orgId, teamId).pipe(
    map(members => {
      const userMember = members.find(member => member.userId === currentUser.id);
      
      if (!userMember || userMember.role !== 'maintainer') {
        router.navigate(['/organizations', orgId, 'teams', teamId]);
        return false;
      }
      
      return true;
    }),
    catchError(() => {
      router.navigate(['/organizations', orgId]);
      return of(false);
    })
  );
};

/**
 * 團隊成員守衛
 * 單一職責：檢查團隊成員權限
 */
export const teamMemberGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const teamService = inject(TeamManagementService);
  const router = inject(Router);

  const orgId = route.paramMap.get('orgId');
  const teamId = route.paramMap.get('teamId');
  
  if (!orgId || !teamId) {
    router.navigate(['/organizations']);
    return false;
  }

  const currentUser = authService.currentAccount();
  if (!currentUser || currentUser.type !== 'user') {
    router.navigate(['/login']);
    return false;
  }

  return teamService.getTeamMembers(orgId, teamId).pipe(
    map(members => {
      const userMember = members.find(member => member.userId === currentUser.id);
      
      if (!userMember) {
        router.navigate(['/organizations', orgId, 'teams', teamId]);
        return false;
      }
      
      return true;
    }),
    catchError(() => {
      router.navigate(['/organizations', orgId]);
      return of(false);
    })
  );
};

/**
 * 團隊管理守衛
 * 單一職責：檢查團隊管理權限（維護者或組織管理員）
 */
export const teamManagementGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const teamService = inject(TeamManagementService);
  const router = inject(Router);

  const orgId = route.paramMap.get('orgId');
  const teamId = route.paramMap.get('teamId');
  
  if (!orgId || !teamId) {
    router.navigate(['/organizations']);
    return false;
  }

  const currentUser = authService.currentAccount();
  if (!currentUser || currentUser.type !== 'user') {
    router.navigate(['/login']);
    return false;
  }

  // 檢查是否為組織管理員
  return teamService.getTeamMembers(orgId, teamId).pipe(
    map(members => {
      const userMember = members.find(member => member.userId === currentUser.id);
      
      // 如果是團隊維護者，允許管理
      if (userMember && userMember.role === 'maintainer') {
        return true;
      }
      
      // TODO: 檢查是否為組織管理員
      // 這裡需要整合組織權限檢查
      
      router.navigate(['/organizations', orgId, 'teams', teamId]);
      return false;
    }),
    catchError(() => {
      router.navigate(['/organizations', orgId]);
      return of(false);
    })
  );
};
