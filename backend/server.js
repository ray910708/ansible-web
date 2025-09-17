const express = require('express');
const cors = require('cors');
const path = require('path');

// Import services
const InventoryService = require('./services/InventoryService');
const ScriptService = require('./services/ScriptService');
const PlaybookService = require('./services/PlaybookService');
const ExecutionLogService = require('./services/ExecutionLogService');
const WebSocketService = require('./services/WebSocketService');

// Import controllers
const InventoryController = require('./controllers/InventoryController');
const ScriptController = require('./controllers/ScriptController');
const PlaybookController = require('./controllers/PlaybookController');

const config = require('./config/config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize controllers
const inventoryController = new InventoryController();
const scriptController = new ScriptController();
const playbookController = new PlaybookController();

// Initialize WebSocket service
const webSocketService = new WebSocketService();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Ansible Web Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// ===== INVENTORY API ROUTES =====
app.get('/api/hosts', inventoryController.getInventory.bind(inventoryController));
app.post('/api/hosts', inventoryController.addHost.bind(inventoryController));
app.put('/api/hosts/:hostName', inventoryController.updateHost.bind(inventoryController));
app.delete('/api/hosts/:hostName', inventoryController.deleteHost.bind(inventoryController));
app.get('/api/groups', inventoryController.getGroups.bind(inventoryController));
app.get('/api/hosts/status/all', inventoryController.getHostsStatus.bind(inventoryController));
app.get('/api/hosts/status/:hostName', inventoryController.getHostStatus.bind(inventoryController));

// ===== SCRIPT API ROUTES =====
app.get('/api/scripts', scriptController.getScripts.bind(scriptController));
app.get('/api/scripts/:filename', scriptController.getScript.bind(scriptController));
app.post('/api/scripts', scriptController.saveScript.bind(scriptController));
app.put('/api/scripts/:filename', scriptController.updateScript.bind(scriptController));
app.delete('/api/scripts/:filename', scriptController.deleteScript.bind(scriptController));
app.get('/api/script-templates', scriptController.getScriptTemplates.bind(scriptController));
app.get('/api/os-categories', scriptController.getOsCategories.bind(scriptController));

// ===== PLAYBOOK API ROUTES =====
app.get('/api/playbooks', playbookController.getPlaybooks.bind(playbookController));
app.get('/api/playbooks/:filename', playbookController.getPlaybook.bind(playbookController));
app.post('/api/playbooks', playbookController.createPlaybook.bind(playbookController));
app.post('/api/playbooks/execute', playbookController.executePlaybook.bind(playbookController));
app.post('/api/playbooks/:filename/validate', playbookController.validatePlaybook.bind(playbookController));
app.delete('/api/playbooks/:filename', playbookController.deletePlaybook.bind(playbookController));

// ===== EXECUTION LOG API ROUTES =====
app.get('/api/executions/history', playbookController.getExecutionHistory.bind(playbookController));
app.get('/api/executions/stats', playbookController.getExecutionStats.bind(playbookController));

// Legacy API endpoints for backward compatibility
app.get('/api/script-templates/:templateId', (req, res) => {
  try {
    const scriptService = new ScriptService();
    scriptService.getScriptTemplates().then(templates => {
      const template = templates[req.params.templateId];
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ success: true, template });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Start server
async function startServer() {
  try {
    // Start HTTP server
    app.listen(PORT, config.server.host, () => {
      console.log(`✅ Ansible Web Platform API server running on http://${config.server.host}:${PORT}`);
      console.log(`📁 Ansible config directory: ${config.ansible.configDir}`);
      console.log(`📋 Inventory file: ${config.ansible.inventory}`);
      console.log(`📚 Playbooks directory: ${config.ansible.playbooks}`);
      console.log(`📜 Scripts directory: ${config.ansible.scripts}`);
      console.log(`📊 Logs directory: ${config.ansible.logs}`);
    });

    // Start WebSocket server
    webSocketService.start(config.websocket.port);
    console.log(`🔗 WebSocket server started on port ${config.websocket.port}`);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  webSocketService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  webSocketService.stop();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;