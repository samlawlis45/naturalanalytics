'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button-modern';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-modern';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Database, 
  Zap,
  TrendingUp,
  Users,
  Clock,
  Plus,
  Activity,
  ArrowUpRight,
  Sparkles
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-white rounded-xl shadow-lg mb-6">
            <BarChart3 className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Loading your analytics</h2>
          <p className="text-slate-600">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                Welcome back, {session?.user?.name || 'User'}!
              </h1>
              <p className="text-slate-600">
                Track your analytics performance and discover insights from your data
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/app/query">
                <Button variant="brand" size="lg" leftIcon={<Plus className="h-5 w-5" />}>
                  New Query
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Queries"
            value={stats?.overview.totalQueries || 0}
            icon={<Activity className="h-5 w-5" />}
            variant="info"
            change={stats?.activity.queriesThisWeek > 0 ? {
              value: Math.round(((stats.activity.queriesThisWeek - stats.activity.queriesLastWeek) / Math.max(stats.activity.queriesLastWeek, 1)) * 100),
              period: "this week",
              trend: stats.activity.queriesThisWeek > stats.activity.queriesLastWeek ? 'up' : 'down'
            } : undefined}
          />

          <MetricCard
            title="Data Sources"
            value={stats?.overview.totalDataSources || 0}
            icon={<Database className="h-5 w-5" />}
            variant="success"
            description={stats?.trends.topDataSources.length > 0 ? `${stats.trends.topDataSources[0].name} most used` : undefined}
          />

          <MetricCard
            title="Dashboards"
            value={stats?.overview.totalDashboards || 0}
            icon={<BarChart3 className="h-5 w-5" />}
            variant="default"
            change={stats?.activity.dashboardsThisMonth > 0 ? {
              value: stats.activity.dashboardsThisMonth,
              period: "this month",
              trend: 'up'
            } : undefined}
          />

          <MetricCard
            title="Growth Rate"
            value={`${stats?.overview.weekOverWeekGrowth >= 0 ? '+' : ''}${stats?.overview.weekOverWeekGrowth.toFixed(1) || '0'}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant={stats?.overview.weekOverWeekGrowth >= 0 ? 'success' : 'warning'}
            description="vs last week"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card variant="elevated" size="lg">
            <CardHeader size="lg">
              <div className="flex items-center space-x-2 mb-1">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Quick Actions</span>
              </div>
              <CardTitle size="lg">Jump into your workflow</CardTitle>
              <CardDescription size="lg">
                Start exploring your data with these powerful tools
              </CardDescription>
            </CardHeader>
            <CardContent size="lg" className="space-y-3">
              <Link href="/app/query" className="block">
                <Card variant="interactive" size="sm" className="group">
                  <CardContent size="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Zap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Ask a Question</h3>
                          <p className="text-sm text-slate-600">Query your data using natural language</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/app/builder" className="block">
                <Card variant="interactive" size="sm" className="group">
                  <CardContent size="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Build a Dashboard</h3>
                          <p className="text-sm text-slate-600">Create visualizations with drag & drop</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/app/datasources" className="block">
                <Card variant="interactive" size="sm" className="group">
                  <CardContent size="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                          <Database className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Connect Data</h3>
                          <p className="text-sm text-slate-600">Add a new data source</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card variant="elevated" size="lg">
            <CardHeader size="lg">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Activity</span>
              </div>
              <CardTitle size="lg">Recent Queries</CardTitle>
              <CardDescription size="lg">
                Your latest data explorations and insights
              </CardDescription>
            </CardHeader>
            <CardContent size="lg">
              <div className="space-y-3">
                {stats?.activity.recentQueries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-slate-100 rounded-xl mb-4 w-fit mx-auto">
                      <Activity className="h-8 w-8 text-slate-400 mx-auto" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">No queries yet</h3>
                    <p className="text-sm text-slate-600 mb-4">Start by asking a question about your data</p>
                    <Link href="/app/query">
                      <Button variant="secondary" size="sm">Ask Your First Question</Button>
                    </Link>
                  </div>
                ) : (
                  stats?.activity.recentQueries.map((query) => (
                    <Card key={query.id} variant="outlined" size="sm" className="hover:border-slate-300 transition-colors">
                      <CardContent size="sm">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {query.naturalQuery}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                              <span>
                                {new Date(query.createdAt).toLocaleDateString()} at{' '}
                                {new Date(query.createdAt).toLocaleTimeString()}
                              </span>
                              <div className="flex items-center space-x-1">
                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                <span>{query.executionTime}ms</span>
                              </div>
                            </div>
                            {query.sqlQuery && (
                              <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 p-2 rounded border truncate">
                                {query.sqlQuery}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              {stats?.activity.recentQueries.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <Link href="/app/query">
                    <Button variant="outline" className="w-full">
                      View All Queries
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        {stats && stats.overview.totalQueries > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card variant="elevated" size="lg">
              <CardHeader size="lg">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Performance</span>
                </div>
                <CardTitle size="lg">Query Metrics</CardTitle>
                <CardDescription size="lg">
                  Monitor your query execution performance
                </CardDescription>
              </CardHeader>
              <CardContent size="lg">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <MetricCard
                    title="Average Time"
                    value={`${stats.performance.avgExecutionTime}ms`}
                    variant="info"
                    size="sm"
                  />
                  <MetricCard
                    title="Fastest Query"
                    value={`${stats.performance.fastestQuery}ms`}
                    variant="success"
                    size="sm"
                  />
                </div>
                <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total execution time</span>
                    <span className="font-medium">{(stats.performance.totalExecutionTime / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slowest query</span>
                    <span className="font-medium text-amber-600">{stats.performance.slowestQuery}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" size="lg">
              <CardHeader size="lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Data Sources</span>
                </div>
                <CardTitle size="lg">Usage Statistics</CardTitle>
                <CardDescription size="lg">
                  Most frequently queried data sources
                </CardDescription>
              </CardHeader>
              <CardContent size="lg">
                {stats.trends.topDataSources.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-slate-100 rounded-xl mb-4 w-fit mx-auto">
                      <Database className="h-8 w-8 text-slate-400 mx-auto" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">No data sources connected</h3>
                    <p className="text-sm text-slate-600 mb-4">Connect your first data source to see usage statistics</p>
                    <Link href="/app/datasources">
                      <Button variant="secondary" size="sm">Connect Data Source</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.trends.topDataSources.map((source, index) => (
                      <div key={source.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-emerald-500' :
                            index === 2 ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <div>
                            <p className="font-medium text-slate-900">{source.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">{source.type}</Badge>
                              <span className="text-xs text-slate-500">{source.count} queries</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-900">{source.count}</div>
                          <div className="text-xs text-slate-500">queries</div>
                        </div>
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
          <Card variant="elevated" size="lg" className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader size="lg">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Getting Started</span>
              </div>
              <CardTitle size="lg" className="text-slate-900">Complete your setup</CardTitle>
              <CardDescription size="lg">
                Follow these steps to unlock the full potential of Natural Analytics
              </CardDescription>
            </CardHeader>
            <CardContent size="lg">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {stats.overview.totalDataSources === 0 ? 'Connect your first data source' : 'Add more data sources'}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      {stats.overview.totalDataSources === 0 
                        ? 'Link your database to start analyzing your data with natural language queries'
                        : 'Connect additional databases for richer insights and comprehensive analysis'
                      }
                    </p>
                    <Link href="/app/datasources">
                      <Button variant="primary" size="sm" leftIcon={<Database className="h-4 w-4" />}>
                        {stats.overview.totalDataSources === 0 ? 'Connect Now' : 'Add More'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {stats.overview.totalQueries === 0 ? 'Ask your first question' : 'Explore more data'}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      {stats.overview.totalQueries === 0 
                        ? 'Try our natural language querying to get insights from your data instantly'
                        : 'Ask complex questions and discover deeper insights from your connected data'
                      }
                    </p>
                    <Link href="/app/query">
                      <Button variant="primary" size="sm" leftIcon={<Zap className="h-4 w-4" />}>
                        {stats.overview.totalQueries === 0 ? 'Ask Question' : 'Explore More'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {stats.overview.totalDashboards === 0 ? 'Create your first dashboard' : 'Build advanced dashboards'}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      {stats.overview.totalDashboards === 0 
                        ? 'Save and organize your visualizations into powerful, shareable dashboards'
                        : 'Create sophisticated multi-widget dashboards for comprehensive data views'
                      }
                    </p>
                    <Link href="/app/builder">
                      <Button variant="primary" size="sm" leftIcon={<BarChart3 className="h-4 w-4" />}>
                        {stats.overview.totalDashboards === 0 ? 'Create Dashboard' : 'Build More'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}