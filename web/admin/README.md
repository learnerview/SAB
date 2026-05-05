# SAB Admin Interface

Web admin interface for operating SAB (Smart Asynchronous Broker).

## Features

- **Dashboard**: Real-time cluster statistics and job trends
- **Job Management**: Monitor, control, and troubleshoot jobs
- **Schedule Management**: Create and manage recurring schedules
- **Queue Management**: Monitor queue performance and health
- **Distributed Tracing**: View trace data and performance metrics
- **Settings**: Configure cluster, security, and notification settings

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Recharts** for data visualization
- **Headless UI** for accessible components
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

## Project Structure

```
src/
├── components/
│ ├── ui/ # Reusable UI components
│ └── Layout.tsx # Main layout component
├── pages/ # Page components
│ ├── Dashboard.tsx
│ ├── Jobs.tsx
│ ├── Schedules.tsx
│ ├── Queues.tsx
│ ├── Tracing.tsx
│ └── Settings.tsx
├── lib/
│ └── utils.ts # Utility functions
├── App.tsx # Main app component with routing
├── main.tsx # Entry point
└── index.css # Global styles
```

## Configuration

### Vite Configuration

The Vite configuration (`vite.config.ts`) includes:

- React plugin
- Path aliases (`@/` for `src/`)
- Development server proxy to API
- Build optimizations

### Tailwind CSS

Tailwind is configured with:
- Custom color scheme
- Dark mode support
- Responsive design utilities
- Component-specific classes

## API Integration

The admin interface integrates with the SAB API. Key endpoints:

- `/api/v1/jobs` - Job management
- `/api/v1/schedules` - Schedule management 
- `/api/v1/queues` - Queue statistics
- `/api/v1/admin` - Admin operations
- `/api/v1/traces` - Distributed tracing data

### Authentication

API keys are used for authentication and can be configured in the settings page.

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Update navigation in `Layout.tsx`

### Adding UI Components

1. Create component in `src/components/ui/`
2. Follow existing patterns with TypeScript interfaces
3. Use Tailwind classes for styling

### Mock Data

The default setup can use mock data for local development. Replace with real API calls when connecting to the backend:

```typescript
// Example API integration
import { useQuery } from '@tanstack/react-query'

const { data: jobs } = useQuery({
 queryKey: ['jobs'],
 queryFn: () => fetch('/api/v1/jobs').then(res => res.json())
})
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Environment Variables for Production

```env
VITE_API_BASE_URL=https://api.sab.com
VITE_WS_URL=wss://api.sab.com/ws
```

## Contributing

1. Follow existing code patterns
2. Use TypeScript for all new code
3. Test responsive design
4. Update documentation as needed

## License

This project is part of the SAB platform and follows the repository root license.
