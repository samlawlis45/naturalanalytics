import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card-modern';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: {
    card: 'border-slate-200',
    icon: 'text-slate-600 bg-slate-100',
    value: 'text-slate-900',
    title: 'text-slate-600',
  },
  success: {
    card: 'border-emerald-200 bg-emerald-50/30',
    icon: 'text-emerald-600 bg-emerald-100',
    value: 'text-emerald-900',
    title: 'text-emerald-700',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50/30',
    icon: 'text-amber-600 bg-amber-100',
    value: 'text-amber-900',
    title: 'text-amber-700',
  },
  error: {
    card: 'border-red-200 bg-red-50/30',
    icon: 'text-red-600 bg-red-100',
    value: 'text-red-900',
    title: 'text-red-700',
  },
  info: {
    card: 'border-blue-200 bg-blue-50/30',
    icon: 'text-blue-600 bg-blue-100',
    value: 'text-blue-900',
    title: 'text-blue-700',
  },
};

const sizeStyles = {
  sm: {
    card: 'p-4',
    icon: 'h-8 w-8 p-1.5',
    value: 'text-xl font-bold',
    title: 'text-xs font-medium uppercase tracking-wide',
    change: 'text-xs',
  },
  md: {
    card: 'p-6',
    icon: 'h-10 w-10 p-2',
    value: 'text-2xl font-bold',
    title: 'text-sm font-medium uppercase tracking-wide',
    change: 'text-sm',
  },
  lg: {
    card: 'p-8',
    icon: 'h-12 w-12 p-2.5',
    value: 'text-3xl font-bold',
    title: 'text-base font-medium uppercase tracking-wide',
    change: 'text-base',
  },
};

export function MetricCard({
  title,
  value,
  change,
  icon,
  description,
  variant = 'default',
  size = 'md',
  className,
}: MetricCardProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'neutral':
        return (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-slate-500';
    }
  };

  return (
    <Card 
      variant="elevated" 
      size={size}
      className={cn(
        'transition-all duration-200 hover:scale-[1.02]',
        variantStyle.card,
        className
      )}
    >
      <CardHeader size={size}>
        <div className="flex items-center justify-between">
          <CardTitle 
            size="sm" 
            className={cn(sizeStyle.title, variantStyle.title)}
          >
            {title}
          </CardTitle>
          {icon && (
            <div className={cn(
              'rounded-lg flex items-center justify-center',
              sizeStyle.icon,
              variantStyle.icon
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent size={size}>
        <div className="space-y-1">
          <div className={cn(sizeStyle.value, variantStyle.value)}>
            {formatValue(value)}
          </div>
          
          {(change || description) && (
            <div className="flex items-center justify-between">
              {change && (
                <div className={cn(
                  'flex items-center space-x-1',
                  sizeStyle.change,
                  getTrendColor(change.trend)
                )}>
                  {getTrendIcon(change.trend)}
                  <span className="font-medium">
                    {Math.abs(change.value)}%
                  </span>
                  <span className="text-slate-500">
                    {change.period}
                  </span>
                </div>
              )}
              
              {description && (
                <span className={cn(
                  'text-slate-600',
                  sizeStyle.change
                )}>
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}