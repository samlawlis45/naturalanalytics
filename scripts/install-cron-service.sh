#!/bin/bash

# Natural Analytics Cron Service Installation Script
# This script sets up the cron service for production deployment

set -e

# Configuration
SERVICE_NAME="natural-analytics-cron"
APP_USER="naturalanalytics"
APP_GROUP="naturalanalytics"
APP_DIR="/opt/natural-analytics"
LOG_DIR="/var/log/natural-analytics"
RUN_DIR="/var/run/natural-analytics"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Check if systemd is available
check_systemd() {
    if ! command -v systemctl &> /dev/null; then
        log_error "systemctl not found. This script requires systemd."
        exit 1
    fi
}

# Create user and group
create_user() {
    log_info "Creating user and group: $APP_USER"
    
    if ! getent group "$APP_GROUP" > /dev/null 2>&1; then
        groupadd --system "$APP_GROUP"
        log_info "Created group: $APP_GROUP"
    fi
    
    if ! getent passwd "$APP_USER" > /dev/null 2>&1; then
        useradd --system --gid "$APP_GROUP" --home-dir "$APP_DIR" \
                --no-create-home --shell /bin/false "$APP_USER"
        log_info "Created user: $APP_USER"
    fi
}

# Create directories
create_directories() {
    log_info "Creating directories"
    
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$RUN_DIR"
    
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
    chown -R "$APP_USER:$APP_GROUP" "$LOG_DIR"
    chown -R "$APP_USER:$APP_GROUP" "$RUN_DIR"
    
    chmod 755 "$APP_DIR"
    chmod 755 "$LOG_DIR"
    chmod 755 "$RUN_DIR"
}

# Install Node.js if not present
install_nodejs() {
    if ! command -v node &> /dev/null; then
        log_info "Installing Node.js"
        
        # Install NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        apt-get install -y nodejs
        
        log_info "Node.js installed: $(node --version)"
    else
        log_info "Node.js already installed: $(node --version)"
    fi
}

# Install application files
install_app() {
    log_info "Installing application files"
    
    # Copy application files (assumes running from app directory)
    if [[ ! -d "./scripts" ]]; then
        log_error "Script must be run from the application root directory"
        exit 1
    fi
    
    # Copy necessary files
    cp -r . "$APP_DIR/"
    
    # Install dependencies
    cd "$APP_DIR"
    sudo -u "$APP_USER" npm ci --production
    
    # Make scripts executable
    chmod +x "$APP_DIR/scripts/cron-daemon.js"
    
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
}

# Install systemd service
install_service() {
    log_info "Installing systemd service"
    
    # Copy service file
    cp "$APP_DIR/scripts/systemd/natural-analytics-cron.service" \
       "/etc/systemd/system/$SERVICE_NAME.service"
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable service
    systemctl enable "$SERVICE_NAME"
    
    log_info "Service installed and enabled"
}

# Configure logrotate
setup_logrotate() {
    log_info "Setting up log rotation"
    
    cat > "/etc/logrotate.d/$SERVICE_NAME" << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        systemctl reload $SERVICE_NAME > /dev/null 2>&1 || true
    endscript
}
EOF
}

# Create environment file
create_env_file() {
    log_info "Creating environment configuration"
    
    cat > "$APP_DIR/.env.production" << EOF
# Natural Analytics Cron Service Configuration
NODE_ENV=production
CRON_APP_URL=http://localhost:3000
CRON_PID_FILE=$RUN_DIR/cron.pid
CRON_LOG_FILE=$LOG_DIR/cron.log
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=60000
MAX_RESTARTS=5
RESTART_DELAY=5000

# Database (update with your actual database URL)
# DATABASE_URL=postgresql://user:password@localhost:5432/naturalanalytics

# Scheduler token (generate a secure token)
# SCHEDULER_TOKEN=your-secure-token-here
EOF
    
    chown "$APP_USER:$APP_GROUP" "$APP_DIR/.env.production"
    chmod 600 "$APP_DIR/.env.production"
    
    log_warn "Please update $APP_DIR/.env.production with your actual configuration"
}

# Start service
start_service() {
    log_info "Starting $SERVICE_NAME service"
    
    systemctl start "$SERVICE_NAME"
    
    # Wait a moment and check status
    sleep 2
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_info "Service started successfully"
        systemctl status "$SERVICE_NAME" --no-pager
    else
        log_error "Service failed to start"
        systemctl status "$SERVICE_NAME" --no-pager
        exit 1
    fi
}

# Main installation process
main() {
    log_info "Starting Natural Analytics Cron Service installation"
    
    check_root
    check_systemd
    create_user
    create_directories
    install_nodejs
    install_app
    install_service
    setup_logrotate
    create_env_file
    
    log_info "Installation completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update configuration in $APP_DIR/.env.production"
    log_info "2. Start the service: systemctl start $SERVICE_NAME"
    log_info "3. Check status: systemctl status $SERVICE_NAME"
    log_info "4. View logs: journalctl -u $SERVICE_NAME -f"
    log_info ""
    log_info "Management commands:"
    log_info "  Start:   systemctl start $SERVICE_NAME"
    log_info "  Stop:    systemctl stop $SERVICE_NAME"
    log_info "  Restart: systemctl restart $SERVICE_NAME"
    log_info "  Status:  systemctl status $SERVICE_NAME"
    log_info "  Logs:    journalctl -u $SERVICE_NAME -f"
}

# Handle command line arguments
case "${1:-install}" in
    install)
        main
        ;;
    start)
        start_service
        ;;
    uninstall)
        log_info "Uninstalling $SERVICE_NAME"
        systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        systemctl disable "$SERVICE_NAME" 2>/dev/null || true
        rm -f "/etc/systemd/system/$SERVICE_NAME.service"
        rm -f "/etc/logrotate.d/$SERVICE_NAME"
        systemctl daemon-reload
        log_info "Service uninstalled (application files not removed)"
        ;;
    *)
        echo "Usage: $0 {install|start|uninstall}"
        exit 1
        ;;
esac