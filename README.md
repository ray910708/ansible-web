# Ansible Web 管理平台

一個基於 Web 的 Ansible 管理平台，提供直觀的圖形化界面來管理主機、腳本和 Playbook。

![Platform Status](https://img.shields.io/badge/status-active-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![React](https://img.shields.io/badge/react-18.2.0-blue)

## 🌟 功能特色

- **主機管理**: 新增、編輯、刪除主機，實時監控主機狀態
- **腳本管理**: 管理和執行 Shell 腳本
- **Playbook 管理**: 建立和執行 Ansible Playbook
- **即時監控**: WebSocket 實時顯示執行狀態和日誌
- **執行歷史**: 查看所有執行記錄和結果
- **使用者友好**: 中文界面，易於操作

## 🏗️ 系統架構

```
ansible-web/
├── frontend/          # React 前端應用
├── backend/           # Node.js 後端 API
├── ansible-configs/   # Ansible 配置文件
├── logs/             # 系統日誌
└── README.md
```

### 技術棧

**前端**
- React 18.2.0
- Tailwind CSS
- Lucide React Icons
- WebSocket 客戶端

**後端**
- Node.js + Express
- SQLite 數據庫
- WebSocket 服務
- JWT 身份驗證
- Multer 文件上傳

**Ansible**
- Ansible Core
- 自定義 Playbook
- 庫存管理
- SSH 連接管理

## 🚀 快速開始

### 系統需求

- Node.js 18.0+
- npm 或 yarn
- Ansible 已安裝並配置
- SSH 金鑰已設置

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd ansible-web
   ```

2. **安裝後端依賴**
   ```bash
   cd backend
   npm install
   ```

3. **安裝前端依賴**
   ```bash
   cd ../frontend
   npm install
   ```

4. **配置 Ansible**
   ```bash
   # 複製並編輯 Ansible 配置
   cd ../ansible-configs
   # 編輯 inventory.ini 添加您的主機
   # 確保 SSH 金鑰配置正確
   ```

### 啟動服務

1. **啟動後端服務**
   ```bash
   cd backend
   npm run dev
   # 或生產環境: npm start
   ```

2. **啟動前端服務**
   ```bash
   cd frontend
   npm start
   ```

3. **訪問應用**
   - 前端: http://localhost:3000
   - 後端 API: http://localhost:3001

## 📖 使用說明

### 主機管理
1. 在「主機管理」頁面添加新主機
2. 配置主機 IP、SSH 端口、用戶名等信息
3. 測試主機連接狀態
4. 查看主機詳細信息

### 腳本管理
1. 在「腳本管理」頁面上傳或建立腳本
2. 選擇目標主機執行腳本
3. 實時查看執行結果

### Playbook 管理
1. 建立或上傳 Ansible Playbook
2. 配置執行參數
3. 選擇目標主機群組
4. 執行並監控進度

### 執行監控
- 實時查看當前執行的任務
- WebSocket 即時更新執行狀態
- 查看詳細的執行日誌

## 🔧 配置說明

### Ansible 配置

編輯 `ansible-configs/ansible.cfg`:
```ini
[defaults]
inventory = ./inventory.ini
remote_user = ansible
private_key_file = ~/.ssh/ansible_key
host_key_checking = False
```

### 主機清單

編輯 `ansible-configs/inventory.ini`:
```ini
[webservers]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

[databases]
db1 ansible_host=192.168.1.20
```

### 後端配置

創建 `backend/config/config.js`:
```javascript
module.exports = {
  server: {
    port: 3001
  },
  database: {
    path: './data/ansible-web.db'
  }
};
```

## 🔌 API 文檔

### 主機管理 API
```
GET    /api/hosts              # 獲取所有主機
POST   /api/hosts              # 添加新主機
PUT    /api/hosts/:hostName    # 更新主機信息
DELETE /api/hosts/:hostName    # 刪除主機
GET    /api/hosts/status/all   # 獲取所有主機狀態
```

### 腳本管理 API
```
GET    /api/scripts            # 獲取所有腳本
POST   /api/scripts            # 上傳新腳本
POST   /api/scripts/execute    # 執行腳本
DELETE /api/scripts/:id        # 刪除腳本
```

### Playbook API
```
GET    /api/playbooks          # 獲取所有 Playbook
POST   /api/playbooks          # 上傳新 Playbook
POST   /api/playbooks/execute  # 執行 Playbook
DELETE /api/playbooks/:id      # 刪除 Playbook
```

## 🛠️ 開發

### 專案結構

```
backend/
├── controllers/       # 控制器
├── services/         # 業務邏輯服務
├── config/          # 配置文件
├── data/            # SQLite 數據庫
└── server.js        # 主服務器文件

frontend/
├── src/
│   ├── components/  # React 組件
│   ├── hooks/       # 自定義 Hook
│   └── App.js       # 主應用組件
└── public/          # 靜態資源
```

### 開發命令

```bash
# 後端開發
cd backend
npm run dev          # 開發模式（自動重啟）

# 前端開發
cd frontend
npm start            # 開發服務器
npm run build        # 構建生產版本
npm test             # 執行測試
```

## 🔒 安全說明

- 確保 SSH 私鑰安全存儲
- 使用專用的 Ansible 用戶帳戶
- 定期更新依賴包
- 在生產環境中使用 HTTPS
- 實施適當的訪問控制

## 📝 變更日誌

### v2.0.0
- 重新設計的用戶界面
- 新增 WebSocket 實時監控
- 改進的錯誤處理
- 更好的日誌記錄

### v1.0.0
- 初始版本發布
- 基本主機管理功能
- 腳本執行功能
- Playbook 管理功能

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案使用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 📞 支援

如果您遇到問題或需要幫助：

- 提交 [Issue](../../issues)
- 查看 [討論區](../../discussions)
- 發送電子郵件至: support@example.com

## 🙏 致謝

感謝所有貢獻者和開源社區的支持！

---

**快樂的 Ansible 自動化！** 🚀