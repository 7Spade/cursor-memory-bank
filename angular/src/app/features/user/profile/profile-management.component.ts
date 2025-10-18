import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { UserService } from '../services/user.service';
import { User, SocialAccount, Certificate, NotificationPreferences, PrivacySettings } from '../models/user.model';
import { AvatarUtils } from '../../../core/utils/avatar.utils';

/**
 * 個人資料管理組件 - 對齊 GitHub Account 設計
 * 實作完整的個人資料管理功能
 */
@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="profile-management-wrapper">
      <mat-card class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <img 
              [src]="getAvatarUrl(user()?.avatar)" 
              [alt]="user()?.displayName"
              class="avatar"
            >
            <button mat-icon-button class="avatar-upload-btn" (click)="onAvatarUpload()">
              <mat-icon>camera_alt</mat-icon>
            </button>
          </div>
          <div class="profile-info">
            <h1 class="display-name">{{ user()?.displayName || '未設定' }}</h1>
            <p class="username">{{ '@' + (user()?.username || '未設定') }}</p>
            <p class="bio">{{ user()?.bio || '尚未填寫個人簡介' }}</p>
            <div class="profile-stats">
              <span class="stat">
                <mat-icon>business</mat-icon>
                {{ user()?.organizationMemberships?.length || 0 }} 個組織
              </span>
              <span class="stat">
                <mat-icon>school</mat-icon>
                {{ user()?.certificates?.length || 0 }} 張證照
              </span>
              <span class="stat">
                <mat-icon>link</mat-icon>
                {{ user()?.socialAccounts?.length || 0 }} 個社交帳戶
              </span>
            </div>
          </div>
        </div>
      </mat-card>

      <mat-card class="profile-content">
        <mat-tab-group>
          <!-- 基本資料 -->
          <mat-tab label="基本資料">
            <div class="tab-content">
              <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>顯示名稱</mat-label>
                    <input matInput formControlName="displayName" placeholder="請輸入顯示名稱">
                    <mat-icon matSuffix>person</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>個人簡介</mat-label>
                    <textarea matInput formControlName="bio" rows="3" placeholder="請輸入個人簡介"></textarea>
                    <mat-icon matSuffix>description</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>所在地</mat-label>
                    <input matInput formControlName="location" placeholder="請輸入所在地">
                    <mat-icon matSuffix>location_on</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>公司</mat-label>
                    <input matInput formControlName="company" placeholder="請輸入公司名稱">
                    <mat-icon matSuffix>business</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>個人網站</mat-label>
                    <input matInput formControlName="website" placeholder="https://example.com">
                    <mat-icon matSuffix>language</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>部落格</mat-label>
                    <input matInput formControlName="blog" placeholder="https://blog.example.com">
                    <mat-icon matSuffix>article</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="profileForm.invalid || loading()">
                    <mat-icon>save</mat-icon>
                    儲存變更
                  </button>
                  <button mat-stroked-button type="button" (click)="onResetProfile()">
                    <mat-icon>refresh</mat-icon>
                    重設
                  </button>
                </div>
              </form>
            </div>
          </mat-tab>

          <!-- 社交帳戶 -->
          <mat-tab label="社交帳戶">
            <div class="tab-content">
              <div class="social-accounts-section">
                <h3>已連結的社交帳戶</h3>
                <div class="social-accounts-list" *ngIf="socialAccounts().length > 0; else noSocialAccounts">
                  <div class="social-account-item" *ngFor="let account of socialAccounts()">
                    <div class="account-info">
                      <mat-icon class="provider-icon">{{ getProviderIcon(account.provider) }}</mat-icon>
                      <div class="account-details">
                        <span class="provider-name">{{ getProviderName(account.provider) }}</span>
                        <span class="account-url">{{ account.url }}</span>
                        <mat-chip *ngIf="account.verified" color="primary" class="verified-chip">
                          <mat-icon>verified</mat-icon>
                          已驗證
                        </mat-chip>
                      </div>
                    </div>
                    <button mat-icon-button color="warn" (click)="onRemoveSocialAccount(account)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
                
                <ng-template #noSocialAccounts>
                  <div class="empty-state">
                    <mat-icon>link_off</mat-icon>
                    <p>尚未連結任何社交帳戶</p>
                  </div>
                </ng-template>

                <mat-divider></mat-divider>

                <div class="add-social-account">
                  <h4>新增社交帳戶</h4>
                  <form [formGroup]="socialAccountForm" (ngSubmit)="onAddSocialAccount()">
                    <div class="form-row">
                      <mat-form-field appearance="outline" class="field">
                        <mat-label>平台</mat-label>
                        <mat-select formControlName="provider">
                          <mat-option value="twitter">Twitter</mat-option>
                          <mat-option value="facebook">Facebook</mat-option>
                          <mat-option value="linkedin">LinkedIn</mat-option>
                          <mat-option value="youtube">YouTube</mat-option>
                          <mat-option value="instagram">Instagram</mat-option>
                          <mat-option value="github">GitHub</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline" class="field">
                        <mat-label>帳戶 URL</mat-label>
                        <input matInput formControlName="url" placeholder="https://example.com/username">
                      </mat-form-field>
                    </div>
                    
                    <button mat-raised-button color="primary" type="submit" [disabled]="socialAccountForm.invalid || loading()">
                      <mat-icon>add</mat-icon>
                      新增帳戶
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- 通知設定 -->
          <mat-tab label="通知設定">
            <div class="tab-content">
              <div class="notification-settings-section">
                <h3>通知偏好設定</h3>
                <form [formGroup]="notificationForm" (ngSubmit)="onUpdateNotifications()">
                  <div class="notification-group">
                    <h4>郵件通知</h4>
                    <mat-form-field appearance="outline" class="field">
                      <mat-label>通知頻率</mat-label>
                      <mat-select formControlName="emailFrequency">
                        <mat-option value="immediate">即時</mat-option>
                        <mat-option value="daily">每日摘要</mat-option>
                        <mat-option value="weekly">每週摘要</mat-option>
                        <mat-option value="never">永不</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="notificationForm.invalid || loading()">
                      <mat-icon>save</mat-icon>
                      儲存設定
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-management-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .profile-card {
      margin-bottom: 24px;
      border-radius: 16px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 24px;
    }

    .avatar-section {
      position: relative;
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #e0e0e0;
    }

    .avatar-upload-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #1976d2;
      color: white;
    }

    .profile-info {
      flex: 1;
    }

    .display-name {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }

    .username {
      font-size: 16px;
      color: #666;
      margin: 0 0 12px 0;
    }

    .bio {
      font-size: 14px;
      color: #666;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .profile-stats {
      display: flex;
      gap: 24px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .profile-content {
      border-radius: 16px;
    }

    .tab-content {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .social-accounts-section h3,
    .notification-settings-section h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .social-accounts-list {
      margin-bottom: 24px;
    }

    .social-account-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .account-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .provider-icon {
      font-size: 24px;
      color: #1976d2;
    }

    .account-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .provider-name {
      font-weight: 500;
      color: #333;
    }

    .account-url {
      font-size: 12px;
      color: #666;
    }

    .verified-chip {
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .notification-group {
      margin-bottom: 24px;
    }

    .notification-group h4 {
      margin: 0 0 16px 0;
      color: #333;
    }
  `]
})
export class ProfileManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // Signals
  user = signal<User | null>(null);
  socialAccounts = signal<SocialAccount[]>([]);
  loading = signal(false);

  // Forms
  profileForm!: FormGroup;
  socialAccountForm!: FormGroup;
  notificationForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();
    this.loadUserData();
  }

  private initializeForms() {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
      bio: [''],
      location: [''],
      company: [''],
      website: [''],
      blog: ['']
    });

    this.socialAccountForm = this.fb.group({
      provider: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });

    this.notificationForm = this.fb.group({
      emailFrequency: ['daily']
    });
  }

  private loadUserData() {
    this.loading.set(true);
    
    // 使用 Firebase 整合的 UserService
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.user.set(user);
          this.socialAccounts.set(user.socialAccounts || []);
          
          // 更新表單
          this.profileForm.patchValue({
            displayName: user.displayName,
            bio: user.bio,
            location: user.location,
            company: user.company,
            website: user.website,
            blog: user.blog
          });
          
          this.notificationForm.patchValue({
            emailFrequency: user.notificationPreferences?.email?.frequency || 'daily'
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('載入用戶資料失敗:', error);
        this.loading.set(false);
      }
    });
  }

  // Event handlers
  onUpdateProfile() {
    if (this.profileForm.valid) {
      this.loading.set(true);
      
      const updates = this.profileForm.value;
      this.userService.updateUser(updates).subscribe({
        next: (updatedUser) => {
          if (updatedUser) {
            this.user.set(updatedUser);
            this.snackBar.open('個人資料更新成功', '關閉', { duration: 3000 });
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('更新個人資料失敗:', error);
          this.snackBar.open('更新失敗，請重試', '關閉', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  onResetProfile() {
    const user = this.user();
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName,
        bio: user.bio,
        location: user.location,
        company: user.company,
        website: user.website,
        blog: user.blog
      });
    }
  }

  onAddSocialAccount() {
    if (this.socialAccountForm.valid) {
      this.loading.set(true);
      // TODO: 實作新增社交帳戶
      setTimeout(() => {
        this.socialAccountForm.reset();
        this.snackBar.open('社交帳戶新增成功', '關閉', { duration: 3000 });
        this.loading.set(false);
      }, 1000);
    }
  }

  onRemoveSocialAccount(account: SocialAccount) {
    // TODO: 實作移除社交帳戶
    this.snackBar.open('社交帳戶已移除', '關閉', { duration: 3000 });
  }

  onUpdateNotifications() {
    if (this.notificationForm.valid) {
      this.loading.set(true);
      // TODO: 實作更新通知設定
      setTimeout(() => {
        this.snackBar.open('通知設定更新成功', '關閉', { duration: 3000 });
        this.loading.set(false);
      }, 1000);
    }
  }

  onAvatarUpload() {
    // 創建文件輸入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.loading.set(true);
        
        this.userService.uploadAvatar(file).subscribe({
          next: (result) => {
            if (result.avatarUrl) {
              // 更新用戶頭像 URL
              const currentUser = this.user();
              if (currentUser) {
                this.user.set({ ...currentUser, avatar: result.avatarUrl });
              }
              this.snackBar.open('頭像上傳成功', '關閉', { duration: 3000 });
            }
            this.loading.set(false);
          },
          error: (error) => {
            console.error('頭像上傳失敗:', error);
            this.snackBar.open('頭像上傳失敗，請重試', '關閉', { duration: 3000 });
            this.loading.set(false);
          }
        });
      }
    };
    
    input.click();
  }

  // Utility methods
  getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      twitter: 'chat',
      facebook: 'facebook',
      linkedin: 'work',
      youtube: 'video_library',
      instagram: 'photo_camera',
      github: 'code'
    };
    return icons[provider] || 'link';
  }

  getProviderName(provider: string): string {
    const names: Record<string, string> = {
      twitter: 'Twitter',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      instagram: 'Instagram',
      github: 'GitHub'
    };
    return names[provider] || provider;
  }

  getAvatarUrl(avatar: string | undefined): string {
    return AvatarUtils.getAvatarUrl(avatar);
  }
}