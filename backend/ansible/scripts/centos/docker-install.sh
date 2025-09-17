#!/bin/bash
# CentOS/RHEL Docker 安裝腳本
# 適用於 CentOS 7, 8, 9 和 RHEL 7, 8, 9

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"
}

log "開始在 CentOS/RHEL 上安裝 Docker..."

# 檢查是否已安裝 Docker
if command -v docker >/dev/null 2>&1; then
    warn "Docker 已經安裝，版本: $(docker --version)"
    exit 0
fi

# 檢查系統版本
MAJOR_VERSION=$(rpm -q --queryformat '%{VERSION}' centos-release 2>/dev/null || rpm -q --queryformat '%{VERSION}' redhat-release 2>/dev/null || echo "unknown")

# 根據版本選擇包管理器
if [[ "$MAJOR_VERSION" == "7" ]]; then
    PKG_MGR="yum"
    log "檢測到 CentOS/RHEL 7，使用 YUM"
elif [[ "$MAJOR_VERSION" == "8" ]] || [[ "$MAJOR_VERSION" == "9" ]]; then
    PKG_MGR="dnf"
    log "檢測到 CentOS/RHEL $MAJOR_VERSION，使用 DNF"
else
    if command -v dnf >/dev/null 2>&1; then
        PKG_MGR="dnf"
    else
        PKG_MGR="yum"
    fi
    log "使用 $PKG_MGR 包管理器"
fi

# 移除舊版本的 Docker
log "移除舊版本的 Docker（如果存在）..."
$PKG_MGR remove -y docker \
    docker-client \
    docker-client-latest \
    docker-common \
    docker-latest \
    docker-latest-logrotate \
    docker-logrotate \
    docker-engine \
    podman \
    runc 2>/dev/null || true

# 安裝必要的依賴
log "安裝必要依賴..."
$PKG_MGR install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 官方儲存庫
log "添加 Docker 官方儲存庫..."
if [[ "$PKG_MGR" == "dnf" ]]; then
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
else
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
fi

# 更新套件清單
log "更新套件清單..."
$PKG_MGR makecache fast 2>/dev/null || $PKG_MGR makecache

# 安裝 Docker CE
log "安裝 Docker CE..."
$PKG_MGR install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 啟動 Docker 服務
log "啟動 Docker 服務..."
systemctl start docker
systemctl enable docker

# 將當前用戶添加到 docker 組
log "將用戶添加到 docker 組..."
usermod -aG docker $USER 2>/dev/null || true

# 配置 Docker 守護進程
log "配置 Docker 守護進程..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# 重新啟動 Docker 以應用配置
systemctl restart docker

# 驗證安裝
log "驗證 Docker 安裝..."
docker --version
docker info | head -10

# 測試 Docker
log "測試 Docker 運行..."
docker run --rm hello-world

log "Docker 在 CentOS/RHEL 上安裝完成！"
log "注意：您可能需要重新登入以使用 Docker 命令（無需 sudo）"