# 組織和團隊管理功能結構樹設計

## 📋 設計原則

基於**單一職責原則**設計的完整結構樹，確保每個模組都有明確的職責，便於維護和擴展。

## 🏗️ 完整結構樹

```
src/app/
├── core/                                    # 核心模組（已存在）
│   ├── services/
│   │   ├── auth.service.ts                  # 認證服務
│   │   ├── organization.service.ts          # 組織服務（已存在）
│   │   ├── permission.service.ts            # 權限服務（已存在）
│   │   └── repository.service.ts            # Repository 服務（已存在）
│   ├── models/
│   │   └── auth.model.ts                   # 認證模型（已存在）
│   ├── guards/
│   │   ├── auth.guard.ts                   # 認證守衛（已存在）
│   │   └── permission.guard.ts             # 權限守衛（已存在）
│   └── utils/
│       └── validation.utils.ts             # 驗證工具（已存在）
├── features/
│   ├── organization/                        # 組織功能模組
│   │   ├── components/                      # 組件層 - 單一職責
│   │   │   ├── organization-create/           # 單一職責：組織建立
│   │   │   │   ├── organization-create.component.ts
│   │   │   │   ├── organization-create.component.html
│   │   │   │   ├── organization-create.component.scss
│   │   │   │   └── organization-create.component.spec.ts
│   │   │   ├── organization-detail/           # 單一職責：組織詳情顯示
│   │   │   │   ├── organization-detail.component.ts
│   │   │   │   ├── organization-detail.component.html
│   │   │   │   ├── organization-detail.component.scss
│   │   │   │   └── organization-detail.component.spec.ts
│   │   │   ├── organization-settings/         # 單一職責：組織設定
│   │   │   │   ├── organization-settings.component.ts
│   │   │   │   ├── organization-settings.component.html
│   │   │   │   ├── organization-settings.component.scss
│   │   │   │   └── organization-settings.component.spec.ts
│   │   │   ├── organization-dashboard/        # 單一職責：組織儀表板
│   │   │   │   ├── organization-dashboard.component.ts
│   │   │   │   ├── organization-dashboard.component.html
│   │   │   │   ├── organization-dashboard.component.scss
│   │   │   │   └── organization-dashboard.component.spec.ts
│   │   │   ├── team-create/                   # 單一職責：團隊建立
│   │   │   │   ├── team-create.component.ts
│   │   │   │   ├── team-create.component.html
│   │   │   │   ├── team-create.component.scss
│   │   │   │   └── team-create.component.spec.ts
│   │   │   ├── team-detail/                   # 單一職責：團隊詳情
│   │   │   │   ├── team-detail.component.ts
│   │   │   │   ├── team-detail.component.html
│   │   │   │   ├── team-detail.component.scss
│   │   │   │   └── team-detail.component.spec.ts
│   │   │   ├── members-management/            # 單一職責：成員管理
│   │   │   │   ├── members-management.component.ts
│   │   │   │   ├── members-management.component.html
│   │   │   │   ├── members-management.component.scss
│   │   │   │   └── members-management.component.spec.ts
│   │   │   ├── team-members/                  # 單一職責：團隊成員管理
│   │   │   │   ├── team-members.component.ts
│   │   │   │   ├── team-members.component.html
│   │   │   │   ├── team-members.component.scss
│   │   │   │   └── team-members.component.spec.ts
│   │   │   └── member-invite/                 # 單一職責：成員邀請
│   │   │       ├── member-invite.component.ts
│   │   │       ├── member-invite.component.html
│   │   │       ├── member-invite.component.scss
│   │   │       └── member-invite.component.spec.ts
│   │   ├── services/                        # 服務層 - 單一職責
│   │   │   ├── organization-management.service.ts    # 單一職責：組織 CRUD 操作
│   │   │   ├── team-management.service.ts             # 單一職責：團隊 CRUD 操作
│   │   │   ├── member-management.service.ts          # 單一職責：成員管理操作
│   │   │   ├── invitation.service.ts                 # 單一職責：邀請功能
│   │   │   ├── role-assignment.service.ts            # 單一職責：角色分配
│   │   │   └── organization-analytics.service.ts     # 單一職責：組織統計分析
│   │   ├── models/                          # 模型層 - 單一職責
│   │   │   ├── organization.model.ts                 # 單一職責：組織數據模型
│   │   │   ├── team.model.ts                         # 單一職責：團隊數據模型
│   │   │   ├── member.model.ts                       # 單一職責：成員數據模型
│   │   │   ├── invitation.model.ts                   # 單一職責：邀請數據模型
│   │   │   ├── role.model.ts                         # 單一職責：角色數據模型
│   │   │   └── analytics.model.ts                   # 單一職責：統計數據模型
│   │   ├── guards/                          # 守衛層 - 單一職責
│   │   │   ├── organization-owner.guard.ts           # 單一職責：檢查組織擁有者權限
│   │   │   ├── organization-admin.guard.ts           # 單一職責：檢查組織管理員權限
│   │   │   ├── team-maintainer.guard.ts              # 單一職責：檢查團隊維護者權限
│   │   │   └── member-management.guard.ts            # 單一職責：檢查成員管理權限
│   │   ├── routes/                          # 路由層 - 單一職責
│   │   │   ├── organization.routes.ts                # 單一職責：組織相關路由
│   │   │   ├── team.routes.ts                        # 單一職責：團隊相關路由
│   │   │   ├── member.routes.ts                      # 單一職責：成員相關路由
│   │   │   └── dashboard.routes.ts                   # 單一職責：儀表板路由
│   │   ├── utils/                           # 工具層 - 單一職責
│   │   │   ├── organization-validator.util.ts       # 單一職責：組織數據驗證
│   │   │   ├── team-validator.util.ts               # 單一職責：團隊數據驗證
│   │   │   ├── member-validator.util.ts             # 單一職責：成員數據驗證
│   │   │   ├── role-calculator.util.ts              # 單一職責：角色權限計算
│   │   │   └── organization-formatter.util.ts        # 單一職責：組織數據格式化
│   │   ├── dialogs/                         # 對話框層 - 單一職責
│   │   │   ├── organization-create-dialog/           # 單一職責：組織建立對話框
│   │   │   ├── team-create-dialog/                  # 單一職責：團隊建立對話框
│   │   │   ├── member-invite-dialog/                # 單一職責：成員邀請對話框
│   │   │   ├── role-assignment-dialog/              # 單一職責：角色分配對話框
│   │   │   └── confirmation-dialog/                 # 單一職責：確認操作對話框
│   │   └── organization.module.ts           # 模組定義
│   ├── user/                                # 用戶功能模組（已存在）
│   └── repository/                          # Repository 功能模組（已存在）
└── shared/                                  # 共享模組
    ├── components/                          # 共享組件
    ├── services/                            # 共享服務
    └── utils/                               # 共享工具
```

