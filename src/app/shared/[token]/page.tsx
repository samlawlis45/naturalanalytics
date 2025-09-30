'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  Calendar, 
  User, 
  Lock,
  Share2,
  MessageSquare,
  AlertCircle,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  allowComments: boolean;
  allowExport: boolean;
  user: {
    name: string;
    image: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function SharedDashboardPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/shared/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Dashboard not found or no longer available');
        } else if (response.status === 403) {
          setError('This dashboard is private or the link has expired');
        } else {
          setError('Failed to load dashboard');
        }
        return;
      }

      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!dashboard?.allowExport) return;
    
    try {
      // Implementation would depend on your export functionality
      // This is a placeholder for the export logic
      alert('Export functionality would be implemented here');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to NaturalAnalytics
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Dashboard not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{dashboard.name}</h1>
                {dashboard.description && (
                  <p className="text-sm text-gray-500">{dashboard.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                Public View
              </Badge>
              {dashboard.allowExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open NaturalAnalytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={dashboard.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboard.user.name)}&background=3b82f6&color=fff`}
                alt={dashboard.user.name}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900">Created by {dashboard.user.name}</p>
                <p className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(dashboard.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {dashboard.allowComments && (
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Comments enabled
                </div>
              )}
              {dashboard.allowExport && (
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Export enabled
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Content</h3>
            <p className="text-gray-600 mb-6">
              This is where the actual dashboard content would be rendered based on the dashboard configuration.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600 mb-2">Dashboard Configuration:</p>
              <pre className="text-xs text-gray-800 overflow-auto">
                {JSON.stringify(dashboard.config, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {dashboard.allowComments && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments
            </h3>
            <div className="text-center py-8">
              <p className="text-gray-500">
                Comments functionality would be implemented here. Users could leave feedback and discuss the dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <Lock className="h-4 w-4 mr-1" />
              Shared securely with NaturalAnalytics
            </div>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              Create your own dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}