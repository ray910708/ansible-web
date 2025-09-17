import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, XCircle, Eye, RotateCcw, Filter } from 'lucide-react';

const ExecutionHistory = () => {
  const [executions, setExecutions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all'); // all, success, failed

  useEffect(() => {
    fetchExecutionHistory();
    fetchExecutionStats();
  }, []);

  const fetchExecutionHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/executions/history');
      const data = await response.json();
      if (data.success) {
        setExecutions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching execution history:', error);
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionStats = async () => {
    try {
      const response = await fetch('/api/executions/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching execution stats:', error);
      setStats({});
    }
  };

  const viewExecutionDetails = (execution) => {
    setSelectedExecution(execution);
    setShowDetails(true);
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    return (ms / 1000).toFixed(2) + 's';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-TW');
  };

  const getStatusIcon = (success, exitCode) => {
    if (success && exitCode === 0) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (success, exitCode) => {
    if (success && exitCode === 0) {
      return { text: '成功', class: 'bg-green-100 text-green-800' };
    } else {
      return { text: '失敗', class: 'bg-red-100 text-red-800' };
    }
  };

  const filteredExecutions = executions.filter(execution => {
    if (filter === 'all') return true;
    if (filter === 'success') return execution.success && execution.exitCode === 0;
    if (filter === 'failed') return !execution.success || execution.exitCode !== 0;
    return true;
  });

  const parseOutput = (output) => {
    if (!output) return { tasks: [], summary: '' };
    
    const lines = output.split('\n');
    const tasks = [];
    let summary = '';
    
    // 解析任務執行結果
    let currentTask = null;
    for (const line of lines) {
      if (line.includes('TASK [')) {
        const taskMatch = line.match(/TASK \[(.*?)\]/);
        if (taskMatch) {
          currentTask = {
            name: taskMatch[1],
            status: '',
            details: []
          };
        }
      } else if (currentTask && (line.includes('ok:') || line.includes('changed:') || line.includes('failed:'))) {
        if (line.includes('ok:')) currentTask.status = 'ok';
        else if (line.includes('changed:')) currentTask.status = 'changed';
        else if (line.includes('failed:')) currentTask.status = 'failed';
        
        tasks.push(currentTask);
        currentTask = null;
      } else if (line.includes('PLAY RECAP')) {
        // 找到總結部分
        const recapIndex = lines.indexOf(line);
        summary = lines.slice(recapIndex).join('\n');
        break;
      }
    }
    
    return { tasks, summary };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">執行歷史</h2>
          <p className="text-gray-600">查看 Playbook 執行記錄和結果分析</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">所有執行</option>
            <option value="success">成功執行</option>
            <option value="failed">失敗執行</option>
          </select>
          <button
            onClick={() => {
              fetchExecutionHistory();
              fetchExecutionStats();
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Play className="h-6 w-6 text-blue-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">總執行次數</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">成功執行</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.successful || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">失敗執行</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.failed || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-purple-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">平均執行時間</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatDuration(stats.averageDuration)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution History Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">執行記錄</h3>
          {filteredExecutions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有執行記錄</h3>
              <p className="mt-1 text-sm text-gray-500">執行 Playbook 後記錄會出現在這裡</p>
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
                      目標主機
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      執行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      持續時間
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExecutions.map((execution, index) => {
                    const status = getStatusText(execution.success, execution.exitCode);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(execution.success, execution.exitCode)}
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                              {status.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {execution.playbook || execution.playbookName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Array.isArray(execution.targets) ? execution.targets.join(', ') : (execution.targetHosts || execution.targets || 'all')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(execution.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(execution.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => viewExecutionDetails(execution)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Execution Details Modal */}
      {showDetails && selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  執行詳情 - {selectedExecution.playbook || selectedExecution.playbookName}
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedExecution(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {/* Execution Info */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">狀態</dt>
                    <dd className="mt-1 flex items-center">
                      {getStatusIcon(selectedExecution.success, selectedExecution.exitCode)}
                      <span className="ml-2 text-sm text-gray-900">
                        {getStatusText(selectedExecution.success, selectedExecution.exitCode).text}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">執行時間</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatTimestamp(selectedExecution.timestamp)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">持續時間</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDuration(selectedExecution.duration)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">退出代碼</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedExecution.exitCode}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Task Analysis */}
              {selectedExecution.output && (() => {
                const parsed = parseOutput(selectedExecution.output);
                return (
                  <div className="space-y-6">
                    {parsed.tasks.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">任務執行結果</h4>
                        <div className="space-y-2">
                          {parsed.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className={`p-3 rounded-md border-l-4 ${
                              task.status === 'ok' ? 'bg-green-50 border-green-400' :
                              task.status === 'changed' ? 'bg-blue-50 border-blue-400' :
                              task.status === 'failed' ? 'bg-red-50 border-red-400' :
                              'bg-gray-50 border-gray-400'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{task.name}</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  task.status === 'ok' ? 'bg-green-100 text-green-800' :
                                  task.status === 'changed' ? 'bg-blue-100 text-blue-800' :
                                  task.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Full Output */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">完整輸出</h4>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                        {selectedExecution.output}
                      </pre>
                    </div>
                    
                    {/* Errors */}
                    {selectedExecution.errors && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">錯誤信息</h4>
                        <pre className="bg-red-50 text-red-900 p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                          {selectedExecution.errors}
                        </pre>
                      </div>
                    )}

                    {/* Command */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">執行命令</h4>
                      <code className="bg-gray-100 text-gray-900 p-2 rounded-md text-sm block">
                        {selectedExecution.command}
                      </code>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionHistory;