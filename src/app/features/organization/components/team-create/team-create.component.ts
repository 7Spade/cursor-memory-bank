import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TeamManagementService } from '../../services/team-management.service';
import { TeamValidator } from '../../utils/team-validator.util';

/**
 * 團隊建立組件
 * 單一職責：團隊建立功能
 */
@Component({
  selector: 'app-team-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <div class="team-create-container">
      <mat-card class="create-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>group</mat-icon>
            建立新團隊
          </mat-card-title>
          <mat-card-subtitle>
            在組織中建立一個新的團隊
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>正在建立團隊...</p>
            </div>
          } @else if (error()) {
            <div class="error-container">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ error() }}</p>
              <button mat-button (click)="clearError()">重試</button>
            </div>
          } @else {
            <form [formGroup]="teamForm" (ngSubmit)="onSubmit()" class="team-form">
              <!-- 團隊名稱 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>團隊名稱</mat-label>
                <input 
                  matInput 
                  formControlName="name"
                  placeholder="例如：前端開發團隊"
                  maxlength="50">
                <mat-hint>這將是您的團隊的顯示名稱</mat-hint>
                @if (teamForm.get('name')?.invalid && teamForm.get('name')?.touched) {
                  <mat-error>
                    {{ getFieldError('name') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 團隊 slug -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>團隊標識符</mat-label>
                <input 
                  matInput 
                  formControlName="slug"
                  placeholder="例如：frontend-team"
                  maxlength="30">
                <mat-hint>用於 URL 的唯一標識符，只能包含小寫字母、數字和連字符</mat-hint>
                @if (teamForm.get('slug')?.invalid && teamForm.get('slug')?.touched) {
                  <mat-error>
                    {{ getFieldError('slug') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 團隊描述 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>團隊描述（可選）</mat-label>
                <textarea 
                  matInput 
                  formControlName="description"
                  placeholder="簡短描述您的團隊..."
                  rows="3"
                  maxlength="500">
                </textarea>
                <mat-hint>{{ teamForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                @if (teamForm.get('description')?.invalid && teamForm.get('description')?.touched) {
                  <mat-error>
                    {{ getFieldError('description') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 父團隊 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>父團隊（可選）</mat-label>
                <mat-select formControlName="parentTeamId">
                  <mat-option [value]="null">無（頂級團隊）</mat-option>
                  @for (team of availableParentTeams(); track team.id) {
                    <mat-option [value]="team.id">{{ team.name }}</mat-option>
                  }
                </mat-select>
                <mat-hint>選擇一個父團隊來建立層級結構</mat-hint>
              </mat-form-field>

              <!-- 權限設定 -->
              <div class="permissions-section">
                <h3>團隊權限設定</h3>
                
                <!-- Repository 權限 -->
                <div class="permission-group">
                  <h4>Repository 權限</h4>
                  <div class="permission-checkboxes">
                    <mat-checkbox formControlName="repoRead">讀取</mat-checkbox>
                    <mat-checkbox formControlName="repoWrite">寫入</mat-checkbox>
                    <mat-checkbox formControlName="repoAdmin">管理</mat-checkbox>
                  </div>
                </div>

                <!-- Issues 權限 -->
                <div class="permission-group">
                  <h4>Issues 權限</h4>
                  <div class="permission-checkboxes">
                    <mat-checkbox formControlName="issuesRead">讀取</mat-checkbox>
                    <mat-checkbox formControlName="issuesWrite">寫入</mat-checkbox>
                    <mat-checkbox formControlName="issuesDelete">刪除</mat-checkbox>
                  </div>
                </div>

                <!-- Pull Requests 權限 -->
                <div class="permission-group">
                  <h4>Pull Requests 權限</h4>
                  <div class="permission-checkboxes">
                    <mat-checkbox formControlName="prRead">讀取</mat-checkbox>
                    <mat-checkbox formControlName="prWrite">寫入</mat-checkbox>
                    <mat-checkbox formControlName="prMerge">合併</mat-checkbox>
                  </div>
                </div>
              </div>
            </form>
          }
        </mat-card-content>

        <mat-card-actions align="end">
          @if (!isLoading() && !error()) {
            <button 
              mat-button 
              (click)="onCancel()"
              [disabled]="isLoading()">
              取消
            </button>
            <button 
              mat-raised-button 
              color="primary"
              (click)="onSubmit()"
              [disabled]="!teamForm.valid || isLoading()">
              <mat-icon>add</mat-icon>
              建立團隊
            </button>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .team-create-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .create-card {
      width: 100%;
      max-width: 600px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .team-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
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

    .permissions-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .permissions-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .permission-group {
      margin-bottom: 20px;
    }

    .permission-group h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #666;
    }

    .permission-checkboxes {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-card-actions {
      padding: 16px 24px;
      margin: 0;
    }
  `]
})
export class TeamCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamManagementService);
  private snackBar = inject(MatSnackBar);

  // Signals for state management
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _availableParentTeams = signal<any[]>([]);

  // Readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly availableParentTeams = this._availableParentTeams.asReadonly();

  // Form
  teamForm!: FormGroup;
  orgId!: string;

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId')!;
    this.initializeForm();
    this.loadParentTeams();
  }

  private initializeForm() {
    this.teamForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/)
      ]],
      slug: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        Validators.pattern(/^[a-z0-9\-_]+$/)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]],
      parentTeamId: [null],
      // Repository 權限
      repoRead: [true],
      repoWrite: [false],
      repoAdmin: [false],
      // Issues 權限
      issuesRead: [true],
      issuesWrite: [false],
      issuesDelete: [false],
      // Pull Requests 權限
      prRead: [true],
      prWrite: [false],
      prMerge: [false]
    });

    // 自動生成 slug
    this.teamForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.teamForm.get('slug')?.touched) {
        const slug = this.generateSlug(name);
        this.teamForm.get('slug')?.setValue(slug);
      }
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s\-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private loadParentTeams() {
    // TODO: 載入可用的父團隊
    this._availableParentTeams.set([]);
  }

  onSubmit() {
    if (this.teamForm.valid) {
      this.createTeam();
    } else {
      this.markFormGroupTouched();
    }
  }

  private async createTeam() {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const formValue = this.teamForm.value;

      // 驗證表單數據
      const validation = TeamValidator.validateTeamData({
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 建立團隊
      const teamId = await this.teamService.createTeam(
        this.orgId,
        formValue.name,
        formValue.slug,
        formValue.description
      );

      this.snackBar.open('團隊建立成功！', '關閉', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });

      // 導航到團隊詳情
      this.router.navigate(['/organizations', this.orgId, 'teams', teamId]);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : '建立團隊失敗');
      this.snackBar.open(this.error() || '建立團隊失敗', '關閉', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  onCancel() {
    this.router.navigate(['/organizations', this.orgId, 'teams']);
  }

  clearError() {
    this._error.set(null);
  }

  getFieldError(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return '此欄位為必填';
      }
      if (field.errors['minlength']) {
        return `至少需要 ${field.errors['minlength'].requiredLength} 個字符`;
      }
      if (field.errors['maxlength']) {
        return `不能超過 ${field.errors['maxlength'].requiredLength} 個字符`;
      }
      if (field.errors['pattern']) {
        return '格式不正確';
      }
    }
    return '';
  }

  private markFormGroupTouched() {
    Object.keys(this.teamForm.controls).forEach(key => {
      const control = this.teamForm.get(key);
      control?.markAsTouched();
    });
  }
}
