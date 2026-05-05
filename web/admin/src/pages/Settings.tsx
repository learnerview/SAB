import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, RefreshCw, Key, Database, Bell, Shield, Users } from 'lucide-react'

const mockSettings = {
  cluster: {
    name: 'SAB-Production',
    version: '2.0.0',
    region: 'us-east-1',
    maxJobs: 10000,
    maxConcurrency: 100
  },
  database: {
    host: 'localhost',
    port: 5432,
    database: 'sab',
    connectionPool: 20,
    timeout: 30000
  },
  notifications: {
    email: {
      enabled: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      from: 'noreply@sab.com'
    },
    slack: {
      enabled: false,
      webhookUrl: '',
      channel: '#alerts'
    }
  },
  security: {
    apiKeyExpiry: 86400,
    maxApiKeys: 100,
    requireHttps: true,
    allowedOrigins: ['http://localhost:3000', 'https://admin.sab.com']
  }
}

const mockApiKeys = [
  {
    id: 'key-001',
    name: 'Production API Key',
    key: 'sk-...abc123',
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    expiresAt: '2024-04-10T00:00:00Z',
    lastUsed: '2024-01-15T14:30:00Z',
    permissions: ['jobs:read', 'jobs:write', 'schedules:read', 'schedules:write']
  },
  {
    id: 'key-002',
    name: 'Read-only Key',
    key: 'sk-...def456',
    status: 'active',
    createdAt: '2024-01-12T00:00:00Z',
    expiresAt: '2024-04-12T00:00:00Z',
    lastUsed: '2024-01-14T09:15:00Z',
    permissions: ['jobs:read', 'schedules:read', 'queues:read']
  },
  {
    id: 'key-003',
    name: 'Test Key',
    key: 'sk-...ghi789',
    status: 'expired',
    createdAt: '2023-12-01T00:00:00Z',
    expiresAt: '2024-01-01T00:00:00Z',
    lastUsed: '2023-12-28T16:45:00Z',
    permissions: ['jobs:write', 'schedules:write']
  }
]

const statusColors = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  revoked: 'bg-gray-100 text-gray-800'
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('cluster')
  const [formData, setFormData] = useState(mockSettings)

  const handleSave = () => {
    console.log('Saving settings:', formData)
  }

  const tabs = [
    { id: 'cluster', label: 'Cluster', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="flex border-b">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'cluster' && (
        <Card>
          <CardHeader>
            <CardTitle>Cluster Configuration</CardTitle>
            <CardDescription>
              Manage cluster-wide settings and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cluster Name</label>
                <Input
                  value={formData.cluster.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cluster: { ...prev.cluster, name: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Version</label>
                <Input value={formData.cluster.version} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <Input
                  value={formData.cluster.region}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cluster: { ...prev.cluster, region: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Jobs</label>
                <Input
                  type="number"
                  value={formData.cluster.maxJobs}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cluster: { ...prev.cluster, maxJobs: parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Concurrency</label>
                <Input
                  type="number"
                  value={formData.cluster.maxConcurrency}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cluster: { ...prev.cluster, maxConcurrency: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure security policies and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key Expiry (seconds)</label>
                <Input
                  type="number"
                  value={formData.security.apiKeyExpiry}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    security: { ...prev.security, apiKeyExpiry: parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max API Keys</label>
                <Input
                  type="number"
                  value={formData.security.maxApiKeys}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    security: { ...prev.security, maxApiKeys: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Allowed Origins</label>
              <div className="space-y-2">
                {formData.security.allowedOrigins.map((origin, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={origin} disabled />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'api-keys' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage API keys for external access
                </CardDescription>
              </div>
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockApiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <p className="text-sm font-mono text-gray-600">{apiKey.key}</p>
                    </div>
                    <Badge className={statusColors[apiKey.status as keyof typeof statusColors]}>
                      {apiKey.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Created</div>
                      <div>{new Date(apiKey.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Expires</div>
                      <div>{new Date(apiKey.expiresAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Last Used</div>
                      <div>{new Date(apiKey.lastUsed).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Permissions</div>
                      <div className="space-y-1">
                        {apiKey.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure email and Slack notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Host</label>
                  <Input
                    value={formData.notifications.email.smtpHost}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: { ...prev.notifications.email, smtpHost: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Port</label>
                  <Input
                    type="number"
                    value={formData.notifications.email.smtpPort}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: { ...prev.notifications.email, smtpPort: parseInt(e.target.value) }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">From Email</label>
                  <Input
                    value={formData.notifications.email.from}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email: { ...prev.notifications.email, from: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Slack Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook URL</label>
                  <Input
                    value={formData.notifications.slack.webhookUrl}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        slack: { ...prev.notifications.slack, webhookUrl: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Channel</label>
                  <Input
                    value={formData.notifications.slack.channel}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        slack: { ...prev.notifications.slack, channel: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
