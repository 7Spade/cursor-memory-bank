# Memory Bank: Tasks

## Current Task
Angular v20 + Signals + Firebase GitHub 式權限系統完整重構 - PLAN 模式 (Level 4)

## Status
- [x] VAN 模式初始化完成
- [x] PLAN 模式 Firebase Auth 配置分析完成
- [x] app.config.ts Firebase Auth 配置驗證完成
- [x] 所有認證組件整合檢查完成
- [x] 路由守衛配置驗證完成
- [x] Firestore 整合分析完成
- [x] 認證配置報告建立完成
- [x] account.md 完整分析完成
- [x] PLAN 重新規劃完成

## Firebase Auth 配置分析結果

### ✅ app.config.ts 配置完整性
**Firebase 服務配置**:
- ✅ provideFirebaseApp: 正確初始化 Firebase 應用
- ✅ provideAuth: 正確提供 Firebase Auth 服務  
- ✅ provideFirestore: 正確提供 Firestore 服務
- ✅ provideAppCheck: 正確配置 App Check 安全服務
- ✅ 環境變數整合: 正確使用 environment.firebase 配置

### ✅ 認證組件整合狀況
**LoginComponent** (`features/user/auth/login.component.ts`):
- ✅ 使用 AuthService 進行登入
- ✅ 整合 Firestore 進行角色查詢
- ✅ 正確的 runInInjectionContext 使用
- ✅ 角色導航邏輯完整

**SignupComponent** (`features/user/auth/signup.component.ts`):
- ✅ 使用 AuthService 進行註冊
- ✅ 自動創建 Firestore 用戶文檔
- ✅ 預設角色設定 (viewer)

**AuthService** (`features/user/auth/auth.service.ts`):
- ✅ 完整的 Firebase Auth 方法封裝
- ✅ login, signup, logout 方法實現
- ✅ 正確的依賴注入

### ✅ 路由守衛配置
**authGuard** (`features/user/auth/auth.guard.ts`):
- ✅ 使用 authState 監聽認證狀態
- ✅ 正確的未認證用戶重定向

**roleGuard** (`features/user/auth/role.guard.ts`):
- ✅ 結合 Firebase Auth 和 Firestore
- ✅ 正確的角色驗證邏輯
- ✅ runInInjectionContext 正確使用

### ⚠️ 發現的問題
1. **重複的認證組件結構**:
   - `app/auth/` 目錄下的組件與 `features/user/auth/` 重複
   - 建議統一使用 `features/user/auth/` 結構

2. **loading 狀態處理**:
   - LoginComponent 中 loading 狀態未正確重置
   - SignupComponent 中 loading 狀態未正確重置

### 📋 建議改進
1. 清理重複的認證組件
2. 修復 loading 狀態處理
3. 統一認證組件結構
4. 添加錯誤處理機制

## Requirements
### 核心需求
- [x] Firebase Auth 配置完整性分析
- [x] 認證組件整合狀況檢查
- [x] 路由守衛配置驗證
- [x] Firestore 整合分析
- [ ] 重複組件清理
- [ ] loading 狀態修復

### 技術約束
- [x] Angular 20.1.0 框架限制
- [x] Firebase 11.10.0 服務限制
- [x] 現有專案結構限制
- [x] 依賴關係限制

## Components Affected
### 需要修改的組件
- [ ] LoginComponent (loading 狀態修復)
- [ ] SignupComponent (loading 狀態修復)
- [ ] 清理重複的 app/auth/ 組件

### 需要新增的組件
- [ ] 錯誤處理機制
- [ ] 統一的認證組件結構

## Implementation Steps
1. [x] Phase 1: Firebase Auth 配置分析
2. [x] Phase 2: 認證組件整合檢查
3. [x] Phase 3: 路由守衛配置驗證
4. [ ] Phase 4: 重複組件清理
5. [ ] Phase 5: loading 狀態修復

## Creative Phases Required
- [x] 🎨 Firebase Auth 架構設計 (已完成)
- [x] 🏗️ 角色管理系統設計 (已完成)
- [x] ⚙️ 路由守衛設計 (已完成)

## Checkpoints
- [x] Firebase Auth 配置驗證完成
- [x] 認證組件整合檢查完成
- [x] 路由守衛配置驗證完成
- [x] Firestore 整合分析完成
- [ ] 重複組件清理完成
- [ ] loading 狀態修復完成

## Current Status
- Phase: PLAN Mode - Angular v20 + Signals + Firebase GitHub 式權限系統完整重構
- Status: Level 4 複雜度，39個任務，6個 Phase
- Blockers: 無

---

## PLAN - Angular v20 + Signals + Firebase GitHub 式權限系統完整重構

