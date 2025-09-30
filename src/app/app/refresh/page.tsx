'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Calendar,
  CheckCircle,
  XCircle,
  BarChart3,
  Database,
  AlertCircle,
  Timer,
  RefreshCw,
  Activity,
  Zap,
  Settings,
  History,
  Target
} from 'lucide-react';

interface RefreshSchedule {
  id: string;
  name: string;
  description?: string;
  targetType: 'DASHBOARD' | 'QUERY';
  targetId: string;
  targetName: string;
  scheduleType: 'MANUAL' | 'INTERVAL' | 'CRON' | 'REALTIME';
  interval?: number;
  cronExpression?: string;
  timezone: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  errorCount: number;
  lastError?: string;
  executions: RefreshExecution[];
  _count: {
    executions: number;
  };
}

interface RefreshExecution {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  recordsAffected?: number;
  errorMessage?: string;
}

interface Dashboard {
  id: string;
  name: string;
}

interface Query {
  id: string;
  naturalQuery: string;
}

export default function RefreshPage() {
  const [schedules, setSchedules] = useState<RefreshSchedule[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RefreshSchedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetType: 'DASHBOARD' as 'DASHBOARD' | 'QUERY',
    targetId: '',
    scheduleType: 'MANUAL' as 'MANUAL' | 'INTERVAL' | 'CRON' | 'REALTIME',
    interval: 60,
    cronExpression: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    Promise.all([
      fetchSchedules(),
      fetchDashboards(),
      fetchQueries()
    ]);
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/refresh/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboards = async () => {
    try {
      const response = await fetch('/api/dashboards');
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboards:', err);
    }
  };

  const fetchQueries = async () => {
    try {
      const response = await fetch('/api/query/history');
      if (response.ok) {
        const data = await response.json();
        setQueries(data.queries || []);
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await fetch('/api/refresh/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create schedule');
      }

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        targetType: 'DASHBOARD',
        targetId: '',
        scheduleType: 'MANUAL',
        interval: 60,
        cronExpression: '',
        timezone: 'UTC'
      });
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    }
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/refresh/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update schedule');
      
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/refresh/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    }
  };

  const handleManualRefresh = async (schedule: RefreshSchedule) => {
    try {
      const response = await fetch('/api/refresh/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: schedule.targetType,
          targetId: schedule.targetId,
          scheduleId: schedule.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute refresh');
      }

      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute refresh');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RUNNING': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'QUEUED': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScheduleTypeLabel = (type: string) => {
    switch (type) {
      case 'MANUAL': return 'Manual';
      case 'INTERVAL': return 'Interval';
      case 'CRON': return 'Cron';
      case 'REALTIME': return 'Real-time';
      default: return type;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatNextRun = (nextRunAt?: string) => {
    if (!nextRunAt) return 'N/A';
    const date = new Date(nextRunAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    return `in ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Refresh</h1>
                <p className="text-gray-600">Manage automatic data refresh schedules</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Timer className="h-4 w-4 text-blue-500 mr-2" />
                  <div className="text-2xl font-bold">{schedules.length}</div>
                </div>
                <p className="text-xs text-muted-foreground">Total Schedules</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {schedules.filter(s => s.isActive).length}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Active Schedules</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {schedules.reduce((sum, s) => sum + s.runCount, 0)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Total Executions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {schedules.reduce((sum, s) => sum + s.errorCount, 0)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Total Errors</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Schedule Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Refresh Schedule</CardTitle>
              <CardDescription>
                Set up automatic data refresh for your dashboards or queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Dashboard Refresh"
                  />
                </div>
                <div>
                  <Label htmlFor="targetType">Target Type</Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value: 'DASHBOARD' | 'QUERY') => 
                      setFormData({ ...formData, targetType: value, targetId: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DASHBOARD">
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </div>
                      </SelectItem>
                      <SelectItem value="QUERY">
                        <div className="flex items-center">
                          <Database className="h-4 w-4 mr-2" />
                          Query
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">
                    {formData.targetType === 'DASHBOARD' ? 'Dashboard' : 'Query'}
                  </Label>
                  <Select
                    value={formData.targetId}
                    onValueChange={(value) => setFormData({ ...formData, targetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.targetType === 'DASHBOARD' 
                        ? dashboards.map((dashboard) => (
                            <SelectItem key={dashboard.id} value={dashboard.id}>
                              {dashboard.name}
                            </SelectItem>
                          ))
                        : queries.map((query) => (
                            <SelectItem key={query.id} value={query.id}>
                              {query.naturalQuery}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduleType">Schedule Type</Label>
                  <Select
                    value={formData.scheduleType}
                    onValueChange={(value: any) => setFormData({ ...formData, scheduleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual Only</SelectItem>
                      <SelectItem value="INTERVAL">Every X Minutes</SelectItem>
                      <SelectItem value="CRON">Cron Expression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.scheduleType === 'INTERVAL' && (
                <div>
                  <Label htmlFor="interval">Interval (minutes)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 60 })}
                  />
                </div>
              )}

              {formData.scheduleType === 'CRON' && (
                <div>
                  <Label htmlFor="cronExpression">Cron Expression</Label>
                  <Input
                    id="cronExpression"
                    value={formData.cronExpression}
                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                    placeholder="0 */6 * * *"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Example: "0 */6 * * *" runs every 6 hours
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this schedule does..."
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreateSchedule}>
                  Create Schedule
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p>Loading schedules...</p>
                </div>
              </CardContent>
            </Card>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Timer className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No refresh schedules created yet</p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {schedule.targetType === 'DASHBOARD' ? (
                          <BarChart3 className="h-4 w-4" />
                        ) : (
                          <Database className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{schedule.name}</CardTitle>
                        <CardDescription>
                          {schedule.targetType}: {schedule.targetName}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={schedule.isActive ? "default" : "secondary"}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {getScheduleTypeLabel(schedule.scheduleType)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Schedule</p>
                      <p className="text-sm">
                        {schedule.scheduleType === 'INTERVAL' && schedule.interval
                          ? `Every ${schedule.interval} minutes`
                          : schedule.scheduleType === 'CRON' && schedule.cronExpression
                          ? schedule.cronExpression
                          : 'Manual only'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Next Run</p>
                      <p className="text-sm">{formatNextRun(schedule.nextRunAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-sm">
                        {schedule.runCount > 0 
                          ? `${Math.round(((schedule.runCount - schedule.errorCount) / schedule.runCount) * 100)}%`
                          : 'N/A'
                        } ({schedule.runCount} runs)
                      </p>
                    </div>
                  </div>

                  {schedule.executions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Recent Executions</p>
                      <div className="space-y-2">
                        {schedule.executions.slice(0, 3).map((execution) => (
                          <div key={execution.id} className="flex items-center space-x-3 text-sm">
                            {getStatusIcon(execution.status)}
                            <span className="flex-1">
                              {new Date(execution.startedAt).toLocaleString()}
                            </span>
                            <span className="text-gray-500">
                              {formatDuration(execution.duration)}
                            </span>
                            {execution.recordsAffected !== undefined && (
                              <span className="text-gray-500">
                                {execution.recordsAffected} records
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleManualRefresh(schedule)}
                      className="flex items-center"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleSchedule(schedule.id, schedule.isActive)}
                    >
                      {schedule.isActive ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedSchedule(schedule)}
                    >
                      <History className="h-3 w-3 mr-1" />
                      History
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}