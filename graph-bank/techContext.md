# Memory Bank: Technical Context

## Technology Stack
- **前端框架**: Angular 20.1.0 (最新版本)
- **UI 元件庫**: Angular Material 20.1.0
- **後端服務**: Firebase 11.10.0 (完整服務套件)
- **狀態管理**: Angular Signals + RxJS
- **認證服務**: Firebase Auth
- **資料庫**: Firestore (NoSQL)
- **檔案儲存**: Firebase Storage
- **安全服務**: Firebase App Check
- **部署服務**: Firebase Hosting

## Development Environment
- **OS**: Windows 11
- **Package Manager**: yarn v1.22.22
- **Editor**: Cursor
- **版本控制**: Git
- **Node.js**: v22.20.0
- **npm**: v10.9.3
- **TypeScript**: 5.8.2

## Key Dependencies
- **核心依賴**: 
  - @angular/core: ^20.1.0
  - @angular/common: ^20.1.0
  - @angular/router: ^20.1.0
  - @angular/material: ^20.1.0
- **Firebase 依賴**:
  - firebase: ^11.10.0
  - @angular/fire: ^18.0.0
- **狀態管理**:
  - rxjs: ^7.8.0
  - Angular Signals (內建)

## Architecture Decisions
- **統一 Account 模型**: 使用 type 區分 'user' | 'organization'
- **Firestore 結構**: accounts/{uid} 統一存儲
- **權限系統**: GitHub 式多層級權限控制
- **現代化 UI**: Angular v20 Control Flow (@if, @for, @switch)
- **狀態管理**: Angular Signals 替代傳統狀態管理

## Current Analysis Results
- **總檔案數**: 81 個檔案
- **總 Token 數**: 111,202 tokens
- **分析文檔**: full-analysis.md (468,853 bytes, 14,698 行)
- **關鍵組件**: Top 5 檔案已識別
- **安全狀態**: ✅ 無可疑檔案檢測