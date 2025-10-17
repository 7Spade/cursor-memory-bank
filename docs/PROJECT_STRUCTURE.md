# 營建管理系統 - 專案結構文件

## 1. 專案概述

### 1.1 專案結構說明
本文件詳細描述了營建管理系統的前端專案結構，採用 Angular 17+ 框架，遵循現代化的前端開發最佳實踐，包括模組化設計、分層架構、和清晰的檔案組織。

### 1.2 架構原則
- **模組化設計**: 按功能領域劃分模組
- **分層架構**: 清晰的責任分離
- **可擴展性**: 易於添加新功能
- **可維護性**: 清晰的代碼組織
- **可測試性**: 便於單元測試和整合測試

## 2. 專案根目錄結構

```
src/
├── app/                                    # 應用程式主目錄
│   ├── app.component.ts                    # 根元件
│   ├── app.config.ts                       # 應用程式配置
│   ├── app.routes.ts                       # 路由配置
│   │
│   ├── features/                           # 功能模組 (第3層)
│   │   ├── user/                          # 用戶模組 ✨
│   │   ├── organization/                   # 組織模組 ✨
│   │   ├── project/                       # 專案模組 ✨
│   │   ├── social/                         # 社交模組 ✨
│   │   ├── achievement/                    # 成就模組 ✨
│   │   └── notification/                   # 通知模組 ✨
│   │
│   ├── shared/                             # 共享模組 (第2層)
│   │   ├── components/                    # 共享元件
│   │   ├── services/                      # 共享服務
│   │   ├── models/                        # 共享模型
│   │   ├── pipes/                         # 共享管道
│   │   ├── directives/                    # 共享指令
│   │   └── utils/                         # 工具函數
│   │
│   ├── core/                              # 核心模組 (第1層)
│   │   ├── auth/                          # 認證核心
│   │   ├── http/                          # HTTP 核心
│   │   ├── storage/                       # 儲存核心
│   │   ├── config/                        # 配置核心
│   │   └── guards/                        # 路由守衛
│   │
│   ├── layouts/                           # 佈局元件
│   │   ├── main-layout/                   # 主要佈局
│   │   ├── auth-layout/                   # 認證佈局
│   │   └── dashboard-layout/             # 儀表板佈局
│   │
│   └── environments/                       # 環境配置
│       ├── environment.ts                 # 開發環境
│       ├── environment.prod.ts            # 生產環境
│       └── environment.staging.ts         # 測試環境
│
├── assets/                                 # 靜態資源
│   ├── images/                            # 圖片資源
│   ├── icons/                             # 圖標資源
│   ├── fonts/                             # 字體資源
│   └── data/                              # 靜態資料
│
├── styles/                                 # 全域樣式
│   ├── _variables.scss                    # SCSS 變數
│   ├── _mixins.scss                       # SCSS 混入
│   ├── _base.scss                         # 基礎樣式
│   └── _themes.scss                       # 主題樣式
│
└── tests/                                  # 測試檔案
    ├── unit/                              # 單元測試
    ├── integration/                       # 整合測試
    └── e2e/                               # 端對端測試
```

## 3. 功能模組詳細結構

### 3.1 用戶模組 (User Module)

