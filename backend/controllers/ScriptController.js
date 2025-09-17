const ScriptService = require('../services/ScriptService');

class ScriptController {
  constructor() {
    this.scriptService = new ScriptService();
  }

  async getScripts(req, res) {
    try {
      const { os, category } = req.query;
      const scripts = await this.scriptService.getScripts(os, category);
      res.json({
        success: true,
        data: scripts
      });
    } catch (error) {
      console.error('Error getting scripts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getScript(req, res) {
    try {
      const { filename } = req.params;
      const script = await this.scriptService.getScript(filename);
      res.json({
        success: true,
        data: script
      });
    } catch (error) {
      console.error('Error getting script:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async saveScript(req, res) {
    try {
      const { name, content, type, osType, category } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({
          success: false,
          error: 'Name and content are required'
        });
      }

      const result = await this.scriptService.saveScript(name, content, type, osType, category);
      res.json({
        success: true,
        message: '腳本保存成功',
        data: result
      });
    } catch (error) {
      console.error('Error saving script:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateScript(req, res) {
    try {
      const { filename } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required'
        });
      }

      // Extract name without extension for saveScript
      const nameWithoutExt = filename.replace(/\.(py|sh)$/, '');
      const type = filename.endsWith('.py') ? 'python' : 'shell';
      
      const result = await this.scriptService.saveScript(nameWithoutExt, content, type);
      res.json({
        success: true,
        message: '腳本更新成功',
        data: result
      });
    } catch (error) {
      console.error('Error updating script:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteScript(req, res) {
    try {
      const { filename } = req.params;
      await this.scriptService.deleteScript(filename);
      
      res.json({
        success: true,
        message: '腳本刪除成功'
      });
    } catch (error) {
      console.error('Error deleting script:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getScriptTemplates(req, res) {
    try {
      const templates = await this.scriptService.getScriptTemplates();
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error getting script templates:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getOsCategories(req, res) {
    try {
      const categories = await this.scriptService.getOsCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error getting OS categories:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ScriptController;