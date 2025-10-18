# Graph Bank System - 術語使用指南

## 📋 術語區分標準

本指南明確區分 Graph Bank System 中使用的不同術語，確保文件的一致性和清晰度。

### 🔄 Graph Bank 相關術語

**用途**：指涉專案內部的記憶管理系統

**術語**：
- **Graph Bank System** - 系統的英文名稱
- **記憶銀行系統** - 系統的中文名稱（專案名稱）
- **Graph Bank** - 簡稱
- **graph-bank** - 目錄名稱
- **Graph Bank 文件** - 指涉系統內的文件

**使用場景**：
- 系統架構描述
- 文件標題
- 功能說明
- 工作流程描述

### ✅ Memory 相關術語

**用途**：指涉 MCP memory server 和相關功能

**術語**：
- **memory.json** - MCP memory server 的文件
- **MEMORY.CHECK** - MCP memory 檢查指令
- **MEMORY.LOAD** - MCP memory 載入指令
- **MEMORY.UPDATE** - MCP memory 更新指令
- **記憶體初始化協議** - MCP memory 初始化
- **記憶體檢查指令** - MCP memory 檢查
- **記憶體上下文載入** - MCP memory 上下文
- **MEMORY_FILE_PATH** - MCP memory 配置

**使用場景**：
- MCP memory server 配置
- Agent 記憶體檢查流程
- 記憶體初始化協議
- 技術實現細節

### 🔒 保持不變的術語

**專案名稱和目錄**：
- **cursor-memory-bank** - 專案目錄名稱
- **記憶銀行系統** - 專案的中文名稱

## 📝 使用範例

### ✅ 正確使用

```markdown
# Graph Bank System - AI Agents 指南

## 概述
Graph Bank System 使用多個專門的 AI 代理來處理開發過程的不同階段。

## Agent 記憶體檢查指令
每個 Agent 在開始工作前都必須執行記憶體檢查：

### 通用指令
- `MEMORY.CHECK` - 檢查 memory.json 狀態
- `MEMORY.LOAD` - 載入記憶體上下文
- `MEMORY.UPDATE` - 更新記憶體內容
```

### ❌ 錯誤使用

```markdown
# Memory Bank System - AI Agents 指南  ❌ 錯誤

## 概述
Memory Bank System 使用多個專門的 AI 代理...  ❌ 錯誤

## Agent 記憶體檢查指令
每個 Agent 在開始工作前都必須執行記憶體檢查：

### 通用指令
- `GRAPH.CHECK` - 檢查 graph-bank 狀態  ❌ 錯誤
- `GRAPH.LOAD` - 載入 Graph Bank 上下文  ❌ 錯誤
```

## 🔍 檢查清單

在編寫或修改文件時，請檢查：

### Graph Bank 術語檢查
- [ ] 系統名稱使用 "Graph Bank System"
- [ ] 功能描述使用 "Graph Bank"
- [ ] 文件標題使用正確的術語
- [ ] 工作流程描述使用正確的術語

### Memory 術語檢查
- [ ] MCP memory server 相關使用 "memory"
- [ ] Agent 指令使用 "MEMORY.*"
- [ ] 記憶體檢查流程使用正確術語
- [ ] 技術實現細節使用正確術語

### 專案名稱檢查
- [ ] 專案目錄名稱保持 "cursor-memory-bank"
- [ ] 專案中文名稱保持 "記憶銀行系統"
- [ ] 不混淆專案名稱和系統名稱

## 🚨 常見錯誤

### 錯誤 1：混淆系統名稱
```markdown
❌ Memory Bank System 使用 Graph Bank 文件
✅ Graph Bank System 使用 Graph Bank 文件
```

### 錯誤 2：混淆 MCP memory 和 Graph Bank
```markdown
❌ 使用 GRAPH.CHECK 檢查 memory.json
✅ 使用 MEMORY.CHECK 檢查 memory.json
```

### 錯誤 3：錯誤的術語組合
```markdown
❌ Memory Bank 使用 MEMORY.CHECK 指令
✅ Graph Bank System 使用 MEMORY.CHECK 指令
```

## 📚 參考文件

- `.cursorrules` - 系統規則和配置
- `AGENTS.md` - AI Agents 指南
- `README.md` - 專案說明
- `MEMORY_COMMANDS.md` - 記憶體檢查指令
- `RELEASE_NOTES.md` - 版本發布說明

## 🔄 更新記錄

- **2025-01-XX**: 建立術語使用指南
- **2025-01-XX**: 完成術語統一修正

---

**注意**：本指南確保 Graph Bank System 中術語使用的一致性，避免混淆和誤解。
