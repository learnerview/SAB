// React Query for data fetching
import { useQuery } from '@tanstack/react-query'

// Lucide React icons
import { 
  Activity, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react'

// UI component imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Chart imports
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Type definitions for dashboard data
interface ClusterStats {
  totalJobs: number
  runningJobs: number
  queuedJobs: number
  successfulJobs: number
  failedJobs: number
  dlqJobs: number
  activeWorkers: number
  activeSchedules: number
  uptimeMs: number
}

interface QueueStats {
  queued: number
  running: number
  success: number
  failed: number
  dlq: number
  throughput: number
  avgExecutionTimeMs: number
  avgWaitTimeMs: number
}

// Mock cluster statistics data for demonstration
const mockClusterStats: ClusterStats = {
  totalJobs: 15420,
  runningJobs: 23,
  queuedJobs: 156,
  successfulJobs: 14890,
  failedJobs: 234,
  dlqJobs: 117,
  activeWorkers: 8,
  activeSchedules: 42,
  uptimeMs: 86400000, // 1 day
}

const mockQueueStats: QueueStats = {
  queued: 156,
  running: 23,
  success: 14890,
  failed: 234,
  dlq: 117,
  throughput: 12.5,
  avgExecutionTimeMs: 2340,
  avgWaitTimeMs: 890,
}

const mockJobTrends = [
  { time: '00:00', jobs: 45 },
  { time: '04:00', jobs: 32 },
  { time: '08:00', jobs: 89 },
  { time: '12:00', jobs: 156 },
  { time: '16:00', jobs: 134 },
  { time: '20:00', jobs: 78 },
  { time: '23:59', jobs: 23 },
]

export function Dashboard() {
  const { data: clusterStats } = useQuery({
    queryKey: ['cluster-stats'],
    queryFn: () => Promise.resolve(mockClusterStats),
    refetchInterval: 30000,
  })

  const { data: queueStats } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => Promise.resolve(mockQueueStats),
    refetchInterval: 30000,
  })

  const successRate = clusterStats ? 
    ((clusterStats.successfulJobs / (clusterStats.successfulJobs + clusterStats.failedJobs)) * 100).toFixed(1) : 
    '0'

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getHealthStatus = () => {
    if (!clusterStats || !queueStats) return 'Unknown'
    
    const dlqRatio = clusterStats.dlqJobs / clusterStats.totalJobs
    const queueAge = queueStats.avgWaitTimeMs
    
    if (dlqRatio > 0.1 || queueAge > 300000) return 'Critical'
    if (dlqRatio > 0.05 || queueAge > 120000) return 'Warning'
    return 'Healthy'
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your SAB scheduler performance and health
        </p>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={healthStatus === 'Healthy' ? 'default' : 
                           healthStatus === 'Warning' ? 'secondary' : 'destructive'}>
              {healthStatus}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {healthStatus === 'Healthy' ? 'All systems operating normally' :
               healthStatus === 'Warning' ? 'Some metrics require attention' :
               'Critical issues detected'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusterStats?.totalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusterStats?.runningJobs}</div>
            <p className="text-xs text-muted-foreground">
              Active now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusterStats?.activeWorkers}</div>
            <p className="text-xs text-muted-foreground">
              8 total workers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Job Trends Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Job Trends</CardTitle>
            <CardDescription>Jobs processed over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockJobTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="jobs" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Queued</span>
                <span>{queueStats?.queued}</span>
              </div>
              <Progress value={(queueStats?.queued || 0) / 5} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running</span>
                <span>{queueStats?.running}</span>
              </div>
              <Progress value={(queueStats?.running || 0) / 5} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>DLQ</span>
                <span className="text-destructive">{clusterStats?.dlqJobs}</span>
              </div>
              <Progress 
                value={(clusterStats?.dlqJobs || 0) / 200} 
                className="h-2 [&>div]:bg-destructive"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.throughput}</div>
            <p className="text-xs text-muted-foreground">jobs/second</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Avg Execution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((queueStats?.avgExecutionTimeMs || 0) / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">per job</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(clusterStats?.uptimeMs || 0)}
            </div>
            <p className="text-xs text-muted-foreground">continuous</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Worker node-3 came online</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">High queue latency detected</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Schedule backup-daily executed</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Job webhook-123 failed (3 retries)</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
