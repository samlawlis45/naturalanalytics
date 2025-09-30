import { NextResponse } from 'next/server';
import { cronService } from '@/lib/cron-service';

export async function GET() {
  try {
    const status = cronService.getStatus();
    const schedules = cronService.getActiveSchedules();
    
    return NextResponse.json({
      ...status,
      detailedSchedules: schedules,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get cron status:', error);
    return NextResponse.json(
      { error: 'Failed to get cron status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await cronService.start();
    
    return NextResponse.json({
      message: 'Cron service started successfully',
      status: cronService.getStatus(),
    });
  } catch (error) {
    console.error('Failed to start cron service:', error);
    return NextResponse.json(
      { error: 'Failed to start cron service' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await cronService.stop();
    
    return NextResponse.json({
      message: 'Cron service stopped successfully',
      status: cronService.getStatus(),
    });
  } catch (error) {
    console.error('Failed to stop cron service:', error);
    return NextResponse.json(
      { error: 'Failed to stop cron service' },
      { status: 500 }
    );
  }
}