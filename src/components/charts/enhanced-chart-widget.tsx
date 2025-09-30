'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartRenderer, ChartConfig } from './chart-renderer';
import { ChartConfigPanel } from './chart-config-panel';
import { 
  Settings, 
  Download, 
  Maximize, 
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedChartWidgetProps {
  data: any[];
  initialConfig?: Partial<ChartConfig>;
  title?: string;
  description?: string;
  onConfigChange?: (config: ChartConfig) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
  showControls?: boolean;
  isEditable?: boolean;
  className?: string;
}

const defaultConfig: ChartConfig = {
  type: 'bar',
  data: [],
  xKey: 'name',
  yKey: 'value',
  yKeys: ['value'],
  theme: 'default',
  showXAxis: true,
  showYAxis: true,
  showGrid: true,
  showTooltip: true,
  showLegend: true,
  legendPosition: 'top',
  showDataLabels: false,
  strokeWidth: 2,
  fillOpacity: 0.8,
  isAnimationActive: true,
  animationDuration: 750,
  innerRadius: 0,
  outerRadius: 80,
  min: 0,
  max: 100,
  value: 0
};

const detectChartType = (data: any[]): ChartConfig['type'] => {
  if (!data || data.length === 0) return 'bar';
  
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const numericKeys = keys.filter(key => typeof firstRow[key] === 'number');
  
  // Single value
  if (data.length === 1 && numericKeys.length === 1) {
    return 'gauge';
  }
  
  // Time series data
  if (keys.some(key => key.toLowerCase().includes('date') || key.toLowerCase().includes('time'))) {
    return 'line';
  }
  
  // Small number of categories - good for pie
  if (data.length <= 8 && numericKeys.length === 1) {
    return 'pie';
  }
  
  // Default to bar
  return 'bar';
};

const getDataSummary = (data: any[]) => {
  if (!data || data.length === 0) return { rows: 0, columns: 0, types: [] };
  
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const types = keys.map(key => ({
    key,
    type: typeof firstRow[key],
    sample: firstRow[key]
  }));
  
  return {
    rows: data.length,
    columns: keys.length,
    types
  };
};

export const EnhancedChartWidget = ({
  data,
  initialConfig = {},
  title,
  description,
  onConfigChange,
  onDelete,
  onDuplicate,
  onExport,
  showControls = true,
  isEditable = true,
  className = ''
}: EnhancedChartWidgetProps) => {
  const [config, setConfig] = useState<ChartConfig>(() => ({
    ...defaultConfig,
    type: detectChartType(data),
    data,
    ...initialConfig
  }));
  
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dataSummary = getDataSummary(data);

  useEffect(() => {
    const newConfig = {
      ...config,
      data
    };
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  }, [data]);

  const handleConfigChange = (newConfig: ChartConfig) => {
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleResetConfig = () => {
    const resetConfig = {
      ...defaultConfig,
      type: detectChartType(data),
      data
    };
    setConfig(resetConfig);
    if (onConfigChange) {
      onConfigChange(resetConfig);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExport = (format: 'png' | 'svg' | 'csv' | 'json') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export behavior
      if (format === 'json') {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chart-data.${format}`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
          ].join('\n');
          
          const dataBlob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `chart-data.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    }
  };

  const cardClassName = `${className} ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''} transition-all duration-300`;

  return (
    <div className={cardClassName}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {title || config.title || 'Chart Visualization'}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {config.type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {dataSummary.rows} rows
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {dataSummary.columns} columns
                </Badge>
              </div>
            </div>
            
            {showControls && (
              <div className="flex items-center space-x-1">
                {isEditable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfigPanel(!showConfigPanel)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="h-8 w-8 p-0"
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('png')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                    {onDuplicate && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDuplicate}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <div className="flex h-full">
            <div className={`flex-1 p-6 ${showConfigPanel ? 'pr-0' : ''}`}>
              {data && data.length > 0 ? (
                <ChartRenderer config={config} />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No data available</p>
                    <p className="text-sm mt-1">Connect a data source to view charts</p>
                  </div>
                </div>
              )}
            </div>
            
            {showConfigPanel && isEditable && (
              <div className="border-l border-gray-200 bg-gray-50">
                <ChartConfigPanel
                  config={config}
                  onChange={handleConfigChange}
                  onReset={handleResetConfig}
                  data={data}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};