```
src/app/features/user/
├── auth/                                  # 認證相關
│   ├── components/                        # 認證元件
│   │   ├── login.component.ts
│   │   ├── registration.component.ts
│   │   ├── forgot-password.component.ts
│   │   ├── email-verification.component.ts
│   │   └── auth-form.component.ts
│   │
│   ├── services/                          # 認證服務
│   │   ├── auth.service.ts
│   │   ├── firebase-auth.service.ts
│   │   └── email.service.ts
│   │
│   ├── guards/                            # 認證守衛
│   │   ├── auth.guard.ts
│   │   ├── guest.guard.ts
│   │   └── role.guard.ts
│   │
│   ├── interceptors/                      # HTTP 攔截器
│   │   └── auth.interceptor.ts
│   │
│   ├── commands/                          # CQRS 命令
│   │   ├── login-user.command.ts
│   │   ├── register-user.command.ts
│   │   ├── forgot-password.command.ts
│   │   └── verify-email.command.ts
│   │
│   ├── events/                            # CQRS 事件
│   │   ├── user-created.event.ts
│   │   ├── user-logged-in.event.ts
│   │   └── user-logged-out.event.ts
│   │
│   ├── models/                            # 認證模型
│   │   ├── auth-user.model.ts
│   │   ├── login-request.model.ts
│   │   └── register-request.model.ts
│   │
│   ├── pages/                             # 認證頁面
│   │   ├── login.page.ts
│   │   ├── register.page.ts
│   │   └── forgot-password.page.ts
│   │
│   └── index.ts                           # 模組匯出
│
├── profile/                               # 個人資料相關
│   ├── components/                        # 個人資料元件
│   │   ├── profile-card.component.ts
│   │   ├── profile-edit.component.ts
│   │   ├── avatar.component.ts
│   │   ├── basic-info.component.ts
│   │   ├── contact-info.component.ts
│   │   └── skills.component.ts
│   │
│   ├── services/                          # 個人資料服務
│   │   ├── profile.service.ts
│   │   ├── profile-domain.service.ts
│   │   └── firestore-profile.repository.ts
│   │
│   ├── commands/                          # CQRS 命令
│   │   ├── create-profile.command.ts
│   │   ├── update-profile.command.ts
│   │   └── upload-avatar.command.ts
│   │
│   ├── queries/                           # CQRS 查詢
│   │   ├── get-profile.query.ts
│   │   └── get-profile-by-id.query.ts
│   │
│   ├── events/                            # CQRS 事件
│   │   ├── profile-updated.event.ts
│   │   └── avatar-uploaded.event.ts
│   │
│   ├── models/                            # 個人資料模型
│   │   ├── user-profile.model.ts
│   │   ├── contact-info.model.ts
│   │   └── skill.model.ts
│   │
│   ├── pages/                             # 個人資料頁面
│   │   ├── profile.page.ts
│   │   └── profile-edit.page.ts
│   │
│   └── index.ts                           # 模組匯出
│
├── certificates/                           # 證照相關
│   ├── components/                        # 證照元件
│   │   ├── certificate-management.component.ts
│   │   ├── certificate-list.component.ts
│   │   ├── certificate-upload.component.ts
│   │   ├── certificate-verification.component.ts
│   │   └── certificate-card.component.ts
│   │
│   ├── services/                          # 證照服務
│   │   ├── certificate.service.ts
│   │   ├── certificate-domain.service.ts
│   │   └── firestore-certificate.repository.ts
│   │
│   ├── commands/                          # CQRS 命令
│   │   ├── add-certificate.command.ts
│   │   ├── update-certificate.command.ts
│   │   ├── verify-certificate.command.ts
│   │   └── delete-certificate.command.ts
│   │
│   ├── queries/                           # CQRS 查詢
│   │   ├── get-certificates.query.ts
│   │   └── get-certificate-by-id.query.ts
│   │
│   ├── events/                            # CQRS 事件
│   │   ├── certificate-added.event.ts
│   │   ├── certificate-verified.event.ts
│   │   └── certificate-expired.event.ts
│   │
│   ├── models/                            # 證照模型
│   │   ├── certificate.model.ts
│   │   └── certificate-verification.model.ts
│   │
│   ├── pages/                             # 證照頁面
│   │   ├── certificates.page.ts
│   │   └── certificate-detail.page.ts
│   │
│   └── index.ts                           # 模組匯出
│
├── social/                                # 社交相關
│   ├── components/                        # 社交元件
│   │   ├── following-list.component.ts
│   │   ├── followers-list.component.ts
│   │   ├── social-button.component.ts
│   │   ├── social-card.component.ts
│   │   └── connection-graph.component.ts
│   │
│   ├── services/                          # 社交服務
│   │   ├── social.service.ts
│   │   ├── social-domain.service.ts
│   │   └── firestore-social.repository.ts
│   │
│   ├── commands/                          # CQRS 命令
│   │   ├── follow-user.command.ts
│   │   ├── unfollow-user.command.ts
│   │   └── block-user.command.ts
│   │
│   ├── queries/                           # CQRS 查詢
│   │   ├── get-following.query.ts
│   │   ├── get-followers.query.ts
│   │   └── get-mutual-connections.query.ts
│   │
│   ├── events/                            # CQRS 事件
│   │   ├── user-followed.event.ts
│   │   └── user-unfollowed.event.ts
│   │
│   ├── models/                            # 社交模型
│   │   ├── social-connection.model.ts
│   │   └── social-recommendation.model.ts
│   │
│   └── index.ts                           # 模組匯出
│
├── notifications/                          # 通知相關
│   ├── components/                        # 通知元件
│   │   ├── notification-center.component.ts
│   │   ├── notification-list.component.ts
│   │   ├── notification-settings.component.ts
│   │   └── notification-badge.component.ts
│   │
│   ├── services/                          # 通知服務
│   │   ├── notification.service.ts
│   │   ├── push-notification.service.ts
│   │   └── firestore-notification.repository.ts
│   │
│   ├── models/                            # 通知模型
│   │   ├── notification.model.ts
│   │   └── notification-settings.model.ts
│   │
│   ├── pages/                             # 通知頁面
│   │   └── notifications.page.ts
│   │
│   └── index.ts                           # 模組匯出
│
├── pages/                                 # 用戶頁面
│   ├── user-profile.page.ts
│   ├── user-settings.page.ts
│   ├── user-dashboard.page.ts
│   └── user-activity.page.ts
│
├── state/                                 # 狀態管理
│   ├── user-state.service.ts
│   ├── auth-state.service.ts
│   ├── profile-state.service.ts
│   └── social-state.service.ts
│
├── models/                                # 用戶模型
│   ├── user.model.ts
│   ├── user-profile.model.ts
│   └── user-settings.model.ts
│
├── services/                              # 用戶服務
│   ├── user.service.ts
│   └── user.repository.ts
│
├── routes/                                # 用戶路由
│   └── user.routes.ts
│
└── index.ts                               # 模組匯出
```

