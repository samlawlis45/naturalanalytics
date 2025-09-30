'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Database, 
  Group, 
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Play,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface QueryBuilder {
  table: string;
  metrics: string[];
  dimensions: string[];
  filters: Array<{ field: string; operator: string; value: string }>;
  groupBy: string[];
  timeRange: string;
}

const AVAILABLE_TABLES = [
  { id: 'customers', name: 'Customers', icon: Users },
  { id: 'products', name: 'Products', icon: ShoppingCart },
  { id: 'orders', name: 'Orders', icon: DollarSign },
  { id: 'sales', name: 'Sales', icon: TrendingUp },
];

const AVAILABLE_METRICS = [
  { id: 'count', name: 'Count', type: 'number' },
  { id: 'sum_total_amount', name: 'Total Amount', type: 'currency' },
  { id: 'avg_total_amount', name: 'Average Amount', type: 'currency' },
  { id: 'max_total_amount', name: 'Max Amount', type: 'currency' },
  { id: 'min_total_amount', name: 'Min Amount', type: 'currency' },
];

const AVAILABLE_DIMENSIONS = [
  { id: 'country', name: 'Country', type: 'string' },
  { id: 'city', name: 'City', type: 'string' },
  { id: 'category', name: 'Category', type: 'string' },
  { id: 'status', name: 'Status', type: 'string' },
  { id: 'order_date', name: 'Order Date', type: 'date' },
  { id: 'created_at', name: 'Created At', type: 'date' },
];

const TIME_RANGES = [
  { id: 'last_7_days', name: 'Last 7 Days' },
  { id: 'last_30_days', name: 'Last 30 Days' },
  { id: 'last_90_days', name: 'Last 90 Days' },
  { id: 'last_year', name: 'Last Year' },
  { id: 'all_time', name: 'All Time' },
];

