import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationManagementService } from '../../services/organization-management.service';
import { OrganizationValidator } from '../../utils/organization-validator.util';

/**
 * 組織建立組件
 * 單一職責：組織建立功能
 */
@Component({
  selector: 'app-organization-create',
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
    MatIconModule
  ],
  template: `
    <div class="organization-create-container">
      <mat-card class="create-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>business</mat-icon>
            建立新組織
          </mat-card-title>
          <mat-card-subtitle>
            建立一個新的組織來管理您的團隊和專案
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>正在建立組織...</p>
            </div>
          } @else if (error()) {
            <div class="error-container">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ error() }}</p>
              <button mat-button (click)="clearError()">重試</button>
            </div>
          } @else {
            <form [formGroup]="organizationForm" (ngSubmit)="onSubmit()" class="organization-form">
              <!-- 組織名稱 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>組織名稱</mat-label>
                <input 
                  matInput 
                  formControlName="name"
                  placeholder="例如：我的公司"
                  maxlength="50">
                <mat-hint>這將是您的組織的顯示名稱</mat-hint>
                @if (organizationForm.get('name')?.invalid && organizationForm.get('name')?.touched) {
                  <mat-error>
                    {{ getFieldError('name') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 組織 slug -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>組織標識符</mat-label>
                <input 
                  matInput 
                  formControlName="slug"
                  placeholder="例如：my-company"
                  maxlength="30">
                <mat-hint>用於 URL 的唯一標識符，只能包含小寫字母、數字和連字符</mat-hint>
                @if (organizationForm.get('slug')?.invalid && organizationForm.get('slug')?.touched) {
                  <mat-error>
                    {{ getFieldError('slug') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 組織描述 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>組織描述（可選）</mat-label>
                <textarea 
                  matInput 
                  formControlName="description"
                  placeholder="簡短描述您的組織..."
                  rows="3"
                  maxlength="500">
                </textarea>
                <mat-hint>{{ organizationForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                @if (organizationForm.get('description')?.invalid && organizationForm.get('description')?.touched) {
                  <mat-error>
                    {{ getFieldError('description') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 組織網站 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>組織網站（可選）</mat-label>
                <input 
                  matInput 
                  formControlName="website"
                  placeholder="https://example.com"
                  type="url">
                <mat-hint>您的組織的官方網站</mat-hint>
                @if (organizationForm.get('website')?.invalid && organizationForm.get('website')?.touched) {
                  <mat-error>
                    {{ getFieldError('website') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 組織位置 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>組織位置（可選）</mat-label>
                <input 
                  matInput 
                  formControlName="location"
                  placeholder="例如：台北市，台灣"
                  maxlength="100">
                <mat-hint>您的組織的主要位置</mat-hint>
                @if (organizationForm.get('location')?.invalid && organizationForm.get('location')?.touched) {
                  <mat-error>
                    {{ getFieldError('location') }}
                  </mat-error>
                }
              </mat-form-field>

              <!-- 可見性設定 -->
              <div class="visibility-section">
                <h3>可見性設定</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>組織可見性</mat-label>
                  <mat-select formControlName="isPublic">
                    <mat-option [value]="false">私有</mat-option>
                    <mat-option [value]="true">公開</mat-option>
                  </mat-select>
                  <mat-hint>私有組織只有成員可以看到，公開組織所有人都可以看到</mat-hint>
                </mat-form-field>
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
              [disabled]="!organizationForm.valid || isLoading()">
              <mat-icon>add</mat-icon>
              建立組織
            </button>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .organization-create-container {
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

    .organization-form {
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

    .visibility-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .visibility-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
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
export class OrganizationCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private orgService = inject(OrganizationManagementService);
  private snackBar = inject(MatSnackBar);

  // Signals for state management
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Form
  organizationForm!: FormGroup;

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.organizationForm = this.fb.group({
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
      website: ['', [
        Validators.pattern(/^https?:\/\/.+/)
      ]],
      location: ['', [
        Validators.maxLength(100)
      ]],
      isPublic: [false]
    });

    // 自動生成 slug
    this.organizationForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.organizationForm.get('slug')?.touched) {
        const slug = this.generateSlug(name);
        this.organizationForm.get('slug')?.setValue(slug);
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

  onSubmit() {
    if (this.organizationForm.valid) {
      this.createOrganization();
    } else {
      this.markFormGroupTouched();
    }
  }

  private async createOrganization() {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const formValue = this.organizationForm.value;
      const currentUser = this.authService.currentAccount();

      if (!currentUser || currentUser.type !== 'user') {
        throw new Error('請先登入');
      }

      // 驗證表單數據
      const validation = OrganizationValidator.validateOrganizationData({
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description,
        website: formValue.website
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 建立組織
      const orgId = await this.orgService.createOrganization(
        formValue.name,
        formValue.slug,
        currentUser.id,
        formValue.description
      );

      this.snackBar.open('組織建立成功！', '關閉', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });

      // 導航到組織儀表板
      this.router.navigate(['/organizations', orgId]);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : '建立組織失敗');
      this.snackBar.open(this.error() || '建立組織失敗', '關閉', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  onCancel() {
    this.router.navigate(['/organizations']);
  }

  clearError() {
    this._error.set(null);
  }

  getFieldError(fieldName: string): string {
    const field = this.organizationForm.get(fieldName);
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
    Object.keys(this.organizationForm.controls).forEach(key => {
      const control = this.organizationForm.get(key);
      control?.markAsTouched();
    });
  }
}
