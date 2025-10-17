# Memory Bank: System Patterns

## Architecture Patterns
- **分層架構**: 前端層、API 層、業務邏輯層、資料層
- **模組化設計**: 按功能領域劃分模組 (用戶、組織、專案、社交、成就、通知)
- **CQRS 模式**: 命令查詢責任分離，使用 Commands、Queries、Events
- **Repository 模式**: 資料存取抽象化
- **Domain Service 模式**: 業務邏輯封裝

## Design Patterns
- **Angular 模組化**: 功能模組、共享模組、核心模組
- **元件化設計**: 可重用的 UI 元件
- **服務注入**: 依賴注入模式
- **狀態管理**: NgRx 狀態管理模式
- **路由守衛**: 認證與授權保護

## Technology Stack
- **前端**: Angular 17+, NgRx, Angular Material
- **後端**: Node.js + Express/NestJS
- **資料庫**: PostgreSQL + Redis
- **認證**: Firebase Auth/Auth0
- **部署**: Docker + Kubernetes
- **監控**: Prometheus + Grafana

## Coding Standards
- **檔案命名**: kebab-case 命名規範
- **目錄結構**: 按功能模組組織
- **代碼組織**: 單一職責原則
- **測試策略**: 單元測試 + 整合測試
- **文檔標準**: Markdown 格式，包含架構圖