### 3.2 組織模組 (Organization Module)

```
src/app/features/organization/
├── components/                            # 組織元件
│   ├── organization-card.component.ts
│   ├── organization-form.component.ts
│   ├── organization-list.component.ts
│   ├── team-management.component.ts
│   ├── team-hierarchy.component.ts        # 新增：團隊層級管理
│   ├── member-management.component.ts
│   ├── project-assignment.component.ts
│   ├── organization-settings.component.ts
│   ├── organization-stats.component.ts
│   ├── security-manager.component.ts       # 新增：安全管理器
│   ├── role-management.component.ts       # 新增：角色管理
│   └── team-member-management.component.ts # 新增：團隊成員管理
│
├── pages/                                 # 組織頁面
│   ├── organization-list.page.ts
│   ├── organization-detail.page.ts
│   ├── organization-settings.page.ts
│   ├── organization-members.page.ts
│   ├── organization-teams.page.ts
│   ├── organization-security.page.ts       # 新增：安全管理頁面
│   ├── organization-roles.page.ts         # 新增：角色管理頁面
│   └── team-hierarchy.page.ts            # 新增：團隊層級頁面
│
├── services/                              # 組織服務
│   ├── organization.service.ts
│   ├── organization-domain.service.ts
│   ├── team.service.ts
│   ├── team-hierarchy.service.ts          # 新增：團隊層級服務
│   ├── member.service.ts
│   ├── security-manager.service.ts        # 新增：安全管理器服務
│   ├── organization-role.service.ts       # 新增：組織角色服務
│   └── firestore-organization.repository.ts
│
├── commands/                              # CQRS 命令
│   ├── create-organization.command.ts
│   ├── update-organization.command.ts
│   ├── add-member.command.ts
│   ├── remove-member.command.ts
│   ├── create-team.command.ts
│   ├── create-nested-team.command.ts      # 新增：創建嵌套團隊
│   ├── assign-project.command.ts
│   ├── add-security-manager.command.ts    # 新增：添加安全管理器
│   ├── remove-security-manager.command.ts # 新增：移除安全管理器
│   ├── create-organization-role.command.ts # 新增：創建組織角色
│   └── assign-team-member-role.command.ts # 新增：分配團隊成員角色
│
├── queries/                               # CQRS 查詢
│   ├── get-organizations.query.ts
│   ├── get-organization-by-id.query.ts
│   ├── get-organization-members.query.ts
│   ├── get-organization-teams.query.ts
│   ├── get-team-hierarchy.query.ts        # 新增：獲取團隊層級
│   ├── get-security-managers.query.ts     # 新增：獲取安全管理器
│   ├── get-organization-roles.query.ts   # 新增：獲取組織角色
│   └── get-team-members.query.ts         # 新增：獲取團隊成員
│
├── events/                                # CQRS 事件
│   ├── organization-created.event.ts
│   ├── member-added.event.ts
│   ├── team-created.event.ts
│   ├── nested-team-created.event.ts      # 新增：嵌套團隊創建事件
│   ├── project-assigned.event.ts
│   ├── security-manager-added.event.ts   # 新增：安全管理器添加事件
│   ├── team-member-role-changed.event.ts # 新增：團隊成員角色變更事件
│   └── organization-role-created.event.ts # 新增：組織角色創建事件
│
├── models/                                # 組織模型
│   ├── organization.model.ts
│   ├── organization-member.model.ts
│   ├── team.model.ts
│   ├── team-member.model.ts               # 新增：團隊成員模型
│   ├── team-hierarchy.model.ts           # 新增：團隊層級模型
│   ├── security-manager.model.ts         # 新增：安全管理器模型
│   ├── organization-role.model.ts        # 新增：組織角色模型
│   └── organization-settings.model.ts
│
├── state/                                 # 狀態管理
│   ├── organization-state.service.ts
│   ├── team-state.service.ts
│   ├── team-hierarchy-state.service.ts   # 新增：團隊層級狀態
│   ├── member-state.service.ts
│   ├── security-manager-state.service.ts # 新增：安全管理器狀態
│   └── organization-role-state.service.ts # 新增：組織角色狀態
│
├── routes/                                # 組織路由
│   └── organization.routes.ts
│
└── index.ts                               # 模組匯出
```

