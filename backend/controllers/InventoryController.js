const InventoryService = require('../services/InventoryService');
const HostStatusService = require('../services/HostStatusService');

class InventoryController {
  constructor() {
    this.inventoryService = new InventoryService();
    this.hostStatusService = new HostStatusService();
  }

  async getInventory(req, res) {
    try {
      const inventory = await this.inventoryService.getInventory();
      res.json({
        success: true,
        data: inventory
      });
    } catch (error) {
      console.error('Error getting inventory:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async addHost(req, res) {
    try {
      const hostData = req.body;
      await this.inventoryService.addHost(hostData);
      
      res.json({
        success: true,
        message: '主機添加成功'
      });
    } catch (error) {
      console.error('Error adding host:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateHost(req, res) {
    try {
      const { hostName } = req.params;
      const hostData = req.body;
      
      await this.inventoryService.updateHost(hostName, hostData);
      
      res.json({
        success: true,
        message: '主機更新成功'
      });
    } catch (error) {
      console.error('Error updating host:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteHost(req, res) {
    try {
      const { hostName } = req.params;
      await this.inventoryService.deleteHost(hostName);
      
      res.json({
        success: true,
        message: '主機刪除成功'
      });
    } catch (error) {
      console.error('Error deleting host:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getGroups(req, res) {
    try {
      const groups = await this.inventoryService.getGroups();
      res.json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error('Error getting groups:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getHostsStatus(req, res) {
    try {
      const inventory = await this.inventoryService.getInventory();
      const hostsStatus = await this.hostStatusService.checkAllHosts(inventory.hosts);
      
      res.json({
        success: true,
        data: hostsStatus
      });
    } catch (error) {
      console.error('Error getting hosts status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getHostStatus(req, res) {
    try {
      const { hostName } = req.params;
      const inventory = await this.inventoryService.getInventory();
      const host = inventory.hosts.find(h => h.name === hostName);
      
      if (!host) {
        return res.status(404).json({
          success: false,
          error: 'Host not found'
        });
      }

      const status = await this.hostStatusService.checkHostStatus(host);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting host status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = InventoryController;