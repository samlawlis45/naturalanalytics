#!/usr/bin/env node

/**
 * Advanced Cron Daemon for Natural Analytics
 * 
 * This daemon provides:
 * - Proper cron expression parsing using node-cron
 * - Automatic schedule synchronization with database
 * - Graceful shutdown handling
 * - Health monitoring and logging
 * - Process supervision capabilities
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Application settings
  appUrl: process.env.CRON_APP_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Process management
  pidFile: process.env.CRON_PID_FILE || './cron-daemon.pid',
  logFile: process.env.CRON_LOG_FILE || './logs/cron-daemon.log',
  
  // Health monitoring
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000'), // 1 minute
  maxRestarts: parseInt(process.env.MAX_RESTARTS || '5'),
  restartDelay: parseInt(process.env.RESTART_DELAY || '5000'), // 5 seconds
};

class CronDaemon {
  constructor() {
    this.isRunning = false;
    this.restartCount = 0;
    this.startTime = new Date();
    this.lastHealthCheck = null;
    this.cronProcess = null;
    
    this.setupLogging();
    this.setupSignalHandlers();
  }

  setupLogging() {
    const logDir = path.dirname(config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.logStream = fs.createWriteStream(config.logFile, { flags: 'a' });
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      pid: process.pid,
      ...(data && { data })
    };
    
    const logLine = JSON.stringify(logEntry) + '\\n';
    
    // Write to file
    this.logStream.write(logLine);
    
    // Also log to console based on log level
    if (config.logLevel === 'debug' || level === 'error' || level === 'warn') {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  setupSignalHandlers() {
    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    // Process monitoring
    process.on('uncaughtException', (error) => {
      this.log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
      this.shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.log('error', 'Unhandled rejection', { reason, promise });
    });
  }

  async start() {
    if (this.isRunning) {
      this.log('warn', 'Cron daemon is already running');
      return;
    }

    this.log('info', 'Starting Natural Analytics Cron Daemon', {
      config: {
        appUrl: config.appUrl,
        healthCheckInterval: config.healthCheckInterval,
        maxRestarts: config.maxRestarts,
      }
    });

    // Write PID file
    fs.writeFileSync(config.pidFile, process.pid.toString());

    this.isRunning = true;
    this.startTime = new Date();

    try {
      // Start the cron service via API
      await this.startCronService();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.log('info', 'Cron daemon started successfully');
    } catch (error) {
      this.log('error', 'Failed to start cron daemon', { error: error.message });
      await this.shutdown('startup-error');
    }
  }

  async startCronService() {
    try {
      const response = await fetch(`${config.appUrl}/api/cron/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.log('info', 'Cron service started via API', result);
    } catch (error) {
      this.log('error', 'Failed to start cron service via API', { error: error.message });
      throw error;
    }
  }

  startHealthMonitoring() {
    this.healthInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, config.healthCheckInterval);

    this.log('debug', 'Health monitoring started', {
      interval: config.healthCheckInterval
    });
  }

  async performHealthCheck() {
    try {
      const response = await fetch(`${config.appUrl}/api/cron/status`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }
      
      const status = await response.json();
      this.lastHealthCheck = new Date();
      
      this.log('debug', 'Health check passed', {
        activeSchedules: status.activeSchedules,
        isRunning: status.isRunning,
      });

      // Reset restart count on successful health check
      if (this.restartCount > 0) {
        this.restartCount = 0;
        this.log('info', 'Restart count reset after successful health check');
      }
      
    } catch (error) {
      this.log('error', 'Health check failed', { error: error.message });
      
      // Attempt restart if within limits
      if (this.restartCount < config.maxRestarts) {
        this.log('warn', `Attempting restart (${this.restartCount + 1}/${config.maxRestarts})`);
        await this.restart();
      } else {
        this.log('error', 'Maximum restart attempts reached, shutting down');
        await this.shutdown('max-restarts');
      }
    }
  }

  async restart() {
    this.restartCount++;
    
    this.log('info', 'Restarting cron service', {
      attempt: this.restartCount,
      maxAttempts: config.maxRestarts
    });

    try {
      // Stop current service
      await this.stopCronService();
      
      // Wait before restart
      await new Promise(resolve => setTimeout(resolve, config.restartDelay));
      
      // Start service again
      await this.startCronService();
      
      this.log('info', 'Cron service restarted successfully');
    } catch (error) {
      this.log('error', 'Failed to restart cron service', { error: error.message });
      throw error;
    }
  }

  async stopCronService() {
    try {
      const response = await fetch(`${config.appUrl}/api/cron/status`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        this.log('info', 'Cron service stopped via API');
      }
    } catch (error) {
      this.log('warn', 'Failed to stop cron service via API', { error: error.message });
    }
  }

  async shutdown(reason) {
    if (!this.isRunning) {
      return;
    }

    this.log('info', `Shutting down cron daemon`, { reason });

    this.isRunning = false;

    // Stop health monitoring
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }

    // Stop cron service
    await this.stopCronService();

    // Clean up PID file
    try {
      if (fs.existsSync(config.pidFile)) {
        fs.unlinkSync(config.pidFile);
      }
    } catch (error) {
      this.log('warn', 'Failed to remove PID file', { error: error.message });
    }

    // Close log stream
    if (this.logStream) {
      this.logStream.end();
    }

    this.log('info', 'Cron daemon shutdown complete');
    
    process.exit(reason === 'uncaughtException' ? 1 : 0);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: process.pid,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime.getTime(),
      restartCount: this.restartCount,
      lastHealthCheck: this.lastHealthCheck,
      config: {
        appUrl: config.appUrl,
        healthCheckInterval: config.healthCheckInterval,
        maxRestarts: config.maxRestarts,
      }
    };
  }
}

// Command line interface
const command = process.argv[2];
const daemon = new CronDaemon();

switch (command) {
  case 'start':
    daemon.start();
    break;
    
  case 'stop':
    if (fs.existsSync(config.pidFile)) {
      const pid = parseInt(fs.readFileSync(config.pidFile, 'utf8'));
      try {
        process.kill(pid, 'SIGTERM');
        console.log(`Stopped cron daemon (PID: ${pid})`);
      } catch (error) {
        console.error(`Failed to stop daemon: ${error.message}`);
      }
    } else {
      console.log('Cron daemon is not running (no PID file found)');
    }
    break;
    
  case 'restart':
    // Stop existing daemon
    if (fs.existsSync(config.pidFile)) {
      const pid = parseInt(fs.readFileSync(config.pidFile, 'utf8'));
      try {
        process.kill(pid, 'SIGTERM');
        console.log(`Stopped existing daemon (PID: ${pid})`);
        // Wait a moment for cleanup
        setTimeout(() => daemon.start(), 2000);
      } catch (error) {
        console.log('No existing daemon to stop, starting new one');
        daemon.start();
      }
    } else {
      daemon.start();
    }
    break;
    
  case 'status':
    if (fs.existsSync(config.pidFile)) {
      const pid = parseInt(fs.readFileSync(config.pidFile, 'utf8'));
      try {
        process.kill(pid, 0); // Check if process exists
        console.log(`Cron daemon is running (PID: ${pid})`);
      } catch (error) {
        console.log('Cron daemon is not running (stale PID file)');
        fs.unlinkSync(config.pidFile);
      }
    } else {
      console.log('Cron daemon is not running');
    }
    break;
    
  default:
    console.log(`
Natural Analytics Cron Daemon

Usage: node cron-daemon.js <command>

Commands:
  start    Start the cron daemon
  stop     Stop the cron daemon
  restart  Restart the cron daemon
  status   Check daemon status

Environment Variables:
  CRON_APP_URL           Application URL (default: http://localhost:3000)
  CRON_PID_FILE          PID file location (default: ./cron-daemon.pid)
  CRON_LOG_FILE          Log file location (default: ./logs/cron-daemon.log)
  LOG_LEVEL              Logging level (default: info)
  HEALTH_CHECK_INTERVAL  Health check interval in ms (default: 60000)
  MAX_RESTARTS           Maximum restart attempts (default: 5)
  RESTART_DELAY          Delay between restarts in ms (default: 5000)
`);
    process.exit(1);
}