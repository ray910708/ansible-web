const fs = require('fs').promises;
const path = require('path');
const YAML = require('js-yaml');
const { spawn } = require('child_process');
const config = require('../config/config');

class PlaybookService {
  constructor() {
    this.playbooksDir = config.ansible.playbooks;
    this.inventoryFile = config.ansible.inventory;
    this.ensurePlaybooksDir();
  }

  async ensurePlaybooksDir() {
    try {
      await fs.mkdir(this.playbooksDir, { recursive: true });
      // 確保 OS 子目錄存在
      const osTypes = ['ubuntu', 'centos', 'debian', 'rhel', 'windows', 'generic'];
      for (const osType of osTypes) {
        await fs.mkdir(path.join(this.playbooksDir, osType), { recursive: true });
      }
    } catch (error) {
      console.error('Error ensuring playbooks directory:', error);
    }
  }

  async getPlaybooks(osFilter = null) {
    try {
      const playbooks = [];
      const osTypes = osFilter ? [osFilter] : ['ubuntu', 'centos', 'debian', 'rhel', 'windows', 'generic'];
      
      // 首先掃描根目錄的舊 playbooks（向後兼容）
      await this.scanPlaybooksDirectory(this.playbooksDir, playbooks, 'legacy');
      
      // 然後掃描各 OS 子目錄
      for (const osType of osTypes) {
        const osDir = path.join(this.playbooksDir, osType);
        try {
          await this.scanPlaybooksDirectory(osDir, playbooks, osType);
        } catch (error) {
          // 如果目錄不存在，跳過
          continue;
        }
      }

      return playbooks.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      console.error('Error getting playbooks:', error);
      return [];
    }
  }

  async scanPlaybooksDirectory(dirPath, playbooks, osType) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            const content = await fs.readFile(filePath, 'utf8');
            
