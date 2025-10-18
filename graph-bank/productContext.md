# Memory Bank: Product Context

## Product Description
基於 Angular 20 和 Firebase 11 的 GitHub 式權限管理系統，提供完整的組織、團隊和 Repository 管理功能。系統使用最新的 Angular 特性（Signals、Control Flow）和現代化架構設計，實現高效且可擴展的權限控制系統。

## Target Users
- **組織管理者**：需要管理組織成員和團隊的管理者
- **團隊領導者**：需要管理團隊成員和 Repository 的團隊領導
- **開發人員**：需要訪問和協作 Repository 的開發者
- **系統管理員**：需要管理整個系統的管理員

## Key Features
- **統一的 Account 系統**
  - 使用 type 區分 'user' | 'organization'
  - 統一的 /accounts 集合路徑
  - 完整的個人檔案管理

- **多層級權限系統**
  - 5 種組織角色：Owner, Admin, Member, Billing, Outside Collaborator
  - 2 種團隊角色：Maintainer, Member
  - Repository 權限：read, triage, write, maintain, admin

- **組織管理功能**
  - 組織成員管理
  - 團隊管理
  - 組織設定
  - 組織儀表板

- **Repository 管理**
  - Repository CRUD 操作
  - 協作者管理
  - 團隊訪問管理
  - Repository 設定

- **現代化技術特性**
  - Angular v20 Signals 狀態管理
  - Control Flow (@if, @for, @switch)
  - Value Objects 模式
  - 完整的測試覆蓋

## Business Value
- **提高效率**：統一的權限管理系統，減少管理開銷
- **降低風險**：多層級的權限控制，確保資源安全
- **提升體驗**：現代化的 UI 設計，提供更好的用戶體驗
- **易於擴展**：模組化設計，便於添加新功能
- **成本效益**：使用 Firebase 服務，降低運維成本

## Success Metrics
- **系統性能**：頁面載入時間 < 2秒
- **構建大小**：< 2MB（目前 1.14MB）
- **測試覆蓋**：> 80% 代碼覆蓋率
- **用戶滿意度**：> 90% 用戶滿意度
- **系統穩定性**：> 99.9% 可用性