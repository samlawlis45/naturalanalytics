'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Layout,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Hash,
  Type,
  Image as ImageIcon,
  Grid3X3,
  Maximize2,
  Settings,
  Eye,
  Copy,
  TrendingUp,
  Layers,
  Target,
  Filter,
  Zap
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Widget {
  id: string;
  type: 'query' | 'text' | 'chart' | 'metric' | 'image';
  title: string;
  content?: string;
  query?: string;
  chartType?: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'composed' | 'radial' | 'funnel' | 'gauge';
  dataSourceId?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config?: Record<string, unknown>;
}

interface Dashboard {
  id?: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: 'grid' | 'freeform';
  isPublic: boolean;
}

const WIDGET_TYPES = [
  { type: 'query', label: 'Query Widget', icon: BarChart3, description: 'Add a data query with visualization' },
  { type: 'text', label: 'Text Widget', icon: Type, description: 'Add text, markdown, or rich content' },
  { type: 'metric', label: 'Metric Widget', icon: Hash, description: 'Display a single number or KPI' },
  { type: 'chart', label: 'Chart Widget', icon: LineChart, description: 'Custom chart with your data' },
  { type: 'image', label: 'Image Widget', icon: ImageIcon, description: 'Add images or logos' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { value: 'area', label: 'Area Chart', icon: TrendingUp, description: 'Show cumulative data' },
  { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
  { value: 'scatter', label: 'Scatter Plot', icon: Activity, description: 'Show correlation' },
  { value: 'composed', label: 'Combined Chart', icon: Layers, description: 'Mix bars and lines' },
  { value: 'radial', label: 'Radial Bar', icon: Target, description: 'Circular progress' },
  { value: 'funnel', label: 'Funnel Chart', icon: Filter, description: 'Show conversion flow' },
  { value: 'gauge', label: 'Gauge Chart', icon: Zap, description: 'Show single metric' }
];

export default function DashboardBuilder() {
  const [dashboard, setDashboard] = useState<Dashboard>({
    name: 'Untitled Dashboard',
    description: '',
    widgets: [],
    layout: 'grid',
    isPublic: false,
  });
  
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: generateId(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      position: {
        x: 0,
        y: 0,
        width: type === 'metric' ? 1 : 2,
        height: type === 'text' ? 1 : 2,
      },
    };

    if (type === 'query') {
      newWidget.query = '';
      newWidget.chartType = 'bar';
    } else if (type === 'text') {
      newWidget.content = 'Enter your text here...';
    } else if (type === 'metric') {
      newWidget.content = '0';
      newWidget.query = '';
    }

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
    setSelectedWidget(newWidget.id);
    setShowWidgetPanel(false);
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === id ? { ...widget, ...updates } : widget
      ),
    }));
  };

  const deleteWidget = (id: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== id),
    }));
    if (selectedWidget === id) {
      setSelectedWidget(null);
    }
  };

  const duplicateWidget = (id: string) => {
    const widget = dashboard.widgets.find(w => w.id === id);
    if (widget) {
      const newWidget = {
        ...widget,
        id: generateId(),
        title: `${widget.title} (Copy)`,
        position: {
          ...widget.position,
          x: widget.position.x + 1,
          y: widget.position.y + 1,
        },
      };
      setDashboard(prev => ({
        ...prev,
        widgets: [...prev.widgets, newWidget],
      }));
    }
  };

  const saveDashboard = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dashboard.name,
          description: dashboard.description,
          config: {
            widgets: dashboard.widgets,
            layout: dashboard.layout,
          },
          isPublic: dashboard.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save dashboard');
      }

      alert('Dashboard saved successfully!');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      alert('Failed to save dashboard. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewDashboard = () => {
    // TODO: Open preview in new tab or modal
    alert('Preview functionality coming soon!');
  };

  const selectedWidgetData = selectedWidget 
    ? dashboard.widgets.find(w => w.id === selectedWidget)
    : null;

  const onDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    setDashboard(prev => {
      const newWidgets = Array.from(prev.widgets);
      const [reorderedWidget] = newWidgets.splice(source.index, 1);
      newWidgets.splice(destination.index, 0, reorderedWidget);

      return {
        ...prev,
        widgets: newWidgets,
      };
    });
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Layout className="h-6 w-6 text-blue-600" />
              <div>
                {isEditing ? (
                  <Input
                    value={dashboard.name}
                    onChange={(e) => setDashboard(prev => ({ ...prev, name: e.target.value }))}
                    className="text-xl font-semibold"
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                  />
                ) : (
                  <h1 
                    className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => setIsEditing(true)}
                  >
                    {dashboard.name}
                  </h1>
                )}
                <p className="text-sm text-gray-600">
                  {dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={previewDashboard}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                onClick={saveDashboard}
                disabled={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Widget Palette */}
          {showWidgetPanel && (
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Widgets</CardTitle>
                  <CardDescription>
                    Drag or click to add widgets to your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {WIDGET_TYPES.map((widgetType) => {
                    const Icon = widgetType.icon;
                    return (
                      <div
                        key={widgetType.type}
                        onClick={() => addWidget(widgetType.type as Widget['type'])}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <Icon className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-sm">{widgetType.label}</div>
                          <div className="text-xs text-gray-500">{widgetType.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard Canvas */}
          <div className={showWidgetPanel ? 'col-span-6' : 'col-span-9'}>
            <Card className="min-h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Grid3X3 className="h-5 w-5 mr-2" />
                      Dashboard Canvas
                    </CardTitle>
                    <CardDescription>
                      {dashboard.layout === 'grid' ? 'Grid Layout' : 'Freeform Layout'}
                    </CardDescription>
                  </div>
                  <Badge variant={dashboard.isPublic ? 'default' : 'secondary'}>
                    {dashboard.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {dashboard.widgets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <Layout className="h-16 w-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Start building your dashboard</h3>
                    <p className="text-center max-w-md">
                      Add widgets from the panel on the left to create visualizations, display metrics, or add content to your dashboard.
                    </p>
                    <Button
                      onClick={() => setShowWidgetPanel(true)}
                      className="mt-4"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Widget
                    </Button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="dashboard-widgets">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="grid grid-cols-4 gap-4 min-h-96"
                        >
                          {dashboard.widgets.map((widget, index) => (
                            <Draggable key={widget.id} draggableId={widget.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`
                                    col-span-${widget.position.width} 
                                    row-span-${widget.position.height}
                                    ${selectedWidget === widget.id ? 'ring-2 ring-blue-500' : ''}
                                    ${snapshot.isDragging ? 'opacity-75' : ''}
                                  `}
                                >
                                  <Card 
                                    className="h-full cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => setSelectedWidget(widget.id)}
                                  >
                                    <CardHeader 
                                      {...provided.dragHandleProps}
                                      className="pb-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm truncate">
                                          {widget.title}
                                        </CardTitle>
                                        <div className="flex items-center space-x-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              duplicateWidget(widget.id);
                                            }}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteWidget(widget.id);
                                            }}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                      {widget.type === 'query' && (
                                        <div className="text-center p-4">
                                          <BarChart3 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                          <p className="text-xs text-gray-500">
                                            {widget.query || 'No query set'}
                                          </p>
                                        </div>
                                      )}
                                      {widget.type === 'text' && (
                                        <div className="text-sm text-gray-700">
                                          {widget.content || 'Empty text widget'}
                                        </div>
                                      )}
                                      {widget.type === 'metric' && (
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-blue-600">
                                            {widget.content || '0'}
                                          </div>
                                          <div className="text-xs text-gray-500">Metric Value</div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Widget Configuration Panel */}
          <div className="col-span-3">
            {selectedWidgetData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Widget Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the selected widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="widget-title">Widget Title</Label>
                    <Input
                      id="widget-title"
                      value={selectedWidgetData.title}
                      onChange={(e) => updateWidget(selectedWidget!, { title: e.target.value })}
                    />
                  </div>

                  {selectedWidgetData.type === 'query' && (
                    <>
                      <div>
                        <Label htmlFor="widget-query">Query</Label>
                        <textarea
                          id="widget-query"
                          value={selectedWidgetData.query || ''}
                          onChange={(e) => updateWidget(selectedWidget!, { query: e.target.value })}
                          placeholder="Enter your natural language query..."
                          className="w-full h-20 p-2 border rounded-md resize-none"
                        />
                      </div>
                      <div>
                        <Label>Chart Type</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2 max-h-64 overflow-y-auto">
                          {CHART_TYPES.map((chartType) => {
                            const Icon = chartType.icon;
                            return (
                              <button
                                key={chartType.value}
                                onClick={() => updateWidget(selectedWidget!, { chartType: chartType.value as any })}
                                className={`flex items-start p-3 border rounded text-sm ${
                                  selectedWidgetData.chartType === chartType.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <Icon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="text-left">
                                  <div className="font-medium">{chartType.label}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{chartType.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedWidgetData.type === 'text' && (
                    <div>
                      <Label htmlFor="widget-content">Content</Label>
                      <textarea
                        id="widget-content"
                        value={selectedWidgetData.content || ''}
                        onChange={(e) => updateWidget(selectedWidget!, { content: e.target.value })}
                        placeholder="Enter your text content..."
                        className="w-full h-32 p-2 border rounded-md resize-none"
                      />
                    </div>
                  )}

                  {selectedWidgetData.type === 'metric' && (
                    <>
                      <div>
                        <Label htmlFor="metric-query">Query for Metric</Label>
                        <textarea
                          id="metric-query"
                          value={selectedWidgetData.query || ''}
                          onChange={(e) => updateWidget(selectedWidget!, { query: e.target.value })}
                          placeholder="Query that returns a single number..."
                          className="w-full h-16 p-2 border rounded-md resize-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="metric-value">Display Value</Label>
                        <Input
                          id="metric-value"
                          value={selectedWidgetData.content || ''}
                          onChange={(e) => updateWidget(selectedWidget!, { content: e.target.value })}
                          placeholder="e.g., 1,234 or $50,000"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Widget Size</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Width</Label>
                        <select
                          value={selectedWidgetData.position.width}
                          onChange={(e) => updateWidget(selectedWidget!, {
                            position: { ...selectedWidgetData.position, width: parseInt(e.target.value) }
                          })}
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value={1}>1 Column</option>
                          <option value={2}>2 Columns</option>
                          <option value={3}>3 Columns</option>
                          <option value={4}>4 Columns</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <select
                          value={selectedWidgetData.position.height}
                          onChange={(e) => updateWidget(selectedWidget!, {
                            position: { ...selectedWidgetData.position, height: parseInt(e.target.value) }
                          })}
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value={1}>1 Row</option>
                          <option value={2}>2 Rows</option>
                          <option value={3}>3 Rows</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateWidget(selectedWidget!)}
                      className="w-full mb-2"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate Widget
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWidget(selectedWidget!)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Widget
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Maximize2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a widget to configure its settings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
