import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, Plus, Eye, PauseCircle, PlayCircle, Trash2, Calendar, Clock } from 'lucide-react'

const mockSchedules = [
  {
    id: 'schedule-001',
    name: 'Daily Data Sync',
    status: 'active',
    type: 'cron',
    expression: '0 2 * * *',
    priority: 'high',
    timezone: 'UTC',
    createdAt: '2024-01-10T00:00:00Z',
    nextRun: '2024-01-16T02:00:00Z',
    lastRun: '2024-01-15T02:00:00Z',
    executionCount: 15,
    jobType: 'batch'
  },
  {
    id: 'schedule-002',
    name: 'Weekly Report',
    status: 'paused',
    type: 'interval',
    expression: '7d',
    priority: 'medium',
    timezone: 'America/New_York',
    createdAt: '2024-01-08T00:00:00Z',
    nextRun: null,
    lastRun: '2024-01-12T09:00:00Z',
    executionCount: 4,
    jobType: 'scheduled'
  },
  {
    id: 'schedule-003',
    name: 'Hourly Health Check',
    status: 'active',
    type: 'interval',
    expression: '1h',
    priority: 'low',
    timezone: 'UTC',
    createdAt: '2024-01-05T00:00:00Z',
    nextRun: '2024-01-15T12:00:00Z',
    lastRun: '2024-01-15T11:00:00Z',
    executionCount: 240,
    jobType: 'batch'
  },
  {
    id: 'schedule-004',
    name: 'Monthly Cleanup',
    status: 'active',
    type: 'cron',
    expression: '0 3 1 * *',
    priority: 'low',
    timezone: 'UTC',
    createdAt: '2024-01-01T00:00:00Z',
    nextRun: '2024-02-01T03:00:00Z',
    lastRun: '2024-01-01T03:00:00Z',
    executionCount: 1,
    jobType: 'batch'
  }
]

const statusColors = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
}

export default function Schedules() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredSchedules = mockSchedules.filter(schedule => {
    const matchesSearch = schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || schedule.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Schedules</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Management</CardTitle>
          <CardDescription>
            Monitor and manage scheduled jobs and recurring tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schedules..."
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
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
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
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Schedule</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Next Run</th>
                  <th className="text-left p-4">Last Run</th>
                  <th className="text-left p-4">Executions</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-gray-500">{schedule.id}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={statusColors[schedule.status as keyof typeof statusColors]}>
                        {schedule.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {schedule.type === 'cron' ? (
                          <Calendar className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        <span className="capitalize">{schedule.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-mono text-sm">{schedule.expression}</div>
                        <div className="text-sm text-gray-500">{schedule.timezone}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={priorityColors[schedule.priority as keyof typeof priorityColors]}>
                        {schedule.priority}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {schedule.nextRun ? (
                        new Date(schedule.nextRun).toLocaleString()
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {schedule.lastRun ? (
                        new Date(schedule.lastRun).toLocaleString()
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{schedule.executionCount}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {schedule.status === 'active' && (
                          <Button variant="outline" size="sm">
                            <PauseCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {schedule.status === 'paused' && (
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
