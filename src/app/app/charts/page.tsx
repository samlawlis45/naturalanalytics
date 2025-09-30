'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedChartWidget } from '@/components/charts/enhanced-chart-widget';
import { ChartConfig } from '@/components/charts/chart-renderer';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity, 
  TrendingUp,
  Zap,
  Target,
  Filter,
  Palette,
  Sparkles,
  Database,
  RefreshCw
} from 'lucide-react';

// Sample data sets for different chart types
const sampleData = {
  sales: [
    { name: 'Jan', value: 4000, profit: 2400, expenses: 1600 },
    { name: 'Feb', value: 3000, profit: 1398, expenses: 1602 },
    { name: 'Mar', value: 2000, profit: 800, expenses: 1200 },
    { name: 'Apr', value: 2780, profit: 3908, expenses: 872 },
    { name: 'May', value: 1890, profit: 4800, expenses: 1090 },
    { name: 'Jun', value: 2390, profit: 3800, expenses: 590 },
    { name: 'Jul', value: 3490, profit: 4300, expenses: 1190 }
  ],
  
  categories: [
    { name: 'Desktop', value: 35, color: '#0088FE' },
    { name: 'Mobile', value: 45, color: '#00C49F' },
    { name: 'Tablet', value: 20, color: '#FFBB28' }
  ],
  
  correlation: [
    { x: 100, y: 200, name: 'A' },
    { x: 120, y: 100, name: 'B' },
    { x: 170, y: 300, name: 'C' },
    { x: 140, y: 250, name: 'D' },
    { x: 150, y: 400, name: 'E' },
    { x: 110, y: 280, name: 'F' }
  ],
  
  funnel: [
    { name: 'Leads', value: 1000 },
    { name: 'Prospects', value: 800 },
    { name: 'Qualified', value: 600 },
    { name: 'Proposals', value: 400 },
    { name: 'Closed', value: 200 }
  ],
  
  radial: [
    { name: 'Completed', value: 75, fill: '#0088FE' },
    { name: 'In Progress', value: 25, fill: '#00C49F' }
  ],
  
  timeSeries: [
    { date: '2024-01', visitors: 1200, conversions: 120 },
    { date: '2024-02', visitors: 1900, conversions: 190 },
    { date: '2024-03', visitors: 3000, conversions: 300 },
    { date: '2024-04', visitors: 2500, conversions: 280 },
    { date: '2024-05', visitors: 2200, conversions: 250 },
    { date: '2024-06', visitors: 2800, conversions: 320 }
  ]
};

const chartExamples = [
  {
    id: 'bar-basic',
    title: 'Monthly Sales',
    description: 'Basic bar chart showing monthly sales data',
    type: 'bar' as const,
    data: sampleData.sales,
    config: { 
      xKey: 'name', 
      yKey: 'value',
      theme: 'default',
      showDataLabels: true
    }
  },
  {
    id: 'line-trend',
    title: 'Visitor Trends',
    description: 'Line chart showing website visitor trends over time',
    type: 'line' as const,
    data: sampleData.timeSeries,
    config: { 
      xKey: 'date', 
      yKey: 'visitors',
      theme: 'professional',
      strokeWidth: 3,
      yAxisFormat: 'number'
    }
  },
  {
    id: 'area-multi',
    title: 'Multi-Series Analysis',
    description: 'Area chart with multiple data series',
    type: 'area' as const,
    data: sampleData.sales,
    config: { 
      xKey: 'name', 
      yKeys: ['profit', 'expenses'],
      theme: 'colorful',
      fillOpacity: 0.6
    }
  },
  {
    id: 'pie-distribution',
    title: 'Traffic Sources',
    description: 'Pie chart showing traffic distribution by device type',
    type: 'pie' as const,
    data: sampleData.categories,
    config: { 
      dataKey: 'value',
      nameKey: 'name',
      theme: 'minimal',
      innerRadius: 40,
      showDataLabels: true
    }
  },
  {
    id: 'scatter-correlation',
    title: 'Data Correlation',
    description: 'Scatter plot showing correlation between variables',
    type: 'scatter' as const,
    data: sampleData.correlation,
    config: { 
      xKey: 'x', 
      yKey: 'y',
      theme: 'dark'
    }
  },
  {
    id: 'composed-combo',
    title: 'Sales & Profit Combined',
    description: 'Combined chart with bars and line',
    type: 'composed' as const,
    data: sampleData.sales,
    config: { 
      xKey: 'name', 
      yKeys: ['value', 'profit'],
      theme: 'professional'
    }
  },
  {
    id: 'radial-progress',
    title: 'Progress Tracker',
    description: 'Radial bar chart for progress visualization',
    type: 'radial' as const,
    data: sampleData.radial,
    config: { 
      dataKey: 'value',
      theme: 'default'
    }
  },
  {
    id: 'funnel-conversion',
    title: 'Conversion Funnel',
    description: 'Funnel chart showing conversion rates',
    type: 'funnel' as const,
    data: sampleData.funnel,
    config: { 
      dataKey: 'value',
      nameKey: 'name',
      theme: 'colorful'
    }
  },
  {
    id: 'gauge-kpi',
    title: 'Performance KPI',
    description: 'Gauge chart for single metric visualization',
    type: 'gauge' as const,
    data: [],
    config: { 
      value: 85,
      min: 0,
      max: 100,
      theme: 'professional',
      yAxisFormat: 'percentage'
    }
  }
];

