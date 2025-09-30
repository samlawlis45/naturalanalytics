'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  Settings,
  Eye,
  Layers,
  RotateCcw
} from 'lucide-react';
import { ChartConfig } from './chart-renderer';

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { value: 'area', label: 'Area Chart', icon: TrendingUp, description: 'Show cumulative data' },
  { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
  { value: 'scatter', label: 'Scatter Plot', icon: Activity, description: 'Show correlation' },
  { value: 'composed', label: 'Combined Chart', icon: Layers, description: 'Mix bars and lines' },
  { value: 'radial', label: 'Radial Bar', icon: Target, description: 'Circular progress' },
  { value: 'funnel', label: 'Funnel Chart', icon: Filter, description: 'Show conversion flow' },
  { value: 'gauge', label: 'Gauge Chart', icon: Zap, description: 'Show single metric' }
];

const THEMES = [
  { value: 'default', label: 'Default', colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'] },
  { value: 'dark', label: 'Dark', colors: ['#8B5CF6', '#06D6A0', '#FFD60A', '#FF006E'] },
  { value: 'colorful', label: 'Colorful', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'] },
  { value: 'minimal', label: 'Minimal', colors: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'] },
  { value: 'professional', label: 'Professional', colors: ['#1E40AF', '#059669', '#DC2626', '#D97706'] }
];

const LEGEND_POSITIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const AXIS_FORMATS = [
  { value: '', label: 'Auto' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' }
];

interface ChartConfigPanelProps {
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
  onReset?: () => void;
  data?: any[];
}

export const ChartConfigPanel = ({ config, onChange, onReset, data = [] }: ChartConfigPanelProps) => {
  const [activeTab, setActiveTab] = useState('type');

  const updateConfig = (updates: Partial<ChartConfig>) => {
    onChange({ ...config, ...updates });
  };

  const getDataKeys = () => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => typeof firstRow[key] === 'number' || key === 'name');
  };

  const getStringKeys = () => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => typeof firstRow[key] === 'string');
  };

  const selectedChartType = CHART_TYPES.find(type => type.value === config.type);

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Chart Configuration
        </CardTitle>
        <CardDescription>
          Customize your chart appearance and behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="type" className="text-xs">Type</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
            <TabsTrigger value="axes" className="text-xs">Axes</TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Chart Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CHART_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={config.type === type.value ? "default" : "outline"}
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center"
                      onClick={() => updateConfig({ type: type.value as any })}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
              {selectedChartType && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedChartType.description}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Chart Title</Label>
              <Input
                placeholder="Enter chart title"
                value={config.title || ''}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">X-Axis Field</Label>
              <Select value={config.xKey || 'name'} onValueChange={(value) => updateConfig({ xKey: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...getStringKeys(), ...getDataKeys()].map((key) => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Y-Axis Field</Label>
              <Select value={config.yKey || 'value'} onValueChange={(value) => updateConfig({ yKey: value, yKeys: [value] })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDataKeys().map((key) => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(config.type === 'pie' || config.type === 'funnel' || config.type === 'radial') && (
              <div>
                <Label className="text-sm font-medium">Data Field</Label>
                <Select value={config.dataKey || 'value'} onValueChange={(value) => updateConfig({ dataKey: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getDataKeys().map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(config.type === 'pie' || config.type === 'funnel') && (
              <div>
                <Label className="text-sm font-medium">Name Field</Label>
                <Select value={config.nameKey || 'name'} onValueChange={(value) => updateConfig({ nameKey: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStringKeys().map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.type === 'gauge' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Current Value</Label>
                  <Input
                    type="number"
                    value={config.value || 0}
                    onChange={(e) => updateConfig({ value: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Min Value</Label>
                  <Input
                    type="number"
                    value={config.min || 0}
                    onChange={(e) => updateConfig({ min: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Value</Label>
                  <Input
                    type="number"
                    value={config.max || 100}
                    onChange={(e) => updateConfig({ max: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Color Theme</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {THEMES.map((theme) => (
                  <Button
                    key={theme.value}
                    variant={config.theme === theme.value ? "default" : "outline"}
                    size="sm"
                    className="justify-start h-auto p-2"
                    onClick={() => updateConfig({ theme: theme.value as any })}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {theme.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-sm">{theme.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Legend</Label>
              <Switch
                checked={config.showLegend ?? true}
                onCheckedChange={(checked) => updateConfig({ showLegend: checked })}
              />
            </div>

            {config.showLegend && (
              <div>
                <Label className="text-sm font-medium">Legend Position</Label>
                <Select 
                  value={config.legendPosition || 'top'} 
                  onValueChange={(value) => updateConfig({ legendPosition: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGEND_POSITIONS.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Data Labels</Label>
              <Switch
                checked={config.showDataLabels ?? false}
                onCheckedChange={(checked) => updateConfig({ showDataLabels: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Animation</Label>
              <Switch
                checked={config.isAnimationActive ?? true}
                onCheckedChange={(checked) => updateConfig({ isAnimationActive: checked })}
              />
            </div>

            {config.isAnimationActive && (
              <div>
                <Label className="text-sm font-medium">Animation Duration (ms)</Label>
                <Slider
                  value={[config.animationDuration || 750]}
                  onValueChange={([value]) => updateConfig({ animationDuration: value })}
                  max={2000}
                  min={100}
                  step={50}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {config.animationDuration || 750}ms
                </div>
              </div>
            )}

            {(config.type === 'line' || config.type === 'area') && (
              <div>
                <Label className="text-sm font-medium">Line Width</Label>
                <Slider
                  value={[config.strokeWidth || 2]}
                  onValueChange={([value]) => updateConfig({ strokeWidth: value })}
                  max={5}
                  min={1}
                  step={0.5}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {config.strokeWidth || 2}px
                </div>
              </div>
            )}

            {(config.type === 'bar' || config.type === 'area') && (
              <div>
                <Label className="text-sm font-medium">Fill Opacity</Label>
                <Slider
                  value={[config.fillOpacity || 0.8]}
                  onValueChange={([value]) => updateConfig({ fillOpacity: value })}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((config.fillOpacity || 0.8) * 100)}%
                </div>
              </div>
            )}

            {config.type === 'pie' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Inner Radius</Label>
                  <Slider
                    value={[config.innerRadius || 0]}
                    onValueChange={([value]) => updateConfig({ innerRadius: value })}
                    max={60}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {config.innerRadius || 0}px
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Outer Radius</Label>
                  <Slider
                    value={[config.outerRadius || 80]}
                    onValueChange={([value]) => updateConfig({ outerRadius: value })}
                    max={120}
                    min={40}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {config.outerRadius || 80}px
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="axes" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show X-Axis</Label>
              <Switch
                checked={config.showXAxis ?? true}
                onCheckedChange={(checked) => updateConfig({ showXAxis: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Y-Axis</Label>
              <Switch
                checked={config.showYAxis ?? true}
                onCheckedChange={(checked) => updateConfig({ showYAxis: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Grid</Label>
              <Switch
                checked={config.showGrid ?? true}
                onCheckedChange={(checked) => updateConfig({ showGrid: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Tooltip</Label>
              <Switch
                checked={config.showTooltip ?? true}
                onCheckedChange={(checked) => updateConfig({ showTooltip: checked })}
              />
            </div>

            {config.showXAxis && (
              <div>
                <Label className="text-sm font-medium">X-Axis Label</Label>
                <Input
                  placeholder="X-Axis Label"
                  value={config.xAxisLabel || ''}
                  onChange={(e) => updateConfig({ xAxisLabel: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}

            {config.showYAxis && (
              <div>
                <Label className="text-sm font-medium">Y-Axis Label</Label>
                <Input
                  placeholder="Y-Axis Label"
                  value={config.yAxisLabel || ''}
                  onChange={(e) => updateConfig({ yAxisLabel: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Y-Axis Format</Label>
              <Select 
                value={config.yAxisFormat || ''} 
                onValueChange={(value) => updateConfig({ yAxisFormat: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AXIS_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.showXAxis && (
              <div>
                <Label className="text-sm font-medium">X-Axis Angle</Label>
                <Slider
                  value={[config.xAxisAngle || 0]}
                  onValueChange={([value]) => updateConfig({ xAxisAngle: value })}
                  max={90}
                  min={-90}
                  step={15}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {config.xAxisAngle || 0}°
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {onReset && (
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};