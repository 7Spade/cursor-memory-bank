# Memory Bank: Active Context

## Current Focus
VAN 模式 - account.md 架構分析完成

## Status
- ✅ VAN 模式初始化完成
- ✅ 專案結構分析完成
- ✅ 技術棧識別完成 (Angular 20.1.0 + Firebase 11.10.0)
- ✅ 複雜度評估完成 (Level 3 - Intermediate Feature)
- ✅ 環境驗證完成 (Node.js v22.20.0, npm v10.9.3)
- ✅ 依賴安裝完成 (npm install --legacy-peer-deps)
- ✅ 編譯環境驗證完成 (構建成功)
- ✅ 安全管理器組件實作完成
- ✅ 組織角色系統組件實作完成
- ✅ 應用程式啟動成功 (http://localhost:4200)
- ✅ IMPLEMENT 模式完成

## Implementation Results
- **專案類型**: Angular 20.1.0 應用程式 (angular-fire-rolekit)
- **技術棧**: Angular + Firebase + Material Design 3
- **複雜度等級**: Level 3 - Intermediate Feature
- **當前狀態**: 所有核心組件實作完成，應用程式可正常運行
- **構建狀態**: 成功 (993.51 kB 總大小)
- **服務器狀態**: 運行中 (http://localhost:4200)

## Completed Components
1. ✅ 環境配置文件 (environment.ts, environment.prod.ts)
2. ✅ 安全管理器組件 (SecurityManagerComponent)
3. ✅ 組織角色系統組件 (OrganizationRolesComponent)
4. ✅ 路由配置更新 (github-aligned.routes.ts)
5. ✅ 應用程式構建和啟動驗證

## Next Steps
1. 進入 REFLECT 模式進行代碼審查
2. 優化和改進實作
3. 準備 ARCHIVE 模式建立文件

## VAN 初始化摘要
- 平台: Windows 11 (PowerShell)
- 套件管理器: yarn
- 專案框架: Angular 20.1.0, Firebase 11.10.0
- 設定檔: `angular/angular.json`、`angular/tsconfig*.json` 驗證通過
- Memory Bank: 結構完整 (`memory-bank/` 核心檔齊全)
- 目錄結構: `angular/src/app/features/...` 正常
- 依賴: `angular/yarn.lock` 存在

### GitHub Account 架構骨架（新增）
- 新增 `angular/src/app/core/models/auth.model.ts`：定義 `Account`/`User`/`Organization`/`Team` 與 ACL 能力
- 新增 `angular/src/app/core/services/auth.service.ts`：以 `accounts/{uid}` 同步用戶文件（以 `login`、`displayName` 等欄位）
- 新增 `angular/src/app/core/services/organization.service.ts`：組織/成員/團隊 CRUD 與查詢
- 保持 Firebase 以 `app.config.ts` 為主配置（`provideFirebaseApp` 等）

### account.md 架構分析結果
**需要變更的檔案清單**：

#### 🗑️ 需要刪除的檔案
- `angular/src/app/auth/` 整個目錄（重複的認證組件）
  - `auth.guard.ts`, `auth.service.ts`, `login.component.ts`, `role.guard.ts`, `signup.component.ts`, `unauthorized.component.ts`

#### ✏️ 需要修改的檔案
- `angular/src/app/features/user/auth/login.component.ts`：改用 `core/services/auth.service`，修復 loading 狀態
- `angular/src/app/features/user/auth/signup.component.ts`：改用 `core/services/auth.service`，修復 loading 狀態
- `angular/src/app/features/user/auth/role.guard.ts`：改用 `accounts/{uid}` 路徑與新模型
- `angular/src/app/features/user/auth/auth.service.ts`：標記為 deprecated 或移除
- `angular/src/app/app.routes.ts`：更新路由以支援組織/團隊結構
- `angular/src/app/features/organization/routes/organization.routes.ts`：整合 ACL 守衛

#### ➕ 需要新增的檔案
- `angular/src/app/core/services/acl.service.ts`：ACL 權限控制核心
- `angular/src/app/core/guards/acl.guard.ts`：ACL 路由守衛
- `angular/src/app/routes/organization-detail/organization-detail.component.ts`：組織詳情頁
- `angular/src/app/routes/members-list/members-list.component.ts`：成員管理頁
- `angular/src/app/routes/teams-list/teams-list.component.ts`：團隊管理頁
- `angular/src/app/routes/team-create/team-create.component.ts`：團隊建立頁
- `angular/src/app/routes/organization-settings/organization-settings.component.ts`：組織設定頁
- `firebase.rules`：Firestore 安全規則（accounts 集合結構）

### 複雜度評估
- 等級: Level 4 - Complex System（完整 GitHub 式權限系統重構）
- 範圍: 認證系統、組織管理、團隊管理、ACL 權限控制、UI 元件、路由重構

### 下一步
- 建議切換至 PLAN 模式，制定分階段實施計畫：
  - Phase 1: 清理重複檔案，統一認證服務
  - Phase 2: 實作 ACL 服務與守衛
  - Phase 3: 建立組織/團隊管理 UI
  - Phase 4: 整合路由與權限控制
  - Phase 5: Firestore 安全規則與測試
