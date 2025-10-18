# Memory Bank: Project Brief

## Project Overview
Angular-Fire-RoleKit - GitHub 式多層級權限管理系統

基於 Angular 20.1.0 + Firebase 11.10.0 的現代化權限管理系統，實現 GitHub 式的組織、團隊和 Repository 管理功能。

## Objectives
- 實現完整的 GitHub 式權限管理系統
- 建立統一的 Account 模型（個人和組織）
- 實現多層級權限控制（組織 → 團隊 → Repository）
- 使用 Angular v20 現代化特性（Signals, Control Flow）
- 建立完整的 Firebase 安全規則

## Scope
- **認證系統**: Firebase Auth + Firestore 統一認證
- **組織管理**: 組織建立、成員管理、角色分配
- **團隊管理**: 團隊建立、成員分組、權限控制
- **Repository 管理**: 專案協作、權限管理
- **權限系統**: 多層級權限檢查和路由保護
- **UI 元件**: 現代化 Angular v20 組件

## Technology Stack
- **前端**: Angular 20.1.0, Angular Material 20.1.0
- **後端**: Firebase 11.10.0 (Auth, Firestore, Functions)
- **狀態管理**: Angular Signals + RxJS
- **UI 框架**: Angular Material + Control Flow
- **開發工具**: TypeScript 5.8.2, yarn

## Current Status
- **Phase**: REPO 模式分析完成
- **進度**: 81 個檔案完整分析，技術文檔已生成
- **下一步**: 準備 VAN 模式深度分析或 PLAN 模式制定開發計劃