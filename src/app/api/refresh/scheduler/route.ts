import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RefreshService } from '@/lib/refresh-service';

// This endpoint is called by a cron job or scheduler service
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal call (in production, use API key or other auth)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SCHEDULER_TOKEN || 'dev-scheduler-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active schedules that need to run
    const schedulesToRun = await RefreshService.getActiveSchedules();

    const results = [];

    for (const schedule of schedulesToRun) {
      try {
        // Create execution record
        const execution = await prisma.refreshExecution.create({
          data: {
            scheduleId: schedule.id,
            status: 'RUNNING',
          },
        });

        const startTime = Date.now();

        // Execute the refresh using the service
        const result = await RefreshService.executeSchedule(schedule.id);

        const duration = Date.now() - startTime;

        // Update execution with result
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

        results.push({
          scheduleId: schedule.id,
          status: result.success ? 'success' : 'error',
          duration,
          recordsAffected: result.recordsAffected,
          error: result.error,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Service handles all error logging internally

        results.push({
          scheduleId: schedule.id,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      schedulesProcessed: schedulesToRun.length,
      results,
    });

  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

