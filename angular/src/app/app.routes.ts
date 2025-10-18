import { Routes } from '@angular/router';
import { LoginComponent } from './features/user/auth/login.component';
import { SignupComponent } from './features/user/auth/signup.component';

import { authGuard } from './features/user/auth/auth.guard';
import { roleGuard, orgRoleGuard, permissionGuard } from './features/user/auth/role.guard';
import { orgAdminGuard, orgOwnerGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  // 認證路由
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/user/auth/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  
  // 用戶帳戶管理路由
  {
    path: 'account',
    loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes),
    canActivate: [authGuard]
  },
  
  // 組織管理路由
  {
    path: 'organizations',
    loadChildren: () => import('./features/organization/routes/organization.routes').then(m => m.organizationRoutes),
    canActivate: [authGuard, permissionGuard('read', 'organization')]
  },
  
  // Repository 管理路由
  {
    path: 'repositories',
    loadChildren: () => import('./features/repository/routes/repository.routes').then(m => m.repositoryRoutes),
    canActivate: [authGuard]
  },
  
  // 角色管理路由
  {
    path: 'admin',
    loadComponent: () => import('./dashboard/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard('admin')]
  },
  {
    path: 'editor',
    loadComponent: () => import('./dashboard/editor.component').then(m => m.EditorComponent),
    canActivate: [authGuard, roleGuard('editor')]
  },
  {
    path: 'viewer',
    loadComponent: () => import('./dashboard/viewer.component').then(m => m.ViewerComponent),
    canActivate: [authGuard, roleGuard('viewer')]
  },
  
  // 儀表板路由
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  //   canActivate: [authGuard]
  // },
  
  // 預設路由
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
