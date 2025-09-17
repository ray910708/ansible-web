# Windows 系統資訊檢查腳本
# 適用於 Windows Server 2019, 2022

param(
    [switch]$Detailed = $false
)

# 設定輸出編碼為 UTF-8
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

Write-Host "=== Windows 系統資訊檢查 ===" -ForegroundColor Green
Write-Host "執行時間: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

# 基本系統資訊
Write-Host "系統基本資訊:" -ForegroundColor Cyan
$computerInfo = Get-ComputerInfo
Write-Host "  電腦名稱: $($computerInfo.CsName)"
Write-Host "  作業系統: $($computerInfo.WindowsProductName)"
Write-Host "  版本: $($computerInfo.WindowsVersion)"
Write-Host "  建置版本: $($computerInfo.OsVersion)"
Write-Host "  架構: $($computerInfo.OsArchitecture)"
Write-Host "  安裝日期: $($computerInfo.OsInstallDate)"
Write-Host ""

# 硬體資訊
Write-Host "硬體資訊:" -ForegroundColor Cyan
Write-Host "  處理器: $($computerInfo.CsProcessors[0].Name)"
Write-Host "  核心數: $($computerInfo.CsNumberOfProcessors)"
Write-Host "  總記憶體: $([math]::Round($computerInfo.TotalPhysicalMemory / 1GB, 2)) GB"
Write-Host "  可用記憶體: $([math]::Round($computerInfo.AvailablePhysicalMemory / 1GB, 2)) GB"
Write-Host ""

# 磁碟資訊
Write-Host "磁碟資訊:" -ForegroundColor Cyan
Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | ForEach-Object {
    $totalSize = [math]::Round($_.Size / 1GB, 2)
    $freeSpace = [math]::Round($_.FreeSpace / 1GB, 2)
    $usedSpace = $totalSize - $freeSpace
    $usagePercent = [math]::Round(($usedSpace / $totalSize) * 100, 1)
    
    Write-Host "  磁碟 $($_.DeviceID)"
    Write-Host "    總容量: $totalSize GB"
    Write-Host "    已使用: $usedSpace GB ($usagePercent%)"
    Write-Host "    可用空間: $freeSpace GB"
}
Write-Host ""

# 網路資訊
Write-Host "網路介面:" -ForegroundColor Cyan
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    Write-Host "  介面: $($_.Name)"
    Write-Host "    狀態: $($_.Status)"
    Write-Host "    速度: $($_.LinkSpeed / 1000000) Mbps"
    
    $ipConfig = Get-NetIPAddress -InterfaceIndex $_.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($ipConfig) {
        Write-Host "    IP 地址: $($ipConfig.IPAddress)"
    }
}
Write-Host ""

# 服務狀態
Write-Host "重要服務狀態:" -ForegroundColor Cyan
$importantServices = @('Spooler', 'Themes', 'AudioSrv', 'BITS', 'EventLog', 'PlugPlay', 'RpcSs', 'Schedule', 'W32Time', 'WinRM')
foreach ($serviceName in $importantServices) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
        $status = if ($service.Status -eq 'Running') { "執行中" } else { "已停止" }
        $color = if ($service.Status -eq 'Running') { "Green" } else { "Red" }
        Write-Host "  $($service.DisplayName): " -NoNewline
        Write-Host $status -ForegroundColor $color
    }
}
Write-Host ""

# 詳細資訊（如果指定 -Detailed 參數）
if ($Detailed) {
    Write-Host "詳細系統資訊:" -ForegroundColor Cyan
    
    # 開機時間
    $bootTime = (Get-WmiObject Win32_OperatingSystem).ConvertToDateTime((Get-WmiObject Win32_OperatingSystem).LastBootUpTime)
    $uptime = (Get-Date) - $bootTime
    Write-Host "  系統開機時間: $($bootTime.ToString('yyyy-MM-dd HH:mm:ss'))"
    Write-Host "  系統運行時間: $($uptime.Days) 天 $($uptime.Hours) 小時 $($uptime.Minutes) 分鐘"
    
    # 安裝的軟體（前10個）
    Write-Host "  已安裝軟體（前10個）:"
    Get-WmiObject -Class Win32_Product | Select-Object Name, Version | Sort-Object Name | Select-Object -First 10 | ForEach-Object {
        Write-Host "    $($_.Name) v$($_.Version)"
    }
    
    # 環境變數
    Write-Host "  重要環境變數:"
    $importantEnvVars = @('PATH', 'TEMP', 'USERNAME', 'COMPUTERNAME', 'PROCESSOR_ARCHITECTURE')
    foreach ($envVar in $importantEnvVars) {
        $value = [Environment]::GetEnvironmentVariable($envVar)
        if ($value.Length -gt 100) {
            $value = $value.Substring(0, 100) + "..."
        }
        Write-Host "    $envVar = $value"
    }
}

Write-Host ""
Write-Host "系統檢查完成！" -ForegroundColor Green