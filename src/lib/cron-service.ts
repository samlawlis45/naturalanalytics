import cron from 'node-cron';
import { RefreshService } from './refresh-service';
import { prisma } from './prisma';

interface ScheduledTask {
  id: string;
  scheduleId: string;
  cronExpression: string;
  task: cron.ScheduledTask;
}

export class CronService {
  private static instance: CronService;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('CronService is already running');
      return;
    }

    console.log('Starting CronService...');
    this.isRunning = true;

    // Load existing schedules from database
    await this.loadSchedulesFromDatabase();

    // Start a background task to check for new/updated schedules
    this.startScheduleWatcher();

    console.log(`CronService started with ${this.scheduledTasks.size} active schedules`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping CronService...');
    this.isRunning = false;

    // Stop all scheduled tasks
    for (const [scheduleId, scheduledTask] of this.scheduledTasks) {
      scheduledTask.task.stop();
      console.log(`Stopped schedule: ${scheduleId}`);
    }

    this.scheduledTasks.clear();
    console.log('CronService stopped');
  }

  private async loadSchedulesFromDatabase(): Promise<void> {
    try {
      const schedules = await prisma.refreshSchedule.findMany({
        where: {
          isActive: true,
          scheduleType: 'CRON',
          cronExpression: {
            not: null,
          },
        },
      });

      for (const schedule of schedules) {
        if (schedule.cronExpression) {
          await this.addSchedule(schedule.id, schedule.cronExpression);
        }
      }
    } catch (error) {
      console.error('Failed to load schedules from database:', error);
    }
  }

  private startScheduleWatcher(): void {
    // Check for new/updated schedules every minute
    cron.schedule('* * * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.syncSchedules();
      } catch (error) {
        console.error('Error syncing schedules:', error);
      }
    });
  }

  private async syncSchedules(): Promise<void> {
    const activeSchedules = await prisma.refreshSchedule.findMany({
      where: {
        isActive: true,
        scheduleType: 'CRON',
        cronExpression: {
          not: null,
        },
      },
    });

    const currentScheduleIds = new Set(Array.from(this.scheduledTasks.keys()));
    const databaseScheduleIds = new Set(activeSchedules.map(s => s.id));

    // Remove schedules that are no longer active
    for (const scheduleId of currentScheduleIds) {
      if (!databaseScheduleIds.has(scheduleId)) {
        await this.removeSchedule(scheduleId);
      }
    }

    // Add new schedules
    for (const schedule of activeSchedules) {
      if (!currentScheduleIds.has(schedule.id) && schedule.cronExpression) {
        await this.addSchedule(schedule.id, schedule.cronExpression);
      }
    }
  }

  async addSchedule(scheduleId: string, cronExpression: string): Promise<boolean> {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        console.error(`Invalid cron expression for schedule ${scheduleId}: ${cronExpression}`);
        return false;
      }

      // Remove existing schedule if it exists
      if (this.scheduledTasks.has(scheduleId)) {
        await this.removeSchedule(scheduleId);
      }

      // Create new scheduled task
      const task = cron.schedule(cronExpression, async () => {
        await this.executeSchedule(scheduleId);
      }, {
        scheduled: false, // Don't start immediately
        timezone: process.env.TZ || 'UTC',
      });

      // Start the task
      task.start();

      // Store the task
      this.scheduledTasks.set(scheduleId, {
        id: `cron_${scheduleId}`,
        scheduleId,
        cronExpression,
        task,
      });

      console.log(`Added cron schedule: ${scheduleId} with expression: ${cronExpression}`);
      
      // Update next run time in database
      await this.updateNextRunTime(scheduleId, cronExpression);
      
      return true;
    } catch (error) {
      console.error(`Failed to add schedule ${scheduleId}:`, error);
      return false;
    }
  }

  async removeSchedule(scheduleId: string): Promise<boolean> {
    try {
      const scheduledTask = this.scheduledTasks.get(scheduleId);
      if (scheduledTask) {
        scheduledTask.task.stop();
        this.scheduledTasks.delete(scheduleId);
        console.log(`Removed cron schedule: ${scheduleId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to remove schedule ${scheduleId}:`, error);
      return false;
    }
  }

  private async executeSchedule(scheduleId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`Executing scheduled refresh: ${scheduleId}`);

    try {
      // Create execution record
      const execution = await prisma.refreshExecution.create({
        data: {
          scheduleId,
          status: 'RUNNING',
        },
      });

      // Execute the refresh
      const result = await RefreshService.executeSchedule(scheduleId);
      const duration = Date.now() - startTime;

      // Update execution record
      await prisma.refreshExecution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          duration,
          recordsAffected: result.recordsAffected,
          metadata: result.metadata,
          errorMessage: result.error || null,
        },
      });

      // Update next run time
      const scheduledTask = this.scheduledTasks.get(scheduleId);
      if (scheduledTask) {
        await this.updateNextRunTime(scheduleId, scheduledTask.cronExpression);
      }

      console.log(`Schedule ${scheduleId} executed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Schedule ${scheduleId} failed after ${duration}ms:`, errorMessage);

      // Update schedule with error
      await prisma.refreshSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          errorCount: { increment: 1 },
          lastError: errorMessage,
        },
      });
    }
  }

  private async updateNextRunTime(scheduleId: string, cronExpression: string): Promise<void> {
    try {
      const nextDate = this.getNextRunDate(cronExpression);
      
      await prisma.refreshSchedule.update({
        where: { id: scheduleId },
        data: {
          nextRunAt: nextDate,
          lastRunAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to update next run time for schedule ${scheduleId}:`, error);
    }
  }

  private getNextRunDate(cronExpression: string): Date {
    try {
      // Use node-cron to get next execution time
      const task = cron.schedule(cronExpression, () => {}, { scheduled: false });
      
      // Get current time and add small buffer to find next execution
      const now = new Date();
      const nextMinute = new Date(now.getTime() + 60000); // Add 1 minute
      
      // Simple calculation for next run (this is approximate)
      // For production, consider using a more sophisticated cron parser
      const parts = cronExpression.split(' ');
      if (parts.length >= 5) {
        const [minute, hour, day, month, dayOfWeek] = parts;
        
        // Handle simple cases
        if (minute !== '*' && hour !== '*') {
          const next = new Date();
          next.setHours(parseInt(hour), parseInt(minute), 0, 0);
          
          // If time has passed today, schedule for tomorrow
          if (next <= now) {
            next.setDate(next.getDate() + 1);
          }
          
          return next;
        }
      }
      
      // Default to 1 hour from now if parsing fails
      return new Date(now.getTime() + 60 * 60 * 1000);
    } catch (error) {
      console.error('Failed to calculate next run date:', error);
      return new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  getActiveSchedules(): Array<{ scheduleId: string; cronExpression: string; nextRun?: Date }> {
    return Array.from(this.scheduledTasks.values()).map(task => ({
      scheduleId: task.scheduleId,
      cronExpression: task.cronExpression,
      nextRun: this.getNextRunDate(task.cronExpression),
    }));
  }

  isScheduleActive(scheduleId: string): boolean {
    return this.scheduledTasks.has(scheduleId);
  }

  getStatus(): {
    isRunning: boolean;
    activeSchedules: number;
    schedules: Array<{ scheduleId: string; cronExpression: string }>;
  } {
    return {
      isRunning: this.isRunning,
      activeSchedules: this.scheduledTasks.size,
      schedules: Array.from(this.scheduledTasks.values()).map(task => ({
        scheduleId: task.scheduleId,
        cronExpression: task.cronExpression,
      })),
    };
  }
}

// Global instance for use across the application
export const cronService = CronService.getInstance();