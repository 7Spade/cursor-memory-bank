# Memory Bank: Tasks

## Current Task
PLAN 模式 - 檔案路徑結構化調整計劃完成

### 📋 PLAN 模式：檔案路徑結構化調整計劃

基於 VAN 分析結果，專注於檔案路徑調整來實現結構化，暫時不考慮路徑別名配置：

#### ✅ 規劃完成狀況
1. **階段 1 規劃**：移動 core/components 到 features/organization/components ✅
2. **階段 2 規劃**：重組 core/models 檔案到正確位置 ✅
3. **階段 3 規劃**：建立 shared 模組結構 ✅
4. **階段 4 規劃**：重組 features/user 模組結構 ✅
5. **階段 5 規劃**：補全 features/repository 模組結構 ✅
6. **階段 6 規劃**：更新所有相對路徑引用 ✅

#### 🎯 總體目標
- 建立統一的檔案組織結構
- 消除檔案位置混亂
- 提升代碼可維護性
- 保持現有相對路徑導入方式

#### 📊 階段規劃詳情

##### **階段 1：移動 core/components 到 features/organization/components** 📁
- **目標**：將組織相關的對話框組件移動到正確的功能模組
- **檔案移動**：organization-create-dialog.component.ts, team-create-dialog.component.ts
- **時程**：30 分鐘

##### **階段 2：重組 core/models 檔案到正確位置** 📋
- **目標**：將混合在 core/models 中的檔案分類到正確位置
- **檔案重組**：dialog-event → shared/types, organization-create → features/organization/models
- **時程**：45 分鐘

##### **階段 3：建立 shared 模組結構** 🏗️
- **目標**：建立統一的共享資源管理結構
- **目錄結構**：shared/types/, shared/components/, shared/utils/
- **時程**：30 分鐘

##### **階段 4：重組 features/user 模組結構** 👤
- **目標**：統一 user 模組的檔案組織結構
- **結構調整**：建立標準目錄結構，移動檔案到正確位置
- **時程**：1 小時

##### **階段 5：補全 features/repository 模組結構** 📚
- **目標**：補全 repository 模組的缺失目錄
- **補全內容**：services/, guards/, utils/ 目錄和佔位符檔案
- **時程**：30 分鐘

##### **階段 6：更新所有相對路徑引用** 🔄
- **目標**：確保所有檔案移動後的導入語句正確
- **更新範圍**：所有組件、服務、路由配置的導入語句
- **時程**：1 小時

#### 📋 實施檢查點
- **6個階段檢查點**：每階段完成後測試驗證
- **風險控制**：分階段實施，每階段完成後測試
- **品質保證**：詳細的檢查點確保實施品質

#### ⚠️ 風險評估與緩解策略
- **低風險**：建立新目錄結構、建立佔位符檔案
- **中風險**：檔案移動、大量導入語句更新
- **緩解策略**：分階段實施、使用 IDE 重構功能、建立備份點

#### ✅ 預期效果
- **提升可維護性**：清晰的檔案組織結構
- **減少重構成本**：統一的模組結構
- **改善開發體驗**：直觀的檔案位置
- **增強可讀性**：一致的檔案組織方式
- **便於團隊協作**：標準化的專案結構

#### 📅 實施時程
- **總計**：4-5 小時完成
- **分階段**：每階段獨立完成，可暫停和恢復
- **風險控制**：每階段完成後測試驗證

### 🎯 下一步建議
- **準備 BUILD 模式**：開始實施階段 1 的檔案移動
- **分階段實施**：按優先級逐步重構
- **風險控制**：每階段完成後測試驗證

#### ✅ 更新的文件
1. **app.routes.ts** - 添加 organizations/:orgId 路由
2. **organization.routes.ts** - 使用 OrganizationListComponent
3. **organization-detail.routes.ts** - 新建完整路由配置
4. **permission.guard.ts** - 通用權限守衛實現
5. **validation.service.ts** - 添加 validateLogin 方法
6. **organization-create.component.ts** - 修復錯誤訪問
7. **team-create.component.ts** - 修復錯誤訪問
8. **所有佔位符組件** - 8個組件全部建立

#### ✅ 構建測試結果
- **構建狀態**：成功 ✅
- **構建時間**：正常
- **錯誤數量**：0 個
- **警告數量**：少量警告（正常）

### 🎯 修正後的重構計劃

