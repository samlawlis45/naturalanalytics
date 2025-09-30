import cron from 'node-cron';

export interface CronValidationResult {
  isValid: boolean;
  error?: string;
  nextRuns?: Date[];
}

export interface CronExpressionInfo {
  expression: string;
  description: string;
  nextRun: Date;
  isValid: boolean;
}

export class CronUtils {
  /**
   * Validate a cron expression
   */
  static validate(expression: string): CronValidationResult {
    try {
      if (!expression || typeof expression !== 'string') {
        return {
          isValid: false,
          error: 'Cron expression is required and must be a string'
        };
      }

      const isValid = cron.validate(expression);
      
      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid cron expression format'
        };
      }

      // Get next few runs to verify the expression works
      const nextRuns = this.getNextRuns(expression, 3);
      
      return {
        isValid: true,
        nextRuns
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Get the next N execution times for a cron expression
   */
  static getNextRuns(expression: string, count: number = 5): Date[] {
    const runs: Date[] = [];
    
    try {
      if (!cron.validate(expression)) {
        return runs;
      }

      // Create a temporary task to calculate next runs
      let currentDate = new Date();
      
      for (let i = 0; i < count; i++) {
        const nextRun = this.getNextRun(expression, currentDate);
        if (nextRun) {
          runs.push(nextRun);
          currentDate = new Date(nextRun.getTime() + 60000); // Add 1 minute to get next occurrence
        } else {
          break;
        }
      }
    } catch (error) {
      console.error('Error calculating next runs:', error);
    }

    return runs;
  }

  /**
   * Get the next execution time for a cron expression
   */
  static getNextRun(expression: string, fromDate: Date = new Date()): Date | null {
    try {
      // Basic cron parsing for common patterns
      const parts = expression.trim().split(/\s+/);
      
      if (parts.length !== 5) {
        return null;
      }

      const [minute, hour, day, month, dayOfWeek] = parts;
      const now = new Date(fromDate);
      const next = new Date(now);

      // Handle simple cases first
      if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        // Daily at specific time
        const targetHour = parseInt(hour);
        const targetMinute = parseInt(minute);
        
        next.setHours(targetHour, targetMinute, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        return next;
      }

      if (minute !== '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        // Hourly at specific minute
        const targetMinute = parseInt(minute);
        
        next.setMinutes(targetMinute, 0, 0);
        
        // If minute has passed this hour, schedule for next hour
        if (next <= now) {
          next.setHours(next.getHours() + 1);
        }
        
        return next;
      }

      if (minute === '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        // Every minute
        next.setSeconds(0, 0);
        next.setMinutes(next.getMinutes() + 1);
        return next;
      }

      // For complex expressions, return a reasonable default
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
    } catch (error) {
      console.error('Error calculating next run:', error);
      return null;
    }
  }

  /**
   * Convert human-readable schedule to cron expression
   */
  static humanToCron(schedule: string): string | null {
    const lower = schedule.toLowerCase().trim();

    const patterns: Record<string, string> = {
      'every minute': '* * * * *',
      'every 5 minutes': '*/5 * * * *',
      'every 10 minutes': '*/10 * * * *',
      'every 15 minutes': '*/15 * * * *',
      'every 30 minutes': '*/30 * * * *',
      'every hour': '0 * * * *',
      'every 2 hours': '0 */2 * * *',
      'every 6 hours': '0 */6 * * *',
      'every 12 hours': '0 */12 * * *',
      'daily': '0 0 * * *',
      'daily at midnight': '0 0 * * *',
      'daily at noon': '0 12 * * *',
      'weekly': '0 0 * * 0',
      'monthly': '0 0 1 * *',
      'yearly': '0 0 1 1 *',
    };

    // Check for time patterns like "daily at 2:30 PM"
    const timeMatch = lower.match(/daily at (\d{1,2}):(\d{2})\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      const period = timeMatch[3];

      if (period === 'pm' && hour !== 12) {
        hour += 12;
      } else if (period === 'am' && hour === 12) {
        hour = 0;
      }

      return `${minute} ${hour} * * *`;
    }

    // Check for hourly patterns like "every hour at :15"
    const hourlyMatch = lower.match(/every hour at :(\d{1,2})/);
    if (hourlyMatch) {
      const minute = parseInt(hourlyMatch[1]);
      return `${minute} * * * *`;
    }

    return patterns[lower] || null;
  }

  /**
   * Convert cron expression to human-readable description
   */
  static cronToHuman(expression: string): string {
    try {
      const parts = expression.trim().split(/\s+/);
      
      if (parts.length !== 5) {
        return 'Invalid cron expression';
      }

      const [minute, hour, day, month, dayOfWeek] = parts;

      // Common patterns
      if (expression === '* * * * *') return 'Every minute';
      if (expression === '0 * * * *') return 'Every hour';
      if (expression === '0 0 * * *') return 'Daily at midnight';
      if (expression === '0 12 * * *') return 'Daily at noon';
      if (expression === '0 0 * * 0') return 'Weekly on Sunday';
      if (expression === '0 0 1 * *') return 'Monthly on the 1st';

      // Interval patterns
      if (minute.startsWith('*/')) {
        const interval = minute.substring(2);
        return `Every ${interval} minutes`;
      }

      if (hour.startsWith('*/')) {
        const interval = hour.substring(2);
        return `Every ${interval} hours`;
      }

      // Specific time patterns
      if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        const h = parseInt(hour);
        const m = parseInt(minute);
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        return `Daily at ${time}`;
      }

      if (minute !== '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
        return `Hourly at :${minute.padStart(2, '0')}`;
      }

      return `Custom: ${expression}`;
    } catch (error) {
      return 'Invalid cron expression';
    }
  }

  /**
   * Get predefined cron expressions for common schedules
   */
  static getPresets(): CronExpressionInfo[] {
    const presets = [
      { expression: '*/5 * * * *', description: 'Every 5 minutes' },
      { expression: '*/15 * * * *', description: 'Every 15 minutes' },
      { expression: '*/30 * * * *', description: 'Every 30 minutes' },
      { expression: '0 * * * *', description: 'Every hour' },
      { expression: '0 */2 * * *', description: 'Every 2 hours' },
      { expression: '0 */6 * * *', description: 'Every 6 hours' },
      { expression: '0 0 * * *', description: 'Daily at midnight' },
      { expression: '0 6 * * *', description: 'Daily at 6:00 AM' },
      { expression: '0 12 * * *', description: 'Daily at noon' },
      { expression: '0 18 * * *', description: 'Daily at 6:00 PM' },
      { expression: '0 0 * * 1', description: 'Weekly on Monday' },
      { expression: '0 0 1 * *', description: 'Monthly on the 1st' },
    ];

    return presets.map(preset => ({
      ...preset,
      nextRun: this.getNextRun(preset.expression) || new Date(),
      isValid: cron.validate(preset.expression),
    }));
  }

  /**
   * Calculate the time until next execution
   */
  static getTimeUntilNext(expression: string): string | null {
    const nextRun = this.getNextRun(expression);
    if (!nextRun) return null;

    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();

    if (diff <= 0) return 'Past due';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Less than a minute';
    }
  }
}