'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: string;
  connectionString: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

const DATA_SOURCE_TYPES = [
  { value: 'POSTGRESQL', label: 'PostgreSQL', icon: '🐘' },
  { value: 'MYSQL', label: 'MySQL', icon: '🐬' },
  { value: 'SQLITE', label: 'SQLite', icon: '📄' },
  { value: 'BIGQUERY', label: 'BigQuery', icon: '☁️' },
  { value: 'SNOWFLAKE', label: 'Snowflake', icon: '❄️' },
  { value: 'REDSHIFT', label: 'Redshift', icon: '🔴' },
];

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConnectionString, setShowConnectionString] = useState<{ [key: string]: boolean }>({});
  const [testingConnection, setTestingConnection] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    name: '',
    type: 'POSTGRESQL',
    connectionString: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/datasources');
      if (!response.ok) throw new Error('Failed to fetch data sources');
      const data = await response.json();
      setDataSources(data.dataSources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDataSource = async () => {
    if (!formData.name || !formData.connectionString) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: 'demo-org' // In production, get from user context
        }),
      });

      if (!response.ok) throw new Error('Failed to add data source');

      await fetchDataSources();
      setShowAddForm(false);
      setFormData({ name: '', type: 'POSTGRESQL', connectionString: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteDataSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    try {
      const response = await fetch(`/api/datasources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete data source');
      await fetchDataSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleConnectionString = (id: string) => {
    setShowConnectionString(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskConnectionString = (str: string) => {
    const parts = str.split('@');
    if (parts.length < 2) return '••••••••';
    return parts[0].substring(0, 10) + '••••••••@' + parts[1];
  };

  const testConnection = async (id: string) => {
    setTestingConnection(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await fetch(`/api/datasources/${id}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.connected) {
        alert(`Connection successful! Found ${data.details?.tableCount || 0} tables.`);
      } else {
        alert(`Connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('Failed to test connection');
    } finally {
      setTestingConnection(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
              <p className="text-gray-600 mt-1">Connect and manage your databases</p>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Data Source Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Data Source</CardTitle>
              <CardDescription className="text-gray-800">
                Connect a database to start querying your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Production Database"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="type">Database Type</Label>
                <select
                  id="type"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  {DATA_SOURCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="connectionString">Connection String</Label>
                <Input
                  id="connectionString"
                  type="password"
                  placeholder="postgresql://user:password@host:5432/database"
                  value={formData.connectionString}
                  onChange={(e) => setFormData(prev => ({ ...prev, connectionString: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your connection string is encrypted and stored securely
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddDataSource}>Add Data Source</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', type: 'POSTGRESQL', connectionString: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Sources List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : dataSources.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No data sources configured</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Data Source
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {dataSources.map((dataSource) => {
              const typeInfo = DATA_SOURCE_TYPES.find(t => t.value === dataSource.type);
              return (
                <Card key={dataSource.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{typeInfo?.icon}</span>
                          <span>{dataSource.name}</span>
                        </CardTitle>
                        <CardDescription className="text-gray-800">
                          {typeInfo?.label}
                        </CardDescription>
                      </div>
                      <Badge variant={dataSource.isActive ? "secondary" : "outline"}>
                        {dataSource.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Connection String</p>
                        <button
                          onClick={() => toggleConnectionString(dataSource.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showConnectionString[dataSource.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                        {showConnectionString[dataSource.id] 
                          ? dataSource.connectionString 
                          : maskConnectionString(dataSource.connectionString)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Added {new Date(dataSource.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testConnection(dataSource.id)}
                        disabled={testingConnection[dataSource.id]}
                      >
                        {testingConnection[dataSource.id] ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-1" />
                        )}
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDataSource(dataSource.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
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