#### Phase 1: 文件重命名和介面重命名（高優先級）
**目標**：重命名文件和介面，避免命名衝突
**任務**：
- [ ] **task-1-1**: 重命名文件 `github-aligned-organization.model.ts` → `organization.model.ts`
- [ ] **task-1-2**: 重命名介面 `GitHubAlignedOrganization` → `OrganizationDetail`
- [ ] **task-1-3**: 更新 `index.ts` 的導出
- [ ] **task-1-4**: 測試文件重命名

**驗收標準**：
- ✅ 文件重命名完成
- ✅ 介面重命名完成，避免與 core Organization 衝突
- ✅ 導出更新完成
- ✅ 沒有命名衝突

#### Phase 2: 服務層更新（中優先級）
**目標**：更新所有服務使用新的 `OrganizationDetail` 介面
**任務**：
- [ ] **task-2-1**: 更新 `permission-calculation.service.ts`
- [ ] **task-2-2**: 更新 `github-aligned-api.service.ts`
- [ ] **task-2-3**: 測試服務層功能
- [ ] **task-2-4**: 驗證服務層正常運行

**驗收標準**：
- ✅ 所有服務使用新的 `OrganizationDetail` 介面
- ✅ 服務層功能正常
- ✅ 業務邏輯保持不變

#### Phase 3: 組件層更新（中優先級）
**目標**：更新所有組件使用新的 `OrganizationDetail` 介面
**任務**：
- [ ] **task-3-1**: 更新 `organization-card.component.ts`
- [ ] **task-3-2**: 更新 `team-management.component.ts`
- [ ] **task-3-3**: 更新 `security-manager.component.ts`
- [ ] **task-3-4**: 更新 `organization-roles.component.ts`

**驗收標準**：
- ✅ 所有組件使用新的 `OrganizationDetail` 介面
- ✅ 組件功能正常
- ✅ UI 顯示正確，業務類型樣式正常

#### Phase 4: 測試和驗證（低優先級）
**目標**：確保重構後所有功能正常
**任務**：
- [ ] **task-4-1**: 進行完整的功能測試
- [ ] **task-4-2**: 驗證業務類型顯示正常
- [ ] **task-4-3**: 驗證內嵌數組功能正常
- [ ] **task-4-4**: 文檔更新

**驗收標準**：
- ✅ 所有功能測試通過
- ✅ 業務類型樣式正常顯示
- ✅ 內嵌數組功能正常
- ✅ 代碼品質優秀

### ⚠️ 修正後的風險評估與依賴關係

#### 風險評估
- **低風險**：重命名文件和介面名稱
- **中風險**：更新所有引用
- **低風險**：保持業務邏輯不變

#### 依賴關係
- **7個文件直接使用**：GitHubAlignedOrganization
- **服務層依賴**：permission-calculation.service.ts, github-aligned-api.service.ts
- **組件層依賴**：organization-card, team-management, security-manager, organization-roles
- **業務邏輯依賴**：type 字段用於 UI 樣式設置

#### 緩解策略
- **分階段實施**：先重命名，再更新引用
- **保持業務邏輯**：不改變 type 字段和內嵌數組
- **避免命名衝突**：使用 OrganizationDetail 避免與 core Organization 衝突
- **測試驗證**：每個階段完成後進行測試

### 🎯 下一步行動
- **Phase 6 已完成**：路由與權限整合全部完成
- **構建測試通過**：所有文件更新完成，構建成功
- **路由結構建立**：完整的 GitHub 式路由層級
- **權限控制整合**：所有路由都有適當的權限保護
- **準備 Phase 7**：安全規則與測試階段
- **品質保證**：構建測試通過，功能正常

**已完成任務**：
- ✅ **organization-create.component.ts**: 組織建立表單
- ✅ **team-create.component.ts**: 團隊建立表單
- ✅ **members-management.component.ts**: 成員管理界面
- ✅ **organization-management.service.ts**: 組織管理服務
- ✅ **team-management.service.ts**: 團隊管理服務
- ✅ **member-management.service.ts**: 成員管理服務
- ✅ **權限守衛**: organization-owner.guard.ts, organization-admin.guard.ts, team-maintainer.guard.ts
- ✅ **路由配置**: organization.routes.ts 和 app.routes.ts 更新
- ✅ **驗證工具**: organization-validator.util.ts, team-validator.util.ts
- ✅ **數據模型**: organization.model.ts, team.model.ts, member.model.ts

**驗收標準**：
- ✅ 用戶可以建立組織
- ✅ 組織擁有者可以建立團隊
- ✅ 用戶可以管理組織成員
- ✅ 用戶可以將成員分組到團隊
- ✅ 所有 UI 元件使用 Control Flow (@if, @for)
- ✅ 權限檢查與 Signals 整合
- ✅ UI 響應式且用戶友好
- ✅ 通過 QA 品質檢查

