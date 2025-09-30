'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, BarChart3, Database, Clock, CheckCircle, XCircle, Save, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ExportMenu } from '@/components/export-menu';

interface QueryResult {
  sqlQuery: string;
  result: Record<string, unknown>[];
  executionTime: number;
  status: string;
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

const SAMPLE_QUERIES = [
  "Show me total sales by month",
  "How many customers do we have?",
  "What are our top selling products?",
  "Show me sales by country",
  "What's the average order value?",
  "Show me pending orders"
];

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DemoPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('demo');
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/datasources');
      if (response.ok) {
        const data = await response.json();
        setDataSources(data.dataSources || []);
      }
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          dataSourceId: selectedDataSource === 'demo' ? undefined : selectedDataSource 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const saveDashboard = async () => {
    if (!result) return;

    setIsSaving(true);
    try {
      const dashboardConfig = {
        query,
        sqlQuery: result.sqlQuery,
        chartType: determineChartType(result.result, result.sqlQuery),
        data: result.result
      };

      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Dashboard - ${new Date().toLocaleString()}`,
          description: `Query: ${query}`,
          config: dashboardConfig,
          isPublic: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save dashboard');
      }

      alert('Dashboard saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  const determineChartType = (data: Record<string, unknown>[], sqlQuery: string) => {
    const lowerSql = sqlQuery.toLowerCase();
    if (!data || data.length === 0) return 'none';
    
    if (lowerSql.includes('count') || lowerSql.includes('sum') || lowerSql.includes('total')) {
      if (data.length === 1) return 'single-value';
      return 'bar-chart';
    }
    
    if (lowerSql.includes('by') && data.length > 1) {
      return 'line-chart';
    }
    
    return 'table';
  };

  const renderChart = (data: Record<string, unknown>[], sqlQuery: string) => {
    if (!data || data.length === 0) return null;

    const lowerSql = sqlQuery.toLowerCase();
    
    // Determine chart type based on query content
    if (lowerSql.includes('count') || lowerSql.includes('sum') || lowerSql.includes('total')) {
      if (data.length === 1 && data[0].count) {
        // Single number result
        const aggregateValue = String(
          (data[0] as Record<string, unknown>).count ??
          (data[0] as Record<string, unknown>).total_amount ??
          (data[0] as Record<string, unknown>).total ??
          ''
        );
        return (
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {aggregateValue}
            </div>
            <div className="text-gray-600">Total Count</div>
          </div>
        );
      }
      
      if (data.length > 1) {
        // Bar chart for multiple categories
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }

    if (lowerSql.includes('by') && data.length > 1) {
      // Line chart for time series or grouped data
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default table view
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
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
              <span className="text-2xl font-bold text-gray-900">NaturalAnalytics Demo</span>
            </div>
            <Badge variant="secondary">Demo Mode</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Query Interface */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Ask Your Data</span>
                </CardTitle>
                <CardDescription className="text-gray-800">
                  Try natural language queries on our sample e-commerce database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Source
                  </label>
                  <select
                    id="dataSource"
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="demo">Demo Database</option>
                    {dataSources.filter(ds => ds.isActive).map(ds => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show me total sales by month"
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <Button 
                  onClick={handleQuery} 
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Execute Query
                    </>
                  )}
                </Button>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Queries:</h4>
                  <div className="space-y-1">
                    {SAMPLE_QUERIES.map((sampleQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleSampleQuery(sampleQuery)}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                      >
                        {sampleQuery}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="mt-2 text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Query Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span>Query Results</span>
                        </CardTitle>
                        <CardDescription>
                          Execution time: {result.executionTime}ms
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={saveDashboard}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <ExportMenu 
                          data={result.result} 
                          filename={`query-${new Date().toISOString().split('T')[0]}`}
                          chartRef={chartRef}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-3 rounded-md">
                      <code className="text-sm text-gray-800">{result.sqlQuery}</code>
                    </div>
                  </CardContent>
                </Card>

                {/* Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Visualization</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRef}>
                      {renderChart(result.result, result.sqlQuery)}
                    </div>
                  </CardContent>
                </Card>

                {/* Raw Data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Data</CardTitle>
                    <CardDescription>
                      {result.result.length} row{result.result.length !== 1 ? 's' : ''} returned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}

            {!result && !error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Enter a query to see results</p>
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
