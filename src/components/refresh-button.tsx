'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  targetType: 'DASHBOARD' | 'QUERY';
  targetId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showLastRefresh?: boolean;
  className?: string;
}

export const RefreshButton = ({
  onRefresh,
  targetType,
  targetId,
  variant = 'outline',
  size = 'sm',
  showLastRefresh = false,
  className = ''
}: RefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<'success' | 'error' | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshStatus(null);

    try {
      // Call the provided refresh function
      await onRefresh();
      
      // Also call our API for tracking
      const response = await fetch('/api/refresh/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          scheduleId: 'manual'
        }),
      });

      if (response.ok) {
        setRefreshStatus('success');
        setLastRefresh(new Date());
      } else {
        setRefreshStatus('error');
      }
    } catch (error) {
      setRefreshStatus('error');
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setRefreshStatus(null);
      }, 3000);
    }
  };

  const getButtonContent = () => {
    if (isRefreshing) {
      return (
        <>
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          Refreshing...
        </>
      );
    }

    if (refreshStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Refreshed
        </>
      );
    }

    if (refreshStatus === 'error') {
      return (
        <>
          <XCircle className="h-4 w-4 mr-2 text-red-500" />
          Failed
        </>
      );
    }

    return (
      <>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </>
    );
  };

  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={refreshStatus === 'success' ? 'border-green-300' : refreshStatus === 'error' ? 'border-red-300' : ''}
      >
        {getButtonContent()}
      </Button>
      
      {showLastRefresh && lastRefresh && (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {formatLastRefresh(lastRefresh)}
        </Badge>
      )}
    </div>
  );
};