### 🎯 目標
實現完整的 Angular v20 現代化 GitHub 式多層級權限系統，包含：
- **Signals 狀態管理**: AccountState 類別與 Computed Signals
- **Control Flow**: @if, @for, @switch 現代化模板語法
- **Value Objects**: ProfileVO, PermissionVO, SettingsVO 領域驅動設計
- **Repository 管理**: 完整的 Repository 協作者與團隊訪問系統
- **權限系統**: PermissionService 替代 ACLService
- **測試策略**: 單元測試、整合測試、E2E 測試

### 📊 複雜度評估
- **等級**: Level 4 - Complex System
- **範圍**: 認證系統、組織管理、團隊管理、Repository 管理、權限控制、UI 元件、路由重構、測試策略
- **影響檔案**: 30+ 個檔案需要新增/修改/刪除
- **總任務數**: 39個任務

### 🗂️ 檔案變更清單

#### 🗑️ 需要刪除的檔案 (6個)
- `angular/src/app/auth/` 整個目錄
  - `auth.guard.ts`, `auth.service.ts`, `login.component.ts`, `role.guard.ts`, `signup.component.ts`, `unauthorized.component.ts`

#### ✏️ 需要修改的檔案 (8個)
- `angular/src/app/core/models/auth.model.ts`：增加 Value Objects 和 Repository 介面
- `angular/src/app/core/services/auth.service.ts`：使用 AccountState 和 Signals
- `angular/src/app/core/services/organization.service.ts`：使用 Value Objects
- `angular/src/app/features/user/auth/login.component.ts`：使用新的 auth.service
- `angular/src/app/features/user/auth/signup.component.ts`：使用新的 auth.service
- `angular/src/app/features/user/auth/role.guard.ts`：使用 accounts 模型
- `angular/src/app/app.routes.ts`：支援組織/團隊/Repository 結構
- `angular/src/app/features/organization/routes/organization.routes.ts`：整合 Permission 守衛

#### ➕ 需要新增的檔案 (16個)
- `angular/src/app/core/models/account-state.ts`：AccountState 類別
- `angular/src/app/core/utils/validation.utils.ts`：ValidationUtils 工具類別
- `angular/src/app/core/services/permission.service.ts`：PermissionService (替代 ACLService)
- `angular/src/app/core/guards/permission.guard.ts`：permissionGuard (替代 aclGuard)
- `angular/src/app/core/services/repository.service.ts`：Repository 管理服務
- `angular/src/app/routes/organization-detail/organization-detail.component.ts`：組織詳情頁
- `angular/src/app/routes/members-list/members-list.component.ts`：成員管理頁
- `angular/src/app/routes/teams-list/teams-list.component.ts`：團隊管理頁
- `angular/src/app/routes/team-create/team-create.component.ts`：團隊建立頁
- `angular/src/app/routes/organization-settings/organization-settings.component.ts`：組織設定頁
- `angular/src/app/routes/organization-dashboard/organization-dashboard.component.ts`：組織儀表板
- `angular/src/app/routes/repository-detail/repository-detail.component.ts`：Repository 詳情頁
- `angular/src/app/routes/repository-settings/repository-settings.component.ts`：Repository 設定頁
- `angular/src/app/routes/collaborators-list/collaborators-list.component.ts`：協作者管理頁
- `angular/src/app/routes/team-access-list/team-access-list.component.ts`：團隊訪問管理頁
- `firebase.rules`：Firestore 安全規則（accounts 和 repositories 集合結構）

### 🚀 分階段實施計畫

#### Phase 1: 基礎清理與現代化 (8個任務)
**目標**: 清理重複檔案，建立現代化基礎架構
**任務**:
- [ ] **task-1-1**: 刪除 `app/auth/` 整個目錄
- [ ] **task-1-2**: 建立 `core/models/account-state.ts` (AccountState 類別)
- [ ] **task-1-3**: 建立 `core/utils/validation.utils.ts` (ValidationUtils)
- [ ] **task-1-4**: 更新 `core/models/auth.model.ts` (增加 Value Objects)
- [ ] **task-1-5**: 更新 `core/services/auth.service.ts` (使用 AccountState 和 Signals)
- [ ] **task-1-6**: 修改 `LoginComponent` 使用新的 auth.service
- [ ] **task-1-7**: 修改 `SignupComponent` 使用新的 auth.service
- [ ] **task-1-8**: 修復 loading 狀態重置問題

**驗收標準**:
- AccountState 類別正確使用 Signals 管理狀態
- ValidationUtils 提供完整的驗證功能
- auth.service 使用 AccountState 和 Signals
- Login/Signup 組件正常工作
- Loading 狀態正確重置

