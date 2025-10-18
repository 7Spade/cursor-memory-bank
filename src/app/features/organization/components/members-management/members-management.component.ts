import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MemberManagementService } from '../../services/member-management.service';
import { OrganizationManagementService } from '../../services/organization-management.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationMember, OrgRole } from '../../../core/models/auth.model';

/**
 * 成員管理組件
 * 單一職責：成員管理功能
 */
@Component({
  selector: 'app-members-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule
  ],
  template: `
    <div class="members-management-container">
      <mat-card class="management-card">
        <mat-card-header>
          <div class="header-content">
            <div class="title-section">
              <mat-card-title>
                <mat-icon>people</mat-icon>
                成員管理
              </mat-card-title>
              <mat-card-subtitle>
                管理組織成員和他們的角色
              </mat-card-subtitle>
            </div>
            <div class="action-section">
              <button 
                mat-raised-button 
                color="primary"
                (click)="inviteMember()"
                [disabled]="isLoading()">
                <mat-icon>person_add</mat-icon>
                邀請成員
              </button>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>載入成員列表...</p>
            </div>
          } @else if (error()) {
            <div class="error-container">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ error() }}</p>
              <button mat-button (click)="loadMembers()">重試</button>
            </div>
          } @else {
            <!-- 統計資訊 -->
            <div class="stats-section">
              <div class="stat-item">
                <mat-icon>people</mat-icon>
                <span class="stat-number">{{ memberCount() }}</span>
                <span class="stat-label">總成員</span>
              </div>
              <div class="stat-item">
                <mat-icon>admin_panel_settings</mat-icon>
                <span class="stat-number">{{ adminCount() }}</span>
                <span class="stat-label">管理員</span>
              </div>
              <div class="stat-item">
                <mat-icon>person</mat-icon>
                <span class="stat-number">{{ memberRoleCount() }}</span>
                <span class="stat-label">一般成員</span>
              </div>
            </div>

            <!-- 成員列表 -->
            <div class="members-table-container">
              <table mat-table [dataSource]="members()" class="members-table">
                <!-- 成員列 -->
                <ng-container matColumnDef="member">
                  <th mat-header-cell *matHeaderCellDef>成員</th>
                  <td mat-cell *matCellDef="let member">
                    <div class="member-info">
                      <div class="member-avatar">
                        <mat-icon>account_circle</mat-icon>
                      </div>
                      <div class="member-details">
                        <div class="member-name">{{ member.userId }}</div>
                        <div class="member-email">{{ member.userId }}@example.com</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- 角色列 -->
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>角色</th>
                  <td mat-cell *matCellDef="let member">
                    @if (canManageMembers()) {
                      <mat-select 
                        [value]="member.role"
                        (selectionChange)="updateMemberRole(member, $event.value)"
                        class="role-select">
                        @for (role of availableRoles; track role.value) {
                          <mat-option [value]="role.value">
                            {{ role.label }}
                          </mat-option>
                        }
                      </mat-select>
                    } @else {
                      <mat-chip [color]="getRoleColor(member.role)">
                        {{ getRoleLabel(member.role) }}
                      </mat-chip>
                    }
                  </td>
                </ng-container>

                <!-- 加入時間列 -->
                <ng-container matColumnDef="joinedAt">
                  <th mat-header-cell *matHeaderCellDef>加入時間</th>
                  <td mat-cell *matCellDef="let member">
                    {{ member.joinedAt | date:'yyyy-MM-dd' }}
                  </td>
                </ng-container>

                <!-- 團隊列 -->
                <ng-container matColumnDef="teams">
                  <th mat-header-cell *matHeaderCellDef>團隊</th>
                  <td mat-cell *matCellDef="let member">
                    <div class="teams-container">
                      @for (team of getMemberTeams(member.userId); track team.id) {
                        <mat-chip class="team-chip">
                          {{ team.name }}
                        </mat-chip>
                      }
                      @if (getMemberTeams(member.userId).length === 0) {
                        <span class="no-teams">無</span>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- 操作列 -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>操作</th>
                  <td mat-cell *matCellDef="let member">
                    @if (canManageMembers() && !isCurrentUser(member.userId)) {
                      <button 
                        mat-icon-button 
                        [matMenuTriggerFor]="memberMenu"
                        [matTooltip]="'更多操作'">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #memberMenu="matMenu">
                        <button mat-menu-item (click)="viewMemberDetails(member)">
                          <mat-icon>visibility</mat-icon>
                          查看詳情
                        </button>
                        <button mat-menu-item (click)="manageMemberTeams(member)">
                          <mat-icon>group</mat-icon>
                          管理團隊
                        </button>
                        <mat-divider></mat-divider>
                        <button 
                          mat-menu-item 
                          (click)="removeMember(member)"
                          class="danger-action">
                          <mat-icon>person_remove</mat-icon>
                          移除成員
                        </button>
                      </mat-menu>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              @if (members().length === 0) {
                <div class="empty-state">
                  <mat-icon>people_outline</mat-icon>
                  <h3>尚無成員</h3>
                  <p>邀請成員加入您的組織</p>
                  <button 
                    mat-raised-button 
                    color="primary"
                    (click)="inviteMember()">
                    <mat-icon>person_add</mat-icon>
                    邀請成員
                  </button>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .members-management-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .management-card {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .title-section {
      display: flex;
      flex-direction: column;
    }

    .action-section {
      display: flex;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
      color: #f44336;
    }

    .stats-section {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
    }

    .members-table-container {
      overflow-x: auto;
    }

    .members-table {
      width: 100%;
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .member-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #e3f2fd;
    }

    .member-details {
      display: flex;
      flex-direction: column;
    }

    .member-name {
      font-weight: 500;
    }

    .member-email {
      font-size: 12px;
      color: #666;
    }

    .role-select {
      min-width: 120px;
    }

    .teams-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .team-chip {
      font-size: 12px;
    }

    .no-teams {
      color: #999;
      font-style: italic;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 0;
      color: #666;
    }

    .empty-state p {
      margin: 0;
      color: #999;
    }

    .danger-action {
      color: #f44336;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class MembersManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private memberService = inject(MemberManagementService);
  private orgService = inject(OrganizationManagementService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Signals for state management
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _members = signal<OrganizationMember[]>([]);

  // Readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly members = this._members.asReadonly();

  // Computed signals
  readonly memberCount = computed(() => this._members().length);
  readonly adminCount = computed(() => 
    this._members().filter(m => m.role === OrgRole.ADMIN || m.role === OrgRole.OWNER).length
  );
  readonly memberRoleCount = computed(() => 
    this._members().filter(m => m.role === OrgRole.MEMBER).length
  );

  // Table configuration
  displayedColumns: string[] = ['member', 'role', 'joinedAt', 'teams', 'actions'];
  orgId!: string;

  availableRoles = [
    { value: OrgRole.OWNER, label: '擁有者' },
    { value: OrgRole.ADMIN, label: '管理員' },
    { value: OrgRole.MEMBER, label: '成員' },
    { value: OrgRole.BILLING, label: '帳務管理員' },
    { value: OrgRole.OUTSIDE_COLLABORATOR, label: '外部協作者' }
  ];

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId')!;
    this.loadMembers();
  }

  private async loadMembers() {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const members = await this.orgService.getOrganizationMembers(this.orgId).toPromise();
      this._members.set(members || []);
    } catch (error) {
      this._error.set(`載入成員列表失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateMemberRole(member: OrganizationMember, newRole: OrgRole) {
    try {
      await this.memberService.updateMemberRole(this.orgId, member.userId, newRole);
      this.snackBar.open('成員角色已更新', '關閉', { duration: 3000 });
      
      // 更新本地狀態
      this._members.update(members => 
        members.map(m => m.id === member.id ? { ...m, role: newRole } : m)
      );
    } catch (error) {
      this.snackBar.open('更新失敗', '關閉', { duration: 3000 });
    }
  }

  async removeMember(member: OrganizationMember) {
    if (confirm(`確定要移除成員 ${member.userId} 嗎？`)) {
      try {
        await this.memberService.removeMember(this.orgId, member.userId);
        this.snackBar.open('成員已移除', '關閉', { duration: 3000 });
        
        // 更新本地狀態
        this._members.update(members => 
          members.filter(m => m.id !== member.id)
        );
      } catch (error) {
        this.snackBar.open('移除失敗', '關閉', { duration: 3000 });
      }
    }
  }

  inviteMember() {
    // TODO: 打開邀請成員對話框
    this.snackBar.open('邀請成員功能開發中', '關閉', { duration: 3000 });
  }

  viewMemberDetails(member: OrganizationMember) {
    // TODO: 打開成員詳情對話框
    this.snackBar.open('成員詳情功能開發中', '關閉', { duration: 3000 });
  }

  manageMemberTeams(member: OrganizationMember) {
    // TODO: 打開管理成員團隊對話框
    this.snackBar.open('管理成員團隊功能開發中', '關閉', { duration: 3000 });
  }

  getRoleLabel(role: OrgRole): string {
    return this.availableRoles.find(r => r.value === role)?.label || role;
  }

  getRoleColor(role: OrgRole): string {
    switch (role) {
      case OrgRole.OWNER:
        return 'primary';
      case OrgRole.ADMIN:
        return 'accent';
      case OrgRole.MEMBER:
        return 'basic';
      case OrgRole.BILLING:
        return 'warn';
      case OrgRole.OUTSIDE_COLLABORATOR:
        return 'basic';
      default:
        return 'basic';
    }
  }

  getMemberTeams(userId: string): any[] {
    // TODO: 實現獲取成員團隊的邏輯
    return [];
  }

  canManageMembers(): boolean {
    const currentUser = this.authService.currentAccount();
    if (!currentUser) return false;

    const member = this._members().find(m => m.userId === currentUser.id);
    return member ? (member.role === OrgRole.OWNER || member.role === OrgRole.ADMIN) : false;
  }

  isCurrentUser(userId: string): boolean {
    const currentUser = this.authService.currentAccount();
    return currentUser ? currentUser.id === userId : false;
  }
}
