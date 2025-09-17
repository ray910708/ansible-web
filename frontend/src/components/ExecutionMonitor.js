import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Monitor } from 'lucide-react';
import Terminal from './Terminal';

const ExecutionMonitor = () => {
  const [executions, setExecutions] = useState([]);
  const [activeExecution, setActiveExecution] = useState(null);
  const [output, setOutput] = useState('');
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState('');
  const [targetHosts, setTargetHosts] = useState('all');
  const [loading, setLoading] = useState(false);
  const [useTerminal, setUseTerminal] = useState(true);
  const terminalRef = useRef(null);

  useEffect(() => {
    fetchPlaybooks();
    fetchExecutionHistory();
  }, []);

  const fetchExecutionHistory = async () => {
    try {
      const response = await fetch('/api/executions/history');
      const data = await response.json();
      if (data.success) {
        const formattedExecutions = (data.data || []).map(exec => ({
          id: exec.id,
          playbook: exec.playbook,
          target: Array.isArray(exec.targets) ? exec.targets.join(',') : exec.targets,
          status: exec.success ? 'completed' : 'failed',
          startTime: new Date(exec.startTime),
          endTime: new Date(exec.endTime),
          duration: exec.duration,
          success: exec.success,
          error: exec.errors
        }));
        setExecutions(formattedExecutions);
      }
    } catch (error) {
      console.error('Error fetching execution history:', error);
      setExecutions([]);
    }
  };

  const fetchPlaybooks = async () => {
    try {
      const response = await fetch('/api/playbooks');
      const data = await response.json();
      if (data.success) {
        setPlaybooks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching playbooks:', error);
      setPlaybooks([]);
    }
  };

  const executePlaybook = async () => {
    if (!selectedPlaybook) {
      alert('請選擇要執行的 Playbook');
      return;
    }

    setLoading(true);
    setActiveExecution(Date.now());

    if (useTerminal && terminalRef.current) {
      // 使用终端执行
      console.log('Using terminal mode, calling executeCommand:', { selectedPlaybook, targetHosts });
      console.log('terminalRef.current:', terminalRef.current);
      terminalRef.current.executeCommand(selectedPlaybook, targetHosts);
    } else {
      // 使用传统API执行
      setOutput('');
      
      try {
        const response = await fetch('/api/playbooks/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playbookName: selectedPlaybook,
            targetHosts: targetHosts,
            user: 'web-user'
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          setOutput(result.data.output || '執行完成');
          
          // 添加到執行歷史
          const newExecution = {
            id: Date.now(),
            playbook: selectedPlaybook,
            target: targetHosts,
            status: result.data.success ? 'completed' : 'failed',
            startTime: new Date(),
            endTime: new Date(),
            duration: result.data.duration || 0,
            success: result.data.success
          };
          
          setExecutions(prev => [newExecution, ...prev]);
        } else {
          setOutput('執行失敗: ' + (result.error || '未知錯誤'));
        }
      } catch (error) {
        console.error('Error executing playbook:', error);
        setOutput('執行錯誤: ' + error.message);
      } finally {
        setLoading(false);
        setActiveExecution(null);
      }
    }
  };

  const stopExecution = () => {
    setLoading(false);
    
    if (useTerminal && terminalRef.current) {
      // 终止终端进程
      terminalRef.current.killCurrentProcess();
    }
    
    if (activeExecution) {
      setExecutions(prev => prev.map(exec => 
        exec.id === activeExecution 
          ? { 
              ...exec, 
              status: 'stopped', 
              endTime: new Date(),
              duration: Date.now() - exec.startTime.getTime(),
              success: false 
            }
          : exec
      ));
      setActiveExecution(null);
    }
  };

  const getStatusIcon = (status, success) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return success ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status, success) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'running':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return success ? 
          `${baseClasses} bg-green-100 text-green-800` : 
          `${baseClasses} bg-red-100 text-red-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'stopped':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">執行監控</h2>
          <p className="text-gray-600">監控和管理 Ansible Playbook 執行</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useTerminal}
              onChange={(e) => setUseTerminal(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">使用终端模式</span>
          </label>
        </div>
      </div>

      {/* Execution Control */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">執行控制</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">選擇 Playbook</label>
            <select
              value={selectedPlaybook}
              onChange={(e) => setSelectedPlaybook(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            >
              <option value="">選擇 Playbook</option>
              {playbooks?.map(playbook => (
                <option key={playbook.name || playbook} value={playbook.name || playbook}>
                  {playbook.name || playbook}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">目標主機</label>
            <input
              type="text"
              value={targetHosts}
              onChange={(e) => setTargetHosts(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="all, web-servers, 192.168.1.100"
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            {loading ? (
              <button
                onClick={stopExecution}
                className="w-full inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4 mr-2" />
                停止執行
              </button>
            ) : (
              <button
                onClick={executePlaybook}
                disabled={!selectedPlaybook}
                className="w-full inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                開始執行
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal or Traditional Output */}
      {useTerminal ? (
        <Terminal 
          ref={terminalRef} 
          onExecute={(result) => {
            setLoading(false);
            setActiveExecution(null);
            
            // 添加到執行歷史
            const newExecution = {
              id: Date.now(),
              playbook: selectedPlaybook,
              target: targetHosts,
              status: result.success ? 'completed' : 'failed',
              startTime: new Date(),
              endTime: new Date(),
              duration: 0,
              success: result.success
            };
            
            setExecutions(prev => [newExecution, ...prev]);
          }}
          isExecuting={loading}
        />
      ) : (
        (loading || output) && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">實時輸出</h3>
              {loading && (
                <div className="flex items-center text-sm text-blue-600">
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  執行中...
                </div>
              )}
            </div>
            <div className="bg-gray-900 rounded-md p-4">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {output || '等待輸出...'}
                {loading && <span className="animate-pulse">▋</span>}
              </pre>
            </div>
          </div>
        )
      )}

      {/* Execution History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">執行歷史</h3>
          {executions.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有執行記錄</h3>
              <p className="mt-1 text-sm text-gray-500">開始執行 Playbook 來查看執行歷史</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Playbook
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      目標
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      開始時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      執行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      結果
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {executions.map((execution) => (
                    <tr key={execution.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(execution.status, execution.success)}
                          <span className={`ml-2 ${getStatusBadge(execution.status, execution.success)}`}>
                            {execution.status === 'running' ? '執行中' :
                             execution.status === 'completed' ? '完成' :
                             execution.status === 'failed' ? '失敗' :
                             execution.status === 'stopped' ? '已停止' : execution.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {execution.playbook}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {execution.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {execution.startTime.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(execution.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {execution.success === true ? '成功' :
                         execution.success === false ? '失敗' : '-'}
                        {execution.error && (
                          <div className="text-red-600 text-xs mt-1">
                            {execution.error}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionMonitor;