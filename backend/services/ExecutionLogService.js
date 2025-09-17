const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class ExecutionLogService {
  constructor() {
    this.logsDir = config.ansible.logs;
    this.ensureLogsDir();
  }

  async ensureLogsDir() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      await fs.mkdir(path.join(this.logsDir, 'executions'), { recursive: true });
    } catch (error) {
      console.error('Error ensuring logs directory:', error);
    }
  }

  async logExecution(executionData) {
    const {
      playbookName,
      targetHosts,
      user,
      result,
      startTime,
      endTime
    } = executionData;

    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      playbook: playbookName,
      targets: Array.isArray(targetHosts) ? targetHosts : [targetHosts],
      user: user || 'system',
      success: result.success,
      duration: result.duration,
      exitCode: result.exitCode,
      output: result.output,
      errors: result.errors,
      command: result.command,
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date().toISOString()
    };

    try {
      const logDate = logEntry.timestamp.split('T')[0];
      const logFile = path.join(this.logsDir, 'executions', `${logDate}.jsonl`);
      
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      
      return logEntry.id;
    } catch (error) {
      console.error('Error logging execution:', error);
      throw error;
    }
  }

  async getExecutionHistory(days = 7, limit = 100) {
    try {
      const executions = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let i = 0; i < days; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() + i);
        
        const logDate = checkDate.toISOString().split('T')[0];
        const logFile = path.join(this.logsDir, 'executions', `${logDate}.jsonl`);
        
        try {
          const content = await fs.readFile(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          
          for (const line of lines) {
            try {
              const execution = JSON.parse(line);
              executions.push(execution);
            } catch (parseError) {
              console.warn('Error parsing log line:', parseError);
            }
          }
        } catch (fileError) {
          // 檔案不存在是正常的，跳過
          continue;
        }
      }

      // 按時間戳排序（最新的在前）
      executions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return executions.slice(0, limit);
    } catch (error) {
      console.error('Error getting execution history:', error);
      return [];
    }
  }

  async getExecutionStats(days = 30) {
    try {
      const executions = await this.getExecutionHistory(days, 1000);
      
      const stats = {
        total: executions.length,
        successful: executions.filter(e => e.success).length,
        failed: executions.filter(e => !e.success).length,
        averageDuration: 0,
        playbookUsage: {},
        dailyStats: {}
      };

      if (executions.length > 0) {
        // 計算平均執行時間
        const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
        stats.averageDuration = Math.round(totalDuration / executions.length);

        // 統計 Playbook 使用情況
        executions.forEach(execution => {
          const playbook = execution.playbook;
          if (!stats.playbookUsage[playbook]) {
            stats.playbookUsage[playbook] = { count: 0, success: 0, failed: 0 };
          }
          stats.playbookUsage[playbook].count++;
          if (execution.success) {
            stats.playbookUsage[playbook].success++;
          } else {
            stats.playbookUsage[playbook].failed++;
          }
        });

        // 統計每日執行情況
        executions.forEach(execution => {
          const date = execution.timestamp.split('T')[0];
          if (!stats.dailyStats[date]) {
            stats.dailyStats[date] = { count: 0, success: 0, failed: 0 };
          }
          stats.dailyStats[date].count++;
          if (execution.success) {
            stats.dailyStats[date].success++;
          } else {
            stats.dailyStats[date].failed++;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting execution stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        playbookUsage: {},
        dailyStats: {}
      };
    }
  }
}

module.exports = ExecutionLogService;