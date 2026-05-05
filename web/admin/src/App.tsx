// React Router imports
import { Routes, Route } from 'react-router-dom'

// Component imports
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import { Schedules } from './pages/Schedules'
import { Cluster } from './pages/Cluster'
import { DLQ } from './pages/DLQ'
import { APIKeys } from './pages/APIKeys'
import { Settings } from './pages/Settings'

// Main App component with routing configuration
export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/cluster" element={<Cluster />} />
        <Route path="/dlq" element={<DLQ />} />
        <Route path="/api-keys" element={<APIKeys />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
