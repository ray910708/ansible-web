const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class ScriptService {
  constructor() {
    this.scriptsDir = config.ansible.scripts;
    this.osTemplatesPath = path.join(config.ansible.configDir, 'os-templates.json');
    this.ensureScriptsDir();
  }

  async ensureScriptsDir() {
    try {
      await fs.mkdir(this.scriptsDir, { recursive: true });
      // 確保 OS 子目錄存在
      const osTypes = ['ubuntu', 'centos', 'debian', 'rhel', 'windows', 'generic'];
      for (const osType of osTypes) {
        await fs.mkdir(path.join(this.scriptsDir, osType), { recursive: true });
      }
    } catch (error) {
      console.error('Error ensuring scripts directory:', error);
    }
  }

  async getOsCategories() {
    try {
      const data = await fs.readFile(this.osTemplatesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting OS categories:', error);
      // 返回預設的 OS 分類
      return {
        osCategories: [
          {
            id: "ubuntu",
            name: "Ubuntu",
            icon: "ubuntu",
            color: "#E95420",
            packageManager: "apt",
            versions: ["20.04", "22.04", "24.04"],
            family: "debian"
          },
          {
            id: "centos",
            name: "CentOS",
            icon: "centos",
            color: "#932279",
            packageManager: "yum",
            versions: ["7", "8", "9"],
            family: "rhel"
          },
          {
            id: "generic",
            name: "通用腳本",
            icon: "server",
            color: "#6B7280",
            packageManager: "generic",
            versions: ["any"],
            family: "unix"
          }
        ],
        scriptCategories: [
          {
            id: "system",
            name: "系統管理",
            description: "系統資訊、用戶管理、權限設定等"
          },
          {
            id: "software",
            name: "軟體安裝",
            description: "應用程式安裝、配置和管理"
          }
        ]
      };
    }
  }

  async getScripts(osFilter = null, categoryFilter = null) {
    try {
      const scripts = [];
      const osTypes = osFilter ? [osFilter] : ['ubuntu', 'centos', 'debian', 'rhel', 'windows', 'generic'];
      
      // 首先掃描根目錄的舊腳本（向後兼容）
      await this.scanDirectory(this.scriptsDir, scripts, 'legacy');
      
      // 然後掃描各 OS 子目錄
      for (const osType of osTypes) {
        const osDir = path.join(this.scriptsDir, osType);
        try {
          await this.scanDirectory(osDir, scripts, osType);
        } catch (error) {
          // 如果目錄不存在，跳過
          continue;
        }
      }

      // 過濾分類
      let filteredScripts = scripts;
      if (categoryFilter) {
        filteredScripts = scripts.filter(script => 
          script.category === categoryFilter
        );
      }

      return filteredScripts.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      console.error('Error getting scripts:', error);
      return [];
    }
  }

  async scanDirectory(dirPath, scripts, osType) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && this.isScriptFile(file)) {
          const content = await fs.readFile(filePath, 'utf8');
          const category = this.detectCategory(content, file);
          
          scripts.push({
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            type: this.getScriptType(file),
            osType: osType,
            category: category,
            content: content,
            preview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            relativePath: osType === 'legacy' ? file : `${osType}/${file}`
          });
        }
      }
    } catch (error) {
      // 目錄不存在或無法讀取，跳過
      if (error.code !== 'ENOENT') {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
    }
  }

  isScriptFile(filename) {
    const validExtensions = ['.sh', '.py', '.ps1'];
    return validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  detectCategory(content, filename) {
    const contentLower = content.toLowerCase();
    const filenameLower = filename.toLowerCase();
    
    // 基於內容和檔名檢測分類
    if (contentLower.includes('docker') || filenameLower.includes('docker')) {
      return 'software';
    }
    if (contentLower.includes('nginx') || contentLower.includes('apache') || filenameLower.includes('nginx')) {
      return 'software';
    }
    if (contentLower.includes('update') || contentLower.includes('upgrade') || filenameLower.includes('update')) {
      return 'system';
    }
    if (contentLower.includes('backup') || filenameLower.includes('backup')) {
      return 'backup';
    }
    if (contentLower.includes('firewall') || contentLower.includes('iptables') || filenameLower.includes('security')) {
      return 'security';
    }
    if (contentLower.includes('log') || filenameLower.includes('log') || filenameLower.includes('monitor')) {
      return 'monitoring';
    }
    
    // 預設分類
    return 'system';
  }

  async getScript(filename) {
    try {
      // 先嘗試在 OS 目錄中找
      const osTypes = ['ubuntu', 'centos', 'debian', 'rhel', 'windows', 'generic'];
      
      for (const osType of osTypes) {
        const filePath = path.join(this.scriptsDir, osType, filename);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const stats = await fs.stat(filePath);
          
          return {
            name: filename,
            content,
            size: stats.size,
            modified: stats.mtime,
            type: this.getScriptType(filename),
            osType: osType,
            category: this.detectCategory(content, filename)
          };
        } catch (error) {
          continue; // 檔案不存在，繼續尋找
        }
      }

      // 如果在 OS 目錄找不到，嘗試根目錄（向後兼容）
      const filePath = path.join(this.scriptsDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);
      
      return {
        name: filename,
        content,
        size: stats.size,
        modified: stats.mtime,
        type: this.getScriptType(filename),
        osType: 'legacy',
        category: this.detectCategory(content, filename)
      };
    } catch (error) {
      console.error('Error getting script:', error);
      throw new Error('Script not found');
    }
  }

  async saveScript(filename, content, type = 'shell', osType = 'generic', category = 'system') {
    try {
      // 確保文件有正確的擴展名
      let extension;
      if (type === 'python') {
        extension = '.py';
      } else if (type === 'powershell') {
        extension = '.ps1';
      } else {
        extension = '.sh';
      }
      
      if (!filename.endsWith(extension)) {
        filename += extension;
      }

      // 確保 OS 目錄存在
      const osDir = path.join(this.scriptsDir, osType);
      await fs.mkdir(osDir, { recursive: true });

      const filePath = path.join(osDir, filename);
      
      // 為腳本添加適當的 shebang
      let scriptContent = content;
      if (!content.startsWith('#!') && !content.startsWith('<#')) {
        if (type === 'python') {
          scriptContent = '#!/usr/bin/env python3\n' + content;
        } else if (type === 'powershell') {
          // PowerShell 不需要 shebang
          scriptContent = content;
        } else {
          scriptContent = '#!/bin/bash\n' + content;
        }
      }

      await fs.writeFile(filePath, scriptContent, { mode: 0o755 });
      
      return {
        name: filename,
        path: filePath,
        type: this.getScriptType(filename),
        osType: osType,
        category: category
      };
    } catch (error) {
      console.error('Error saving script:', error);
      throw error;
    }
  }

  async deleteScript(filename) {
    try {
      // 先嘗試在 OS 目錄中找
      const osTypes = ['ubuntu', 'centos', 'debian', 'rhel', 'windows', 'generic'];
      
      for (const osType of osTypes) {
        const filePath = path.join(this.scriptsDir, osType, filename);
        try {
          await fs.unlink(filePath);
          return true;
        } catch (error) {
          continue;
        }
      }

      // 如果在 OS 目錄找不到，嘗試根目錄
      const filePath = path.join(this.scriptsDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting script:', error);
      throw error;
    }
  }

  getScriptType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.py':
        return 'python';
      case '.sh':
        return 'shell';
      case '.ps1':
        return 'powershell';
      case '.yml':
      case '.yaml':
        return 'ansible';
      default:
        return 'text';
    }
  }

  async getScriptTemplates() {
    const osCategories = await this.getOsCategories();
    
    return {
      'ubuntu-nginx': {
        name: 'Ubuntu Nginx 安裝',
        category: 'software',
        osType: 'ubuntu',
        type: 'shell',
        description: 'Ubuntu 系統上安裝和配置 Nginx',
        content: await this.getTemplateContent('ubuntu', 'nginx-install')
      },
      
      'centos-docker': {
        name: 'CentOS Docker 安裝',
        category: 'software', 
        osType: 'centos',
        type: 'shell',
        description: 'CentOS/RHEL 系統上安裝 Docker CE',
        content: await this.getTemplateContent('centos', 'docker-install')
      },
      
      'ubuntu-update': {
        name: 'Ubuntu 系統更新',
        category: 'system',
        osType: 'ubuntu',
        type: 'shell', 
        description: 'Ubuntu 系統套件更新和維護',
        content: await this.getTemplateContent('ubuntu', 'system-update')
      },

      'windows-info': {
        name: 'Windows 系統資訊',
        category: 'system',
        osType: 'windows',
        type: 'powershell',
        description: 'Windows 系統資訊檢查腳本',
        content: await this.getTemplateContent('windows', 'system-info')
      }
    };
  }

  async getTemplateContent(osType, templateType) {
    const templateMap = {
      'ubuntu': {
        'nginx-install': `#!/bin/bash
# Ubuntu Nginx 安裝腳本
# 適用於 Ubuntu 20.04+

set -e
echo "開始安裝 Nginx..."

# 設定非交互式環境
export DEBIAN_FRONTEND=noninteractive

# 更新套件清單
apt-get update -y

# 安裝 Nginx
apt-get install -y nginx

# 啟動並設定開機自動啟動
systemctl start nginx
systemctl enable nginx

# 配置防火牆
ufw allow 'Nginx Full'

echo "Nginx 安裝完成！"
echo "狀態: $(systemctl is-active nginx)"`,

        'system-update': `#!/bin/bash
# Ubuntu 系統更新腳本

set -e
export DEBIAN_FRONTEND=noninteractive

echo "開始系統更新..."

# 更新套件清單
apt-get update -y

# 升級套件
apt-get upgrade -y

# 清理
apt-get autoremove -y
apt-get autoclean

echo "系統更新完成！"`
      },
      
      'centos': {
        'docker-install': `#!/bin/bash
# CentOS Docker 安裝腳本

set -e
echo "開始安裝 Docker..."

# 移除舊版本
yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安裝依賴
yum install -y yum-utils

# 添加 Docker 儲存庫
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安裝 Docker CE
yum install -y docker-ce docker-ce-cli containerd.io

# 啟動 Docker
systemctl start docker
systemctl enable docker

echo "Docker 安裝完成！"`
      },

      'windows': {
        'system-info': `# Windows 系統資訊檢查腳本
Write-Host "=== Windows 系統資訊 ===" -ForegroundColor Green

$computerInfo = Get-ComputerInfo
Write-Host "電腦名稱: $($computerInfo.CsName)"
Write-Host "作業系統: $($computerInfo.WindowsProductName)"
Write-Host "版本: $($computerInfo.WindowsVersion)"
Write-Host "架構: $($computerInfo.OsArchitecture)"

Write-Host "檢查完成！" -ForegroundColor Green`
      }
    };

    try {
      return templateMap[osType]?.[templateType] || '# 模板內容不可用';
    } catch (error) {
      return '# 模板載入失敗';
    }
  }
}

module.exports = ScriptService;