### 3.3 專案模組 (Project Module)

```
src/app/features/project/
├── components/                            # 專案元件
│   ├── project-card.component.ts
│   ├── project-form.component.ts
│   ├── project-list.component.ts
│   ├── project-dashboard.component.ts
│   ├── milestone-management.component.ts
│   ├── task-management.component.ts
│   ├── document-management.component.ts
│   ├── photo-gallery.component.ts
│   ├── cost-control.component.ts
│   ├── gantt-chart.component.ts
│   └── project-timeline.component.ts
│
├── pages/                                 # 專案頁面
│   ├── project-list.page.ts
│   ├── project-detail.page.ts
│   ├── project-dashboard.page.ts
│   ├── project-tasks.page.ts
│   ├── project-documents.page.ts
│   ├── project-photos.page.ts
│   ├── project-cost.page.ts
│   └── project-settings.page.ts
│
├── services/                              # 專案服務
│   ├── project.service.ts
│   ├── project-domain.service.ts
│   ├── milestone.service.ts
│   ├── task.service.ts
│   ├── document.service.ts
│   ├── cost-control.service.ts
│   └── firestore-project.repository.ts
│
├── commands/                              # CQRS 命令
│   ├── create-project.command.ts
│   ├── update-project.command.ts
│   ├── add-milestone.command.ts
│   ├── create-task.command.ts
│   ├── upload-document.command.ts
│   ├── add-daily-report.command.ts
│   └── update-cost.command.ts
│
├── queries/                               # CQRS 查詢
│   ├── get-projects.query.ts
│   ├── get-project-by-id.query.ts
│   ├── get-project-milestones.query.ts
│   ├── get-project-tasks.query.ts
│   └── get-project-cost.query.ts
│
├── events/                                # CQRS 事件
│   ├── project-created.event.ts
│   ├── milestone-added.event.ts
│   ├── task-created.event.ts
│   ├── document-uploaded.event.ts
│   └── cost-updated.event.ts
│
├── models/                                # 專案模型
│   ├── project.model.ts
│   ├── milestone.model.ts
│   ├── task.model.ts
│   ├── document.model.ts
│   ├── daily-report.model.ts
│   ├── inspection.model.ts
│   ├── material.model.ts
│   ├── equipment.model.ts
│   ├── safety-record.model.ts
│   ├── weather-log.model.ts
│   ├── comment.model.ts
│   └── cost-control.model.ts
│
├── state/                                 # 狀態管理
│   ├── project-state.service.ts
│   ├── milestone-state.service.ts
│   ├── task-state.service.ts
│   └── cost-state.service.ts
│
├── routes/                                # 專案路由
│   └── project.routes.ts
│
└── index.ts                               # 模組匯出
```