## 🎯 單一職責原則應用

### 組件層 (Components)
每個組件只負責一個特定功能：
- **organization-create**: 只負責組織建立
- **team-create**: 只負責團隊建立
- **members-management**: 只負責成員管理
- **team-members**: 只負責團隊成員管理
- **organization-dashboard**: 只負責組織儀表板顯示

### 服務層 (Services)
每個服務只處理一種業務邏輯：
- **organization-management**: 只處理組織 CRUD 操作
- **team-management**: 只處理團隊 CRUD 操作
- **member-management**: 只處理成員管理操作
- **invitation**: 只處理邀請功能
- **role-assignment**: 只處理角色分配
- **organization-analytics**: 只處理組織統計分析

### 模型層 (Models)
每個模型只定義一種數據結構：
- **organization.model**: 只定義組織數據
- **team.model**: 只定義團隊數據
- **member.model**: 只定義成員數據
- **invitation.model**: 只定義邀請數據
- **role.model**: 只定義角色數據
- **analytics.model**: 只定義統計數據

### 守衛層 (Guards)
每個守衛只檢查一種權限類型：
- **organization-owner**: 只檢查組織擁有者權限
- **organization-admin**: 只檢查組織管理員權限
- **team-maintainer**: 只檢查團隊維護者權限
- **member-management**: 只檢查成員管理權限

### 工具層 (Utils)
每個工具只處理一種特定功能：
- **organization-validator**: 只處理組織數據驗證
- **team-validator**: 只處理團隊數據驗證
- **member-validator**: 只處理成員數據驗證
- **role-calculator**: 只處理角色權限計算
- **organization-formatter**: 只處理組織數據格式化

## 🔗 與現有架構的整合

### 使用現有核心服務
- `core/services/organization.service.ts` - 組織基礎服務
- `core/services/permission.service.ts` - 權限管理服務
- `core/services/auth.service.ts` - 認證服務

### 使用現有核心模型
- `core/models/auth.model.ts` - 認證和組織模型

### 使用現有核心守衛
- `core/guards/auth.guard.ts` - 認證守衛
- `core/guards/permission.guard.ts` - 權限守衛

### 使用現有核心工具
- `core/utils/validation.utils.ts` - 驗證工具

## 📋 實施策略

### 階段 1: 基礎結構建立
1. 建立 `features/organization/` 目錄結構
2. 建立基礎的服務、模型、守衛文件
3. 建立路由配置

### 階段 2: 核心組件實現
1. 實現 `organization-create.component.ts`
2. 實現 `team-create.component.ts`
3. 實現 `members-management.component.ts`

### 階段 3: 功能擴展
1. 實現 `team-members.component.ts`
2. 實現 `organization-dashboard.component.ts`
3. 實現 `organization-settings.component.ts`

### 階段 4: 優化和測試
1. 添加對話框組件
2. 完善工具函數
3. 添加單元測試

## ✅ 驗收標準

### 架構驗收
- ✅ 每個組件只負責一個特定功能
- ✅ 每個服務只處理一種業務邏輯
- ✅ 每個模型只定義一種數據結構
- ✅ 每個守衛只檢查一種權限類型
- ✅ 目錄結構清晰，職責分明

### 功能驗收
- ✅ 用戶可以建立組織
- ✅ 組織擁有者可以建立團隊
- ✅ 用戶可以管理組織成員
- ✅ 用戶可以將成員分組到團隊
- ✅ 所有功能都有適當的權限控制

### 代碼品質驗收
- ✅ 使用 Angular v20 現代化特性
- ✅ 使用 Signals 進行狀態管理
- ✅ 使用 Control Flow (@if, @for)
- ✅ 使用 Standalone Components
- ✅ 完整的 TypeScript 類型定義