### 🔗 Phase 6: 路由與權限整合（6個任務）
**目標**：建立完整的路由系統和權限控制
**任務**：
- [x] **task-6-1**: 更新 app.routes.ts 支援完整結構
- [x] **task-6-2**: 更新 organization.routes.ts
- [x] **task-6-3**: 建立完整的路由層級和導航邏輯
- [x] **task-6-4**: 整合權限控制到所有路由
- [x] **task-6-5**: 更新路由守衛使用 PermissionService
- [x] **task-6-6**: 修復編譯錯誤

**驗收標準**：
- ✅ 路由結構符合 GitHub 式設計
- ✅ 所有路由都有權限保護
- ✅ 導航邏輯正確
- ✅ 權限控制整合到所有路由

### 🔒 Phase 7: 安全規則與測試（7個任務）
**目標**：建立安全的後端規則和完整測試
**任務**：
- [ ] **task-7-1**: 實作 Firestore 安全規則 (accounts 集合)
- [ ] **task-7-2**: 實作組織/團隊/成員權限規則
- [ ] **task-7-3**: 實作 Repository 安全規則
- [ ] **task-7-4**: 實作單元測試
- [ ] **task-7-5**: 實作整合測試
- [ ] **task-7-6**: 實作 E2E 測試
- [ ] **task-7-7**: 進行完整功能測試和驗證

**驗收標準**：
- ✅ Firestore 安全規則正確保護資料
- ✅ 測試覆蓋率達標
- ✅ 完整功能測試通過
- ✅ 安全規則和權限系統驗證通過

### ⚠️ 風險評估與依賴關係
**高風險項目**：
1. **UI 組件開發**：新組件可能與現有架構衝突
2. **路由重構**：大量路由變更可能破壞現有導航
3. **權限系統整合**：權限邏輯變更可能導致安全問題

**依賴關係**：
- Phase 4 → Phase 5：UI 組件完成後才能整合路由
- Phase 5 → Phase 6：路由整合完成後才能進行測試

**任務優先級分析**：
**高優先級（用戶直接體驗）：**
1. organization-create.component.ts - 用戶需要能夠建立組織
2. team-create.component.ts - 組織擁有者需要能夠建立團隊
3. members-management.component.ts - 需要管理組織成員

**中優先級（功能完整性）：**
4. team-members.component.ts - 團隊成員分組功能
5. organization-dashboard.component.ts - 組織概覽
6. organization-settings.component.ts - 組織設定

**建議實施順序**：
1. Phase 4（UI 組件）- 風險中，影響大，優先級最高
2. Phase 5（路由整合）- 風險高，影響大
3. Phase 6（安全規則與測試）- 風險高，影響大

### 🎯 下一步行動
- 立即開始 Phase 4 的 organization-create.component.ts 開發
- 優先實現用戶可以直接使用的功能
- 建立任務追蹤和進度監控
- 每個組件完成後立即整合到路由系統

### 問題描述
目前的評分系統過於固定，缺乏靈活性，這可能導致：
1. 無法根據任務複雜度調整評分標準
2. 評分項目權重不合理
3. 無法反映不同類型任務的特點

### 改進方案
1. 實現動態評分標準
   - [ ] 設計複雜度基礎評分標準
   - [ ] 建立評分調整機制
   - [ ] 實現自動評分建議
   - [ ] 加入評分歷史記錄

2. 建立權重配置系統
   - [ ] 設計權重配置介面
   - [ ] 實現權重動態調整
   - [ ] 建立權重模板系統
   - [ ] 加入權重驗證機制

3. 優化評分報告
   - [ ] 設計詳細評分報告
   - [ ] 實現評分趨勢分析
   - [ ] 加入改進建議功能
   - [ ] 建立評分對比視圖

### 預期成果
- 更靈活的評分標準
- 合理的權重配置
- 更好的評分報告
- 更有價值的改進建議

### 問題描述
目前的任務追蹤系統缺乏並行任務和回滾機制，這可能導致：
1. 無法有效管理並行開發任務
2. 任務依賴關係不明確
3. 缺乏任務回滾和恢復機制

### 改進方案
1. 實現並行任務管理
   - [ ] 設計並行任務狀態模型
   - [ ] 建立任務依賴關係追蹤
   - [ ] 實現並行任務進度監控
   - [ ] 加入衝突檢測機制

2. 建立任務回滾機制
   - [ ] 設計任務狀態歷史記錄
   - [ ] 實現任務回滾功能
   - [ ] 建立回滾點管理
   - [ ] 加入相依任務連動回滾

3. 優化任務管理介面
   - [ ] 設計並行任務視圖
   - [ ] 實現任務時間線顯示
   - [ ] 加入任務依賴關係圖
   - [ ] 建立回滾操作介面

### 預期成果
- 更有效的並行任務管理
- 清晰的任務依賴關係
- 可靠的任務回滾機制
- 更好的任務可視化

### 問題描述
目前的創意階段執行流程過於線性，缺乏迭代和並行機制，這可能導致：
1. 無法快速驗證和調整設計決策
2. 團隊協作效率低下
3. 無法靈活應對需求變更

### 改進方案
1. 引入迭代循環機制
   - [ ] 定義迭代週期（建議 1-2 週）
   - [ ] 建立迭代評審和調整機制
   - [ ] 加入快速原型驗證流程

2. 實現並行設計流程
   - [ ] 識別可並行執行的設計任務
   - [ ] 建立團隊協作機制
   - [ ] 設計衝突解決流程

3. 加強反饋機制
   - [ ] 建立定期設計評審機制
   - [ ] 實現即時反饋渠道
   - [ ] 加入利害關係人參與機制

### 預期成果
- 更靈活的設計流程
- 提高團隊協作效率
- 更快的設計迭代週期
- 更好的設計品質

## Current Task
PLAN 模式 - 專案當前情況分析完成，制定詳細實施任務

## Status
- [x] 使用 sequential-thinking 分析專案當前情況
- [x] 識別重複的認證組件和服務問題
- [x] 評估模型不一致和服務層混亂問題
- [x] 制定 Phase 1: 基礎清理與現代化任務
- [ ] 制定 Phase 2: 核心服務現代化任務
- [ ] 制定 Phase 3: UI 元件現代化任務
- [ ] 制定 Phase 4: 安全規則和測試任務

## PLAN 模式分析結果

### 🔍 專案當前情況分析
- ✅ **專案結構確認**：Angular 專案在 `angular/` 子目錄中
- ✅ **構建狀態**：構建成功但有預算警告 (1.11 MB > 1.00 MB)
- ✅ **依賴狀態**：Angular 20.1.0 + Firebase 11.10.0 配置正確
- ✅ **問題識別**：發現多個重複和架構問題

### ⚠️ 發現的關鍵問題

#### 1. 重複的認證組件和服務
- **問題**：存在三個不同的 AuthService 實現
  - `app/auth/auth.service.ts` - 基礎版本
  - `features/user/auth/auth.service.ts` - 擴展版本
  - `core/services/auth.service.ts` - 現代化版本
- **影響**：依賴注入衝突、維護困難
- **解決方案**：統一使用 `core/services/auth.service.ts`

#### 2. 重複的認證組件
- **問題**：`app/auth/` 與 `features/user/auth/` 重複
- **影響**：代碼重複、路由混亂
- **解決方案**：刪除 `app/auth/` 目錄，統一使用 `features/user/auth/`

#### 3. 模型不一致
- **問題**：多個不同的模型定義
  - `core/models/auth.model.ts` - 基礎模型
  - `features/organization/models/github-aligned-organization.model.ts` - 不同組織模型
- **影響**：類型不匹配、服務層混亂
- **解決方案**：統一使用 account.md 設計的模型

#### 4. 服務層架構混亂
- **問題**：多個不同的服務實現
  - `core/services/organization.service.ts` - Firestore 實現
  - `features/organization/services/github-aligned-api.service.ts` - HTTP API 實現
- **影響**：架構不一致、維護困難
- **解決方案**：統一服務層架構

#### 5. 缺少 account.md 設計實現
- **問題**：沒有實現 account.md 中的設計
  - 缺少 Value Objects (ProfileVO, PermissionVO, SettingsVO)
  - 缺少 AccountState 類別
  - 缺少 Repository 相關介面
  - 缺少 ValidationUtils 工具類別
- **影響**：不符合 GitHub 式設計、功能不完整
- **解決方案**：按照 account.md 重構整個系統

## Phase 1: 基礎清理與現代化 (8個任務)

### 🗑️ 清理重複檔案
- [ ] **task-1-1**: 刪除 `app/auth/` 整個目錄
  - 刪除 `app/auth/auth.guard.ts`
  - 刪除 `app/auth/auth.service.ts`
  - 刪除 `app/auth/login.component.ts`
  - 刪除 `app/auth/role.guard.ts`
  - 刪除 `app/auth/signup.component.ts`
  - 刪除 `app/auth/unauthorized.component.ts`

