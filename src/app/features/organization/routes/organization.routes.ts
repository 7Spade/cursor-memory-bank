import { Routes } from '@angular/router';
import { organizationOwnerGuard } from '../guards/organization-owner.guard';
import { organizationAdminGuard, organizationMemberGuard } from '../guards/organization-admin.guard';
import { teamMaintainerGuard } from '../guards/team-maintainer.guard';

/**
 * 組織相關路由
 * 單一職責：組織相關路由配置
 */
export const organizationRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('../components/organization-create/organization-create.component')
      .then(m => m.OrganizationCreateComponent),
    title: '建立組織'
  },
  {
    path: ':orgId',
    canActivate: [organizationMemberGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('../components/organization-dashboard/organization-dashboard.component')
          .then(m => m.OrganizationDashboardComponent),
        title: '組織儀表板'
      },
      {
        path: 'settings',
        canActivate: [organizationOwnerGuard],
        loadComponent: () => import('../components/organization-settings/organization-settings.component')
          .then(m => m.OrganizationSettingsComponent),
        title: '組織設定'
      },
      {
        path: 'members',
        canActivate: [organizationAdminGuard],
        loadComponent: () => import('../components/members-management/members-management.component')
          .then(m => m.MembersManagementComponent),
        title: '成員管理'
      },
      {
        path: 'teams',
        children: [
          {
            path: '',
            canActivate: [organizationMemberGuard],
            loadComponent: () => import('../components/team-list/team-list.component')
              .then(m => m.TeamListComponent),
            title: '團隊列表'
          },
          {
            path: 'create',
            canActivate: [organizationAdminGuard],
            loadComponent: () => import('../components/team-create/team-create.component')
              .then(m => m.TeamCreateComponent),
            title: '建立團隊'
          },
          {
            path: ':teamId',
            canActivate: [teamMaintainerGuard],
            children: [
              {
                path: '',
                loadComponent: () => import('../components/team-detail/team-detail.component')
                  .then(m => m.TeamDetailComponent),
                title: '團隊詳情'
              },
              {
                path: 'members',
                loadComponent: () => import('../components/team-members/team-members.component')
                  .then(m => m.TeamMembersComponent),
                title: '團隊成員'
              },
              {
                path: 'settings',
                loadComponent: () => import('../components/team-settings/team-settings.component')
                  .then(m => m.TeamSettingsComponent),
                title: '團隊設定'
              }
            ]
          }
        ]
      }
    ]
  }
];
