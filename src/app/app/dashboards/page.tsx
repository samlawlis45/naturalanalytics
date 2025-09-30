'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareDialog } from '@/components/share-dialog';
import { 
  BarChart3, 
  Calendar,
  Lock,
  Globe,
  Trash2,
  Eye,
  Loader2,
  Plus,
  Edit3,
  Copy,
  Share2,
  Filter,
  Search,
  Layout,
  Grid3X3,
  List,
  Star,
  StarOff,
  Download,
  Settings
} from 'lucide-react';

interface Widget {
  id: string;
  type: 'query' | 'text' | 'chart' | 'metric' | 'image';
  title: string;
  content?: string;
  query?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'number';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  config: {
    // Legacy format
    query?: string;
    sqlQuery?: string;
    chartType?: string;
    data?: Record<string, unknown>[];
    // New format
    widgets?: Widget[];
    layout?: 'grid' | 'freeform';
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationId: string | null;
  isFavorite?: boolean;
}

export default function DashboardsPage() {
  const { data: session } = useSession();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchDashboards();
    fetchCurrentUserId();
  }, []);

  const fetchCurrentUserId = async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
      }
    }
  };

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

  const handleDuplicate = async (dashboard: Dashboard) => {
    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${dashboard.name} (Copy)`,
          description: dashboard.description,
          config: dashboard.config,
          isPublic: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate dashboard');
      await fetchDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    // TODO: Implement favorites API
    const updatedDashboards = dashboards.map(d => 
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
    );
    setDashboards(updatedDashboards);
  };

  const handleShare = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setShareDialogOpen(true);
  };

  const getChartIcon = (dashboard: Dashboard) => {
    // Check if it's a new widget-based dashboard
    if (dashboard.config.widgets && dashboard.config.widgets.length > 0) {
      return Layout;
    }
    // Legacy dashboard
    switch (dashboard.config.chartType) {
      case 'bar-chart':
      case 'line-chart':
        return BarChart3;
      default:
        return BarChart3;
    }
  };

  const getDashboardType = (dashboard: Dashboard) => {
    return dashboard.config.widgets ? 'Dashboard' : 'Query';
  };

  const getWidgetCount = (dashboard: Dashboard) => {
    return dashboard.config.widgets ? dashboard.config.widgets.length : 1;
  };

  const filteredDashboards = dashboards
    .filter(dashboard => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return dashboard.name.toLowerCase().includes(searchLower) ||
               dashboard.description?.toLowerCase().includes(searchLower) ||
               dashboard.config.query?.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .filter(dashboard => {
      switch (filterType) {
        case 'public': return dashboard.isPublic;
        case 'private': return !dashboard.isPublic;
        case 'favorites': return dashboard.isFavorite;
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboards</h1>
              <p className="text-gray-600 mt-1">Manage and organize your saved visualizations</p>
            </div>
            <div className="flex gap-2">
              <Link href="/app/query">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Quick Query
                </Button>
              </Link>
              <Link href="/app/builder">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Build Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search dashboards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dashboards</option>
                <option value="favorites">Favorites</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="name">Name</option>
              </select>
              
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center text-sm text-gray-600">
            <span>{filteredDashboards.length} dashboard{filteredDashboards.length !== 1 ? 's' : ''}</span>
            {searchTerm && (
              <span className="ml-2">
                • Filtered by "{searchTerm}"
              </span>
            )}
          </div>
        </div>
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
                <div className="flex gap-2 justify-center">
                  <Link href="/app/query">
                    <Button variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Quick Query
                    </Button>
                  </Link>
                  <Link href="/app/builder">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Build Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredDashboards.map((dashboard) => {
              const ChartIcon = getChartIcon(dashboard);
              
              if (viewMode === 'list') {
                return (
                  <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ChartIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 truncate">{dashboard.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {getDashboardType(dashboard)}
                              </Badge>
                              {dashboard.isFavorite && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>{getWidgetCount(dashboard)} widget{getWidgetCount(dashboard) !== 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span>Updated {new Date(dashboard.updatedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <Badge variant={dashboard.isPublic ? "secondary" : "outline"} className="text-xs">
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
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(dashboard.id)}
                          >
                            {dashboard.isFavorite ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(dashboard)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(dashboard)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Link href={`/app/builder?edit=${dashboard.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/${dashboard.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(dashboard.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              return (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <ChartIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <CardTitle className="truncate">{dashboard.name}</CardTitle>
                          {dashboard.isFavorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                        {dashboard.description && (
                          <CardDescription className="text-gray-800 line-clamp-2 mt-1">
                            {dashboard.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getDashboardType(dashboard)}
                          </Badge>
                          <Badge variant={dashboard.isPublic ? "secondary" : "outline"} className="text-xs">
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
                      </div>
                      
                      {/* Quick Actions - Show on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(dashboard.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {dashboard.isFavorite ? (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(dashboard);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Content Preview */}
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {dashboard.config.widgets ? (
                        <>
                          <p className="font-medium text-gray-700 mb-1">
                            {getWidgetCount(dashboard)} Widget{getWidgetCount(dashboard) !== 1 ? 's' : ''}:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {dashboard.config.widgets.slice(0, 3).map((widget, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {widget.type}
                              </Badge>
                            ))}
                            {dashboard.config.widgets.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{dashboard.config.widgets.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700 mb-1">Query:</p>
                          <p className="text-gray-600 line-clamp-2">{dashboard.config.query}</p>
                        </>
                      )}
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
                      <Link href={`/app/builder?edit=${dashboard.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(dashboard)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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

      {/* Share Dialog */}
      {selectedDashboard && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setSelectedDashboard(null);
          }}
          dashboardId={selectedDashboard.id}
          dashboardName={selectedDashboard.name}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}