import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw, PauseCircle, PlayCircle, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const mockQueues = [
  {
    name: 'default',
    status: 'active',
    pending: 125,
    running: 8,
    completed: 15420,
    failed: 23,
    totalProcessed: 15451,
    successRate: 99.85,
    avgProcessingTime: 2.3,
    maxConcurrency: 10,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    name: 'high-priority',
    status: 'active',
    pending: 12,
    running: 3,
    completed: 8934,
    failed: 5,
    totalProcessed: 8942,
    successRate: 99.94,
    avgProcessingTime: 1.8,
    maxConcurrency: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    name: 'email',
    status: 'paused',
    pending: 342,
    running: 0,
    completed: 12456,
    failed: 89,
    totalProcessed: 12545,
    successRate: 99.29,
    avgProcessingTime: 3.1,
    maxConcurrency: 15,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    name: 'reports',
    status: 'active',
    pending: 67,
    running: 2,
    completed: 3456,
    failed: 12,
    totalProcessed: 3470,
    successRate: 99.65,
    avgProcessingTime: 5.7,
    maxConcurrency: 3,
    createdAt: '2024-01-08T00:00:00Z'
  },
  {
    name: 'backup',
    status: 'active',
    pending: 3,
    running: 1,
    completed: 765,
    failed: 2,
    totalProcessed: 770,
    successRate: 99.74,
    avgProcessingTime: 45.2,
    maxConcurrency: 2,
    createdAt: '2024-01-10T00:00:00Z'
  }
]

const statusColors = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800'
}

const getHealthStatus = (queue: typeof mockQueues[0]) => {
  if (queue.failed > 50) return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
  if (queue.successRate < 99) return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
  if (queue.successRate > 99.9) return { status: 'excellent', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  return { status: 'good', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
}

export default function Queues() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredQueues = mockQueues.filter(queue => 
    queue.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Queues</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            Create Queue
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Queues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockQueues.length}</div>
            <p className="text-sm text-gray-500">Active job queues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockQueues.reduce((sum, q) => sum + q.pending, 0)}
            </div>
            <p className="text-sm text-gray-500">Jobs waiting to be processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockQueues.reduce((sum, q) => sum + q.running, 0)}
            </div>
            <p className="text-sm text-gray-500">Jobs currently processing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Management</CardTitle>
          <CardDescription>
            Monitor and manage job queues and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search queues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQueues.map((queue) => {
              const health = getHealthStatus(queue)
              const Icon = health.icon
              
              return (
                <div key={queue.name} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{queue.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[queue.status as keyof typeof statusColors]}>
                          {queue.status}
                        </Badge>
                        <Badge className={health.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {health.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {queue.status === 'active' && (
                        <Button variant="outline" size="sm">
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {queue.status === 'paused' && (
                        <Button variant="outline" size="sm">
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Pending</div>
                      <div className="text-xl font-semibold">{queue.pending}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Running</div>
                      <div className="text-xl font-semibold">{queue.running}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Completed</div>
                      <div className="text-xl font-semibold">{queue.completed.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Failed</div>
                      <div className="text-xl font-semibold">{queue.failed}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-lg font-semibold">{queue.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Avg Processing Time</div>
                      <div className="text-lg font-semibold">{queue.avgProcessingTime}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Max Concurrency</div>
                      <div className="text-lg font-semibold">{queue.maxConcurrency}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Created: {new Date(queue.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Processed: {queue.totalProcessed.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
