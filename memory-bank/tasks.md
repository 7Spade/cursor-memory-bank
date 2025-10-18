# Memory Bank: Tasks

## Current Task
GitHub 式權限系統完整重構 - PLAN 模式 (Level 4)

## Status
- [x] VAN 模式初始化完成
- [x] PLAN 模式 Firebase Auth 配置分析完成
- [x] app.config.ts Firebase Auth 配置驗證完成
- [x] 所有認證組件整合檢查完成
- [x] 路由守衛配置驗證完成
- [x] Firestore 整合分析完成
- [x] 認證配置報告建立完成

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
- Phase: PLAN Mode - GitHub 式權限系統完整重構計畫
- Status: Level 4 複雜度，需要分階段實施
- Blockers: 無

---

## PLAN - GitHub 式權限系統完整重構計畫

### 🎯 目標
實現完整的 GitHub 式多層級權限系統，包含：
- Account 統一模型（User/Organization）
- 組織/團隊/成員管理
- ACL 權限控制
- Firestore 安全規則
- 完整的 UI 元件與路由

### 📊 複雜度評估
- **等級**: Level 4 - Complex System
- **範圍**: 認證系統、組織管理、團隊管理、ACL 權限控制、UI 元件、路由重構
- **影響檔案**: 20+ 個檔案需要新增/修改/刪除

### 🗂️ 檔案變更清單

#### 🗑️ 需要刪除的檔案 (6個)
- `angular/src/app/auth/` 整個目錄
  - `auth.guard.ts`, `auth.service.ts`, `login.component.ts`, `role.guard.ts`, `signup.component.ts`, `unauthorized.component.ts`

#### ✏️ 需要修改的檔案 (6個)
- `angular/src/app/features/user/auth/login.component.ts`：改用 `core/services/auth.service`，修復 loading 狀態
- `angular/src/app/features/user/auth/signup.component.ts`：改用 `core/services/auth.service`，修復 loading 狀態
- `angular/src/app/features/user/auth/role.guard.ts`：改用 `accounts/{uid}` 路徑與新模型
- `angular/src/app/features/user/auth/auth.service.ts`：標記為 deprecated 或移除
- `angular/src/app/app.routes.ts`：更新路由以支援組織/團隊結構
- `angular/src/app/features/organization/routes/organization.routes.ts`：整合 ACL 守衛

#### ➕ 需要新增的檔案 (8個)
- `angular/src/app/core/services/acl.service.ts`：ACL 權限控制核心
- `angular/src/app/core/guards/acl.guard.ts`：ACL 路由守衛
- `angular/src/app/routes/organization-detail/organization-detail.component.ts`：組織詳情頁
- `angular/src/app/routes/members-list/members-list.component.ts`：成員管理頁
- `angular/src/app/routes/teams-list/teams-list.component.ts`：團隊管理頁
- `angular/src/app/routes/team-create/team-create.component.ts`：團隊建立頁
- `angular/src/app/routes/organization-settings/organization-settings.component.ts`：組織設定頁
- `firebase.rules`：Firestore 安全規則（accounts 集合結構）

### 🚀 分階段實施計畫

#### Phase 1: 清理重複檔案與統一認證服務
**目標**: 移除重複檔案，統一認證服務
**任務**:
- [ ] 刪除 `angular/src/app/auth/` 整個目錄
- [ ] 修改 `LoginComponent` 使用 `core/services/auth.service`
- [ ] 修改 `SignupComponent` 使用 `core/services/auth.service`
- [ ] 修復 loading 狀態重置問題
- [ ] 標記舊 `auth.service.ts` 為 deprecated

**驗收標準**:
- 登入/註冊成功後，`accounts/{uid}` 用戶文件正確同步
- Loading 狀態在成功與失敗時正確重置
- 移除重複的 `app/auth/` 代碼

#### Phase 2: 實作 ACL 服務與守衛
**目標**: 建立權限控制核心
**任務**:
- [ ] 實作 `core/services/acl.service.ts`
- [ ] 實作 `core/guards/acl.guard.ts`
- [ ] 修改 `role.guard.ts` 使用 accounts 模型
- [ ] 整合 ACL 到現有路由

**驗收標準**:
- ACL 服務正確計算用戶權限
- ACL 守衛正確保護路由
- 角色檢查與 accounts 模型對齊

#### Phase 3: 建立組織/團隊管理 UI
**目標**: 建立完整的組織管理介面
**任務**:
- [ ] 實作組織詳情頁 (`organization-detail.component.ts`)
- [ ] 實作成員管理頁 (`members-list.component.ts`)
- [ ] 實作團隊管理頁 (`teams-list.component.ts`)
- [ ] 實作團隊建立頁 (`team-create.component.ts`)
- [ ] 實作組織設定頁 (`organization-settings.component.ts`)