### 🏗️ 實現 account.md 設計的 auth.model.ts
- [ ] **task-1-2**: 更新 `core/models/auth.model.ts` 實現 account.md 設計
  - 添加 Value Objects (ProfileVO, PermissionVO, SettingsVO)
  - 添加 AccountState 類別使用 Signals
  - 添加 Repository 相關介面
  - 添加 ValidationUtils 工具類別
  - 添加 CertificateVO, SocialRelationVO, BusinessLicenseVO

### 🔧 實現 ValidationUtils 工具類別
- [ ] **task-1-3**: 建立 `core/utils/validation.utils.ts`
  - 實現 validateEmail() 方法
  - 實現 validateProfile() 方法
  - 實現 validatePermission() 方法
  - 添加其他驗證工具方法

### 🔄 統一 AuthService 實現
- [ ] **task-1-4**: 更新 `core/services/auth.service.ts` 使用 AccountState
  - 實現 AccountState 狀態管理
  - 使用 Signals 和 Computed Signals
  - 實現 syncUserProfile() 方法
  - 添加權限檢查方法

### 🔄 更新認證組件
- [ ] **task-1-5**: 修改 `features/user/auth/login.component.ts`
  - 使用新的 `core/services/auth.service`
  - 修復 loading 狀態重置問題
  - 使用 Control Flow (@if, @for) 替代傳統結構指令

- [ ] **task-1-6**: 修改 `features/user/auth/signup.component.ts`
  - 使用新的 `core/services/auth.service`
  - 修復 loading 狀態重置問題
  - 使用 Control Flow (@if, @for) 替代傳統結構指令

### 🔄 更新路由守衛
- [ ] **task-1-7**: 修改 `features/user/auth/role.guard.ts`
  - 使用 accounts 模型替代舊模型
  - 使用新的 auth.service
  - 實現正確的角色檢查邏輯

### 🔄 更新路由配置
- [ ] **task-1-8**: 更新 `app.routes.ts`
  - 確保所有路由使用正確的組件
  - 移除對已刪除組件的引用
  - 添加組織/團隊/Repository 結構支援

## Phase 2: 核心服務現代化 (6個任務)

### 🛡️ 實現 PermissionService
- [ ] **task-2-1**: 建立 `core/services/permission.service.ts`
  - 使用 Signals 管理權限狀態
  - 實現 can() 權限檢查方法
  - 實現 canManageTeam() 團隊權限檢查
  - 實現 canAccessRepository() Repository 權限檢查
  - 替代現有的 permission-calculation.service

### 🔒 實現權限守衛
- [ ] **task-2-2**: 建立 `core/guards/permission.guard.ts`
  - 實現 permissionGuard 函數
  - 使用 PermissionService 進行權限檢查
  - 實現錯誤處理和重定向

### 🏢 更新 OrganizationService
- [ ] **task-2-3**: 更新 `core/services/organization.service.ts`
  - 使用 Value Objects (ProfileVO, PermissionVO, SettingsVO)
  - 實現 createOrganization() 使用 ValidationUtils
  - 實現完整的 CRUD 操作
  - 使用 Signals 狀態管理

### 🔄 更新現有路由守衛
- [ ] **task-2-4**: 修改 `features/user/auth/role.guard.ts`
  - 使用 accounts 模型
  - 整合 PermissionService
  - 實現正確的權限檢查邏輯

### 🔗 整合權限到路由
- [ ] **task-2-5**: 更新所有路由使用 Permission 守衛
  - 更新 `app.routes.ts` 使用 permissionGuard
  - 更新 `features/organization/routes/organization.routes.ts`
  - 添加權限檢查到所有受保護路由

### 🔄 更新所有服務使用 Signals
- [ ] **task-2-6**: 更新所有服務使用 Signals 狀態管理
  - 確保所有服務使用 inject() 函數
  - 實現 Signals 基礎的狀態管理
  - 添加 Computed Signals 用於衍生狀態

## Phase 3: Repository 管理系統 (7個任務)

### 📁 實現 Repository 模型
- [ ] **task-3-1**: 更新 `core/models/auth.model.ts` 添加 Repository 介面
  - 添加 Repository 介面
  - 添加 RepositoryCollaborator 介面
  - 添加 RepositoryTeamAccess 介面
  - 添加相關的權限和角色定義

### 🔧 實現 RepositoryService
- [ ] **task-3-2**: 建立 `core/services/repository.service.ts`
  - 實現 Repository CRUD 操作
  - 實現協作者管理
  - 實現團隊訪問管理
  - 使用 Signals 狀態管理

