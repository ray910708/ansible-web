import React, { useState, useEffect } from 'react';
import { Plus, Play, FileText, Settings, CheckCircle, XCircle } from 'lucide-react';

const PlaybookManagement = () => {
  const [playbooks, setPlaybooks] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    description: '',
    hosts: [],
    tasks: [],
    vars: {}
  });
  const [loading, setLoading] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  useEffect(() => {
    fetchPlaybooks();
    fetchScripts();
    fetchHosts();
  }, []);

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

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
      if (data.success) {
        setScripts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      setScripts([]);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await fetch('/api/hosts');
      const data = await response.json();
      if (data.success) {
        // 從新的 API 結構獲取主機群組
        if (data.data && data.data.groups) {
          const groups = Object.keys(data.data.groups);
          setHosts(groups);
        } else {
          setHosts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching hosts:', error);
      setHosts([]);
    }
  };

  const addTask = () => {
    setNewPlaybook({
      ...newPlaybook,
      tasks: [
        ...newPlaybook.tasks,
        {
          name: '',
          script: '',
          when: '',
          notify: ''
        }
      ]
    });
  };

  const updateTask = (index, field, value) => {
    const updatedTasks = [...newPlaybook.tasks];
    updatedTasks[index][field] = value;
    setNewPlaybook({
      ...newPlaybook,
      tasks: updatedTasks
    });
  };

  const removeTask = (index) => {
    const updatedTasks = newPlaybook.tasks.filter((_, i) => i !== index);
    setNewPlaybook({
      ...newPlaybook,
      tasks: updatedTasks
    });
  };

  const handleCreatePlaybook = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const playbookConfig = {
        name: newPlaybook.name,
        hosts: newPlaybook.hosts,
        become: true,
        gather_facts: true,
        vars: newPlaybook.vars,
        tasks: newPlaybook.tasks.filter(task => task.name && task.script)
      };

      const response = await fetch('/api/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlaybook.name,
          config: playbookConfig
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewPlaybook({
          name: '',
          description: '',
          hosts: [],
          tasks: [],
          vars: {}
        });
        setShowCreateForm(false);
        fetchPlaybooks();
      } else {
        alert('創建 Playbook 失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating playbook:', error);
      alert('創建 Playbook 時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const executePlaybook = async (playbookName) => {
    // 檢查是否需要特殊處理 (交互式腳本)
    const needsInteractiveHandling = playbookName.includes('nginx') || playbookName.includes('mysql') || playbookName.includes('安裝');
    
    if (needsInteractiveHandling) {
      const confirmed = window.confirm(
        '此 Playbook 可能包含需要交互的腳本。\n\n' +
        '系統已自動設定為非交互式模式，如果執行失敗，請檢查腳本是否正確配置。\n\n' +
        '繼續執行嗎？'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setExecutionResult(null);
    setShowExecutionModal(true);

    try {
      const response = await fetch('/api/playbooks/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playbookName: playbookName.endsWith('.yml') || playbookName.endsWith('.yaml') ? playbookName : playbookName + '.yml',
          targetHosts: 'all',
          options: {
            extraVars: {
              // 自動添加非交互式變數
              ansible_python_interpreter: 'auto_silent',
              DEBIAN_FRONTEND: 'noninteractive',
              NEEDRESTART_MODE: 'a'
            }
          }
        }),
      });

      const data = await response.json();
      setExecutionResult(data);
    } catch (error) {
      console.error('Error executing playbook:', error);
      setExecutionResult({
        success: false,
        error: '執行 Playbook 時發生錯誤: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const editPlaybook = async (playbookName) => {
    try {
      const response = await fetch(`/api/playbooks/${playbookName}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const playbook = data.data;
        // 從 parsed 陣列中獲取內容，或者從 content 陣列中獲取
        const content = playbook.parsed && playbook.parsed[0] ? playbook.parsed[0] : 
                       (playbook.content && playbook.content[0] ? playbook.content[0] : {});
        
        setEditingPlaybook({
          name: playbookName.replace('.yml', '').replace('.yaml', ''),
          originalName: playbookName,
          description: content.name || '',
          hosts: Array.isArray(content.hosts) ? content.hosts : (content.hosts ? [content.hosts] : ['all']),
          tasks: content.tasks ? content.tasks.map(task => ({
            name: task.name || '',
            script: task.script ? task.script.split('/').pop() : '',
            when: task.when || '',
            notify: task.notify || ''
          })) : [],
          vars: content.vars || {}
        });
        setShowEditForm(true);
      }
    } catch (error) {
      console.error('Error loading playbook:', error);
      alert('載入 Playbook 失敗');
    }
  };

  const handleUpdatePlaybook = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const playbookConfig = {
        name: editingPlaybook.description || editingPlaybook.name,
        hosts: editingPlaybook.hosts,
        become: true,
        gather_facts: true,
        vars: editingPlaybook.vars,
        tasks: editingPlaybook.tasks.filter(task => task.name && task.script)
      };

      // 如果名稱改變了，需要刪除舊的並創建新的
      if (editingPlaybook.name !== editingPlaybook.originalName.replace('.yml', '').replace('.yaml', '')) {
        // 刪除舊的 playbook
        await fetch(`/api/playbooks/${editingPlaybook.originalName}`, {
          method: 'DELETE'
        });
        
        // 創建新的 playbook
        const response = await fetch('/api/playbooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingPlaybook.name,
            config: playbookConfig
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setEditingPlaybook(null);
          setShowEditForm(false);
          fetchPlaybooks();
        } else {
          alert('更新 Playbook 失敗: ' + data.error);
        }
      } else {
        // 直接更新現有 playbook
        const response = await fetch('/api/playbooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingPlaybook.name,
            config: playbookConfig
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setEditingPlaybook(null);
          setShowEditForm(false);
          fetchPlaybooks();
        } else {
          alert('更新 Playbook 失敗: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error updating playbook:', error);
      alert('更新 Playbook 時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const updateEditTask = (index, field, value) => {
    const updatedTasks = [...editingPlaybook.tasks];
    updatedTasks[index][field] = value;
    setEditingPlaybook({
      ...editingPlaybook,
      tasks: updatedTasks
    });
  };

  const removeEditTask = (index) => {
    const updatedTasks = editingPlaybook.tasks.filter((_, i) => i !== index);
    setEditingPlaybook({
      ...editingPlaybook,
      tasks: updatedTasks
    });
  };

  const addEditTask = () => {
    setEditingPlaybook({
      ...editingPlaybook,
      tasks: [
        ...editingPlaybook.tasks,
        {
          name: '',
          script: '',
          when: '',
          notify: ''
        }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Playbook 管理</h2>
          <p className="text-gray-600">創建和管理 Ansible Playbook</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          創建 Playbook
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-gray-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">總 Playbook</dt>
                  <dd className="text-lg font-medium text-gray-900">{playbooks.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">可用腳本</dt>
                  <dd className="text-lg font-medium text-gray-900">{scripts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-blue-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">主機群組</dt>
                  <dd className="text-lg font-medium text-gray-900">{hosts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Play className="h-6 w-6 text-purple-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">執行次數</dt>
                  <dd className="text-lg font-medium text-gray-900">-</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Playbook Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">創建新 Playbook</h3>
          <form onSubmit={handleCreatePlaybook} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Playbook 名稱</label>
                <input
                  type="text"
                  value={newPlaybook.name}
                  onChange={(e) => setNewPlaybook({...newPlaybook, name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="my-playbook"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">目標主機群組</label>
                <select
                  multiple
                  value={newPlaybook.hosts}
                  onChange={(e) => setNewPlaybook({
                    ...newPlaybook, 
                    hosts: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">所有主機</option>
                  {hosts.map(host => (
                    <option key={host} value={host}>{host}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">描述</label>
              <textarea
                value={newPlaybook.description}
                onChange={(e) => setNewPlaybook({...newPlaybook, description: e.target.value})}
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="描述這個 Playbook 的用途..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">任務列表</label>
                <button
                  type="button"
                  onClick={addTask}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加任務
                </button>
              </div>
              
              {newPlaybook.tasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 mb-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">任務名稱</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(index, 'name', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="任務描述"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">執行腳本</label>
                      <select
                        value={task.script}
                        onChange={(e) => updateTask(index, 'script', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">選擇腳本</option>
                        {scripts.map(script => (
                          <option key={script.name} value={script.name}>
                            {script.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">執行條件 (when)</label>
                      <input
                        type="text"
                        value={task.when}
                        onChange={(e) => updateTask(index, 'when', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="例: ansible_os_family == 'Debian'"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="w-full px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        移除任務
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {newPlaybook.tasks.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  點擊「添加任務」開始構建您的 Playbook
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || newPlaybook.tasks.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? '創建中...' : '創建 Playbook'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Playbook Form */}
      {showEditForm && editingPlaybook && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">編輯 Playbook</h3>
          <form onSubmit={handleUpdatePlaybook} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Playbook 名稱</label>
                <input
                  type="text"
                  value={editingPlaybook.name}
                  onChange={(e) => setEditingPlaybook({...editingPlaybook, name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="my-playbook"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">目標主機群組</label>
                <select
                  multiple
                  value={editingPlaybook.hosts}
                  onChange={(e) => setEditingPlaybook({
                    ...editingPlaybook, 
                    hosts: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">所有主機</option>
                  {hosts.map(host => (
                    <option key={host} value={host}>{host}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">描述</label>
              <textarea
                value={editingPlaybook.description}
                onChange={(e) => setEditingPlaybook({...editingPlaybook, description: e.target.value})}
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="描述這個 Playbook 的用途..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">任務列表</label>
                <button
                  type="button"
                  onClick={addEditTask}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加任務
                </button>
              </div>
              
              {editingPlaybook.tasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 mb-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">任務名稱</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateEditTask(index, 'name', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="任務描述"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">執行腳本</label>
                      <select
                        value={task.script}
                        onChange={(e) => updateEditTask(index, 'script', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">選擇腳本</option>
                        {scripts.map(script => (
                          <option key={script.name} value={script.name}>
                            {script.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">執行條件 (when)</label>
                      <input
                        type="text"
                        value={task.when}
                        onChange={(e) => updateEditTask(index, 'when', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="例: ansible_os_family == 'Debian'"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeEditTask(index)}
                        className="w-full px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        移除任務
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {editingPlaybook.tasks.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  點擊「添加任務」開始構建您的 Playbook
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingPlaybook(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? '更新中...' : '更新 Playbook'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Playbooks List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Playbook 清單</h3>
          {playbooks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有 Playbook</h3>
              <p className="mt-1 text-sm text-gray-500">創建您的第一個自動化 Playbook</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {playbooks.map((playbook, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <h4 className="ml-2 text-sm font-medium text-gray-900">
                        {(playbook.name || playbook).replace('.yml', '').replace('.yaml', '')}
                      </h4>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => executePlaybook(playbook.name || playbook)}
                        className="text-green-600 hover:text-green-800"
                        title="執行"
                        disabled={loading}
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => editPlaybook(playbook.name || playbook)}
                        className="text-gray-400 hover:text-gray-600"
                        title="編輯"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Playbook
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      點擊執行按鈕運行此 Playbook
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Execution Result Modal */}
      {showExecutionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">執行結果</h3>
                <button
                  onClick={() => {
                    setShowExecutionModal(false);
                    setExecutionResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">正在執行 Playbook...</span>
                  <div className="ml-4 text-xs text-gray-500">
                    <p>如果執行時間過長，系統將在5分鐘後自動終止</p>
                  </div>
                </div>
              ) : executionResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-md ${
                    executionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {executionResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`ml-2 text-sm font-medium ${
                        executionResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {executionResult.success ? '執行成功' : '執行失敗'}
                      </span>
                    </div>
                  </div>
                  
                  {executionResult.output && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">輸出:</h4>
                      <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto text-gray-800">
                        {executionResult.output}
                      </pre>
                    </div>
                  )}
                  
                  {executionResult.error && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">錯誤:</h4>
                      <pre className="bg-red-50 p-3 rounded-md text-sm overflow-x-auto text-red-800">
                        {executionResult.error}
                      </pre>
                    </div>
                  )}
                  
                  {executionResult.stderr && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">stderr:</h4>
                      <pre className="bg-yellow-50 p-3 rounded-md text-sm overflow-x-auto text-yellow-800">
                        {executionResult.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybookManagement;