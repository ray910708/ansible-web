const { spawn } = require('child_process');
const config = require('../config/config');

class HostStatusService {
  constructor() {
    this.statusCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  async checkHostStatus(host) {
    const cacheKey = `${host.name}-${host.ip}`;
    const cached = this.statusCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.status;
    }

    try {
      const status = await this.pingHost(host);
      this.statusCache.set(cacheKey, {
        status,
        timestamp: Date.now()
      });
      return status;
    } catch (error) {
      const errorStatus = {
        online: false,
        reachable: false,
        ssh: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
      
      this.statusCache.set(cacheKey, {
        status: errorStatus,
        timestamp: Date.now()
      });
      
      return errorStatus;
    }
  }

  async pingHost(host) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // First check if host is reachable via ping
      const pingProcess = spawn('ping', ['-c', '1', '-W', '3000', host.ip || host.name]);
      
      let pingOutput = '';
      let pingError = '';
      
      pingProcess.stdout.on('data', (data) => {
        pingOutput += data.toString();
      });
      
      pingProcess.stderr.on('data', (data) => {
        pingError += data.toString();
      });
      
      pingProcess.on('close', async (pingCode) => {
        const responseTime = Date.now() - startTime;
        const reachable = pingCode === 0;
        
        let sshStatus = false;
        let sshError = '';
        
        // If ping successful, test SSH connection
        if (reachable && host.user) {
          try {
            sshStatus = await this.testSSHConnection(host);
          } catch (error) {
            sshError = error.message;
          }
        }
        
        const status = {
          online: reachable,
          reachable: reachable,
          ssh: sshStatus,
          responseTime: reachable ? responseTime : null,
          lastChecked: new Date().toISOString(),
          error: !reachable ? (pingError || 'Host unreachable') : (sshError || null)
        };
        
        resolve(status);
      });
      
      pingProcess.on('error', (error) => {
        reject(new Error(`Ping failed: ${error.message}`));
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        pingProcess.kill();
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }

  async testSSHConnection(host) {
    return new Promise((resolve, reject) => {
      // 使用更寬鬆的 SSH 測試，允許密碼認證
      const args = [
        '-o', 'ConnectTimeout=10',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'PasswordAuthentication=yes',
        '-o', 'PubkeyAuthentication=yes',
        '-o', 'PreferredAuthentications=publickey,password,keyboard-interactive',
        '-o', 'LogLevel=ERROR'
      ];
      
      if (host.port && host.port !== 22) {
        args.push('-p', host.port);
      }
      
      args.push(`${host.user}@${host.ip || host.name}`);
      args.push('echo "SSH connection test successful"');
      
      const sshProcess = spawn('ssh', args);
      
      let output = '';
      let error = '';
      
      sshProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      sshProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      sshProcess.on('close', (code) => {
        // 如果成功執行或者只是認證問題（但能建立連接），都認為 SSH 可用
        if (code === 0 || output.includes('SSH connection test successful')) {
          resolve(true);
        } else {
          // 檢查是否是連接本身的問題還是認證問題
          if (error.includes('Connection refused') || 
              error.includes('No route to host') ||
              error.includes('Host key verification failed') ||
              error.includes('Could not resolve hostname')) {
            reject(new Error('SSH service not available'));
          } else if (error.includes('Permission denied') || 
                     error.includes('Authentication failed')) {
            // 如果只是認證失敗，說明 SSH 服務是可用的
            resolve(true);
          } else {
            // 其他錯誤情況，嘗試更簡單的連接測試
            this.testSimpleConnection(host).then(resolve).catch(reject);
          }
        }
      });
      
      sshProcess.on('error', (err) => {
        reject(new Error(`SSH process error: ${err.message}`));
      });
      
      // Timeout after 15 seconds
      setTimeout(() => {
        sshProcess.kill();
        reject(new Error('SSH connection timeout'));
      }, 15000);
    });
  }

  async testSimpleConnection(host) {
    return new Promise((resolve, reject) => {
      // 最簡單的 SSH 端口連接測試
      const args = [
        '-o', 'ConnectTimeout=5',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'BatchMode=yes', // 不提示輸入密碼
        '-o', 'LogLevel=ERROR'
      ];
      
      if (host.port && host.port !== 22) {
        args.push('-p', host.port);
      }
      
      args.push(`${host.user}@${host.ip || host.name}`);
      args.push('exit 0');
      
      const sshProcess = spawn('ssh', args);
      
      let error = '';
      
      sshProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      sshProcess.on('close', () => {
        // 對於簡單連接測試，任何非致命錯誤都認為 SSH 服務可用
        if (error.includes('Connection refused') || 
            error.includes('No route to host') ||
            error.includes('Could not resolve hostname')) {
          reject(new Error('SSH service not available'));
        } else {
          // 即使認證失敗，也說明 SSH 服務是運行的
          resolve(true);
        }
      });
      
      sshProcess.on('error', (err) => {
        reject(new Error(`SSH test error: ${err.message}`));
      });
      
      // Timeout after 8 seconds
      setTimeout(() => {
        sshProcess.kill();
        reject(new Error('SSH connection timeout'));
      }, 8000);
    });
  }

  async testSimpleSSH(host) {
    return new Promise((resolve, reject) => {
      // 備用的 SSH 測試方法
      this.testSimpleConnection(host).then(resolve).catch(reject);
    });
  }

  async checkAllHosts(hosts) {
    const results = {};
    
    // Check hosts in parallel with limited concurrency
    const batchSize = 5;
    for (let i = 0; i < hosts.length; i += batchSize) {
      const batch = hosts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (host) => {
        try {
          const status = await this.checkHostStatus(host);
          results[host.name] = status;
        } catch (error) {
          results[host.name] = {
            online: false,
            reachable: false,
            ssh: false,
            error: error.message,
            lastChecked: new Date().toISOString()
          };
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    return results;
  }

  clearCache() {
    this.statusCache.clear();
  }
  
  getCacheStats() {
    return {
      size: this.statusCache.size,
      entries: Array.from(this.statusCache.entries()).map(([key, value]) => ({
        host: key,
        cached: new Date(value.timestamp).toISOString(),
        status: value.status.online ? 'online' : 'offline'
      }))
    };
  }
}

module.exports = HostStatusService;