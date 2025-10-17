import { Routes } from '@angular/router';

/**
 * GitHub 對齊功能的路由配置
 * 對齊 GitHub 的組織管理路由結構
 */
export const githubAlignedRoutes: Routes = [
  {
    path: 'organizations',
    loadComponent: () => import('../components/organization/organization-card.component').then(m => m.OrganizationCardComponent),
    title: '組織管理'
  },
  {
    path: 'teams',
    loadComponent: () => import('../components/team/team-hierarchy.component').then(m => m.TeamHierarchyComponent),
    title: '團隊管理'
  },
  {
    path: '',
    redirectTo: 'organizations',
    pathMatch: 'full'
  }
];
