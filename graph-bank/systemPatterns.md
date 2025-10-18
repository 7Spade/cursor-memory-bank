# Memory Bank: System Patterns

## Architecture Patterns
- **分層架構**: 前端層、Firebase 服務層、業務邏輯層、Firestore 資料層
- **模組化設計**: 按功能領域劃分模組 (core, features, shared)
- **GitHub 式權限**: 多層級權限控制（組織 → 團隊 → Repository）
- **統一 Account 模型**: 使用 type 區分個人和組織
- **Angular Signals**: 現代化狀態管理模式

## Design Patterns
- **Angular 模組化**: core, features, shared 模組結構
- **元件化設計**: 可重用的 Angular Material 元件
- **服務注入**: Angular 依賴注入模式
- **狀態管理**: Angular Signals + Computed Signals
- **路由守衛**: Firebase Auth + 權限守衛保護

## Technology Stack
- **前端**: Angular 20.1.0, Angular Material 20.1.0
- **後端**: Firebase 11.10.0 (Auth, Firestore, Functions)
- **狀態管理**: Angular Signals + RxJS
- **UI 框架**: Angular Material + Control Flow
- **開發工具**: TypeScript 5.8.2, yarn
- **部署**: Firebase Hosting

## Coding Standards
- **檔案命名**: kebab-case 命名規範
- **目錄結構**: 按功能模組組織 (core, features, shared)
- **代碼組織**: 單一職責原則
- **現代化語法**: Angular v20 Control Flow (@if, @for, @switch)
- **狀態管理**: 使用 Angular Signals 替代傳統狀態管理
- **測試策略**: Jasmine + Karma 單元測試

## Current Implementation Status
- **分析完成**: 81 個檔案完整分析
- **架構確認**: Angular 20.1.0 + Firebase 11.10.0
- **關鍵組件**: Top 5 檔案已識別
- **技術文檔**: full-analysis.md 已生成