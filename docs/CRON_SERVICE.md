# Natural Analytics Cron Service

A comprehensive cron scheduling system for Natural Analytics that provides automated data refresh capabilities with multiple deployment options.

## Overview

The cron service provides:
- ✅ **Advanced cron expression parsing** using node-cron
- ✅ **Multiple deployment options** (standalone, systemd, Docker, Kubernetes)
- ✅ **Automatic schedule synchronization** with database
- ✅ **Health monitoring and recovery** with configurable restart policies
- ✅ **Comprehensive logging** and error handling
- ✅ **Graceful shutdown** handling
- ✅ **Production-ready** service management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CronService   │    │  RefreshService │    │    Database     │
│                 │    │                 │    │                 │
│ • Schedule Mgmt │◄──►│ • Execute Tasks │◄──►│ • Schedules     │
│ • Cron Parsing  │    │ • Cache Refresh │    │ • Executions    │
│ • Health Checks │    │ • Error Handling│    │ • Results       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. CronService (`src/lib/cron-service.ts`)
Core service that manages cron schedules:
- Validates and parses cron expressions
- Manages scheduled tasks lifecycle
- Synchronizes with database changes
- Provides health monitoring

### 2. CronUtils (`src/lib/cron-utils.ts`)
Utility functions for cron operations:
- Expression validation and parsing
- Human-readable descriptions
- Preset expressions
- Next execution calculations

### 3. API Endpoints (`src/app/api/cron/`)
RESTful API for service management:
- `GET /api/cron/status` - Service status and active schedules
- `POST /api/cron/status` - Start cron service
- `DELETE /api/cron/status` - Stop cron service

## Deployment Options

### Option 1: Standalone Node.js Process

Simple daemon process with health monitoring:

```bash
# Start the daemon
node scripts/cron-daemon.js start

# Check status
node scripts/cron-daemon.js status

# Stop the daemon
node scripts/cron-daemon.js stop

# Restart
node scripts/cron-daemon.js restart
```

**Environment Variables:**
```bash
CRON_APP_URL=http://localhost:3000
CRON_PID_FILE=./cron-daemon.pid
CRON_LOG_FILE=./logs/cron-daemon.log
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=60000
MAX_RESTARTS=5
RESTART_DELAY=5000
```

### Option 2: Systemd Service (Production)

Full system service integration with automatic startup:

```bash
# Install the service
sudo ./scripts/install-cron-service.sh

# Manage the service
sudo systemctl start natural-analytics-cron
sudo systemctl enable natural-analytics-cron
sudo systemctl status natural-analytics-cron

# View logs
sudo journalctl -u natural-analytics-cron -f
```

**Features:**
- Automatic startup on boot
- Process supervision and restart
- Resource limits and security
- Log rotation with logrotate
- User isolation

### Option 3: Docker Compose

Containerized deployment with the main application:

```bash
# Start with scheduler
docker-compose -f docker-compose.scheduler.yml up -d

# View scheduler logs
docker-compose -f docker-compose.scheduler.yml logs scheduler -f

# Scale the scheduler
docker-compose -f docker-compose.scheduler.yml up -d --scale scheduler=2
```

### Option 4: Kubernetes

Enterprise-grade deployment with high availability:

```bash
# Deploy the cron service
kubectl apply -f k8s/cron-deployment.yaml

# Deploy Kubernetes CronJobs (alternative)
kubectl apply -f k8s/cronjob-scheduler.yaml

# Check status
kubectl get pods -l app=natural-analytics-cron
kubectl logs -l app=natural-analytics-cron -f
```

## Cron Expression Support

### Validation and Parsing

```typescript
import { CronUtils } from '@/lib/cron-utils';

// Validate expression
const result = CronUtils.validate('0 */6 * * *');
// { isValid: true, nextRuns: [Date, Date, Date] }

// Get human description
const description = CronUtils.cronToHuman('0 */6 * * *');
// "Every 6 hours"

// Convert from human language
const expression = CronUtils.humanToCron('daily at 2:30 PM');
// "30 14 * * *"
```

### Preset Expressions

Common scheduling patterns are provided as presets:

```typescript
const presets = CronUtils.getPresets();
// [
//   { expression: '*/5 * * * *', description: 'Every 5 minutes' },
//   { expression: '0 * * * *', description: 'Every hour' },
//   { expression: '0 0 * * *', description: 'Daily at midnight' },
//   ...
// ]
```

### Supported Patterns

