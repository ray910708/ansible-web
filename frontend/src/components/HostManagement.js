import React, { useState, useEffect } from 'react';
import { Plus, Server, Edit, Trash2, RefreshCw } from 'lucide-react';

const HostManagement = () => {
  const [hosts, setHosts] = useState([]);
  const [inventory, setInventory] = useState('');
  const [hostsStatus, setHostsStatus] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHost, setNewHost] = useState({
    name: '',
    ip: '',
    user: '',
    password: '',
    group: 'servers',
    sshKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [editingHost, setEditingHost] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchHostsStatus();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hosts');
      const data = await response.json();
      if (data.success) {
        // 後端返回的是 data.data.hosts 和 data.data.groups
        if (data.data && data.data.hosts) {
          setHosts(data.data.hosts);
        }
        // 如果需要設置 inventory 文本，我們需要重新構建
        setInventory('# Ansible Inventory\n' + JSON.stringify(data.data, null, 2));
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostsStatus = async () => {
    console.log('開始獲取主機狀態...');
    setStatusLoading(true);
    try {
      const response = await fetch('/api/hosts/status/all');
      console.log('狀態API回應:', response.status);
      const data = await response.json();
      console.log('狀態數據:', data);
      if (data.success) {
        setHostsStatus(data.data);
        console.log('狀態已更新:', data.data);
      } else {
        console.error('API錯誤:', data.error);
      }
    } catch (error) {
      console.error('Error fetching hosts status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const parseInventory = (inventoryText) => {
    const lines = inventoryText.split('\n');
    const parsedHosts = [];
    let currentGroup = '';

    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        currentGroup = line.slice(1, -1);
      } else if (line && !line.startsWith('#')) {
        const parts = line.split(' ');
        if (parts.length > 0) {
          const name = parts[0];
          const hostMatch = line.match(/ansible_host=([^\s]+)/);
          const userMatch = line.match(/ansible_user=([^\s]+)/);
          
          parsedHosts.push({
            name,
            ip: hostMatch ? hostMatch[1] : '',
            user: userMatch ? userMatch[1] : '',
            group: currentGroup
          });
        }
      }
    });

    setHosts(parsedHosts);
  };

  const handleAddHost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHost),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewHost({
          name: '',
          ip: '',
          user: '',
          password: '',
          group: 'servers',
          sshKey: ''
        });
        setShowAddForm(false);
        fetchInventory();
        fetchHostsStatus();
      } else {
        alert('添加主機失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding host:', error);
      alert('添加主機時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const editHost = (host) => {
    setEditingHost({
      name: host.name,
      ip: host.ip,
      user: host.user,
      password: '',
      group: host.group,
      sshKey: ''
    });
    setShowEditForm(true);
  };

  const handleUpdateHost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/hosts/${editingHost.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingHost),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingHost(null);
        setShowEditForm(false);
        fetchInventory();
        fetchHostsStatus();
      } else {
        alert('更新主機失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating host:', error);
      alert('更新主機時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const deleteHost = async (hostName) => {
    if (!confirm(`確定要刪除主機 "${hostName}" 嗎？`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hosts/${hostName}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchInventory();
        fetchHostsStatus();
      } else {
        alert('刪除主機失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting host:', error);
      alert('刪除主機時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const renderHostStatus = (hostName) => {
    const status = hostsStatus[hostName];
    
    if (statusLoading) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          檢查中
        </span>
      );
    }

    if (!status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          未知
        </span>
      );
    }

    if (status.online && status.ssh) {
      return (
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ● 線上 (SSH 可用)
          </span>
          {status.responseTime && (
            <span className="text-xs text-gray-500">
              響應時間: {status.responseTime}ms
            </span>
          )}
        </div>
      );
    } else if (status.online) {
      return (
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ● 可達 (SSH 失敗)
          </span>
          {status.responseTime && (
            <span className="text-xs text-gray-500">
              響應時間: {status.responseTime}ms
            </span>
          )}
          {status.error && (
            <span className="text-xs text-red-500" title={status.error}>
              SSH 錯誤
            </span>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ● 離線
          </span>
          {status.error && (
            <span className="text-xs text-red-500" title={status.error}>
              不可達
            </span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">主機管理</h2>
          <p className="text-gray-600">管理 Ansible 主機清單和連接設定</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              fetchInventory();
              fetchHostsStatus();
            }}
            disabled={loading || statusLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || statusLoading) ? 'animate-spin' : ''}`} />
            重新整理
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加主機
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">總主機數</dt>
                  <dd className="text-lg font-medium text-gray-900">{hosts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">線上主機</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statusLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      Object.values(hostsStatus).filter(status => status.online).length
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-gray-400 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">主機群組</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {[...new Set(hosts.map(h => h.group))].length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Host Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">添加新主機</h3>
          <form onSubmit={handleAddHost} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">主機名稱</label>
              <input
                type="text"
                value={newHost.name}
                onChange={(e) => setNewHost({...newHost, name: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IP 地址</label>
              <input
                type="text"
                value={newHost.ip}
                onChange={(e) => setNewHost({...newHost, ip: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">用戶名</label>
              <input
                type="text"
                value={newHost.user}
                onChange={(e) => setNewHost({...newHost, user: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">密碼</label>
              <input
                type="password"
                value={newHost.password}
                onChange={(e) => setNewHost({...newHost, password: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="SSH 密碼 (可選，建議使用 SSH 金鑰)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">主機群組</label>
              <input
                type="text"
                value={newHost.group}
                onChange={(e) => setNewHost({...newHost, group: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SSH 金鑰路徑</label>
              <input
                type="text"
                value={newHost.sshKey}
                onChange={(e) => setNewHost({...newHost, sshKey: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="例: ~/.ssh/id_rsa (可選)"
              />
            </div>
            <div className="sm:col-span-4">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? '添加中...' : '添加主機'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Edit Host Form */}
      {showEditForm && editingHost && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">編輯主機</h3>
          <form onSubmit={handleUpdateHost} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">主機名稱</label>
              <input
                type="text"
                value={editingHost.name}
                onChange={(e) => setEditingHost({...editingHost, name: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IP 地址</label>
              <input
                type="text"
                value={editingHost.ip}
                onChange={(e) => setEditingHost({...editingHost, ip: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">用戶名</label>
              <input
                type="text"
                value={editingHost.user}
                onChange={(e) => setEditingHost({...editingHost, user: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">密碼</label>
              <input
                type="password"
                value={editingHost.password}
                onChange={(e) => setEditingHost({...editingHost, password: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="留空保持不變"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">主機群組</label>
              <input
                type="text"
                value={editingHost.group}
                onChange={(e) => setEditingHost({...editingHost, group: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SSH 金鑰路徑</label>
              <input
                type="text"
                value={editingHost.sshKey}
                onChange={(e) => setEditingHost({...editingHost, sshKey: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="例: ~/.ssh/id_rsa (可選)"
              />
            </div>
            <div className="sm:col-span-4">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingHost(null);
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
                  {loading ? '更新中...' : '更新主機'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Hosts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">主機清單</h3>
          {hosts.length === 0 ? (
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有主機</h3>
              <p className="mt-1 text-sm text-gray-500">開始添加主機到您的清單中</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      主機名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP 地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      群組
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hosts.map((host, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {host.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {host.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {host.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {host.group}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderHostStatus(host.name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => editHost(host)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteHost(host.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

export default HostManagement;