            try {
              const parsed = YAML.load(content);
              const category = this.detectPlaybookCategory(parsed, file);
              
              playbooks.push({
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                content: parsed,
                osType: osType,
                category: category,
                valid: true,
                relativePath: osType === 'legacy' ? file : `${osType}/${file}`
              });
            } catch (yamlError) {
              playbooks.push({
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                content: content,
                osType: osType,
                category: 'unknown',
                valid: false,
                error: yamlError.message,
                relativePath: osType === 'legacy' ? file : `${osType}/${file}`
              });
            }
          }
        }
      }
    } catch (error) {
      // 目錄不存在或無法讀取，跳過
      if (error.code !== 'ENOENT') {
        console.error(`Error scanning playbook directory ${dirPath}:`, error);
      }
    }
  }

  detectPlaybookCategory(parsed, filename) {
    if (!parsed || !Array.isArray(parsed)) {
      return 'unknown';
    }

    const firstPlay = parsed[0];
    if (!firstPlay || !firstPlay.name) {
      return 'unknown';
    }

    const playName = firstPlay.name.toLowerCase();
    const filenameLower = filename.toLowerCase();
    
    // 基於 playbook 名稱和檔名檢測分類
    if (playName.includes('system') || playName.includes('maintenance') || filenameLower.includes('system')) {
      return 'system';
    }
    if (playName.includes('install') || playName.includes('setup') || filenameLower.includes('install')) {
      return 'software';
    }
    if (playName.includes('security') || playName.includes('firewall') || filenameLower.includes('security')) {
      return 'security';
    }
    if (playName.includes('backup') || filenameLower.includes('backup')) {
      return 'backup';
    }
    if (playName.includes('monitor') || filenameLower.includes('monitor')) {
      return 'monitoring';
    }
    if (playName.includes('network') || filenameLower.includes('network')) {
      return 'network';
    }
    
    return 'system'; // 預設分類
  }

  async getPlaybook(filename) {
    try {
      const filePath = path.join(this.playbooksDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);
      
      return {
        name: filename,
        content,
        parsed: YAML.load(content),
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting playbook:', error);
      throw new Error('Playbook not found');
    }
  }

  async createPlaybook(playbookData) {
    const { name, description, hosts, tasks, vars = {}, become = true } = playbookData;
    
    if (!name || !hosts || !tasks || tasks.length === 0) {
      throw new Error('Missing required playbook data');
    }

    // 構建 playbook 結構
    const playbook = [{
      name: description || name,
      hosts: Array.isArray(hosts) ? hosts.join(',') : hosts,
      become: become,
      gather_facts: true,
      vars: vars,
      tasks: tasks.map(task => this.formatTask(task))
    }];

    // 生成 YAML 內容
    const yamlContent = YAML.dump(playbook, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    // 確保文件名有 .yml 擴展名
    const filename = name.endsWith('.yml') ? name : `${name}.yml`;
    const filePath = path.join(this.playbooksDir, filename);

    try {
      await fs.writeFile(filePath, yamlContent);
      return {
        name: filename,
        path: filePath,
        content: playbook
      };
    } catch (error) {
      console.error('Error creating playbook:', error);
      throw error;
    }
  }

  formatTask(task) {
    const { name, script, module, args, when, notify, register } = task;
    
    const formattedTask = {
      name: name || 'Unnamed task'
    };

    // 腳本任務
    if (script) {
      formattedTask.script = path.join(config.ansible.scripts, script);
      if (register) formattedTask.register = register;
    }

    // Ansible 模組任務
    if (module) {
      formattedTask[module] = args || {};
    }

    // 條件執行
    if (when) {
      formattedTask.when = when;
    }

    // 通知處理器
    if (notify) {
      formattedTask.notify = notify;
    }

    return formattedTask;
  }

  async executePlaybook(playbookName, targetHosts = 'all', options = {}) {
    return new Promise((resolve, reject) => {
      const playbookPath = path.join(this.playbooksDir, playbookName);
      
      // 構建 ansible-playbook 命令
      const args = [
        '-i', this.inventoryFile,
        playbookPath
      ];

      if (targetHosts !== 'all') {
        args.push('--limit', targetHosts);
      }

      if (options.checkMode) {
        args.push('--check');
      }

      if (options.verbose) {
        args.push('-v');
      }

      if (options.extraVars) {
        args.push('--extra-vars', JSON.stringify(options.extraVars));
      }

      console.log('Executing command:', 'ansible-playbook', args.join(' '));

      const startTime = Date.now();
      const childProcess = spawn('ansible-playbook', args, {
        env: { ...process.env, ANSIBLE_CONFIG: path.join(config.ansible.configDir, '../ansible.cfg') }
      });

      let stdout = '';
      let stderr = '';

      // 設定超時機制 (5分鐘)
      const timeout = setTimeout(() => {
        console.log(`Killing ansible process due to timeout for playbook: ${playbookName}`);
        childProcess.kill('SIGKILL');
        resolve({
          success: false,
          exitCode: -1,
          duration: Date.now() - startTime,
          output: stdout,
          errors: stderr + '\n執行超時：進程已被終止 (5分鐘超時)',
          timestamp: new Date().toISOString(),
          command: `ansible-playbook ${args.join(' ')}`
        });
      }, 5 * 60 * 1000); // 5分鐘超時

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const result = {
          success: code === 0,
          exitCode: code,
          duration,
          output: stdout,
          errors: stderr,
          timestamp: new Date().toISOString(),
          command: `ansible-playbook ${args.join(' ')}`
        };

        resolve(result);
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async validatePlaybook(filename) {
    try {
      const playbookPath = path.join(this.playbooksDir, filename);
      
      return new Promise((resolve, reject) => {
        const args = [
          '--syntax-check',
          '-i', this.inventoryFile,
          playbookPath
        ];

        const childProcess = spawn('ansible-playbook', args);
        let output = '';
        let errors = '';

        childProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
          errors += data.toString();
        });

        childProcess.on('close', (code) => {
          resolve({
            valid: code === 0,
            output,
            errors: errors || null
          });
        });

        childProcess.on('error', (error) => {
          resolve({
            valid: false,
            errors: error.message
          });
        });
      });
    } catch (error) {
      return {
        valid: false,
        errors: error.message
      };
    }
  }

  async deletePlaybook(filename) {
    try {
      const filePath = path.join(this.playbooksDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting playbook:', error);
      throw error;
    }
  }
}

module.exports = PlaybookService;