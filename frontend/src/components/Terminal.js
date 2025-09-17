import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Power, Square, RotateCcw, Download } from 'lucide-react';

const Terminal = React.forwardRef(({ onExecute }, ref) => {
  const [output, setOutput] = useState([]);
  const [websocket, setWebsocket] = useState(null);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const outputRef = useRef(null);

  // WebSocket连接管理
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        addOutputLine('系统', '终端连接已建立', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          addOutputLine('错误', '消息解析失败', 'error');
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        addOutputLine('系统', '终端连接已断开', 'warning');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        addOutputLine('错误', 'WebSocket连接错误', 'error');
      };

      setWebsocket(ws);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
      addOutputLine('错误', 'WebSocket连接失败', 'error');
    }
  };

  // 格式化输出内容
  const formatOutputContent = (content, type) => {
    if (!content) return content;
    
    // 处理JSON格式化
    if (type === 'output' && content.includes('"changed": true')) {
      try {
        // 提取JSON部分
        const jsonMatch = content.match(/{"changed".*?}/s);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          
          // 提取主要信息
          const mainPart = content.substring(0, content.indexOf('=> '));
          let formattedOutput = mainPart + '=> {\n';
          
          // 格式化主要属性
          if (parsed.changed !== undefined) formattedOutput += `  "changed": ${parsed.changed},\n`;
          if (parsed.rc !== undefined) formattedOutput += `  "rc": ${parsed.rc},\n`;
          
          // 如果有stdout输出，显示主要内容
          if (parsed.stdout) {
            const stdoutLines = parsed.stdout_lines || parsed.stdout.split('\\r\\n').filter(l => l.trim());
            formattedOutput += `  "output": [\n`;
            stdoutLines.forEach(line => {
              if (line.trim()) {
                formattedOutput += `    "${line.trim()}",\n`;
              }
            });
            formattedOutput = formattedOutput.replace(/,$/, '') + '\n  ]\n';
          }
          
          formattedOutput += '}';
          return formattedOutput;
        }
      } catch (e) {
        // 如果解析失败，返回原始内容
      }
    }
    
    // 处理多行输出的格式
    return content
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .trim();
  };

  const handleWebSocketMessage = (data) => {
    const { type, processId, data: messageData, command, exitCode, success, error } = data;

    switch (type) {
      case 'connection_established':
        addOutputLine('系统', `✓ WebSocket连接已建立 (客户端ID: ${data.clientId})`, 'info');
        break;

      case 'process_started':
        setCurrentProcess(processId);
        addOutputLine('系统', `▶ 进程已启动`, 'info');
        addOutputLine('系统', `  命令: ${command}`, 'info');
        addOutputLine('系统', `  进程ID: ${processId}`, 'info');
        addOutputLine('系统', '=' + '='.repeat(60), 'info');
        break;

      case 'stdout':
        if (messageData) {
          const formattedContent = formatOutputContent(messageData.toString(), 'output');
          // 按行分割输出
          const lines = formattedContent.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              // 识别不同类型的输出
              if (line.includes('PLAY [') || line.includes('TASK [')) {
                addOutputLine('Ansible', line, 'success');
              } else if (line.includes('PLAY RECAP')) {
                addOutputLine('Ansible', '\n' + line, 'success');
              } else if (line.includes('ok:') || line.includes('changed:')) {
                addOutputLine('Ansible', line, 'output');
              } else if (line.startsWith('  ')) {
                // 缩进的内容（JSON数据等）
                addOutputLine('详情', line, 'info');
              } else {
                addOutputLine('输出', line, 'output');
              }
            }
          });
        }
        break;

      case 'stderr':
        if (messageData) {
          const lines = messageData.toString().split('\n');
          lines.forEach(line => {
            if (line.trim() && !line.includes('debug1:')) {
              addOutputLine('警告', line.trim(), 'warning');
            }
          });
        }
        break;

      case 'process_complete':
        setCurrentProcess(null);
        const status = success ? '成功' : '失败';
        const statusType = success ? 'success' : 'error';
        const icon = success ? '✓' : '✗';
        addOutputLine('系统', '=' + '='.repeat(60), 'info');
        addOutputLine('系统', `${icon} 进程执行${status} (退出码: ${exitCode})`, statusType);
        if (onExecute) {
          onExecute({ success, exitCode, processId });
        }
        break;

      case 'process_error':
        setCurrentProcess(null);
        addOutputLine('错误', `✗ 进程错误: ${error}`, 'error');
        break;

      case 'execution_error':
        addOutputLine('错误', `✗ 执行错误: ${error}`, 'error');
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  };

  const addOutputLine = (source, content, type = 'output') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLine = {
      id: Date.now() + Math.random(),
      timestamp,
      source,
      content: content.toString(),
      type
    };
    
    setOutput(prev => [...prev, newLine]);
  };

  const executeCommand = (playbookName, targetHosts = 'all', options = {}) => {
    console.log('Terminal executeCommand called:', { playbookName, targetHosts, options });
    
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      addOutputLine('错误', 'WebSocket未连接', 'error');
      console.error('WebSocket not connected:', websocket?.readyState);
      return;
    }

    const message = {
      type: 'execute_playbook',
      payload: {
        playbookName,
        targetHosts,
        options
      }
    };

    console.log('Sending WebSocket message:', message);
    websocket.send(JSON.stringify(message));
    addOutputLine('系统', `执行命令: ansible-playbook ${playbookName} --limit ${targetHosts}`, 'info');
  };

  const killCurrentProcess = () => {
    if (!currentProcess || !websocket) {
      return;
    }

    const message = {
      type: 'kill_process',
      payload: {
        processId: currentProcess
      }
    };

    websocket.send(JSON.stringify(message));
    addOutputLine('系统', '正在终止当前进程...', 'warning');
  };

  const clearTerminal = () => {
    setOutput([]);
    addOutputLine('系统', '终端已清空', 'info');
  };

  const exportLog = () => {
    const logContent = output.map(line => 
      `[${line.timestamp}] ${line.source}: ${line.content}`
    ).join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addOutputLine('系统', '日志已导出', 'success');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'disconnected':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLineTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-400 font-semibold';
      case 'error':
        return 'text-red-400 font-semibold';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-cyan-400';
      case 'output':
        return 'text-green-300';
      default:
        return 'text-gray-300';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case '系统':
        return 'text-blue-400';
      case 'Ansible':
        return 'text-green-400';
      case '详情':
        return 'text-cyan-300';
      case '输出':
        return 'text-white';
      case '错误':
        return 'text-red-400';
      case '警告':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  // 对外暴露执行命令的接口
  React.useImperativeHandle(ref, () => ({
    executeCommand,
    killCurrentProcess,
    clearTerminal
  }), [websocket, currentProcess]);

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <TerminalIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">实时终端</h3>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${getStatusColor(connectionStatus)}`}></div>
            <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
              {connectionStatus === 'connected' ? '已连接' : 
               connectionStatus === 'disconnected' ? '未连接' : '连接错误'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {currentProcess && (
            <button
              onClick={killCurrentProcess}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              title="终止进程"
            >
              <Square className="h-4 w-4 mr-1" />
              停止
            </button>
          )}
          
          <button
            onClick={clearTerminal}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            title="清空终端"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            清空
          </button>
          
          <button
            onClick={exportLog}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            title="导出日志"
          >
            <Download className="h-4 w-4 mr-1" />
            导出
          </button>

          <button
            onClick={() => executeCommand('test-playbook.yml', 'all')}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            title="测试执行"
          >
            测试
          </button>
          
          {!isConnected && (
            <button
              onClick={connectWebSocket}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              title="重新连接"
            >
              <Power className="h-4 w-4 mr-1" />
              连接
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={outputRef}
        className="bg-gray-900 text-green-400 p-4 terminal-font text-sm h-96 overflow-y-auto scrollbar-thin"
      >
        {output.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <TerminalIcon className="mx-auto h-12 w-12 mb-2" />
            <p>终端准备就绪</p>
            <p className="text-xs mt-1">等待执行命令...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {output.map((line) => (
              <div key={line.id} className="flex hover:bg-gray-800 hover:bg-opacity-30 px-2 py-0.5 rounded">
                <span className="text-gray-500 mr-3 text-xs shrink-0">
                  [{line.timestamp}]
                </span>
                <span className={`mr-3 text-xs font-medium shrink-0 w-16 ${getSourceColor(line.source)}`}>
                  {line.source}:
                </span>
                <span className={`flex-1 whitespace-pre-wrap break-words ${getLineTypeColor(line.type)}`}>
                  {line.content}
                </span>
              </div>
            ))}
            {currentProcess && (
              <div className="flex items-center text-blue-400">
                <span className="animate-pulse mr-2">▋</span>
                <span className="text-xs">进程运行中...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Terminal;