### 3.4 社交模組 (Social Module)

```
src/app/features/social/
├── components/                            # 社交元件
│   ├── social-feed.component.ts
│   ├── post-card.component.ts
│   ├── comment-section.component.ts
│   ├── like-button.component.ts
│   ├── share-button.component.ts
│   ├── user-mention.component.ts
│   └── hashtag.component.ts
│
├── pages/                                 # 社交頁面
│   ├── social-feed.page.ts
│   ├── post-detail.page.ts
│   └── user-profile.page.ts
│
├── services/                              # 社交服務
│   ├── social-feed.service.ts
│   ├── post.service.ts
│   ├── comment.service.ts
│   └── firestore-social.repository.ts
│
├── commands/                              # CQRS 命令
│   ├── create-post.command.ts
│   ├── like-post.command.ts
│   ├── add-comment.command.ts
│   └── share-post.command.ts
│
├── queries/                               # CQRS 查詢
│   ├── get-social-feed.query.ts
│   ├── get-post-by-id.query.ts
│   └── get-user-posts.query.ts
│
├── events/                                # CQRS 事件
│   ├── post-created.event.ts
│   ├── post-liked.event.ts
│   └── comment-added.event.ts
│
├── models/                                # 社交模型
│   ├── post.model.ts
│   ├── comment.model.ts
│   ├── like.model.ts
│   └── share.model.ts
│
├── state/                                 # 狀態管理
│   ├── social-state.service.ts
│   └── post-state.service.ts
│
├── routes/                                # 社交路由
│   └── social.routes.ts
│
└── index.ts                               # 模組匯出
```

### 3.5 成就模組 (Achievement Module)

```
src/app/features/achievement/
├── components/                            # 成就元件
│   ├── achievement-card.component.ts
│   ├── achievement-list.component.ts
│   ├── achievement-progress.component.ts
│   ├── leaderboard.component.ts
│   ├── badge-display.component.ts
│   └── achievement-notification.component.ts
│
├── pages/                                 # 成就頁面
│   ├── achievements.page.ts
│   ├── leaderboard.page.ts
│   └── achievement-detail.page.ts
│
├── services/                              # 成就服務
│   ├── achievement.service.ts
│   ├── achievement-domain.service.ts
│   ├── leaderboard.service.ts
│   └── firestore-achievement.repository.ts
│
├── commands/                              # CQRS 命令
│   ├── create-achievement.command.ts
│   ├── award-achievement.command.ts
│   └── update-leaderboard.command.ts
│
├── queries/                               # CQRS 查詢
│   ├── get-achievements.query.ts
│   ├── get-user-achievements.query.ts
│   └── get-leaderboard.query.ts
│
├── events/                                # CQRS 事件
│   ├── achievement-earned.event.ts
│   ├── leaderboard-updated.event.ts
│   └── badge-unlocked.event.ts
│
├── models/                                # 成就模型
│   ├── achievement.model.ts
│   ├── user-achievement.model.ts
│   ├── leaderboard-entry.model.ts
│   └── achievement-rule.model.ts
│
├── state/                                 # 狀態管理
│   ├── achievement-state.service.ts
│   └── leaderboard-state.service.ts
│
├── routes/                                # 成就路由
│   └── achievement.routes.ts
│
└── index.ts                               # 模組匯出
```

