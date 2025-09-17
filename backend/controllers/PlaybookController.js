const PlaybookService = require('../services/PlaybookService');
const ExecutionLogService = require('../services/ExecutionLogService');

class PlaybookController {
  constructor() {
    this.playbookService = new PlaybookService();
    this.logService = new ExecutionLogService();
  }

  async getPlaybooks(req, res) {
    try {
      const playbooks = await this.playbookService.getPlaybooks();
      res.json({
        success: true,
        data: playbooks
      });
    } catch (error) {
      console.error('Error getting playbooks:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPlaybook(req, res) {
    try {
      const { filename } = req.params;
      const playbook = await this.playbookService.getPlaybook(filename);
      res.json({
        success: true,
        data: playbook
      });
    } catch (error) {
      console.error('Error getting playbook:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async createPlaybook(req, res) {
    try {
      const { name, config } = req.body;
      
      // 處理前端發送的數據結構
      const playbookData = config ? {
        name: name,
        description: config.name,
        hosts: config.hosts,
        tasks: config.tasks,
        vars: config.vars || {},
        become: config.become !== false
      } : req.body;
      
      const result = await this.playbookService.createPlaybook(playbookData);
      
      res.json({
        success: true,
        message: 'Playbook 創建成功',
        data: result
      });
    } catch (error) {
      console.error('Error creating playbook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async executePlaybook(req, res) {
    try {
      const { playbookName, targetHosts, options, user } = req.body;
      
      if (!playbookName) {
        return res.status(400).json({
          success: false,
          error: 'Playbook name is required'
        });
      }

      const startTime = new Date().toISOString();
      const result = await this.playbookService.executePlaybook(
        playbookName, 
        targetHosts || 'all', 
        options || {}
      );
      const endTime = new Date().toISOString();

      // 記錄執行日誌
      try {
        await this.logService.logExecution({
          playbookName,
          targetHosts: targetHosts || 'all',
          user: user || 'anonymous',
          result,
          startTime,
          endTime
        });
      } catch (logError) {
        console.error('Error logging execution:', logError);
      }

      res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      console.error('Error executing playbook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async validatePlaybook(req, res) {
    try {
      const { filename } = req.params;
      const result = await this.playbookService.validatePlaybook(filename);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error validating playbook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deletePlaybook(req, res) {
    try {
      const { filename } = req.params;
      await this.playbookService.deletePlaybook(filename);
      
      res.json({
        success: true,
        message: 'Playbook 刪除成功'
      });
    } catch (error) {
      console.error('Error deleting playbook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getExecutionHistory(req, res) {
    try {
      const { days = 7, limit = 100 } = req.query;
      const history = await this.logService.getExecutionHistory(
        parseInt(days), 
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting execution history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getExecutionStats(req, res) {
    try {
      const { days = 30 } = req.query;
      const stats = await this.logService.getExecutionStats(parseInt(days));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting execution stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = PlaybookController;