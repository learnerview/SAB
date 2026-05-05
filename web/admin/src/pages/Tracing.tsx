import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, Download, Eye, Activity, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const mockTraces = [
  {
    traceId: 'trace-001',
    spanId: 'span-001',
    jobId: 'job-001',
    jobName: 'Data Processing Job',
    operation: 'job.execute',
    status: 'completed',
    startTime: '2024-01-15T10:31:00Z',
    endTime: '2024-01-15T10:33:15Z',
    duration: 135000,
    service: 'job-processor',
    tags: {
      'job.type': 'batch',
      'job.priority': 'high',
      'job.queue': 'default'
    },
    logs: [
      { timestamp: '2024-01-15T10:31:00Z', level: 'INFO', message: 'Job execution started' },
      { timestamp: '2024-01-15T10:32:30Z', level: 'INFO', message: 'Processing batch 1/3' },
      { timestamp: '2024-01-15T10:33:15Z', level: 'INFO', message: 'Job completed successfully' }
    ]
  },
  {
    traceId: 'trace-002',
    spanId: 'span-002',
    jobId: 'job-002',
    jobName: 'Email Campaign',
    operation: 'job.execute',
    status: 'completed',
    startTime: '2024-01-15T09:16:00Z',
    endTime: '2024-01-15T09:45:30Z',
    duration: 1770000,
    service: 'email-sender',
    tags: {
      'job.type': 'scheduled',
      'job.priority': 'medium',
      'job.queue': 'email'
    },
    logs: [
      { timestamp: '2024-01-15T09:16:00Z', level: 'INFO', message: 'Email campaign started' },
      { timestamp: '2024-01-15T09:30:00Z', level: 'WARNING', message: 'Rate limit approaching' },
      { timestamp: '2024-01-15T09:45:30Z', level: 'INFO', message: 'Campaign completed' }
    ]
  },
  {
    traceId: 'trace-003',
    spanId: 'span-003',
    jobId: 'job-003',
    jobName: 'Report Generation',
    operation: 'job.execute',
    status: 'error',
    startTime: '2024-01-15T08:01:00Z',
    endTime: '2024-01-15T08:15:30Z',
    duration: 870000,
    service: 'report-generator',
    tags: {
      'job.type': 'batch',
      'job.priority': 'low',
      'job.queue': 'reports'
    },
    logs: [
      { timestamp: '2024-01-15T08:01:00Z', level: 'INFO', message: 'Report generation started' },
      { timestamp: '2024-01-15T08:10:00Z', level: 'ERROR', message: 'Database connection failed' },
      { timestamp: '2024-01-15T08:15:30Z', level: 'ERROR', message: 'Job failed after retries' }
    ]
  },
  {
    traceId: 'trace-004',
    spanId: 'span-004',
    jobId: 'schedule-001',
    jobName: 'Daily Data Sync',
    operation: 'schedule.trigger',
    status: 'running',
    startTime: '2024-01-15T10:30:00Z',
    endTime: null,
    duration: null,
    service: 'scheduler',
    tags: {
      'schedule.type': 'cron',
      'schedule.expression': '0 2 * * *'
    },
    logs: [
      { timestamp: '2024-01-15T10:30:00Z', level: 'INFO', message: 'Schedule triggered' },
      { timestamp: '2024-01-15T10:30:05Z', level: 'INFO', message: 'Job submitted successfully' }
    ]
  }
]

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  error: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const statusIcons = {
  completed: CheckCircle,
  running: Activity,
  error: XCircle,
  cancelled: XCircle
}

const formatDuration = (duration: number | null) => {
  if (!duration) return '-'
  if (duration < 1000) return `${duration}ms`
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
  return `${(duration / 60000).toFixed(1)}m`
}

export default function Tracing() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTrace, setSelectedTrace] = useState<typeof mockTraces[0] | null>(null)

  const filteredTraces = mockTraces.filter(trace => {
    const matchesSearch = trace.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trace.jobId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || trace.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Distributed Tracing</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Traces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockTraces.length}</div>
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {mockTraces.filter(t => t.status === 'running').length}
            </div>
            <p className="text-sm text-gray-500">Active traces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {mockTraces.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-500">Successful traces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {mockTraces.filter(t => t.status === 'error').length}
            </div>
            <p className="text-sm text-gray-500">Failed traces</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trace List</CardTitle>
            <CardDescription>
              Recent distributed traces across all services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search traces..."
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
                <option value="error">Error</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredTraces.map((trace) => {
                const Icon = statusIcons[trace.status as keyof typeof statusIcons]
                return (
                  <div
                    key={trace.traceId}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTrace(trace)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{trace.jobName}</span>
                        <Badge className={statusColors[trace.status as keyof typeof statusColors]}>
                          {trace.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDuration(trace.duration)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Trace ID:</span> {trace.traceId}
                      </div>
                      <div>
                        <span className="font-medium">Service:</span> {trace.service}
                      </div>
                      <div>
                        <span className="font-medium">Operation:</span> {trace.operation}
                      </div>
                      <div>
                        <span className="font-medium">Started:</span> {new Date(trace.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trace Details</CardTitle>
            <CardDescription>
              {selectedTrace ? 'Selected trace information' : 'Select a trace to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrace ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Trace ID:</span> {selectedTrace.traceId}</div>
                    <div><span className="font-medium">Span ID:</span> {selectedTrace.spanId}</div>
                    <div><span className="font-medium">Job ID:</span> {selectedTrace.jobId}</div>
                    <div><span className="font-medium">Service:</span> {selectedTrace.service}</div>
                    <div><span className="font-medium">Operation:</span> {selectedTrace.operation}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Timing</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Start:</span> {new Date(selectedTrace.startTime).toLocaleString()}
                    </div>
                    {selectedTrace.endTime && (
                      <div>
                        <span className="font-medium">End:</span> {new Date(selectedTrace.endTime).toLocaleString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(selectedTrace.duration)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="space-y-1">
                    {Object.entries(selectedTrace.tags).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="font-medium">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Logs</h3>
                  <div className="space-y-2">
                    {selectedTrace.logs.map((log, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-3 text-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{log.message}</span>
                          <Badge variant={log.level === 'ERROR' ? 'destructive' : log.level === 'WARNING' ? 'secondary' : 'default'}>
                            {log.level}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a trace to view detailed information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