**驗收標準**:
- 組織/成員/團隊 CRUD 操作正常
- UI 元件與 ACL 權限整合
- 角色管理功能完整

#### Phase 4: 整合路由與權限控制
**目標**: 建立完整的路由系統
**任務**:
- [ ] 更新 `app.routes.ts` 支援組織/團隊結構
- [ ] 更新 `organization.routes.ts` 整合 ACL 守衛
- [ ] 建立組織/團隊/成員路由層級
- [ ] 整合權限控制到所有路由

**驗收標準**:
- 路由結構符合 GitHub 式組織管理
- 所有路由都有適當的權限保護
- 導航邏輯正確

#### Phase 5: Firestore 安全規則與測試
**目標**: 建立安全的後端規則
**任務**:
- [ ] 實作 `firebase.rules` 安全規則
- [ ] 建立 accounts 集合結構規則
- [ ] 實作組織/團隊/成員權限規則
- [ ] 進行完整的功能測試

**驗收標準**:
- Firestore 安全規則正確保護資料
- 所有 CRUD 操作都通過安全檢查
- 權限控制在前後端都正確運作

### 🔍 詳細實施檢查點

#### Phase 1 檢查點
- [ ] **檢查點 1.1**: 確認 `app/auth/` 目錄完全移除
- [ ] **檢查點 1.2**: `LoginComponent` 成功使用 `core/services/auth.service`
- [ ] **檢查點 1.3**: `SignupComponent` 成功使用 `core/services/auth.service`
- [ ] **檢查點 1.4**: Loading 狀態在成功/失敗時正確重置
- [ ] **檢查點 1.5**: 登入後 `accounts/{uid}` 文件正確創建
- [ ] **檢查點 1.6**: 舊 `auth.service.ts` 標記為 deprecated

#### Phase 2 檢查點
- [ ] **檢查點 2.1**: `acl.service.ts` 正確計算權限
- [ ] **檢查點 2.2**: `acl.guard.ts` 正確保護路由
- [ ] **檢查點 2.3**: `role.guard.ts` 使用 accounts 模型
- [ ] **檢查點 2.4**: ACL 整合到現有路由
- [ ] **檢查點 2.5**: 權限檢查邏輯正確

#### Phase 3 檢查點
- [ ] **檢查點 3.1**: 組織詳情頁功能完整
- [ ] **檢查點 3.2**: 成員管理頁 CRUD 正常
- [ ] **檢查點 3.3**: 團隊管理頁功能完整
- [ ] **檢查點 3.4**: 團隊建立頁功能正常
- [ ] **檢查點 3.5**: 組織設定頁功能完整
- [ ] **檢查點 3.6**: UI 與 ACL 權限整合

#### Phase 4 檢查點
- [ ] **檢查點 4.1**: `app.routes.ts` 支援組織/團隊結構
- [ ] **檢查點 4.2**: `organization.routes.ts` 整合 ACL 守衛
- [ ] **檢查點 4.3**: 組織/團隊/成員路由層級正確
- [ ] **檢查點 4.4**: 所有路由都有權限保護
- [ ] **檢查點 4.5**: 導航邏輯正確

#### Phase 5 檢查點
- [ ] **檢查點 5.1**: `firebase.rules` 安全規則正確
- [ ] **檢查點 5.2**: accounts 集合結構規則正確
- [ ] **檢查點 5.3**: 組織/團隊/成員權限規則正確
- [ ] **檢查點 5.4**: 完整功能測試通過
- [ ] **檢查點 5.5**: 前後端權限控制一致

### ⚠️ 風險評估與依賴關係

#### 高風險項目
1. **Firestore 資料結構變更**: 從 `users/{uid}` 改為 `accounts/{uid}`
   - **風險**: 現有資料可能無法相容
   - **緩解**: 實作資料遷移腳本

2. **路由結構重構**: 大量路由變更
   - **風險**: 可能破壞現有導航
   - **緩解**: 分階段實施，保持向後相容

3. **權限系統複雜化**: ACL 系統複雜度高
   - **風險**: 權限邏輯錯誤可能導致安全問題
   - **緩解**: 詳細測試與安全規則驗證

#### 依賴關係
- **Phase 1** → **Phase 2**: ACL 服務依賴統一的認證服務
- **Phase 2** → **Phase 3**: UI 元件依賴 ACL 服務
- **Phase 3** → **Phase 4**: 路由整合依賴 UI 元件
- **Phase 4** → **Phase 5**: 安全規則依賴完整路由結構

#### 建議實施順序
1. **Phase 1** (基礎清理) - 風險低，影響小
2. **Phase 2** (ACL 核心) - 風險中，影響中
3. **Phase 3** (UI 元件) - 風險中，影響大
4. **Phase 4** (路由整合) - 風險高，影響大
5. **Phase 5** (安全規則) - 風險高，影響大