#### Phase 2: 核心服務現代化 (6個任務)
**目標**: 建立現代化權限管理系統
**任務**:
- [ ] **task-2-1**: 實作 `core/services/permission.service.ts` (使用 Signals)
- [ ] **task-2-2**: 實作 `core/guards/permission.guard.ts` (替代 aclGuard)
- [ ] **task-2-3**: 更新 `core/services/organization.service.ts` (使用 Value Objects)
- [ ] **task-2-4**: 修改 `role.guard.ts` 使用 accounts 模型
- [ ] **task-2-5**: 整合 Permission 到現有路由
- [ ] **task-2-6**: 更新所有服務使用 Signals 狀態管理

**驗收標準**:
- PermissionService 正確計算權限
- permissionGuard 正確保護路由
- organization.service 使用 Value Objects
- 所有服務使用 Signals 狀態管理

#### Phase 3: Repository 管理系統 (7個任務)
**目標**: 建立完整的 Repository 管理功能
**任務**:
- [ ] **task-3-1**: 更新 `core/models/auth.model.ts` (增加 Repository 相關介面)
- [ ] **task-3-2**: 實作 `core/services/repository.service.ts`
- [ ] **task-3-3**: 實作 `routes/repository-detail/repository-detail.component.ts`
- [ ] **task-3-4**: 實作 `routes/repository-settings/repository-settings.component.ts`
- [ ] **task-3-5**: 實作 `routes/collaborators-list/collaborators-list.component.ts`
- [ ] **task-3-6**: 實作 `routes/team-access-list/team-access-list.component.ts`
- [ ] **task-3-7**: 更新路由支援 Repository 管理

**驗收標準**:
- Repository 服務 CRUD 操作正常
- Repository UI 元件功能完整
- 協作者和團隊訪問管理正常

#### Phase 4: 組織/團隊管理 UI (6個任務)
**目標**: 建立現代化 UI 元件
**任務**:
- [ ] **task-4-1**: 實作 `organization-detail.component.ts` (使用 Control Flow + Signals)
- [ ] **task-4-2**: 實作 `members-list.component.ts` (使用 Control Flow + Signals)
- [ ] **task-4-3**: 實作 `teams-list.component.ts` (使用 Control Flow + Signals)
- [ ] **task-4-4**: 實作 `team-create.component.ts` (使用 Control Flow + Signals)
- [ ] **task-4-5**: 實作 `organization-settings.component.ts` (使用 Control Flow + Signals)
- [ ] **task-4-6**: 實作 `organization-dashboard.component.ts` (使用 Control Flow + Signals)

**驗收標準**:
- 所有 UI 元件使用 Control Flow (@if, @for)
- 權限檢查與 Signals 整合
- 組織/團隊管理功能完整

#### Phase 5: 路由與權限整合 (5個任務)
**目標**: 建立完整的路由系統
**任務**:
- [ ] **task-5-1**: 更新 `app.routes.ts` 支援組織/團隊/Repository 結構
- [ ] **task-5-2**: 更新 `organization.routes.ts` 整合 Permission 守衛
- [ ] **task-5-3**: 建立完整的路由層級和導航邏輯
- [ ] **task-5-4**: 整合權限控制到所有路由
- [ ] **task-5-5**: 更新路由守衛使用 PermissionService

**驗收標準**:
- 路由結構符合 GitHub 式設計
- 所有路由都有權限保護
- 導航邏輯正確

#### Phase 6: 安全規則與測試 (7個任務)
**目標**: 建立安全的後端規則和完整測試
**任務**:
- [ ] **task-6-1**: 實作 `firebase.rules` (accounts 集合規則)
- [ ] **task-6-2**: 實作 Repository 安全規則
- [ ] **task-6-3**: 實作組織/團隊/成員權限規則
- [ ] **task-6-4**: 實作單元測試 (auth.service, permission.service, organization.service)
- [ ] **task-6-5**: 實作整合測試 (路由守衛, 權限檢查)
- [ ] **task-6-6**: 實作 E2E 測試 (完整用戶流程)
- [ ] **task-6-7**: 進行完整功能測試和驗證

**驗收標準**:
- Firestore 安全規則正確保護資料
- 測試覆蓋率達標
- 完整功能測試通過

### 🔍 詳細實施檢查點

#### Phase 1 檢查點
- [ ] **檢查點 1.1**: 確認 `app/auth/` 目錄完全移除
- [ ] **檢查點 1.2**: AccountState 類別正確使用 Signals
- [ ] **檢查點 1.3**: ValidationUtils 提供完整驗證功能
- [ ] **檢查點 1.4**: auth.model.ts 包含 Value Objects
- [ ] **檢查點 1.5**: auth.service.ts 使用 AccountState 和 Signals
- [ ] **檢查點 1.6**: LoginComponent 使用新的 auth.service
- [ ] **檢查點 1.7**: SignupComponent 使用新的 auth.service
- [ ] **檢查點 1.8**: Loading 狀態正確重置

