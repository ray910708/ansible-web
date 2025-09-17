import React, { useState } from 'react';
import { 
  Book, 
  Server, 
  FileText, 
  Play, 
  Monitor, 
  History, 
  Settings,
  CheckCircle,
  ArrowRight,
  Terminal,
  Users,
  Globe,
  Shield,
  Zap,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

const UserGuide = () => {
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: '快速開始',
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3>歡迎使用 Ansible Web 管理平台！</h3>
            <p>這是一個現代化的 Web 介面，用於管理 Ansible 自動化任務。通過直觀的圖形介面，您可以輕鬆管理主機清單、執行 Playbook、監控執行狀態等。</p>
            
            <h4>主要功能概覽：</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Server className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-900">主機管理</span>
                </div>
                <p className="text-sm text-blue-800">管理 Ansible 主機清單，檢查主機狀態，配置連接設定</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-purple-900">腳本管理</span>
                </div>
                <p className="text-sm text-purple-800">創建、編輯和管理自動化腳本，支援 Shell 和 Python</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <Play className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-900">Playbook 管理</span>
                </div>
                <p className="text-sm text-green-800">管理 Ansible Playbook，執行自動化任務</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center mb-2">
                  <Monitor className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-900">實時監控</span>
                </div>
                <p className="text-sm text-red-800">實時監控任務執行，查看詳細輸出和狀態</p>
              </div>
            </div>

            <h4>第一次使用建議步驟：</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5">1</span>
                <div>
                  <strong>配置主機：</strong>前往「主機管理」頁面添加您的目標主機
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5">2</span>
                <div>
                  <strong>檢查連接：</strong>確認主機狀態為「線上 (SSH 可用)」
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5">3</span>
                <div>
                  <strong>執行任務：</strong>在「執行監控」頁面選擇 Playbook 並執行
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-3 mt-0.5">4</span>
                <div>
                  <strong>查看結果：</strong>在「執行歷史」頁面查看詳細的執行記錄
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'host-management',
      title: '主機管理',
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3>主機管理功能說明</h3>
            <p>主機管理是 Ansible 的核心，用於管理您要自動化的目標伺服器。</p>

            <h4>添加新主機</h4>
            <ol>
              <li>點擊右上角的「添加主機」按鈕</li>
              <li>填寫必要資訊：
                <ul>
                  <li><strong>主機名稱：</strong>用於識別的名稱（如 web-server-01）</li>
                  <li><strong>IP 地址：</strong>目標主機的 IP 地址</li>
                  <li><strong>用戶名：</strong>SSH 連接使用的用戶名</li>
                  <li><strong>主機群組：</strong>邏輯分組（如 web-servers、db-servers）</li>
                </ul>
              </li>
              <li>可選設定：
                <ul>
                  <li><strong>密碼：</strong>SSH 密碼（建議使用金鑰認證）</li>
                  <li><strong>SSH 金鑰路徑：</strong>私鑰文件路徑（如 ~/.ssh/id_rsa）</li>
                </ul>
              </li>
            </ol>

            <h4>主機狀態說明</h4>
            <div className="space-y-2 not-prose">
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                <span className="font-medium text-green-900">線上 (SSH 可用)</span>
                <span className="ml-2 text-sm text-green-700">- 主機可達且 SSH 連接正常</span>
              </div>
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                <span className="font-medium text-yellow-900">可達 (SSH 失敗)</span>
                <span className="ml-2 text-sm text-yellow-700">- 主機回應 ping 但 SSH 無法連接</span>
              </div>
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                <span className="font-medium text-red-900">離線</span>
                <span className="ml-2 text-sm text-red-700">- 主機無回應或無法連接</span>
              </div>
            </div>

            <h4>最佳實踐</h4>
            <ul>
              <li>使用有意義的主機名稱和群組分類</li>
              <li>優先使用 SSH 金鑰而非密碼認證</li>
              <li>定期檢查主機狀態確保連通性</li>
              <li>將相似功能的主機歸類到同一群組</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'script-management',
      title: '腳本管理',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3>腳本管理功能說明</h3>
            <p>腳本管理讓您可以創建、編輯和管理用於自動化的腳本文件。</p>

            <h4>支援的腳本類型</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <Terminal className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-900">Shell Script (.sh)</span>
                </div>
                <p className="text-sm text-green-800">用於系統管理、軟體安裝、服務配置等任務</p>
                <div className="mt-2">
                  <code className="text-xs bg-green-100 p-1 rounded">#!/bin/bash</code>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-900">Python Script (.py)</span>
                </div>
                <p className="text-sm text-blue-800">用於複雜邏輯處理、數據分析、API 集成等</p>
                <div className="mt-2">
                  <code className="text-xs bg-blue-100 p-1 rounded">#!/usr/bin/env python3</code>
                </div>
              </div>
            </div>

            <h4>創建新腳本</h4>
            <ol>
              <li>點擊「新增腳本」按鈕</li>
              <li>填寫腳本資訊：
                <ul>
                  <li><strong>腳本名稱：</strong>不需要副檔名，系統會自動添加</li>
                  <li><strong>腳本類型：</strong>選擇 Shell 或 Python</li>
                  <li><strong>腳本模板：</strong>可選擇預設模板快速開始</li>
                </ul>
              </li>
              <li>在編輯器中撰寫腳本內容</li>
              <li>點擊「保存腳本」完成創建</li>
            </ol>

            <h4>腳本編輯功能</h4>
            <ul>
              <li><strong>語法高亮：</strong>支援 Shell 和 Python 語法着色</li>
              <li><strong>即時預覽：</strong>點擊眼睛圖標查看腳本內容</li>
              <li><strong>版本管理：</strong>自動保存修改時間和大小資訊</li>
              <li><strong>模板系統：</strong>提供常用腳本模板</li>
            </ul>

            <h4>使用建議</h4>
            <ul>
              <li>為腳本添加清楚的註釋說明用途</li>
              <li>使用適當的錯誤處理機制</li>
              <li>測試腳本在不同環境下的兼容性</li>
              <li>定期備份重要腳本</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'playbook-execution',
      title: 'Playbook 執行',
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3>Playbook 執行功能說明</h3>
            <p>Playbook 是 Ansible 的核心概念，定義了要在目標主機上執行的任務序列。</p>

            <h4>執行 Playbook</h4>
            <ol>
              <li>前往「執行監控」頁面</li>
              <li>選擇要執行的 Playbook</li>
              <li>指定目標主機：
                <ul>
                  <li><code>all</code> - 所有主機</li>
                  <li><code>web-servers</code> - 特定群組</li>
                  <li><code>192.168.1.100</code> - 特定 IP</li>
                  <li><code>server1,server2</code> - 多個主機</li>
                </ul>
              </li>
              <li>選擇執行模式：
                <ul>
                  <li><strong>終端模式：</strong>實時顯示執行過程和輸出</li>
                  <li><strong>傳統模式：</strong>執行完成後顯示結果</li>
                </ul>
              </li>
              <li>點擊「開始執行」</li>
            </ol>

            <h4>終端模式功能</h4>
            <div className="bg-gray-900 p-4 rounded-lg text-green-400 font-mono text-sm not-prose">
              <div className="mb-2 text-blue-400">[08:52:02] 系統: ▶ 進程已啟動</div>
              <div className="mb-2 text-green-400">[08:52:03] Ansible: PLAY [系統更新] ***************</div>
              <div className="mb-2 text-green-400">[08:52:05] Ansible: ok: [web-server-01]</div>
              <div className="mb-2 text-cyan-400">[08:52:06] 詳情: "changed": true</div>
              <div className="text-green-400">[08:52:06] 系統: ✓ 進程執行成功</div>
            </div>

            <h4>執行狀態說明</h4>
            <div className="space-y-2 not-prose">
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-3" />
                <span className="font-medium text-blue-900">執行中</span>
                <span className="ml-2 text-sm text-blue-700">- Playbook 正在執行</span>
              </div>
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="font-medium text-green-900">執行成功</span>
                <span className="ml-2 text-sm text-green-700">- 所有任務都成功完成</span>
              </div>
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-red-600 mr-3" />
                <span className="font-medium text-red-900">執行失敗</span>
                <span className="ml-2 text-sm text-red-700">- 部分或全部任務失敗</span>
              </div>
            </div>

            <h4>最佳實踐</h4>
            <ul>
              <li>先在測試環境中驗證 Playbook</li>
              <li>使用 --check 模式進行乾運行測試</li>
              <li>為複雜操作設定適當的超時時間</li>
              <li>監控執行過程，及時處理錯誤</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'monitoring',
      title: '執行監控與歷史',
      icon: Monitor,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3>執行監控與歷史功能說明</h3>
            <p>監控功能讓您可以實時追蹤任務執行狀態，歷史功能提供詳細的執行記錄分析。</p>

            <h4>實時監控功能</h4>
            <ul>
              <li><strong>實時終端：</strong>即時顯示命令執行輸出</li>
              <li><strong>進程控制：</strong>可以隨時停止正在執行的任務</li>
              <li><strong>狀態追蹤：</strong>顯示任務執行進度和狀態</li>
              <li><strong>日誌導出：</strong>將執行日誌導出為文本文件</li>
            </ul>

            <h4>執行歷史分析</h4>
            <p>執行歷史頁面提供了豐富的篩選和分析功能：</p>
            <ul>
              <li><strong>狀態篩選：</strong>按成功/失敗狀態篩選記錄</li>
              <li><strong>Playbook 篩選：</strong>查看特定 Playbook 的執行歷史</li>
              <li><strong>搜尋功能：</strong>根據關鍵字搜尋相關記錄</li>
              <li><strong>詳細分析：</strong>查看每次執行的完整輸出和錯誤資訊</li>
            </ul>

            <h4>執行記錄詳情</h4>
            <p>點擊任何執行記錄的詳情按鈕，可以查看：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2">基本資訊</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 執行狀態和結果</li>
                  <li>• 開始和結束時間</li>
                  <li>• 執行持續時間</li>
                  <li>• 退出代碼</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-900 mb-2">任務分析</h5>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 每個任務的執行結果</li>
                  <li>• 變更和錯誤詳情</li>
                  <li>• 完整的控制台輸出</li>
                  <li>• 執行的具體命令</li>
                </ul>
              </div>
            </div>

            <h4>效能統計</h4>
            <p>頁面頂部的統計卡片顯示：</p>
            <ul>
              <li><strong>總執行次數：</strong>系統累計執行的任務總數</li>
              <li><strong>成功執行：</strong>成功完成的任務數量</li>
              <li><strong>失敗執行：</strong>執行失敗的任務數量</li>
              <li><strong>平均執行時間：</strong>任務平均完成時間</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: '常見問題',
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h3>常見問題與解決方案</h3>

            <h4>連接問題</h4>
            <div className="space-y-4 not-prose">
              <div className="border-l-4 border-red-400 pl-4 py-2 bg-red-50">
                <h5 className="font-semibold text-red-900">問題：主機顯示「離線」狀態</h5>
                <p className="text-red-800 text-sm mt-1">檢查網路連通性和防火牆設定</p>
                <ul className="text-red-800 text-sm mt-2 space-y-1">
                  <li>• 確認主機 IP 地址正確</li>
                  <li>• 檢查網路連接是否正常</li>
                  <li>• 確認目標主機已開機</li>
                  <li>• 檢查防火牆是否阻擋連接</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50">
                <h5 className="font-semibold text-yellow-900">問題：主機「可達 (SSH 失敗)」</h5>
                <p className="text-yellow-800 text-sm mt-1">SSH 連接配置問題</p>
                <ul className="text-yellow-800 text-sm mt-2 space-y-1">
                  <li>• 檢查 SSH 服務是否運行（通常是埠 22）</li>
                  <li>• 確認用戶名和密碼正確</li>
                  <li>• 檢查 SSH 金鑰配置</li>
                  <li>• 確認用戶有適當的權限</li>
                </ul>
              </div>
            </div>

            <h4>執行問題</h4>
            <div className="space-y-4 not-prose">
              <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                <h5 className="font-semibold text-blue-900">問題：Playbook 執行失敗</h5>
                <p className="text-blue-800 text-sm mt-1">檢查 Playbook 語法和目標主機狀態</p>
                <ul className="text-blue-800 text-sm mt-2 space-y-1">
                  <li>• 檢查 YAML 語法是否正確</li>
                  <li>• 確認目標主機有足夠權限</li>
                  <li>• 檢查必要的軟體是否已安裝</li>
                  <li>• 查看詳細錯誤訊息進行診斷</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50">
                <h5 className="font-semibold text-purple-900">問題：腳本無法查看內容</h5>
                <p className="text-purple-800 text-sm mt-1">文件權限或路徑問題</p>
                <ul className="text-purple-800 text-sm mt-2 space-y-1">
                  <li>• 確認腳本文件存在</li>
                  <li>• 檢查文件讀取權限</li>
                  <li>• 刷新頁面重新載入</li>
                  <li>• 檢查伺服器日誌錯誤訊息</li>
                </ul>
              </div>
            </div>

            <h4>效能問題</h4>
            <ul>
              <li><strong>執行緩慢：</strong>檢查網路延遲和目標主機資源使用情況</li>
              <li><strong>終端輸出延遲：</strong>確認 WebSocket 連接正常</li>
              <li><strong>大量主機管理：</strong>考慮分批處理或使用主機群組</li>
            </ul>

            <h4>獲得協助</h4>
            <ul>
              <li>查看瀏覽器開發者工具中的錯誤訊息</li>
              <li>檢查伺服器日誌文件</li>
              <li>參考 Ansible 官方文檔</li>
              <li>聯繫系統管理員獲得技術支援</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const currentSection = sections.find(s => s.id === expandedSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">使用說明</h2>
          <p className="text-gray-600">完整的平台使用指南和故障排除</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">導覽目錄</h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = expandedSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isActive 
                        ? `${section.bgColor} ${section.color}` 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-3 ${isActive ? section.color : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    {isActive ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentSection && (
            <div className="bg-white shadow rounded-lg">
              <div className={`px-6 py-4 border-b ${currentSection.bgColor}`}>
                <div className="flex items-center">
                  <currentSection.icon className={`h-6 w-6 mr-3 ${currentSection.color}`} />
                  <h3 className={`text-xl font-semibold ${currentSection.color}`}>
                    {currentSection.title}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                {currentSection.content}
              </div>
            </div>
          )}

          {!currentSection && (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <Book className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">選擇一個主題開始</h3>
              <p className="text-gray-600">點擊左側選單中的任意主題來查看詳細說明</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">快速連結</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://docs.ansible.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-100"
          >
            <ExternalLink className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-blue-900">Ansible 官方文檔</div>
              <div className="text-sm text-blue-700">詳細的 Ansible 使用說明</div>
            </div>
          </a>
          <a
            href="https://galaxy.ansible.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-100"
          >
            <ExternalLink className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-blue-900">Ansible Galaxy</div>
              <div className="text-sm text-blue-700">社群分享的 Role 和模組</div>
            </div>
          </a>
          <a
            href="https://github.com/ansible/ansible"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-100"
          >
            <ExternalLink className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-blue-900">GitHub 專案</div>
              <div className="text-sm text-blue-700">Ansible 開源專案</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;