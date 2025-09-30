'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Database, 
  Zap,
  TrendingUp,
  Users,
  Clock,
  Plus,
  Activity
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalQueries: number;
    totalDashboards: number;
    totalDataSources: number;
    weekOverWeekGrowth: number;
    avgExecutionTime: number;
  };
  activity: {
    queriesThisWeek: number;
    queriesLastWeek: number;
    dashboardsThisMonth: number;
    recentQueries: Array<{
      id: string;
      naturalQuery: string;
      executionTime: number;
      createdAt: string;
      sqlQuery?: string;
    }>;
  };
  trends: {
    daily: Array<{
      date: string;
      day: string;
      count: number;
    }>;
    topDataSources: Array<{
      name: string;
      type: string;
      count: number;
    }>;
  };
  performance: {
    avgExecutionTime: number;
    fastestQuery: number;
    slowestQuery: number;
    totalExecutionTime: number;
  };
}

export default function AppDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback to empty stats if API fails
      setStats({
        overview: {
          totalQueries: 0,
          totalDashboards: 0,
          totalDataSources: 0,
          weekOverWeekGrowth: 0,
          avgExecutionTime: 0
        },
        activity: {
          queriesThisWeek: 0,
          queriesLastWeek: 0,
          dashboardsThisMonth: 0,
          recentQueries: []
        },
        trends: {
          daily: [],
          topDataSources: []
        },
        performance: {
          avgExecutionTime: 0,
          fastestQuery: 0,
          slowestQuery: 0,
          totalExecutionTime: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {session?.user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here&apos;s what&apos;s happening with your analytics
              </p>
            </div>
            <Link href="/app/query">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Query
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalQueries || 0}</p>
                  {stats?.activity.queriesThisWeek > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      +{stats.activity.queriesThisWeek} this week
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Data Sources</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalDataSources || 0}</p>
                  {stats?.trends.topDataSources.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.trends.topDataSources[0].name} most used
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dashboards</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalDashboards || 0}</p>
                  {stats?.activity.dashboardsThisMonth > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      +{stats.activity.dashboardsThisMonth} this month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Growth</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.overview.weekOverWeekGrowth >= 0 ? '+' : ''}
                    {stats?.overview.weekOverWeekGrowth.toFixed(1) || '0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">vs last week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription className="text-gray-800">
                Get started with these common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/app/query" className="block">
                <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Zap className="h-8 w-8 text-blue-600 mr-4" />
                  <div>
                    <h3 className="font-medium">Ask a Question</h3>
                    <p className="text-sm text-gray-600">Query your data using natural language</p>
                  </div>
                </div>
              </Link>

              <Link href="/app/builder" className="block">
                <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="h-8 w-8 text-purple-600 mr-4" />
                  <div>
                    <h3 className="font-medium">Build a Dashboard</h3>
                    <p className="text-sm text-gray-600">Create visualizations with drag & drop</p>
                  </div>
                </div>
              </Link>

              <Link href="/app/datasources" className="block">
                <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Database className="h-8 w-8 text-green-600 mr-4" />
                  <div>
                    <h3 className="font-medium">Connect Data</h3>
                    <p className="text-sm text-gray-600">Add a new data source</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Queries
              </CardTitle>
              <CardDescription className="text-gray-800">
                Your latest data explorations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.activity.recentQueries.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No queries yet</p>
                    <p className="text-xs text-gray-400">Start by asking a question about your data</p>
                  </div>
                ) : (
                  stats?.activity.recentQueries.map((query) => (
                    <div key={query.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-1 bg-gray-100 rounded">
                        <Activity className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {query.naturalQuery}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>
                            {new Date(query.createdAt).toLocaleDateString()} at{' '}
                            {new Date(query.createdAt).toLocaleTimeString()}
                          </span>
                          <span>•</span>
                          <span>{query.executionTime}ms</span>
                        </div>
                        {query.sqlQuery && (
                          <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                            {query.sqlQuery}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/app/query">
                  <Button variant="outline" className="w-full">
                    View All Queries
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        {stats && stats.overview.totalQueries > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Query Performance
                </CardTitle>
                <CardDescription className="text-gray-800">
                  Your query execution metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.performance.avgExecutionTime}ms</p>
                    <p className="text-sm text-gray-600">Average Time</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.performance.fastestQuery}ms</p>
                    <p className="text-sm text-gray-600">Fastest Query</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Total execution time: {(stats.performance.totalExecutionTime / 1000).toFixed(1)}s</p>
                  <p>Slowest query: {stats.performance.slowestQuery}ms</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data Source Usage
                </CardTitle>
                <CardDescription className="text-gray-800">
                  Most frequently queried sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.trends.topDataSources.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No data source usage yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.trends.topDataSources.map((source, index) => (
                      <div key={source.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium">{source.name}</span>
                          <Badge variant="outline" className="text-xs">{source.type}</Badge>
                        </div>
                        <span className="text-sm text-gray-600">{source.count} queries</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Getting Started Section - Show only if user has minimal data */}
        {stats && stats.overview.totalQueries < 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Getting Started
              </CardTitle>
              <CardDescription className="text-gray-800">
                Complete these steps to get the most out of Natural Analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">1</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {stats.overview.totalDataSources === 0 ? 'Connect your first data source' : 'Add more data sources'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.overview.totalDataSources === 0 
                        ? 'Link your database to start analyzing your data'
                        : 'Connect additional databases for richer insights'
                      }
                    </p>
                  </div>
                  <Link href="/app/datasources">
                    <Button variant="outline" size="sm">Connect</Button>
                  </Link>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">2</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {stats.overview.totalQueries === 0 ? 'Ask your first question' : 'Explore more data'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.overview.totalQueries === 0 
                        ? 'Try querying your data using natural language'
                        : 'Ask complex questions to discover insights'
                      }
                    </p>
                  </div>
                  <Link href="/app/query">
                    <Button variant="outline" size="sm">Try Now</Button>
                  </Link>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">3</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {stats.overview.totalDashboards === 0 ? 'Create a dashboard' : 'Build advanced dashboards'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.overview.totalDashboards === 0 
                        ? 'Save and organize your visualizations'
                        : 'Create multi-widget dashboards for comprehensive views'
                      }
                    </p>
                  </div>
                  <Link href="/app/builder">
                    <Button variant="outline" size="sm">Build</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}