'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Share2, 
  Copy, 
  Mail, 
  Users, 
  Globe, 
  Lock, 
  Calendar,
  Trash2,
  UserPlus,
  Eye,
  Edit,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardId: string;
  dashboardName: string;
  currentUserId: string;
}

interface Share {
  id: string;
  email: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT';
  expiresAt: string | null;
  createdAt: string;
  user?: {
    name: string;
    image: string;
  };
}

export function ShareDialog({ isOpen, onClose, dashboardId, dashboardName, currentUserId }: ShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'COMMENT' | 'EDIT'>('VIEW');
  const [expirationDays, setExpirationDays] = useState<string>('never');
  
  // Public sharing
  const [isPublic, setIsPublic] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [allowComments, setAllowComments] = useState(true);
  const [allowExport, setAllowExport] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      fetchPublicSettings();
    }
  }, [isOpen, dashboardId]);

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/shares`);
      if (!response.ok) throw new Error('Failed to fetch shares');
      
      const data = await response.json();
      setShares(data.shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shares');
    }
  };

  const fetchPublicSettings = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/public`);
      if (!response.ok) throw new Error('Failed to fetch public settings');
      
      const data = await response.json();
      setIsPublic(data.isPublic);
      setPublicLink(data.publicLink);
      setAllowComments(data.allowComments);
      setAllowExport(data.allowExport);
    } catch (err) {
      console.error('Failed to load public settings:', err);
    }
  };

  const handleShare = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const expiresAt = expirationDays === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(`/api/dashboards/${dashboardId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          permission,
          expiresAt,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share dashboard');
      }

      setSuccess(`Dashboard shared with ${email}`);
      setEmail('');
      await fetchShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/shares/${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove share');
      
      await fetchShares();
      setSuccess('Share removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share');
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: string) => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/shares/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: newPermission }),
      });

      if (!response.ok) throw new Error('Failed to update permission');
      
      await fetchShares();
      setSuccess('Permission updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    }
  };

  const handleTogglePublic = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/public`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: !isPublic,
          allowComments,
          allowExport,
        }),
      });

      if (!response.ok) throw new Error('Failed to update public settings');
      
      const data = await response.json();
      setIsPublic(data.isPublic);
      setPublicLink(data.publicLink);
      setSuccess(isPublic ? 'Dashboard made private' : 'Dashboard made public');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update public settings');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Link copied to clipboard!');
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'VIEW': return <Eye className="h-4 w-4" />;
      case 'COMMENT': return <MessageSquare className="h-4 w-4" />;
      case 'EDIT': return <Edit className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'VIEW': return 'bg-gray-100 text-gray-800';
      case 'COMMENT': return 'bg-blue-100 text-blue-800';
      case 'EDIT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share &quot;{dashboardName}&quot;
          </DialogTitle>
          <DialogDescription>
            Share this dashboard with others or make it publicly accessible
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </div>
          )}

          {/* Public Sharing */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium">Public Access</h3>
                  <p className="text-sm text-gray-500">Anyone with the link can access this dashboard</p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
              />
            </div>

            {isPublic && publicLink && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={publicLink}
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(publicLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(publicLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={allowComments}
                      onCheckedChange={setAllowComments}
                      size="sm"
                    />
                    <Label>Allow comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={allowExport}
                      onCheckedChange={setAllowExport}
                      size="sm"
                    />
                    <Label>Allow export</Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share with specific people */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Share with specific people
            </h3>

            {/* Add new share */}
            <div className="space-y-3 mb-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleShare()}
                />
                <Select value={permission} onValueChange={(value) => setPermission(value as 'VIEW' | 'COMMENT' | 'EDIT')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEW">View</SelectItem>
                    <SelectItem value="COMMENT">Comment</SelectItem>
                    <SelectItem value="EDIT">Edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShare} disabled={isLoading}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-sm">Expires:</Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="90">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Existing shares */}
            {shares.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Shared with {shares.length} {shares.length === 1 ? 'person' : 'people'}
                </div>
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {share.user?.image ? (
                        <img
                          src={share.user.image}
                          alt={share.user.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {share.user?.name || share.email}
                        </p>
                        {share.user && (
                          <p className="text-xs text-gray-500">{share.email}</p>
                        )}
                        {share.expiresAt && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expires {new Date(share.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Select 
                        value={share.permission} 
                        onValueChange={(value) => handleUpdatePermission(share.id, value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEW">View</SelectItem>
                          <SelectItem value="COMMENT">Comment</SelectItem>
                          <SelectItem value="EDIT">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Badge 
                        variant="outline" 
                        className={`${getPermissionColor(share.permission)} border-0`}
                      >
                        {getPermissionIcon(share.permission)}
                        <span className="ml-1">{share.permission}</span>
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}