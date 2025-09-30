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
  totalQueries: number;
  dataSources: number;
  dashboards: number;
  recentQueries: Array<{
    id: string;
    naturalQuery: string;
    createdAt: string;
  }>;
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
      // TODO: Create API endpoint for dashboard stats
      // For now, using mock data
      setStats({
        totalQueries: 127,
        dataSources: 3,
        dashboards: 8,
        recentQueries: [
          { id: '1', naturalQuery: 'Show me sales by region this month', createdAt: '2024-01-20T10:30:00Z' },
          { id: '2', naturalQuery: 'How many new customers did we get?', createdAt: '2024-01-20T09:15:00Z' },
          { id: '3', naturalQuery: 'Top performing products by revenue', createdAt: '2024-01-19T16:45:00Z' },
        ]
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalQueries}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.dataSources}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.dashboards}</p>
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
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">+23%</p>
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
                {stats?.recentQueries.map((query) => (
                  <div key={query.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="p-1 bg-gray-100 rounded">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {query.naturalQuery}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(query.createdAt).toLocaleDateString()} at{' '}
                        {new Date(query.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
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

        {/* Getting Started Section - Show only if user has minimal data */}
        {stats && stats.totalQueries < 5 && (
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
                    <h4 className="font-medium">Connect your first data source</h4>
                    <p className="text-sm text-gray-600">Link your database to start analyzing your data</p>
                  </div>
                  <Link href="/app/datasources">
                    <Button variant="outline" size="sm">Connect</Button>
                  </Link>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">2</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">Ask your first question</h4>
                    <p className="text-sm text-gray-600">Try querying your data using natural language</p>
                  </div>
                  <Link href="/app/query">
                    <Button variant="outline" size="sm">Try Now</Button>
                  </Link>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">3</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">Create a dashboard</h4>
                    <p className="text-sm text-gray-600">Save and organize your visualizations</p>
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