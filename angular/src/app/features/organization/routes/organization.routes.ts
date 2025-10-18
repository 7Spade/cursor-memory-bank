import { Routes } from '@angular/router';

/**
 * 組織模組的路由配置
 * 對齊 TREE.md 的組織管理路由結構
 */
export const organizationRoutes: Routes = [
  {
    path: 'organizations',
    loadComponent: () => import('../components/organization-card.component').then(m => m.OrganizationCardComponent),
    title: '組織管理'
  },
  {
    path: 'teams',
    loadComponent: () => import('../components/team-management.component').then(m => m.TeamHierarchyComponent),
    title: '團隊管理'
  },
  {
    path: 'security',
    loadComponent: () => import('../components/security-manager.component').then(m => m.SecurityManagerComponent),
    title: '安全管理器'
  },
  {
    path: 'roles',
    loadComponent: () => import('../components/organization-roles.component').then(m => m.OrganizationRolesComponent),
    title: '組織角色系統'
  },
  {
    path: '',
    redirectTo: 'organizations',
    pathMatch: 'full'
  }
];