### 3.6 通知模組 (Notification Module)

```
src/app/features/notification/
├── components/                            # 通知元件
│   ├── notification-center.component.ts
│   ├── notification-list.component.ts
│   ├── notification-settings.component.ts
│   ├── notification-badge.component.ts
│   ├── notification-toast.component.ts
│   └── notification-item.component.ts
│
├── pages/                                 # 通知頁面
│   ├── notifications.page.ts
│   └── notification-settings.page.ts
│
├── services/                              # 通知服務
│   ├── notification.service.ts
│   ├── push-notification.service.ts
│   ├── email-notification.service.ts
│   └── firestore-notification.repository.ts
│
├── commands/                              # CQRS 命令
│   ├── send-notification.command.ts
│   ├── mark-as-read.command.ts
│   └── update-settings.command.ts
│
├── queries/                               # CQRS 查詢
│   ├── get-notifications.query.ts
│   ├── get-unread-count.query.ts
│   └── get-notification-settings.query.ts
│
├── events/                                # CQRS 事件
│   ├── notification-sent.event.ts
│   ├── notification-read.event.ts
│   └── settings-updated.event.ts
│
├── models/                                # 通知模型
│   ├── notification.model.ts
│   ├── notification-settings.model.ts
│   └── notification-template.model.ts
│
├── state/                                 # 狀態管理
│   ├── notification-state.service.ts
│   └── settings-state.service.ts
│
├── routes/                                # 通知路由
│   └── notification.routes.ts
│
└── index.ts                               # 模組匯出
```

## 4. 共享模組結構

### 4.1 共享元件 (Shared Components)

```
src/app/shared/components/
├── ui/                                    # UI 元件
│   ├── button/
│   │   ├── button.component.ts
│   │   ├── button.component.html
│   │   ├── button.component.scss
│   │   └── button.component.spec.ts
│   │
│   ├── input/
│   │   ├── input.component.ts
│   │   ├── input.component.html
│   │   ├── input.component.scss
│   │   └── input.component.spec.ts
│   │
│   ├── modal/
│   │   ├── modal.component.ts
│   │   ├── modal.component.html
│   │   ├── modal.component.scss
│   │   └── modal.component.spec.ts
│   │
│   ├── table/
│   │   ├── table.component.ts
│   │   ├── table.component.html
│   │   ├── table.component.scss
│   │   └── table.component.spec.ts
│   │
│   └── chart/
│       ├── chart.component.ts
│       ├── chart.component.html
│       ├── chart.component.scss
│       └── chart.component.spec.ts
│
├── forms/                                 # 表單元件
│   ├── form-field/
│   ├── form-validation/
│   ├── form-stepper/
│   └── form-wizard/
│
├── layout/                                # 佈局元件
│   ├── header/
│   ├── sidebar/
│   ├── footer/
│   └── breadcrumb/
│
├── data/                                  # 資料元件
│   ├── data-table/
│   ├── data-grid/
│   ├── data-list/
│   └── data-tree/
│
└── media/                                 # 媒體元件
    ├── image-gallery/
    ├── video-player/
    ├── file-upload/
    └── media-viewer/
```

### 4.2 共享服務 (Shared Services)

```
src/app/shared/services/
├── http/                                  # HTTP 服務
│   ├── http.service.ts
│   ├── api.service.ts
│   └── error-handler.service.ts
│
├── storage/                                # 儲存服務
│   ├── storage.service.ts
│   ├── local-storage.service.ts
│   └── session-storage.service.ts
│
├── utils/                                 # 工具服務
│   ├── date.service.ts
│   ├── format.service.ts
│   ├── validation.service.ts
│   └── crypto.service.ts
│
├── ui/                                    # UI 服務
│   ├── dialog.service.ts
│   ├── toast.service.ts
│   ├── loading.service.ts
│   └── theme.service.ts
│
└── business/                              # 業務服務
    ├── permission.service.ts
    ├── audit.service.ts
    └── analytics.service.ts
```

