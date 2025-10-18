# Graph Bank System - AI Agents 指南

## 概述
Graph Bank System 使用多個專門的 AI 代理來處理開發過程的不同階段。每個代理都有特定的角色和職責，共同構成一個協調的開發系統。

## Agent 記憶體檢查指令

### 記憶體初始化指令
每個 Agent 在開始工作前都必須執行記憶體檢查：

**通用指令：**
- `MEMORY.CHECK` - 檢查 memory.json 狀態
- `MEMORY.LOAD` - 載入記憶體上下文
- `MEMORY.UPDATE` - 更新記憶體內容

**Agent 特定指令：**
- `VAN.MEMORY` - VAN Agent 記憶體檢查
- `PLAN.MEMORY` - PLAN Agent 記憶體檢查
- `CREATIVE.MEMORY` - CREATIVE Agent 記憶體檢查
- `IMPLEMENT.MEMORY` - IMPLEMENT Agent 記憶體檢查
- `REFLECT.MEMORY` - REFLECT Agent 記憶體檢查
- `ARCHIVE.MEMORY` - ARCHIVE Agent 記憶體檢查

### 記憶體檢查流程
1. 執行 `MEMORY.CHECK` 驗證記憶體完整性
2. 執行 `MEMORY.LOAD` 載入相關上下文
3. 基於記憶體內容建立對話基線
4. 開始 Agent 特定工作流程

## 代理架構

### 1. VAN Agent (🔍 初始化代理)
**角色**：專案分析師和初始化專家
**職責**：
- 分析專案結構和複雜度
- 確定任務級別 (Level 1-4)
- 建立專案上下文
- 識別技術棧和依賴關係

**使用時機**：
- 開始新專案時
- 需要重新評估專案狀態時
- 專案結構發生重大變化時

### 2. PLAN Agent (📋 規劃代理)
**角色**：專案規劃師和任務分解專家
**職責**：
- 將複雜任務分解為可管理的子任務
- 建立詳細的實施計劃
- 識別依賴關係和優先級
- 預估時間和資源需求

**使用時機**：
- Level 2-4 任務的規劃階段
- 需要詳細實施計劃時
- 任務複雜度較高時

### 3. CREATIVE Agent (🎨 創意代理)
**角色**：設計決策專家
**職責**：
- 探索設計選項和替代方案
- 進行技術選型分析
- 建立設計決策文件
- 提供創意解決方案

**使用時機**：
- Level 3-4 任務的設計階段
- 需要探索多種設計選項時
- 面臨複雜技術決策時

### 4. IMPLEMENT Agent (⚒️ 實施代理)
**角色**：代碼實施專家
**職責**：
- 系統性地實施計劃的組件
- 編寫高品質的代碼
- 遵循最佳實踐和編碼標準
- 進行代碼優化和重構

**使用時機**：
- 所有級別任務的實施階段
- 需要編寫或修改代碼時
- 進行代碼重構時

### 5. REFLECT Agent (🔍 反思代理)
**角色**：代碼審查和學習專家
**職責**：
- 審查實施的代碼品質
- 識別改進機會
- 記錄經驗教訓
- 提供優化建議

**使用時機**：
- 實施完成後的審查階段
- 需要代碼品質評估時
- 學習和改進時

### 6. ARCHIVE Agent (📁 歸檔代理)
**角色**：文件管理專家
**職責**：
- 建立全面的專案文件
- 整理和歸檔專案資產
- 建立知識庫
- 維護專案歷史

**使用時機**：
- 專案完成後的歸檔階段
- 需要建立完整文件時
- 知識轉移時

## 代理協作模式

### 順序協作
```
VAN → PLAN → CREATIVE → IMPLEMENT → REFLECT → ARCHIVE
```

### 並行協作
- 多個代理可以同時處理不同的任務
- 代理間可以共享上下文和狀態
- 支援動態任務分配

### 回饋循環
- 每個代理的輸出可以作為其他代理的輸入
- 支援迭代改進和優化
- 保持上下文的一致性

## 代理配置

### 工具配置
每個代理都有特定的工具配置：
- **VAN**：Codebase Search, Read File, Terminal, List Directory, Fetch Rules
- **PLAN**：Codebase Search, Read File, Terminal, List Directory
- **CREATIVE**：Codebase Search, Read File, Terminal, List Directory, Edit File, Fetch Rules
- **IMPLEMENT**：所有工具
- **REFLECT**：Codebase Search, Read File, Terminal, List Directory
- **ARCHIVE**：Codebase Search, Read File, Terminal, List Directory

### 環境變數
- `NODE_OPTIONS`：Node.js 記憶體配置
- `MEMORY_FILE_PATH`：記憶體文件路徑

## 最佳實踐

### 代理選擇
- 根據任務複雜度選擇適當的代理
- 遵循建議的工作流程順序
- 必要時可以跳過某些階段

### 上下文管理
- 保持代理間的上下文一致性
- 使用 Graph Bank 文件儲存狀態
- 定期更新和同步上下文

### 品質控制
- 使用 QA 功能進行技術驗證
- 定期進行代碼審查
- 保持代碼的可讀性和可維護性

## 故障排除

### 常見問題
1. **代理無響應**：檢查工具配置和指令複製
2. **上下文丟失**：確保 Graph Bank 文件正確更新
3. **工具錯誤**：驗證工具權限和配置

### 除錯技巧
- 檢查代理的輸出日誌
- 驗證工具配置
- 確認上下文狀態
- 使用 QA 功能進行驗證