### 🖥️ 實現 Repository UI 元件
- [ ] **task-3-3**: 建立 `routes/repository-detail/repository-detail.component.ts`
  - 使用 Control Flow (@if, @for, @switch)
  - 實現權限驅動的 UI
  - 使用 Signals 狀態管理

- [ ] **task-3-4**: 建立 `routes/repository-settings/repository-settings.component.ts`
  - 實現 Repository 設定功能
  - 使用 Control Flow 和 Signals

- [ ] **task-3-5**: 建立 `routes/collaborators-list/collaborators-list.component.ts`
  - 實現協作者管理功能
  - 使用 Control Flow 和 Signals

- [ ] **task-3-6**: 建立 `routes/team-access-list/team-access-list.component.ts`
  - 實現團隊訪問管理功能
  - 使用 Control Flow 和 Signals

### 🔗 更新路由支援 Repository
- [ ] **task-3-7**: 更新路由支援 Repository 管理
  - 更新 `app.routes.ts` 添加 Repository 路由
  - 實現完整的路由層級和導航邏輯
  - 整合權限控制到所有 Repository 路由

## Phase 4: 組織/團隊管理 UI (6個任務)

### 🖥️ 實現組織管理 UI 元件
- [ ] **task-4-1**: 建立 `routes/organization-detail/organization-detail.component.ts`
  - 使用 Control Flow (@if, @for, @switch)
  - 實現權限驅動的 UI
  - 使用 Signals 狀態管理

- [ ] **task-4-2**: 建立 `routes/members-list/members-list.component.ts`
  - 實現成員管理功能
  - 使用 Control Flow 和 Signals

- [ ] **task-4-3**: 建立 `routes/teams-list/teams-list.component.ts`
  - 實現團隊列表功能
  - 使用 Control Flow 和 Signals

- [ ] **task-4-4**: 建立 `routes/team-create/team-create.component.ts`
  - 實現團隊建立功能
  - 使用 Control Flow 和 Signals

- [ ] **task-4-5**: 建立 `routes/organization-settings/organization-settings.component.ts`
  - 實現組織設定功能
  - 使用 Control Flow 和 Signals

- [ ] **task-4-6**: 建立 `routes/organization-dashboard/organization-dashboard.component.ts`
  - 實現組織儀表板功能
  - 使用 Control Flow 和 Signals

## Phase 5: 路由與權限整合 (5個任務)

### 🔗 更新應用程式路由
- [ ] **task-5-1**: 更新 `app.routes.ts` 支援完整結構
  - 添加組織/團隊/Repository 路由
  - 實現 GitHub 式路由結構
  - 整合權限控制

### 🔗 更新組織路由
- [ ] **task-5-2**: 更新 `features/organization/routes/organization.routes.ts`
  - 整合 Permission 守衛
  - 實現完整的組織路由結構
  - 添加權限檢查

### 🧭 實現路由層級和導航
- [ ] **task-5-3**: 建立完整的路由層級和導航邏輯
  - 實現組織 → 團隊 → Repository 的導航
  - 添加麵包屑導航
  - 實現權限驅動的導航

### 🛡️ 整合權限控制
- [ ] **task-5-4**: 整合權限控制到所有路由
  - 確保所有路由都有適當的權限保護
  - 實現權限檢查和重定向
  - 添加錯誤處理

### 🔄 更新路由守衛
- [ ] **task-5-5**: 更新所有路由守衛使用 PermissionService
  - 確保所有守衛使用統一的權限檢查
  - 實現一致的錯誤處理
  - 添加日誌記錄

## Phase 6: 安全規則與測試 (7個任務)

### 🔒 實現 Firestore 安全規則
- [ ] **task-6-1**: 建立 `firebase.rules` 實現 accounts 集合規則
  - 實現統一的 accounts 集合安全規則
  - 實現組織成員權限檢查
  - 實現團隊權限檢查

- [ ] **task-6-2**: 實現 Repository 安全規則
  - 實現 Repository 讀寫權限
  - 實現協作者權限檢查
  - 實現團隊訪問權限檢查

- [ ] **task-6-3**: 實現組織/團隊/成員權限規則
  - 實現完整的權限層級檢查
  - 實現輔助函數
  - 添加安全規則測試

### 🧪 實現測試策略
- [ ] **task-6-4**: 實現單元測試
  - 測試 auth.service
  - 測試 permission.service
  - 測試 organization.service
  - 測試 ValidationUtils

