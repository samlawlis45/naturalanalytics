'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Calendar,
  Lock,
  Globe,
  Trash2,
  Eye,
  Loader2,
  Plus
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  config: {
    query: string;
    sqlQuery: string;
    chartType: string;
    data: Record<string, unknown>[];
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationId: string | null;
}

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const response = await fetch('/api/dashboards');
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/auth/signin';
          return;
        }
        throw new Error('Failed to fetch dashboards');
      }
      const data = await response.json();
      setDashboards(data.dashboards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      const response = await fetch(`/api/dashboards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete dashboard');
      await fetchDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar-chart':
      case 'line-chart':
        return BarChart3;
      default:
        return BarChart3;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">My Dashboards</span>
            </div>
            <Link href="/demo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : dashboards.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No dashboards created yet</p>
                <Link href="/demo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((dashboard) => {
              const ChartIcon = getChartIcon(dashboard.config.chartType);
              return (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <ChartIcon className="h-5 w-5 text-blue-600" />
                          <span className="truncate">{dashboard.name}</span>
                        </CardTitle>
                        {dashboard.description && (
                          <CardDescription className="text-gray-800 line-clamp-2">
                            {dashboard.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={dashboard.isPublic ? "secondary" : "outline"}>
                        {dashboard.isPublic ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium text-gray-700 mb-1">Query:</p>
                      <p className="text-gray-600 line-clamp-2">{dashboard.config.query}</p>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/${dashboard.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(dashboard.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}