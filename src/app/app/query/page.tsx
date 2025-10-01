'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button-modern';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-modern';
import { Send, BarChart3, Database, Clock, CheckCircle, XCircle, Save, Share2, History, Star, StarOff, Trash2, RefreshCw, Sparkles, Play, AlertCircle } from 'lucide-react';
import { ExportMenu } from '@/components/export-menu';
import { EnhancedChartWidget } from '@/components/charts/enhanced-chart-widget';
import { ChartConfig } from '@/components/charts/chart-renderer';
import { RefreshButton } from '@/components/refresh-button';

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

interface QueryHistory {
  id: string;
  naturalQuery: string;
  sqlQuery: string;
  executionTime: number;
  createdAt: string;
  isFavorite: boolean;
  dataSourceId?: string;
  result?: Record<string, unknown>[];
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

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('demo');
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDataSources();
    fetchQueryHistory();
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

  const fetchQueryHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/query/history');
      if (response.ok) {
        const data = await response.json();
        setQueryHistory(data.queries || []);
      }
    } catch (error) {
      console.error('Failed to fetch query history:', error);
    } finally {
      setIsLoadingHistory(false);
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
      
      // Add to history after successful query
      await fetchQueryHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const toggleFavorite = async (historyId: string) => {
    try {
      const response = await fetch(`/api/query/history/${historyId}/favorite`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setQueryHistory(prev => prev.map(q => 
          q.id === historyId ? { ...q, isFavorite: !q.isFavorite } : q
        ));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteFromHistory = async (historyId: string) => {
    if (!confirm('Remove this query from history?')) return;
    
    try {
      const response = await fetch(`/api/query/history/${historyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setQueryHistory(prev => prev.filter(q => q.id !== historyId));
      }
    } catch (error) {
      console.error('Failed to delete query:', error);
    }
  };

  const loadHistoryQuery = (historyQuery: QueryHistory) => {
    setQuery(historyQuery.naturalQuery);
    if (historyQuery.dataSourceId) {
      setSelectedDataSource(historyQuery.dataSourceId);
    }
    setShowHistory(false);
  };

  const clearHistory = async () => {
    if (!confirm('Clear all query history? This cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/query/history', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setQueryHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
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

  const getSmartChartConfig = (data: Record<string, unknown>[], sqlQuery: string): Partial<ChartConfig> => {
    if (!data || data.length === 0) return { type: 'bar' };

    const lowerSql = sqlQuery.toLowerCase();
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    const numericKeys = keys.filter(key => typeof firstRow[key] === 'number');
    
    // Single value metrics
    if (data.length === 1 && numericKeys.length === 1) {
      const value = Number(Object.values(firstRow)[0]);
      return {
        type: 'gauge',
        value,
        min: 0,
        max: value * 1.5,
        yAxisFormat: lowerSql.includes('percent') ? 'percentage' : 'number',
        theme: 'professional'
      };
    }
    
    // Time series detection
    if (keys.some(key => key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.toLowerCase().includes('month'))) {
      return {
        type: 'line',
        theme: 'default',
        strokeWidth: 3,
        yAxisFormat: lowerSql.includes('amount') || lowerSql.includes('price') || lowerSql.includes('cost') ? 'currency' : 'number'
      };
    }
    
    // Proportional data (good for pie charts)
    if (data.length <= 8 && numericKeys.length === 1 && lowerSql.includes('by')) {
      return {
        type: 'pie',
        theme: 'colorful',
        innerRadius: 20,
        showDataLabels: true
      };
    }
    
    // Trend analysis
    if (lowerSql.includes('trend') || lowerSql.includes('over time')) {
      return {
        type: 'area',
        theme: 'professional',
        fillOpacity: 0.3
      };
    }
    
    // Comparison data
    if (lowerSql.includes('compare') || lowerSql.includes('vs') || numericKeys.length > 1) {
      return {
        type: 'composed',
        theme: 'default',
        yKeys: numericKeys.slice(0, 2)
      };
    }
    
    // Default to bar chart
    return {
      type: 'bar',
      theme: 'default',
      showDataLabels: data.length <= 10,
      yAxisFormat: lowerSql.includes('amount') || lowerSql.includes('price') || lowerSql.includes('cost') ? 'currency' : 'number'
    };
  };

  const renderChart = (data: Record<string, unknown>[], sqlQuery: string) => {
    if (!data || data.length === 0) return null;

    // Check if this is a simple table view case
    const shouldShowTable = data.length > 50 || Object.keys(data[0]).length > 6;
    
    if (shouldShowTable) {
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
              {data.slice(0, 100).map((row, index) => (
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
          {data.length > 100 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Showing first 100 rows of {data.length} total rows
            </div>
          )}
        </div>
      );
    }

    const smartConfig = getSmartChartConfig(data, sqlQuery);
    
    return (
      <EnhancedChartWidget
        data={data}
        initialConfig={smartConfig}
        title="Query Results"
        description={`${data.length} rows • Auto-detected: ${smartConfig.type} chart`}
        showControls={true}
        isEditable={true}
        onExport={(format) => {
          if (format === 'csv' || format === 'json') {
            // Use existing export logic from ExportMenu
            console.log(`Exporting as ${format}`);
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Natural Language Query</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Query Your Data</h1>
              <p className="text-slate-600">
                Ask questions in natural language and get instant visualizations
              </p>
              {queryHistory.filter(q => q.isFavorite).length > 0 && (
                <div className="flex items-center space-x-1 mt-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-slate-600">
                    {queryHistory.filter(q => q.isFavorite).length} favorite queries saved
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Query Interface */}
          <div className="lg:col-span-1">
            <Card variant="elevated" size="lg">
              <CardHeader size="lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Query Interface</span>
                </div>
                <CardTitle size="lg">Ask Your Data</CardTitle>
                <CardDescription size="lg">
                  Transform natural language into powerful insights
                </CardDescription>
              </CardHeader>
              <CardContent size="lg" className="space-y-6">
                <div>
                  <label htmlFor="dataSource" className="block text-sm font-medium text-slate-700 mb-2">
                    Data Source
                  </label>
                  <select
                    id="dataSource"
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  <label htmlFor="query" className="block text-sm font-medium text-slate-700 mb-2">
                    Natural Language Query
                  </label>
                  <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show me total sales by month, or What are our top performing products?"
                    className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Ask questions about your data in plain English
                  </p>
                </div>
                
                <Button 
                  onClick={handleQuery} 
                  disabled={isLoading || !query.trim()}
                  variant="brand"
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Processing Query...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Execute Query
                    </>
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex-1"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History ({queryHistory.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={fetchQueryHistory}
                    disabled={isLoadingHistory}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {showHistory ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Query History:</h4>
                      {queryHistory.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearHistory}
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                      ) : queryHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No queries yet</p>
                      ) : (
                        queryHistory.map((historyQuery) => (
                          <div
                            key={historyQuery.id}
                            className="group flex items-start justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                            onClick={() => loadHistoryQuery(historyQuery)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">
                                {historyQuery.naturalQuery}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                <span>{new Date(historyQuery.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{historyQuery.executionTime}ms</span>
                                {historyQuery.isFavorite && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                )}
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(historyQuery.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {historyQuery.isFavorite ? (
                                  <StarOff className="h-3 w-3" />
                                ) : (
                                  <Star className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFromHistory(historyQuery.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
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
                    {queryHistory.filter(q => q.isFavorite).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Favorites:</h4>
                        <div className="space-y-1">
                          {queryHistory
                            .filter(q => q.isFavorite)
                            .slice(0, 3)
                            .map((favoriteQuery) => (
                              <button
                                key={favoriteQuery.id}
                                onClick={() => loadHistoryQuery(favoriteQuery)}
                                className="block w-full text-left text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 p-2 rounded flex items-center"
                              >
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                <span className="truncate">{favoriteQuery.naturalQuery}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                        <RefreshButton
                          onRefresh={async () => {
                            // Re-execute the current query
                            if (query) {
                              await handleQuery();
                            }
                          }}
                          targetType="QUERY"
                          targetId="current-query"
                          showLastRefresh={true}
                        />
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