const CHART_CATEGORIES = [
  { id: 'all', label: 'All Charts', icon: Sparkles },
  { id: 'basic', label: 'Basic Charts', icon: BarChart3, types: ['bar', 'line', 'area', 'pie'] },
  { id: 'advanced', label: 'Advanced Charts', icon: Target, types: ['scatter', 'composed', 'radial', 'funnel', 'gauge'] },
  { id: 'business', label: 'Business Charts', icon: TrendingUp, types: ['funnel', 'gauge', 'composed'] }
];

export default function ChartsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [chartConfigs, setChartConfigs] = useState<Record<string, ChartConfig>>({});

  const handleConfigChange = (chartId: string, config: ChartConfig) => {
    setChartConfigs(prev => ({
      ...prev,
      [chartId]: config
    }));
  };

  const filteredExamples = chartExamples.filter(example => {
    if (activeCategory === 'all') return true;
    const category = CHART_CATEGORIES.find(cat => cat.id === activeCategory);
    return category?.types?.includes(example.type);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Charts</h1>
              <p className="text-gray-600">
                Explore powerful data visualization with customizable chart types
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Database className="h-4 w-4" />
              <span>{chartExamples.length} Chart Types</span>
            </div>
            <div className="flex items-center space-x-1">
              <Palette className="h-4 w-4" />
              <span>5 Color Themes</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4" />
              <span>Interactive Customization</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            {CHART_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center space-x-1"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Chart Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExamples.map((example) => (
            <div key={example.id} className="h-96">
              <EnhancedChartWidget
                data={example.data}
                title={example.title}
                description={example.description}
                initialConfig={{
                  type: example.type,
                  ...example.config
                }}
                onConfigChange={(config) => handleConfigChange(example.id, config)}
                showControls={true}
                isEditable={true}
                className="h-full"
              />
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Rich Customization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Customize colors, themes, animations, and styling options to match your brand and preferences.
              </p>
              <div className="mt-3 flex space-x-2">
                <Badge variant="outline">5 Themes</Badge>
                <Badge variant="outline">Custom Colors</Badge>
                <Badge variant="outline">Animations</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Multiple Chart Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Choose from 9 different chart types including advanced visualizations like gauges and funnels.
              </p>
              <div className="mt-3 flex space-x-2">
                <Badge variant="outline">Bar & Line</Badge>
                <Badge variant="outline">Pie & Area</Badge>
                <Badge variant="outline">Advanced</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Interactive Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Full-screen mode, export options, real-time configuration, and responsive design for all devices.
              </p>
              <div className="mt-3 flex space-x-2">
                <Badge variant="outline">Export</Badge>
                <Badge variant="outline">Full Screen</Badge>
                <Badge variant="outline">Responsive</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Integration with Natural Analytics
            </CardTitle>
            <CardDescription>
              These advanced charts are automatically available throughout the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Dashboard Builder</h4>
                <p className="text-sm text-gray-600">
                  Use these charts in your custom dashboards with drag-and-drop functionality.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Query Interface</h4>
                <p className="text-sm text-gray-600">
                  Charts are automatically generated from your SQL queries with intelligent type detection.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Sources</h4>
                <p className="text-sm text-gray-600">
                  Connect to any database and visualize your data with these powerful chart types.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Sharing & Export</h4>
                <p className="text-sm text-gray-600">
                  Share your visualizations or export them in multiple formats (PNG, CSV, JSON).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}