#### Phase 2 檢查點
- [ ] **檢查點 2.1**: PermissionService 正確計算權限
- [ ] **檢查點 2.2**: permissionGuard 正確保護路由
- [ ] **檢查點 2.3**: organization.service.ts 使用 Value Objects
- [ ] **檢查點 2.4**: role.guard.ts 使用 accounts 模型
- [ ] **檢查點 2.5**: Permission 整合到現有路由
- [ ] **檢查點 2.6**: 所有服務使用 Signals 狀態管理

#### Phase 3 檢查點
- [ ] **檢查點 3.1**: auth.model.ts 包含 Repository 介面
- [ ] **檢查點 3.2**: repository.service.ts 功能完整
- [ ] **檢查點 3.3**: repository-detail.component.ts 功能正常
- [ ] **檢查點 3.4**: repository-settings.component.ts 功能正常
- [ ] **檢查點 3.5**: collaborators-list.component.ts 功能正常
- [ ] **檢查點 3.6**: team-access-list.component.ts 功能正常
- [ ] **檢查點 3.7**: 路由支援 Repository 管理

#### Phase 4 檢查點
- [ ] **檢查點 4.1**: organization-detail.component.ts 使用 Control Flow
- [ ] **檢查點 4.2**: members-list.component.ts 使用 Control Flow
- [ ] **檢查點 4.3**: teams-list.component.ts 使用 Control Flow
- [ ] **檢查點 4.4**: team-create.component.ts 使用 Control Flow
- [ ] **檢查點 4.5**: organization-settings.component.ts 使用 Control Flow
- [ ] **檢查點 4.6**: organization-dashboard.component.ts 使用 Control Flow

#### Phase 5 檢查點
- [ ] **檢查點 5.1**: app.routes.ts 支援完整結構
- [ ] **檢查點 5.2**: organization.routes.ts 整合 Permission 守衛
- [ ] **檢查點 5.3**: 路由層級和導航邏輯正確
- [ ] **檢查點 5.4**: 權限控制整合到所有路由
- [ ] **檢查點 5.5**: 路由守衛使用 PermissionService

#### Phase 6 檢查點
- [ ] **檢查點 6.1**: firebase.rules 安全規則正確
- [ ] **檢查點 6.2**: Repository 安全規則正確
- [ ] **檢查點 6.3**: 組織/團隊/成員權限規則正確
- [ ] **檢查點 6.4**: 單元測試覆蓋率達標
- [ ] **檢查點 6.5**: 整合測試通過
- [ ] **檢查點 6.6**: E2E 測試通過
- [ ] **檢查點 6.7**: 完整功能測試通過

### ⚠️ 風險評估與依賴關係

#### 高風險項目
1. **Signals 狀態管理複雜化**: AccountState 和 PermissionService 使用 Signals
   - **風險**: 狀態管理邏輯複雜，可能導致性能問題
   - **緩解**: 詳細測試和性能監控

2. **Repository 系統新增功能**: 完整的 Repository 管理系統
   - **風險**: 功能複雜度高，可能影響現有系統
   - **緩解**: 分階段實施，保持向後相容

3. **權限系統重構**: ACLService → PermissionService
   - **風險**: 權限邏輯變更可能導致安全問題
   - **緩解**: 詳細測試與安全規則驗證

4. **路由結構重構**: 大量路由變更
   - **風險**: 可能破壞現有導航
   - **緩解**: 分階段實施，保持向後相容

#### 依賴關係
- **Phase 1** → **Phase 2**: 核心服務依賴基礎清理
- **Phase 2** → **Phase 3**: Repository 服務依賴 Permission 服務
- **Phase 2** → **Phase 4**: UI 元件依賴 Permission 服務
- **Phase 3** → **Phase 5**: 路由整合依賴 Repository 功能
- **Phase 4** → **Phase 5**: 路由整合依賴 UI 元件
- **Phase 5** → **Phase 6**: 測試依賴完整功能

#### 建議實施順序
1. **Phase 1** (基礎清理) - 風險低，影響小
2. **Phase 2** (核心服務) - 風險中，影響中
3. **Phase 3** (Repository 系統) - 風險中，影響大
4. **Phase 4** (UI 元件) - 風險中，影響大
5. **Phase 5** (路由整合) - 風險高，影響大
6. **Phase 6** (安全規則與測試) - 風險高，影響大

### 🎯 驗收標準
- 登入/註冊成功後，`accounts/{uid}` 用戶文件正確同步
- 組織/成員/團隊/Repository 查詢正常，角色檢查與守衛可用
- Login/Signup loading 狀態在成功與失敗時正確重置
- 移除重複的 `app/auth/` 代碼，不影響現有 UI 與路由
- PermissionService 權限控制正確運作
- Firestore 安全規則保護資料安全
- 完整的 GitHub 式組織管理和 Repository 管理功能
- 使用 Angular v20 現代化特性 (Signals, Control Flow)
- 測試覆蓋率達標，功能測試通過