export default function BuilderPage() {
  const [queryBuilder, setQueryBuilder] = useState<QueryBuilder>({
    table: 'orders',
    metrics: [],
    dimensions: [],
    filters: [],
    groupBy: [],
    timeRange: 'last_30_days',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[]>([]);

  const addMetric = (metric: string) => {
    setQueryBuilder(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric) 
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  const addDimension = (dimension: string) => {
    setQueryBuilder(prev => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimension)
        ? prev.dimensions.filter(d => d !== dimension)
        : [...prev.dimensions, dimension]
    }));
  };

  // const addGroupBy = (dimension: string) => {
  //   setQueryBuilder(prev => ({
  //     ...prev,
  //     groupBy: prev.groupBy.includes(dimension)
  //       ? prev.groupBy.filter(d => d !== dimension)
  //       : [...prev.groupBy, dimension]
  //   }));
  // };

  const generateQuery = () => {
    setIsGenerating(true);
    
    // Simulate query generation
    setTimeout(() => {
      const { table, metrics, groupBy, timeRange } = queryBuilder;
      
      let sql = 'SELECT ';
      
      if (metrics.length === 0) {
        sql += '*';
      } else {
        const metricClauses = metrics.map(metric => {
          const metricData = AVAILABLE_METRICS.find(m => m.id === metric);
          if (metric === 'count') return 'COUNT(*) as count';
          if (metricData) {
            const field = metricData.id.replace('_total_amount', '');
            return `${field.toUpperCase()}(total_amount) as ${metricData.id}`;
          }
          return metric;
        });
        sql += metricClauses.join(', ');
      }
      
      sql += ` FROM ${table}`;
      
      if (groupBy.length > 0) {
        sql += ` GROUP BY ${groupBy.join(', ')}`;
      }
      
      if (timeRange !== 'all_time') {
        sql += ` WHERE created_at >= NOW() - INTERVAL '${timeRange.replace('last_', '').replace('_days', ' days').replace('_year', ' year')}'`;
      }
      
      sql += ' ORDER BY ';
      if (metrics.includes('sum_total_amount')) {
        sql += 'sum_total_amount DESC';
      } else if (groupBy.length > 0) {
        sql += groupBy[0];
      } else {
        sql += 'id';
      }
      
      setGeneratedQuery(sql);
      
      // Generate mock results
      const mockResults = generateMockResults(table);
      setQueryResult(mockResults);
      
      setIsGenerating(false);
    }, 1000);
  };

  const generateMockResults = (table: string) => {
    if (table === 'customers') {
      return [
        { country: 'USA', count: 150, sum_total_amount: 45000 },
        { country: 'Canada', count: 75, sum_total_amount: 22500 },
        { country: 'UK', count: 50, sum_total_amount: 15000 },
        { country: 'Germany', count: 30, sum_total_amount: 9000 },
      ];
    }
    
    if (table === 'products') {
      return [
        { category: 'Electronics', count: 200, sum_total_amount: 120000 },
        { category: 'Books', count: 150, sum_total_amount: 4500 },
        { category: 'Clothing', count: 100, sum_total_amount: 15000 },
      ];
    }
    
    if (table === 'orders') {
      return [
        { status: 'completed', count: 300, sum_total_amount: 90000 },
        { status: 'pending', count: 50, sum_total_amount: 15000 },
        { status: 'cancelled', count: 25, sum_total_amount: 7500 },
      ];
    }
    
    return [
      { month: '2024-01', count: 100, sum_total_amount: 30000 },
      { month: '2024-02', count: 120, sum_total_amount: 36000 },
      { month: '2024-03', count: 150, sum_total_amount: 45000 },
    ];
  };

  const renderChart = () => {
    if (queryResult.length === 0) return null;

    const data = queryResult;
    const hasTimeData = data.some(d => d.month || d.order_date);
    const hasGroupData = data.some(d => d.country || d.category || d.status);

    if (hasTimeData) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sum_total_amount" stroke="#0088FE" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (hasGroupData) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={Object.keys(data[0]).find(key => key !== 'count' && key !== 'sum_total_amount')} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sum_total_amount" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {String(data[0]?.count || data[0]?.sum_total_amount || 'N/A')}
        </div>
        <div className="text-gray-600">Total</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Visual Query Builder</span>
            </div>
            <Badge variant="secondary">Beta</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Query Builder */}
          <div className="lg:col-span-1 space-y-6">
            {/* Table Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Source</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_TABLES.map((table) => {
                    const Icon = table.icon;
                    return (
                      <button
                        key={table.id}
                        onClick={() => setQueryBuilder(prev => ({ ...prev, table: table.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          queryBuilder.table === table.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-2" />
                        <div className="text-sm font-medium">{table.name}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Metrics</span>
                </CardTitle>
                <CardDescription className="text-gray-800">What do you want to measure?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {AVAILABLE_METRICS.map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => addMetric(metric.id)}
                      className={`w-full p-2 rounded text-left transition-colors ${
                        queryBuilder.metrics.includes(metric.id)
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {metric.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Group className="h-5 w-5" />
                  <span>Dimensions</span>
                </CardTitle>
                <CardDescription className="text-gray-800">How do you want to group the data?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {AVAILABLE_DIMENSIONS.map((dimension) => (
                    <button
                      key={dimension.id}
                      onClick={() => addDimension(dimension.id)}
                      className={`w-full p-2 rounded text-left transition-colors ${
                        queryBuilder.dimensions.includes(dimension.id)
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {dimension.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Range */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Time Range</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setQueryBuilder(prev => ({ ...prev, timeRange: range.id }))}
                      className={`w-full p-2 rounded text-left transition-colors ${
                        queryBuilder.timeRange === range.id
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={generateQuery} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Query
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generated SQL */}
            {generatedQuery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Generated SQL</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <code className="text-sm text-gray-800">{generatedQuery}</code>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visualization */}
            {queryResult.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Visualization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChart()}
                </CardContent>
              </Card>
            )}

            {/* Raw Data */}
            {queryResult.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Raw Data</CardTitle>
                  <CardDescription>
                    {queryResult.length} row{queryResult.length !== 1 ? 's' : ''} returned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(queryResult[0]).map((key) => (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {queryResult.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof value === 'number' ? value.toLocaleString() : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {!generatedQuery && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Configure your query and click &quot;Generate Query&quot; to see results</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