### 4.3 共享模型 (Shared Models)

```
src/app/shared/models/
├── base/                                  # 基礎模型
│   ├── base.model.ts
│   ├── entity.model.ts
│   └── value-object.model.ts
│
├── common/                                # 通用模型
│   ├── pagination.model.ts
│   ├── filter.model.ts
│   ├── sort.model.ts
│   └── search.model.ts
│
├── api/                                   # API 模型
│   ├── api-response.model.ts
│   ├── api-error.model.ts
│   └── api-request.model.ts
│
└── ui/                                    # UI 模型
    ├── menu-item.model.ts
    ├── breadcrumb.model.ts
    └── notification.model.ts
```

## 5. 核心模組結構

### 5.1 認證核心 (Auth Core)

```
src/app/core/auth/
├── services/
│   ├── auth.service.ts
│   ├── token.service.ts
│   └── permission.service.ts
│
├── guards/
│   ├── auth.guard.ts
│   ├── guest.guard.ts
│   └── role.guard.ts
│
├── interceptors/
│   └── auth.interceptor.ts
│
├── models/
│   ├── user.model.ts
│   ├── token.model.ts
│   └── permission.model.ts
│
└── index.ts
```

### 5.2 HTTP 核心 (HTTP Core)

```
src/app/core/http/
├── services/
│   ├── http.service.ts
│   ├── api.service.ts
│   └── error-handler.service.ts
│
├── interceptors/
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   └── loading.interceptor.ts
│
├── models/
│   ├── api-response.model.ts
│   ├── api-error.model.ts
│   └── http-config.model.ts
│
└── index.ts
```

### 5.3 儲存核心 (Storage Core)

```
src/app/core/storage/
├── services/
│   ├── storage.service.ts
│   ├── local-storage.service.ts
│   └── session-storage.service.ts
│
├── models/
│   ├── storage-item.model.ts
│   └── storage-config.model.ts
│
└── index.ts
```

## 6. 佈局元件結構

### 6.1 主要佈局 (Main Layout)

```
src/app/layouts/main-layout/
├── components/
│   ├── header/
│   │   ├── header.component.ts
│   │   ├── header.component.html
│   │   ├── header.component.scss
│   │   └── header.component.spec.ts
│   │
│   ├── sidebar/
│   │   ├── sidebar.component.ts
│   │   ├── sidebar.component.html
│   │   ├── sidebar.component.scss
│   │   └── sidebar.component.spec.ts
│   │
│   └── footer/
│       ├── footer.component.ts
│       ├── footer.component.html
│       ├── footer.component.scss
│       └── footer.component.spec.ts
│
├── main-layout.component.ts
├── main-layout.component.html
├── main-layout.component.scss
├── main-layout.component.spec.ts
└── index.ts
```

### 6.2 認證佈局 (Auth Layout)

```
src/app/layouts/auth-layout/
├── components/
│   ├── auth-header/
│   └── auth-footer/
│
├── auth-layout.component.ts
├── auth-layout.component.html
├── auth-layout.component.scss
├── auth-layout.component.spec.ts
└── index.ts
```

## 7. 測試結構

### 7.1 單元測試 (Unit Tests)

```
src/tests/unit/
├── components/                            # 元件測試
│   ├── user/
│   ├── organization/
│   ├── project/
│   └── shared/
│
├── services/                              # 服務測試
│   ├── user/
│   ├── organization/
│   ├── project/
│   └── shared/
│
├── pipes/                                 # 管道測試
├── directives/                            # 指令測試
└── utils/                                 # 工具測試
```

### 7.2 整合測試 (Integration Tests)

```
src/tests/integration/
├── features/                              # 功能整合測試
│   ├── user/
│   ├── organization/
│   ├── project/
│   └── social/
│
├── api/                                   # API 整合測試
├── auth/                                  # 認證整合測試
└── e2e/                                   # 端對端測試
```

## 8. 配置檔案

### 8.1 Angular 配置

```
angular.json                               # Angular 專案配置
tsconfig.json                              # TypeScript 配置
tsconfig.app.json                          # 應用程式 TypeScript 配置
tsconfig.spec.json                         # 測試 TypeScript 配置
```