- [ ] **task-6-5**: 實現整合測試
  - 測試路由守衛
  - 測試權限檢查
  - 測試服務整合

- [ ] **task-6-6**: 實現 E2E 測試
  - 測試完整用戶流程
  - 測試權限控制
  - 測試 UI 互動

- [ ] **task-6-7**: 進行完整功能測試和驗證
  - 測試所有功能
  - 驗證權限系統
  - 性能測試
  - 安全測試

## 驗收標準

### Phase 1 驗收標準
- ✅ AccountState 類別正確使用 Signals 管理狀態
- ✅ ValidationUtils 提供完整的驗證功能
- ✅ auth.service 使用 AccountState 和 Signals
- ✅ Login/Signup 組件正常工作
- ✅ Loading 狀態正確重置
- ✅ 重複的 app/auth/ 組件已刪除

### Phase 2 驗收標準
- ✅ PermissionService 正確計算權限
- ✅ permissionGuard 正確保護路由
- ✅ organization.service 使用 Value Objects
- ✅ 所有服務使用 Signals 狀態管理
- ✅ 權限檢查與 UI 邏輯分離

### Phase 3 驗收標準
- ✅ Repository 服務 CRUD 操作正常
- ✅ Repository UI 元件功能完整
- ✅ 協作者和團隊訪問管理正常
- ✅ 路由支援 Repository 管理

### Phase 4 驗收標準
- ✅ 所有 UI 元件使用 Control Flow (@if, @for)
- ✅ 權限檢查與 Signals 整合
- ✅ 組織/團隊管理功能完整
- ✅ UI 響應式且用戶友好

### Phase 5 驗收標準
- ✅ 路由結構符合 GitHub 式設計
- ✅ 所有路由都有權限保護
- ✅ 導航邏輯正確
- ✅ 權限控制整合到所有路由

### Phase 6 驗收標準
- ✅ Firestore 安全規則正確保護資料
- ✅ 測試覆蓋率達標
- ✅ 完整功能測試通過
- ✅ 安全規則和權限系統驗證通過

## 風險評估與依賴關係

### 高風險項目
1. **Signals 狀態管理複雜化**：AccountState 和 PermissionService 使用 Signals
   - **風險**：狀態管理邏輯複雜，可能導致性能問題
   - **緩解**：詳細測試和性能監控

2. **Repository 系統新增功能**：完整的 Repository 管理系統
   - **風險**：功能複雜度高，可能影響現有系統
   - **緩解**：分階段實施，保持向後相容

3. **權限系統重構**：ACLService → PermissionService
   - **風險**：權限邏輯變更可能導致安全問題
   - **緩解**：詳細測試與安全規則驗證

4. **路由結構重構**：大量路由變更
   - **風險**：可能破壞現有導航
   - **緩解**：分階段實施，保持向後相容

### 依賴關係
- **Phase 1** → **Phase 2**：核心服務依賴基礎清理
- **Phase 2** → **Phase 3**：Repository 服務依賴 Permission 服務
- **Phase 2** → **Phase 4**：UI 元件依賴 Permission 服務
- **Phase 3** → **Phase 5**：路由整合依賴 Repository 功能
- **Phase 4** → **Phase 5**：路由整合依賴 UI 元件
- **Phase 5** → **Phase 6**：測試依賴完整功能

### 建議實施順序
1. **Phase 1** (基礎清理) - 風險低，影響小
2. **Phase 2** (核心服務) - 風險中，影響中
3. **Phase 3** (Repository 系統) - 風險中，影響大
4. **Phase 4** (UI 元件) - 風險中，影響大
5. **Phase 5** (路由整合) - 風險高，影響大
6. **Phase 6** (安全規則與測試) - 風險高，影響大

## 當前狀態
- Phase: PLAN Mode - 專案當前情況分析完成
- Status: Level 4 複雜度，39個任務，6個 Phase
- Blockers: 無
- Next: 準備進入 IMPLEMENT 模式開始實施

---

## Status
- [x] 修復圖標混淆：為 REFLECT 模式分配唯一圖標 (🔍 → 📝)
- [x] 修復工作流程衝突：統一 Level 1 任務處理流程 (添加 REFLECT 階段)
- [x] 補充 MCP Memory Server 指令：在 .cursorrules 中添加完整指令列表
- [x] 修復文件路徑衝突：統一文件位置規範 (明確 graph-bank/ 目錄)
- [x] 修復文件命名不一致：統一命名規範
- [x] 補充 INIT Agent 檢查時機：在 .cursorrules 中定義
- [x] BUILD 模式修復完成

## Status
- [x] VAN Agent 初始化完成
- [x] MCP Memory Server 狀態檢查完成
- [x] 專案結構分析完成 (Angular 20.1.0 + Firebase 11.10.0)
- [x] 技術棧識別完成 (Angular Material, Firestore, Firebase Auth)
- [x] 複雜度評估完成 (Level 4 - Complex System)
- [x] 環境驗證完成 (Node.js v22.20.0, npm v10.9.3)
- [x] 依賴安裝驗證完成 (yarn.lock 存在)
- [x] 編譯環境驗證完成 (TypeScript 錯誤已修復，構建成功)
- [x] 重複組件識別完成 (app/auth/ 與 features/user/auth/ 重複)
- [x] Firebase 配置分析完成 (app.config.ts 配置完整)
- [x] 認證系統分析完成 (使用 accounts/{uid} 統一模型)
- [x] Graph Bank 文件更新完成
- [x] account.md 完整閱讀和分析完成
- [x] GitHub 式 account 結構實現策略制定完成
- [x] PLAN Agent 初始化 - 使用 sequential-thinking 深入分析 account.md
- [x] Context7 查詢 Angular Signals 和 Firebase Firestore 文檔
- [x] GitHub 式 account 架構設計分析完成
- [x] 分階段實施計畫制定完成 (6個 Phase, 39個任務)
- [x] 風險評估和依賴關係分析完成
- [x] QA 檢查 - 包管理器 yarn 配置驗證
- [x] 檢查 yarn.lock 文件完整性
- [x] 驗證 package.json 與 yarn.lock 一致性
- [x] 檢查依賴版本兼容性
- [x] 驗證 yarn 安裝狀態
- [x] QA 檢查 - 任務文件邏輯和順序驗證
- [x] 檢查權限/角色系統實施順序
- [x] 驗證組織/個人建立流程依賴關係
- [x] 檢查任務間的前置條件
- [x] 驗證 Phase 間的依賴關係
- [x] PLAN QA 檢查 - 驗證 PLAN Agent 輸出品質
- [x] 檢查實施計畫的完整性
- [x] 驗證任務分解的合理性
- [x] 檢查風險評估的準確性
- [x] 驗證依賴關係的正確性
- [x] 檢查驗收標準的明確性
- [x] PLAN 修正 - Phase 2 任務順序修正
- [x] 更新實施計畫文件
- [x] 更新依賴關係圖
- [x] 驗證修正後的邏輯
- [x] 準備開始實施
- [x] PLAN QA 最終檢查 - 修正後的實施計畫品質優秀

## VAN Agent 初始化摘要

### 🎯 專案概覽
- **專案名稱**: angular-fire-rolekit
- **框架版本**: Angular 20.1.0 + Firebase 11.10.0
- **複雜度等級**: Level 4 - Complex System
- **主要目標**: GitHub 式多層級權限系統重構

### 🔍 技術棧分析
- **前端框架**: Angular 20.1.0 (最新版本)
- **UI 元件庫**: Angular Material 20.1.0
- **後端服務**: Firebase 11.10.0 (完整服務套件)
- **認證服務**: Firebase Auth + Firestore
- **狀態管理**: Angular 內建狀態管理 + RxJS
- **包管理器**: yarn
- **TypeScript**: 5.8.2 (嚴格模式)

### 🏗️ 架構分析
- **統一模型**: 使用 `accounts/{uid}` 路徑存儲所有 Account 類型
- **GitHub 對齊**: Account/User/Organization 模型設計
- **權限系統**: 多層級權限控制 (個人 → 組織 → 團隊 → 資源)
- **角色管理**: 5 種組織角色 + 2 種團隊角色
- **Firebase 整合**: 完整的 Firebase 服務配置

### ⚠️ 發現的問題
1. **重複的認證組件**: `app/auth/` 與 `features/user/auth/` 重複
2. **TypeScript 錯誤**: 已修復 `data['type']` 類型問題
3. **Loading 狀態**: Login/Signup 組件中 loading 狀態未正確重置

### 📋 建議改進
1. 清理重複的認證組件 (`app/auth/` 目錄)
2. 修復 loading 狀態處理
3. 統一認證組件結構
4. 添加錯誤處理機制

### 🚀 下一步建議
- 建議切換至 PLAN 模式，制定分階段實施計畫：
  - Phase 1: 清理重複檔案，統一認證服務
  - Phase 2: 實作 ACL 服務與守衛
  - Phase 3: 建立組織/團隊管理 UI
  - Phase 4: 整合路由與權限控制
  - Phase 5: Firestore 安全規則與測試

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