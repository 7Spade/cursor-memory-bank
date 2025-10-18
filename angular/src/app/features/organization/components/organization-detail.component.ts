import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';

import { OrganizationService } from '../../../core/services/organization.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../../core/services/auth.service';
import { Organization, Team, OrganizationMember } from '../../../core/models/auth.model';

/**
 * 組織詳情組件
 * 顯示組織的基本信息和統計數據
 */
@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatDividerModule
  ],
  template: `
    <div class="organization-detail-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>載入組織詳情中...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <p>{{ error() }}</p>
          <button mat-button (click)="loadOrganization()">重試</button>
        </div>
      } @else if (organization()) {
        <!-- 組織資訊卡片 -->
        <mat-card class="organization-info-card">
          <mat-card-header>
            <div mat-card-avatar class="organization-avatar">
              @if (organization()?.profile?.avatar) {
                <img [src]="organization()?.profile?.avatar" [alt]="organization()?.login">
              } @else {
                <mat-icon>business</mat-icon>
              }
            </div>
            <mat-card-title>{{ organization()?.login }}</mat-card-title>
            <mat-card-subtitle>{{ organization()?.login }}</mat-card-subtitle>
            
            <div class="card-actions">
              @if (permissionService.canManageOrganization()) {
                <button mat-icon-button (click)="editOrganization()">
                  <mat-icon>edit</mat-icon>
                </button>
              }
              @if (permissionService.isOrganizationOwner()) {
                <button mat-icon-button (click)="deleteOrganization()" class="delete-button">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>
          </mat-card-header>

          <mat-card-content>
            @if (organization()?.description) {
              <p class="organization-description">{{ organization()?.description }}</p>
            }
            
            <div class="organization-stats">
              <div class="stat-item">
                <mat-icon>people</mat-icon>
                <span>{{ memberCount() }} 成員</span>
              </div>
              <div class="stat-item">
                <mat-icon>groups</mat-icon>
                <span>{{ teamCount() }} 團隊</span>
              </div>
              <div class="stat-item">
                <mat-icon>security</mat-icon>
                <span>{{ securityManagerCount() }} 安全管理器</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            @if (permissionService.canManageMembers()) {
              <button mat-button (click)="goToMembers()" color="primary">
                <mat-icon>people</mat-icon>
                管理成員
              </button>
            }
            @if (permissionService.canManageTeams()) {
              <button mat-button (click)="goToTeams()">
                <mat-icon>groups</mat-icon>
                管理團隊
              </button>
            }
            @if (permissionService.canManageOrganization()) {
              <button mat-button (click)="goToSettings()">
                <mat-icon>settings</mat-icon>
                組織設定
              </button>
            }
          </mat-card-actions>
        </mat-card>

        <!-- 統計資訊網格 -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">people</mat-icon>
                <div class="stat-info">
                  <h3>{{ memberCount() }}</h3>
                  <p>成員</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">groups</mat-icon>
                <div class="stat-info">
                  <h3>{{ teamCount() }}</h3>
                  <p>團隊</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">security</mat-icon>
                <div class="stat-info">
                  <h3>{{ securityManagerCount() }}</h3>
                  <p>安全管理器</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 最近團隊 -->
        @if (teams().length > 0) {
          <mat-card class="recent-teams-card">
            <mat-card-header>
              <mat-card-title>最近團隊</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="team-list">
                @for (team of teams(); track team.id) {
                  <div class="team-item">
                    <div class="team-info">
                      <h4>{{ team.name }}</h4>
                      <p>{{ team.description || '暫無描述' }}</p>
                    </div>
                    <button mat-button (click)="viewTeam(team.id)">
                      查看
                    </button>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .organization-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
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

    .organization-info-card {
      margin-bottom: 24px;
    }

    .organization-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--mdc-theme-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .card-actions {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .delete-button {
      color: var(--mdc-theme-error);
    }

    .organization-description {
      margin: 16px 0;
      color: var(--mdc-theme-on-surface-variant);
      line-height: 1.5;
    }

    .organization-stats {
      display: flex;
      gap: 16px;
      margin: 16px 0;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--mdc-theme-on-surface-variant);
        font-size: 14px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: var(--mdc-theme-primary);
        }
        
        .stat-info {
          h3 {
            margin: 0;
            font-size: 24px;
            font-weight: 500;
          }
          
          p {
            margin: 0;
            color: var(--mdc-theme-on-surface-variant);
            font-size: 14px;
          }
        }
      }
    }

    .recent-teams-card {
      .team-list {
        display: grid;
        gap: 16px;
      }
      
      .team-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        
        .team-info {
          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 500;
          }
          
          p {
            margin: 0;
            color: var(--mdc-theme-on-surface-variant);
            font-size: 14px;
          }
        }
      }
    }

    @media (max-width: 600px) {
      .organization-detail-container {
        padding: 16px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .team-item {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
    }
  `]
})
export class OrganizationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  readonly permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  // Signals
  organization = signal<Organization | null>(null);
  teams = signal<Team[]>([]);
  members = signal<OrganizationMember[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed signals
  readonly memberCount = computed(() => this.members().length);
  readonly teamCount = computed(() => this.teams().length);
  readonly securityManagerCount = computed(() => 
    this.members().filter(m => m.role === 'admin' || m.role === 'owner').length
  );

  orgId!: string;

  async ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId')!;
    
    if (!this.orgId) {
      this.error.set('無效的組織 ID');
      return;
    }

    // 設置當前組織到權限服務
    await this.permissionService.setCurrentOrganization(this.orgId);
    
    // 載入組織詳情
    await this.loadOrganization();
  }

  async loadOrganization() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      // 載入組織資訊
      const org = await this.orgService.getOrganization(this.orgId).toPromise();
      this.organization.set(org || null);
      
      if (!org) {
        this.error.set('組織不存在');
        return;
      }

      // 載入團隊列表 - 暫時設為空數組，因為 getOrganizationTeams 方法不存在
      this.teams.set([]);

      // 載入成員列表
      const members = await this.orgService.getOrganizationMembers(this.orgId).toPromise();
      this.members.set(members || []);

    } catch (error) {
      this.error.set(`載入組織詳情失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  editOrganization() {
    this.router.navigate(['settings'], { relativeTo: this.route });
  }

  deleteOrganization() {
    // TODO: 實作刪除組織邏輯
    console.log('刪除組織:', this.orgId);
  }

  goToMembers() {
    this.router.navigate(['members'], { relativeTo: this.route });
  }

  goToTeams() {
    this.router.navigate(['teams'], { relativeTo: this.route });
  }

  goToSettings() {
    this.router.navigate(['settings'], { relativeTo: this.route });
  }

  viewTeam(teamId: string) {
    this.router.navigate(['teams', teamId], { relativeTo: this.route });
  }
}