### 8.2 環境配置

```
src/environments/
├── environment.ts                         # 開發環境
├── environment.prod.ts                    # 生產環境
├── environment.staging.ts                 # 測試環境
└── environment.test.ts                    # 測試環境
```

### 8.3 樣式配置

```
src/styles/
├── _variables.scss                        # SCSS 變數
├── _mixins.scss                           # SCSS 混入
├── _base.scss                             # 基礎樣式
├── _themes.scss                           # 主題樣式
├── _components.scss                       # 元件樣式
└── styles.scss                            # 主要樣式檔案
```

## 9. 開發指南

### 9.1 檔案命名規範

#### 9.1.1 元件檔案
- **元件檔案**: `kebab-case.component.ts`
- **HTML 模板**: `kebab-case.component.html`
- **樣式檔案**: `kebab-case.component.scss`
- **測試檔案**: `kebab-case.component.spec.ts`

#### 9.1.2 服務檔案
- **服務檔案**: `kebab-case.service.ts`
- **測試檔案**: `kebab-case.service.spec.ts`

#### 9.1.3 模型檔案
- **模型檔案**: `kebab-case.model.ts`

#### 9.1.4 頁面檔案
- **頁面檔案**: `kebab-case.page.ts`

### 9.2 目錄結構規範

#### 9.2.1 功能模組結構
```
feature-name/
├── components/                            # 元件目錄
├── pages/                                 # 頁面目錄
├── services/                              # 服務目錄
├── models/                                # 模型目錄
├── state/                                 # 狀態管理目錄
├── routes/                                # 路由目錄
└── index.ts                               # 模組匯出
```

#### 9.2.2 元件目錄結構
```
component-name/
├── component-name.component.ts
├── component-name.component.html
├── component-name.component.scss
├── component-name.component.spec.ts
└── index.ts                               # 元件匯出
```

### 9.3 代碼組織原則

#### 9.3.1 單一職責原則
- 每個元件只負責一個功能
- 每個服務只處理一種業務邏輯
- 每個模型只定義一種資料結構

#### 9.3.2 依賴注入原則
- 使用 Angular 的依賴注入系統
- 避免直接實例化服務
- 使用介面定義服務契約

#### 9.3.3 模組化原則
- 按功能領域劃分模組
- 保持模組間的鬆耦合
- 使用共享模組提供通用功能

### 9.4 測試策略

#### 9.4.1 單元測試
- 每個元件和服務都應該有對應的測試
- 測試覆蓋率應該達到 80% 以上
- 使用 Jasmine 和 Karma 進行測試

#### 9.4.2 整合測試
- 測試模組間的整合
- 測試 API 整合
- 使用 Protractor 進行端對端測試

#### 9.4.3 測試檔案組織
- 測試檔案與源檔案放在同一目錄
- 使用 `.spec.ts` 後綴命名測試檔案
- 測試檔案應該與源檔案保持相同的結構

## 10. 部署與建置

### 10.1 建置配置

#### 10.1.1 開發建置
```bash
ng build --configuration=development
```

#### 10.1.2 生產建置
```bash
ng build --configuration=production
```

#### 10.1.3 測試建置
```bash
ng build --configuration=staging
```

### 10.2 部署策略

#### 10.2.1 靜態部署
- 使用 Nginx 或 Apache 提供靜態檔案
- 配置適當的快取策略
- 使用 CDN 加速資源載入

#### 10.2.2 容器化部署
- 使用 Docker 容器化應用
- 使用 Kubernetes 進行容器編排
- 配置適當的資源限制和健康檢查

### 10.3 監控與日誌

#### 10.3.1 應用程式監控
- 使用 Angular 的錯誤處理機制
- 整合第三方監控服務
- 配置適當的告警機制

#### 10.3.2 效能監控
- 監控頁面載入時間
- 監控 API 回應時間
- 監控用戶體驗指標

---

**文件版本**: v1.0  
**最後更新**: 2024-01-01  
**維護者**: 前端開發團隊  
**審核者**: 技術架構師