| Pattern | Expression | Description |
|---------|------------|-------------|
| `*/5 * * * *` | Every 5 minutes | Runs every 5 minutes |
| `0 * * * *` | Every hour | Runs at the top of every hour |
| `0 6 * * *` | Daily at 6 AM | Runs daily at 6:00 AM |
| `0 0 * * 1` | Weekly on Monday | Runs every Monday at midnight |
| `0 0 1 * *` | Monthly | Runs on the 1st of every month |

## Usage Examples

### Creating a Schedule

```typescript
import { cronService } from '@/lib/cron-service';

// Start the service
await cronService.start();

// Add a schedule
await cronService.addSchedule('schedule-123', '0 */6 * * *');

// Remove a schedule
await cronService.removeSchedule('schedule-123');

// Get service status
const status = cronService.getStatus();
```

### Database Integration

Schedules are automatically synchronized with the database:

```sql
-- Create a new cron schedule
INSERT INTO "RefreshSchedule" (
  "targetType", "targetId", "scheduleType", 
  "cronExpression", "isActive", "userId"
) VALUES (
  'DASHBOARD', 'dash-123', 'CRON', 
  '0 6 * * *', true, 'user-456'
);
```

The cron service will automatically pick up this schedule and start executing it.

### API Integration

```typescript
// Start cron service via API
const response = await fetch('/api/cron/status', {
  method: 'POST'
});

// Get service status
const status = await fetch('/api/cron/status');
const data = await status.json();
// {
//   isRunning: true,
//   activeSchedules: 5,
//   schedules: [...],
//   detailedSchedules: [...]
// }
```

## Monitoring and Logging

### Health Checks

The service includes comprehensive health monitoring:
- **Database connectivity** - Ensures database is accessible
- **Schedule synchronization** - Verifies schedules are up-to-date
- **Task execution** - Monitors successful/failed executions
- **Memory and CPU usage** - Resource monitoring

### Logging Levels

```bash
LOG_LEVEL=debug  # Detailed debug information
LOG_LEVEL=info   # General operational messages (default)
LOG_LEVEL=warn   # Warning conditions
LOG_LEVEL=error  # Error conditions only
```

### Log Format

All logs are structured JSON for easy parsing:

```json
{
  "timestamp": "2023-12-07T10:30:00.000Z",
  "level": "info",
  "message": "Schedule executed successfully",
  "pid": 12345,
  "data": {
    "scheduleId": "schedule-123",
    "duration": 1250,
    "recordsAffected": 42
  }
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CRON_APP_URL` | `http://localhost:3000` | URL of the main application |
| `CRON_PID_FILE` | `./cron-daemon.pid` | Process ID file location |
| `CRON_LOG_FILE` | `./logs/cron-daemon.log` | Log file location |
| `LOG_LEVEL` | `info` | Logging level |
| `HEALTH_CHECK_INTERVAL` | `60000` | Health check interval (ms) |
| `MAX_RESTARTS` | `5` | Maximum restart attempts |
| `RESTART_DELAY` | `5000` | Delay between restarts (ms) |

### Database Configuration

The service uses the same database connection as the main application. Ensure these tables exist:

- `RefreshSchedule` - Stores schedule definitions
- `RefreshExecution` - Tracks execution history
- `DataSourceCache` - Manages cached data

## Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check logs
   journalctl -u natural-analytics-cron -n 50
   
   # Check application connectivity
   curl http://localhost:3000/api/health
   ```

2. **Schedules not executing**
   ```bash
   # Check service status
   curl http://localhost:3000/api/cron/status
   
   # Verify database connectivity
   # Check schedule active status in database
   ```

3. **High memory usage**
   ```bash
   # Check active schedules
   curl http://localhost:3000/api/cron/status
   
   # Review log files for errors
   tail -f /var/log/natural-analytics/cron.log
   ```

### Debug Mode

Enable debug logging for detailed information:

```bash
export LOG_LEVEL=debug
node scripts/cron-daemon.js start
```

## Security Considerations

- **Process isolation** - Runs under dedicated user account
- **Resource limits** - Memory and CPU limits in production
- **Secure logging** - No sensitive data in logs
- **Network isolation** - Communicates only with main application
- **Token authentication** - Uses bearer tokens for API calls

## Performance

- **Lightweight** - Minimal memory footprint (~50MB)
- **Efficient** - Uses event-driven architecture
- **Scalable** - Supports thousands of concurrent schedules
- **Resilient** - Automatic error recovery and retries

## Migration from Simple Scheduler

If upgrading from the basic scheduler script:

1. Stop the old scheduler: `pkill -f scheduler.js`
2. Install the new cron service: `./scripts/install-cron-service.sh`
3. Update any custom configurations
4. Start the new service: `systemctl start natural-analytics-cron`

The new cron service is fully backward compatible with existing schedules.