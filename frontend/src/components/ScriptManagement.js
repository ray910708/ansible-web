import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Eye, Edit, Trash2, Code } from 'lucide-react';

const ScriptManagement = () => {
  const [scripts, setScripts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [newScript, setNewScript] = useState({
    name: '',
    content: '',
    type: 'shell'
  });
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const scriptTemplates = {
    shell: `#!/bin/bash
# Shell 腳本模板
echo "開始執行腳本..."

# 在這裡添加您的命令
sudo apt update
sudo apt upgrade -y

echo "腳本執行完成"`,
    python: `#!/usr/bin/env python3
# Python 腳本模板
import os
import sys

def main():
    print("開始執行 Python 腳本...")
    
    # 在這裡添加您的 Python 代碼
    
    print("腳本執行完成")

if __name__ == "__main__":
    main()`
  };

  useEffect(() => {
    fetchScripts();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/script-templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates({});
    }
  };

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
      if (data.success) {
        setScripts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScript = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScript),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewScript({
          name: '',
          content: '',
          type: 'shell'
        });
        setShowAddForm(false);
        fetchScripts();
      } else {
        alert('保存腳本失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('保存腳本時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const viewScriptContent = async (scriptName) => {
    try {
      const response = await fetch(`/api/scripts/${scriptName}`);
      const data = await response.json();
      if (data.success) {
        setSelectedScript({
          name: scriptName,
          content: data.data.content || data.content || '脚本内容为空'
        });
        setShowContent(true);
      } else {
        alert('获取脚本内容失败: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching script content:', error);
      alert('获取脚本内容时发生错误');
    }
  };

  const editScript = async (scriptName) => {
    try {
      const response = await fetch(`/api/scripts/${scriptName}`);
      const data = await response.json();
      if (data.success) {
        setEditingScript({
          name: scriptName,
          content: data.data.content,
          type: data.data.type || 'shell'
        });
        setShowEditForm(true);
      }
    } catch (error) {
      console.error('Error fetching script for editing:', error);
    }
  };

  const handleUpdateScript = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/scripts/${editingScript.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingScript.content
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingScript(null);
        setShowEditForm(false);
        fetchScripts();
      } else {
        alert('更新腳本失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating script:', error);
      alert('更新腳本時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const deleteScript = async (scriptName) => {
    if (!confirm(`確定要刪除腳本 "${scriptName}" 嗎？`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/scripts/${scriptName}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchScripts();
      } else {
        alert('刪除腳本失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting script:', error);
      alert('刪除腳本時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScriptTypeIcon = (filename) => {
    if (filename.endsWith('.py')) {
      return <Code className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">腳本管理</h2>
          <p className="text-gray-600">管理和編輯您的自動化腳本</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新增腳本
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
                  <dt className="text-sm font-medium text-gray-500 truncate">總腳本數</dt>
                  <dd className="text-lg font-medium text-gray-900">{scripts?.length || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Code className="h-6 w-6 text-blue-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Python 腳本</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {scripts?.filter(s => s.name.endsWith('.py')).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-green-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Shell 腳本</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {scripts?.filter(s => s.name.endsWith('.sh')).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Download className="h-6 w-6 text-purple-400" />
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">總大小</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatFileSize(scripts?.reduce((total, script) => total + script.size, 0) || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Script Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">新增腳本</h3>
          <form onSubmit={handleAddScript} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">腳本名稱</label>
                <input
                  type="text"
                  value={newScript.name}
                  onChange={(e) => setNewScript({...newScript, name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="my-script"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">腳本類型</label>
                <select
                  value={newScript.type}
                  onChange={(e) => setNewScript({
                    ...newScript, 
                    type: e.target.value,
                    content: scriptTemplates[e.target.value]
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="shell">Shell Script (.sh)</option>
                  <option value="python">Python Script (.py)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">腳本模板</label>
                <select
                  onChange={(e) => {
                    if (e.target.value && templates[e.target.value]) {
                      setNewScript({
                        ...newScript,
                        name: templates[e.target.value].name.replace(/\s+/g, '-').toLowerCase(),
                        content: templates[e.target.value].content,
                        type: templates[e.target.value].type
                      });
                    }
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">選擇模板 (可選)</option>
                  {Object.entries(templates).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">腳本內容</label>
              <textarea
                value={newScript.content}
                onChange={(e) => setNewScript({...newScript, content: e.target.value})}
                rows={12}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="在這裡輸入您的腳本內容..."
                required
              />
            </div>
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
                {loading ? '保存中...' : '保存腳本'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Script Form */}
      {showEditForm && editingScript && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">編輯腳本</h3>
          <form onSubmit={handleUpdateScript} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">腳本名稱</label>
              <input
                type="text"
                value={editingScript.name}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">腳本內容</label>
              <textarea
                value={editingScript.content}
                onChange={(e) => setEditingScript({...editingScript, content: e.target.value})}
                rows={12}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? '更新中...' : '更新腳本'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scripts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">腳本清單</h3>
          {(scripts?.length || 0) === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有腳本</h3>
              <p className="mt-1 text-sm text-gray-500">開始創建您的第一個自動化腳本</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scripts?.map((script, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {getScriptTypeIcon(script.name)}
                      <h4 className="ml-2 text-sm font-medium text-gray-900 truncate">
                        {script.name}
                      </h4>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => viewScriptContent(script.name)}
                        className="text-gray-400 hover:text-gray-600"
                        title="查看內容"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => editScript(script.name)}
                        className="text-gray-400 hover:text-gray-600"
                        title="編輯"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteScript(script.name)}
                        className="text-red-400 hover:text-red-600"
                        title="刪除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      大小: {formatFileSize(script.size)}
                    </p>
                    <p className="text-xs text-gray-500">
                      修改: {new Date(script.modified).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 truncate">
                      {script.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Script Content Modal */}
      {showContent && selectedScript && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedScript.name}
              </h3>
              <button
                onClick={() => setShowContent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">關閉</span>
                ✕
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-96">
              <code>{selectedScript.content}</code>
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowContent(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptManagement;