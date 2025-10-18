# Memory Bank: Product Context

## Product Description
Angular-Fire-RoleKit - GitHub 式多層級權限管理系統

基於 Angular 20.1.0 + Firebase 11.10.0 的現代化權限管理系統，實現完整的 GitHub 式組織、團隊和 Repository 管理功能。系統使用最新的 Angular 特性（Signals、Control Flow）和現代化架構設計。

## Target Users
- **組織管理者**：需要管理組織成員和團隊的管理者
- **團隊領導者**：需要管理團隊成員和 Repository 的團隊領導
- **開發人員**：需要訪問和協作 Repository 的開發者
- **系統管理員**：需要管理整個系統的管理員

## Key Features
- **統一的 Account 系統**
  - 使用 type 區分 'user' | 'organization'
  - 統一的 accounts/{uid} 集合路徑
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

- **現代化 UI**
  - Angular v20 Control Flow (@if, @for, @switch)
  - Angular Signals 狀態管理
  - Angular Material 20.1.0 組件
  - 響應式設計

## Current Analysis Status
- **分析完成**：81 個檔案完整分析
- **關鍵組件識別**：Top 5 檔案已識別
- **技術架構確認**：Angular 20.1.0 + Firebase 11.10.0
- **分析文檔**：full-analysis.md 已生成