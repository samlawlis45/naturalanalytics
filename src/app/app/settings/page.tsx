'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  Database,
  Download,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Copy,
  Plus,
  Calendar,
  Activity
} from 'lucide-react';

interface UserSettings {
  notifications: {
    email: {
      queryCompleted: boolean;
      dashboardShared: boolean;
      weeklyDigest: boolean;
    };
    push: {
      queryCompleted: boolean;
      dashboardShared: boolean;
    };
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    showLineNumbers: boolean;
  };
  privacy: {
    allowAnalytics: boolean;
    shareUsageData: boolean;
    publicProfile: boolean;
  };
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    lastUsedAt: string | null;
    createdAt: string;
  }>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: {
        queryCompleted: true,
        dashboardShared: true,
        weeklyDigest: false,
      },
      push: {
        queryCompleted: false,
        dashboardShared: false,
      },
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      showLineNumbers: true,
    },
    privacy: {
      allowAnalytics: true,
      shareUsageData: false,
      publicProfile: false,
    },
    apiKeys: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  
  // API Key management
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newApiKeyName }),
      });

      if (!response.ok) throw new Error('Failed to generate API key');
      
      const data = await response.json();
      setGeneratedApiKey(data.key);
      
      // Refresh settings to get the new key in the list
      await fetchSettings();
      setNewApiKeyName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate API key');
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/user/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API key');
      
      await fetchSettings();
      setSuccess('API key deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/user/export');
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `natural-analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your data.')) return;
    
    const confirmText = prompt('Type "DELETE" to confirm account deletion');
    if (confirmText !== 'DELETE') return;

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete account');
      
      // Sign out and redirect
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccess('API key copied to clipboard');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                <button onClick={clearMessages} className="text-red-400 hover:text-red-600">
                  ×
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>{success}</span>
                </div>
                <button onClick={clearMessages} className="text-green-400 hover:text-green-600">
                  ×
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <SettingsIcon className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Natural Analytics looks for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div>
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, theme: value as any }
                        }))}
                        className={`p-4 border rounded-lg transition-all ${
                          settings.appearance.theme === value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">Use smaller spacing and font sizes</p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, compactMode: checked }
                    }))}
                  />
                </div>

                {/* Show Line Numbers */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show SQL Line Numbers</Label>
                    <p className="text-sm text-gray-500">Display line numbers in SQL query results</p>
                  </div>
                  <Switch
                    checked={settings.appearance.showLineNumbers}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, showLineNumbers: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what updates you receive via email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Query Completed</Label>
                      <p className="text-sm text-gray-500">Get notified when long-running queries finish</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.email.queryCompleted}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: { ...prev.notifications.email, queryCompleted: checked }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Dashboard Shared</Label>
                      <p className="text-sm text-gray-500">Get notified when someone shares a dashboard with you</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.email.dashboardShared}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: { ...prev.notifications.email, dashboardShared: checked }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-gray-500">Receive a weekly summary of your analytics activity</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.email.weeklyDigest}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: { ...prev.notifications.email, weeklyDigest: checked }
                      }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Real-time notifications in your browser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Query Completed</Label>
                      <p className="text-sm text-gray-500">Browser notification when queries finish</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.push.queryCompleted}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        push: { ...prev.notifications.push, queryCompleted: checked }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Dashboard Shared</Label>
                      <p className="text-sm text-gray-500">Browser notification for shared dashboards</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.push.dashboardShared}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        push: { ...prev.notifications.push, dashboardShared: checked }
                      }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for programmatic access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New API Key Form */}
                {showNewApiKey && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div>
                      <Label htmlFor="apiKeyName">API Key Name</Label>
                      <Input
                        id="apiKeyName"
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        placeholder="Production API Key"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={generateApiKey}>Generate Key</Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowNewApiKey(false);
                          setNewApiKeyName('');
                          setGeneratedApiKey(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Generated API Key */}
                {generatedApiKey && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      API Key Generated Successfully!
                    </p>
                    <p className="text-xs text-green-600 mb-3">
                      Make sure to copy this key - you won't be able to see it again.
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                        {generatedApiKey}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => copyApiKey(generatedApiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* API Keys List */}
                {settings.apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {settings.apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{apiKey.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="text-xs font-mono text-gray-500">
                                {showApiKey[apiKey.id] 
                                  ? apiKey.key 
                                  : `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 8)}`}
                              </code>
                              <button
                                onClick={() => setShowApiKey(prev => ({
                                  ...prev,
                                  [apiKey.id]: !prev[apiKey.id]
                                }))}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showApiKey[apiKey.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => copyApiKey(apiKey.key)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Created {new Date(apiKey.createdAt).toLocaleDateString()}
                              {apiKey.lastUsedAt && ` • Last used ${new Date(apiKey.lastUsedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No API keys created yet
                  </p>
                )}

                {!showNewApiKey && !generatedApiKey && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewApiKey(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New API Key
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control how your data is used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Allow Analytics</Label>
                      <p className="text-sm text-gray-500">Help us improve by allowing anonymous usage analytics</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.privacy.allowAnalytics}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, allowAnalytics: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Public Profile</Label>
                      <p className="text-sm text-gray-500">Allow others to see your public dashboards</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.privacy.publicProfile}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, publicProfile: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Your Data</CardTitle>
                <CardDescription>Download all your data in JSON format</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Export includes all your queries, dashboards, and settings. The export does not include 
                  connected database credentials for security reasons.
                </p>
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Delete Account</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={deleteAccount}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}