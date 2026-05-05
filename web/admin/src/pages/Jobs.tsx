import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, Plus, Eye, PauseCircle, PlayCircle, Trash2 } from 'lucide-react'

const mockJobs = [
  {
    id: 'job-001',
    name: 'Data Processing Job',
    status: 'running',
    priority: 'high',
    createdAt: '2024-01-15T10:30:00Z',
    startedAt: '2024-01-15T10:31:00Z',
    progress: 75,
    type: 'batch',
    queue: 'default'
  },
  {
    id: 'job-002',
    name: 'Email Campaign',
    status: 'completed',
    priority: 'medium',
    createdAt: '2024-01-15T09:15:00Z',
    startedAt: '2024-01-15T09:16:00Z',
    completedAt: '2024-01-15T09:45:00Z',
    progress: 100,
    type: 'scheduled',
    queue: 'email'
  },
  {
    id: 'job-003',
    name: 'Report Generation',
    status: 'failed',
    priority: 'low',
    createdAt: '2024-01-15T08:00:00Z',
    startedAt: '2024-01-15T08:01:00Z',
    failedAt: '2024-01-15T08:15:00Z',
    progress: 45,
    type: 'batch',
    queue: 'reports'
  },
  {
    id: 'job-004',
    name: 'Database Backup',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-01-15T11:00:00Z',
    progress: 0,
    type: 'scheduled',
    queue: 'backup'
  }
]

const statusColors = {
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
}

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>
            Monitor and manage all jobs in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Queue</th>
                  <th className="text-left p-4">Progress</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-gray-500">{job.id}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={priorityColors[job.priority as keyof typeof priorityColors]}>
                        {job.priority}
                      </Badge>
                    </td>
                    <td className="p-4">{job.type}</td>
                    <td className="p-4">{job.queue}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {job.status === 'running' && (
                          <Button variant="outline" size="sm">
                            <PauseCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'pending' && (
                          <Button variant="outline" size="sm">
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
