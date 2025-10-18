import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { firstValueFrom } from 'rxjs';

import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OrganizationCardComponent } from '../components/organization-card.component';
import { OrganizationCreateDialogComponent } from '../components/organization-create-dialog.component';
import { OrganizationDetail } from '../models/organization.model';
import { OrganizationCreatedEvent } from '../models/organization-create.model';

/**
 * 組織列表組件
 * 單一職責：顯示組織列表和提供建立組織的功能
 * 遵循單一職責原則：只負責組織列表的顯示和建立組織的入口
 */
@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    OrganizationCardComponent
  ],
  template: `
    <div class="organization-list-container">
      <!-- 頁面標題和操作按鈕 -->
      <div class="page-header">
        <div class="header-content">
          <h1>組織管理</h1>
          <p>管理您的組織和團隊</p>
        </div>
        <div class="header-actions">
          <button 
            mat-raised-button 
            color="primary"
            (click)="openCreateOrganizationDialog()"
            [disabled]="isLoading()">
            <mat-icon>add</mat-icon>
            建立組織
          </button>
        </div>
      </div>

      <!-- 載入狀態 -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>載入組織列表中...</p>
        </div>
      }

      <!-- 錯誤狀態 -->
      @if (error()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <p>{{ error() }}</p>
          <button mat-button (click)="loadOrganizations()">重試</button>
        </div>
      }

      <!-- 組織列表 -->
      @if (!isLoading() && !error()) {
        @if (organizations().length === 0) {
          <!-- 空狀態 -->
          <div class="empty-state">
            <mat-icon>business</mat-icon>
            <h2>尚未建立任何組織</h2>
            <p>建立您的第一個組織來開始管理團隊和專案</p>
            <button 
              mat-raised-button 
              color="primary"
              (click)="openCreateOrganizationDialog()">
              <mat-icon>add</mat-icon>
              建立第一個組織
            </button>
          </div>
        } @else {
          <!-- 組織網格 -->
          <mat-grid-list 
            cols="1" 
            rowHeight="400px" 
            gutterSize="16px"
            class="organization-grid">
            @for (organization of organizations(); track organization.id) {
              <mat-grid-tile>
                <app-organization-card
                  [organization]="createOrganizationSignal(organization)"
                  [isSelected]="createIsSelectedSignal(false)"
                  (view)="onViewOrganization($event)"
                  (edit)="onEditOrganization($event)"
                  (settings)="onOrganizationSettings($event)"
                  (members)="onOrganizationMembers($event)"
                  (teams)="onOrganizationTeams($event)"
                  (delete)="onDeleteOrganization($event)">
                </app-organization-card>
              </mat-grid-tile>
            }
          </mat-grid-list>
        }
      }
    </div>
  `,
  styles: [`
    .organization-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      font-weight: 500;
      color: var(--mdc-theme-on-surface);
    }

    .header-content p {
      margin: 0;
      color: var(--mdc-theme-on-surface-variant);
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      gap: 16px;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      gap: 16px;
      color: var(--mdc-theme-error);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      gap: 16px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mdc-theme-on-surface-variant);
    }

    .empty-state h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--mdc-theme-on-surface);
    }

    .empty-state p {
      margin: 0;
      color: var(--mdc-theme-on-surface-variant);
      max-width: 400px;
    }

    .organization-grid {
      margin-top: 16px;
    }

    @media (min-width: 768px) {
      .organization-grid {
        cols: 2;
      }
    }

    @media (min-width: 1024px) {
      .organization-grid {
        cols: 3;
      }
    }

    @media (max-width: 600px) {
      .organization-list-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }
    }
  `]
})
export class OrganizationListComponent implements OnInit {
  // 服務注入
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // 狀態管理
  private _organizations = signal<OrganizationDetail[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // 只讀信號
  readonly organizations = this._organizations.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  ngOnInit(): void {
    this.loadOrganizations();
  }

  /**
   * 載入組織列表
   */
  async loadOrganizations(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      // 獲取當前用戶
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this._error.set('請先登入');
        return;
      }

      // 調用服務方法獲取用戶的組織列表
      const organizations = await firstValueFrom(
        this.organizationService.getUserOrganizations(currentUser.uid)
      );
      
      // 將 Organization 轉換為 OrganizationDetail
      const organizationDetails: OrganizationDetail[] = organizations.map(org => ({
        id: org.id,
        slug: org.login, // 使用 login 作為 slug
        name: org.profile.name,
        description: org.description || '',
        type: 'construction' as const, // 暫時設為 construction，可以後續優化
        profile: {
          website: org.profile.website,
          location: org.profile.location,
          email: org.profile.email,
          phone: undefined, // ProfileVO 沒有 phone 字段
          avatar: org.profile.avatar
        },
        members: [], // 暫時設為空數組，可以後續優化
        teams: [],   // 暫時設為空數組，可以後續優化
        securityManagers: [], // 暫時設為空數組，可以後續優化
        organizationRoles: [], // 暫時設為空數組，可以後續優化
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      }));
      
      this._organizations.set(organizationDetails);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入組織列表失敗';
      this._error.set(errorMessage);
      this.notificationService.showError(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 建立組織信號
   */
  createOrganizationSignal(organization: OrganizationDetail) {
    return signal(organization);
  }

  /**
   * 建立選中狀態信號
   */
  createIsSelectedSignal(isSelected: boolean) {
    return signal(isSelected);
  }

  /**
   * 打開建立組織對話框
   */
  openCreateOrganizationDialog(): void {
    const dialogRef = this.dialog.open(OrganizationCreateDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadOrganizations(); // 重新載入組織列表
      }
    });
  }

  /**
   * 檢視組織
   */
  onViewOrganization(organization: OrganizationDetail): void {
    console.log('檢視組織:', organization);
    // TODO: 導航到組織詳情頁面
  }

  /**
   * 編輯組織
   */
  onEditOrganization(organization: OrganizationDetail): void {
    console.log('編輯組織:', organization);
    // TODO: 打開編輯組織對話框
  }

  /**
   * 組織設定
   */
  onOrganizationSettings(organization: OrganizationDetail): void {
    console.log('組織設定:', organization);
    // TODO: 導航到組織設定頁面
  }

  /**
   * 組織成員
   */
  onOrganizationMembers(organization: OrganizationDetail): void {
    console.log('組織成員:', organization);
    // TODO: 導航到組織成員頁面
  }

  /**
   * 組織團隊
   */
  onOrganizationTeams(organization: OrganizationDetail): void {
    console.log('組織團隊:', organization);
    // TODO: 導航到組織團隊頁面
  }

  /**
   * 刪除組織
   */
  onDeleteOrganization(organization: OrganizationDetail): void {
    console.log('刪除組織:', organization);
    // TODO: 顯示刪除確認對話框
  }
}
