import React, { useState } from 'react';
import { Server, FileText, Play, Settings, Monitor, Users, History, HelpCircle } from 'lucide-react';
import HostManagement from './components/HostManagement';
import ScriptManagement from './components/ScriptManagement';
import PlaybookManagement from './components/PlaybookManagement';
import ExecutionMonitor from './components/ExecutionMonitor';
import ExecutionHistory from './components/ExecutionHistory';
import UserGuide from './components/UserGuide';

function App() {
  const [activeTab, setActiveTab] = useState('hosts');

  const tabs = [
    { id: 'hosts', name: '主機管理', icon: Server, component: HostManagement },
    { id: 'scripts', name: '腳本管理', icon: FileText, component: ScriptManagement },
    { id: 'playbooks', name: 'Playbook', icon: Play, component: PlaybookManagement },
    { id: 'monitor', name: '執行監控', icon: Monitor, component: ExecutionMonitor },
    { id: 'history', name: '執行歷史', icon: History, component: ExecutionHistory },
    { id: 'guide', name: '使用說明', icon: HelpCircle, component: UserGuide },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || HostManagement;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Ansible 管理平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">系統狀態: 正常運行</span>
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ActiveComponent />
      </main>
    </div>
  );
}

export default App;