const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const config = require('../config/config');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.runningProcesses = new Map();
  }

  start(port = config.websocket.port) {
    this.wss = new WebSocket.Server({ port });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      console.log(`WebSocket client ${clientId} connected`);
      
      ws.send(JSON.stringify({
        type: 'connection_established',
        clientId: clientId,
        message: 'WebSocket connection established'
      }));

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, clientId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket client ${clientId} disconnected`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    console.log(`WebSocket server started on port ${port}`);
  }

  async handleMessage(ws, clientId, data) {
    const { type, payload } = data;

    switch (type) {
      case 'execute_playbook':
        await this.handleExecutePlaybook(ws, clientId, payload);
        break;
      
      case 'kill_process':
        await this.handleKillProcess(ws, clientId, payload);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`
        }));
    }
  }

  async handleExecutePlaybook(ws, clientId, payload) {
    const { playbookName, targetHosts, options = {} } = payload;
    
    if (!playbookName) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Playbook name is required'
      }));
      return;
    }

    try {
      const processId = await this.executeWithLiveOutput(
        playbookName, 
        targetHosts || 'all',
        options,
        ws
      );

      ws.send(JSON.stringify({
        type: 'process_registered',
        processId: processId
      }));

    } catch (error) {
      console.error('Error executing playbook:', error);
      ws.send(JSON.stringify({
        type: 'execution_error',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  }

  async executeWithLiveOutput(playbookName, targetHosts, options, websocket) {
    const playbookPath = path.join(config.ansible.playbooks, playbookName);
    const inventoryPath = config.ansible.inventory;
    
    const args = [
      '-i', inventoryPath,
      playbookPath,
      '--limit', targetHosts,
      '-v'
    ];

    if (options.checkMode) {
      args.push('--check');
    }

    if (options.extraVars) {
      args.push('--extra-vars', JSON.stringify(options.extraVars));
    }

    const processId = `${playbookName}-${Date.now()}`;
    const childProcess = spawn('ansible-playbook', args);
    
    this.runningProcesses.set(processId, childProcess);

    websocket.send(JSON.stringify({
      type: 'process_started',
      processId,
      command: `ansible-playbook ${args.join(' ')}`
    }));

    childProcess.stdout.on('data', (data) => {
      websocket.send(JSON.stringify({
        type: 'stdout',
        processId,
        data: data.toString()
      }));
    });

    childProcess.stderr.on('data', (data) => {
      websocket.send(JSON.stringify({
        type: 'stderr',
        processId,
        data: data.toString()
      }));
    });

    childProcess.on('close', (code) => {
      websocket.send(JSON.stringify({
        type: 'process_complete',
        processId,
        exitCode: code,
        success: code === 0
      }));
      
      this.runningProcesses.delete(processId);
    });

    childProcess.on('error', (error) => {
      websocket.send(JSON.stringify({
        type: 'process_error',
        processId,
        error: error.message
      }));
      
      this.runningProcesses.delete(processId);
    });

    return processId;
  }

  async handleKillProcess(ws, clientId, payload) {
    const { processId } = payload;
    
    if (!processId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Process ID is required'
      }));
      return;
    }

    const killed = this.killProcess(processId);
    
    ws.send(JSON.stringify({
      type: 'process_kill_result',
      processId: processId,
      success: killed,
      timestamp: new Date().toISOString()
    }));
  }

  killProcess(processId) {
    const process = this.runningProcesses.get(processId);
    if (process) {
      process.kill('SIGTERM');
      this.runningProcesses.delete(processId);
      return true;
    }
    return false;
  }

  broadcastToAll(message) {
    this.clients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('WebSocket server stopped');
    }
  }
}

module.exports = WebSocketService;