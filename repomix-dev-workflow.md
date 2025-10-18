# Repomix 開發工作流程

## 🚀 快速開始

### 1. 專案分析
```bash
# 生成完整專案概覽
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --style markdown \
  --top-files-len 20 \
  --output project-overview.md
```

### 2. 功能開發
```bash
# 只包含源碼文件
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --include "src/**/*.ts,src/**/*.html,src/**/*.scss" \
  --style markdown \
  --output source-code.md
```

### 3. 代碼審查
```bash
# 壓縮模式快速審查
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --compress \
  --style markdown \
  --output code-review.md
```

### 4. 極致節省模式
```bash
# 節省 88% 令牌的極致模式
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --compress \
  --remove-comments \
  --remove-empty-lines \
  --no-file-summary \
  --no-directory-structure \
  --include "src/**/*.ts,src/**/*.html,*.md" \
  --style markdown \
  --output minimal-output.md
```

### 5. 其他實用模式

#### JSON 格式輸出
```bash
# 生成 JSON 格式，適合程式化處理
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --style json \
  --output project-data.json
```

#### XML 格式輸出
```bash
# 生成 XML 格式，適合結構化分析
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --style xml \
  --output project-structure.xml
```

#### 包含 Git 歷史
```bash
# 包含 Git 提交歷史和變更
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --include-logs \
  --include-diffs \
  --style markdown \
  --output project-with-history.md
```

#### 只包含特定文件類型
```bash
# 只包含 TypeScript 文件
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --include "**/*.ts" \
  --style markdown \
  --output typescript-only.md
```

## 📊 輸出模式對比

| 模式 | Token 數量 | 節省比例 | 文件數量 | 適用場景 |
|------|------------|----------|----------|----------|
| **完整模式** | 351,116 | - | 147 | 深度分析、完整理解 |
| **壓縮模式** | 307,073 | 12.5% | 147 | 快速審查、代碼分析 |
| **源碼模式** | 44,080 | 87.4% | 5 | 功能開發、代碼生成 |
| **極致節省** | 41,433 | 88.2% | 4 | 成本敏感、快速概覽 |

## 🎯 使用場景

### AI 代碼分析
- 將 repomix 輸出提供給 AI 進行代碼分析
- 獲取架構建議和改進方案
- 識別潛在問題和優化機會

### 新功能開發
- 基於現有架構設計新模組
- 參考現有代碼風格和模式
- 確保新功能與現有系統整合

### 代碼重構
- 分析代碼結構和依賴關係
- 識別重構機會
- 提供重構建議

### 問題診斷
- 快速理解專案結構
- 定位問題根源
- 提供解決方案

## 💡 最佳實踐

1. **定期更新**：每次重大變更後重新生成 repomix 輸出
2. **分段分析**：根據需要只分析特定模組
3. **版本控制**：將 repomix 輸出加入版本控制
4. **團隊協作**：與團隊成員分享 repomix 輸出

## 🔧 進階技巧

### 自定義配置
創建 `repomix.config.json` 文件：
```json
{
  "include": ["src/**/*.ts", "src/**/*.html"],
  "ignore": ["*.spec.ts", "*.test.ts"],
  "style": "markdown",
  "compress": true
}
```

### 自動化腳本
```bash
#!/bin/bash
# 自動生成 repomix 輸出
docker run -v ${PWD}:/app -it --rm ghcr.io/yamadashy/repomix \
  --config repomix.config.json \
  --output repomix-output.md
```

## 🤖 AI Agent 推薦

### 主要推薦：Claude 3.5 Sonnet
- **通用性最佳**：可以處理代碼、文檔、架構分析
- **代碼能力強**：優秀的 Angular/TypeScript 支持
- **整合度高**：與 Cursor 完美整合
- **成本控制**：通過 repomix 節省令牌

### 分層使用策略
1. **Claude 3.5 Sonnet**：架構分析、代碼審查、功能設計
2. **GitHub Copilot**：代碼生成、自動完成
3. **本地模型**：敏感數據處理、離線開發

### 成本優化
- 使用 repomix 極致節省模式（88% 令牌節省）
- 分層使用不同 AI Agent
- 監控令牌使用量
