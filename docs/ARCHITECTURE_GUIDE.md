# SAB System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ EXTERNAL CLIENTS │
│ (Web, Mobile, Backends, SDKs) │
└────────────────────┬────────────────────────────────────────────┘
 │ HTTPS/TLS 1.3
 ▼
┌─────────────────────────────────────────────────────────────────┐
│ INGRESS LAYER │
│ (nginx Ingress Controller) │
│ - TLS termination │
│ - Rate limiting (300 req/min) │
│ - CORS handling │
│ - Request routing │
└────────────────────┬────────────────────────────────────────────┘
 │
 ┌────────────┼────────────┐
 ▼ ▼ ▼
┌──────────────────────────────────────────────────────────────────┐
│ API LAYER (StatefulSet - 3+ pods) │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ SAB Application Container │ │
│ │ - Spring Boot 3.2.1 on Java 17 │ │
│ │ - Port: 8080 │ │
│ │ - Memory: 512MB heap, 1GB limit │ │
│ │ - CPU: 500m request, 2000m limit │ │
│ │ │ │
│ │ Key Components: │ │
│ │ - API Server: REST endpoints, authentication │ │
│ │ - Worker: Job execution engine, polling │ │
│ │ - Scheduler: Cron job scheduling │ │
│ │ - Metrics: Prometheus metrics export │ │
│ │ - Tracing: OpenTelemetry OTLP export │ │
│ └────────────────────────────────────────────────────────────┘ │
│ Pod Anti-affinity: Spread pods across nodes │
│ HPA: 3-10 replicas based on CPU/Memory │
│ PDB: minAvailable=2 for graceful evictions │
└──────────┬──────────────┬──────────────┬───────────────────────┘
 │ │ │
 TCP 5432 TCP 6379 TCP 4317
 │ │ │
 ┌──▼──┐ ┌───▼────┐ ┌────▼──────┐
 │ DB │ │ Cache │ │Collector │
 │ PG15│ │ Redis7 │ │OTEL │
 └──────┘ └────────┘ └───────────┘
 │ │ │
 ▼ ▼ ▼
 ┌────────┐ ┌────────┐ ┌──────────────┐
 │EBS Vol │ │PVC Vol │ │Jaeger/ELK │
 │100 GB │ │50 GB │ │Log Storage │
 └────────┘ └────────┘ └──────────────┘
```

## Component Details

### API Server
- **Role**: Handle HTTP requests from clients
- **Protocols**: HTTP/1.1 on port 8080 (TLS via Ingress)
- **Authentication**: X-API-KEY header with SHA-256 hashing
- **Rate Limiting**: 300 requests/minute per API key
- **Endpoints**:
 - `POST /api/v1/jobs` - Submit job
 - `GET /api/v1/jobs/{id}` - Get job status
 - `GET /api/v1/jobs?producer=xxx` - List jobs
 - `POST /api/v1/schedules` - Create schedule
 - `GET /actuator/health` - Health check
 - `GET /actuator/prometheus` - Metrics

### Worker/Scheduler
- **Role**: Poll job queue and execute jobs
- **Polling Interval**: 1000ms (configurable)
- **Lease-based Execution**: 30-second leases prevent duplicate execution
- **Retry Logic**: Max 3 attempts with exponential backoff
- **DLQ**: Jobs exceeding max attempts moved to dead-letter queue

### Cache Layer (Redis)
- **Primary Use Cases**:
 - API key lookups (900K ops/day typical)
 - Job queue (FIFO with visibility timeout)
 - Lease tracking (prevents duplicate execution)
 - Auth token caching
- **Configuration**: 2GB max, LRU eviction policy
- **Persistence**: RDB snapshots + AOF logging
- **Replication**: Single primary (upgrade to cluster for HA)

### Data Layer (PostgreSQL)
- **Tables**:
 - `job_entity`: Core job data with status tracking
 - `queue_entry`: Work queue with visibility timeout
 - `schedule_entity`: Recurring job definitions
 - `api_key_entity`: Authentication tokens
 - `event_log`: Audit trail of all operations
- **Indexes**:
 - `idx_job_status`: Fast status queries
 - `idx_job_producer_status`: Multi-tenant isolation
 - `idx_queue_entry_visible_at`: Queue polling
- **Connection Pool**: 20 connections per pod (Hikari)
- **Replication**: Read replicas for analytics queries

### Monitoring Stack

#### Prometheus (Metrics)
- Scrapes `/actuator/prometheus` every 30 seconds
- Retention: 15 days
- Metrics:
 - `sab_jobs_submitted_total` - Throughput
 - `sab_jobs_completed_total` - Success count
 - `sab_job_duration_seconds` - Latency (histogram)
 - `jvm_memory_used_bytes` - Memory usage
 - `process_cpu_usage` - CPU percentage

#### Grafana (Visualization)
- Pre-built dashboards:
 - System overview (CPU, memory, disk)
 - Job metrics (throughput, latency, error rate)
 - Database metrics (connections, query time)
 - Redis metrics (memory, evictions, hitrate)
- Alert rules: Error rate, latency, resource exhaustion
- SLA tracking: 99.9% uptime, P99 <1s latency

#### Jaeger (Tracing)
- Distributed tracing with OpenTelemetry
- Sampling: 10% of requests sampled to reduce overhead
- Trace context propagated through job execution
- Enables:
 - Request latency analysis
 - Dependency mapping
 - Root cause analysis of failures

#### ELK Stack (Logs)
- Elasticsearch: Centralized log storage
- Logback-spring.xml: Structured JSON logging
- Kibana: Log searching and visualization
- Retention: 30 days

## Data Flow

### Job Submission
```
Client
 ↓
API Gateway (Ingress)
 ↓ [TLS termination, rate limit]
Spring Boot API Server
 ↓ [API key validation, caching]
Database (insert job_entity)
 ├→ Cache (update activeApiKeys)
 ├→ Queue (FIFO work queue in Redis)
 └→ Metrics (increment submitted counter)
 ↓
Client returns Job ID
```

### Job Execution
```
Worker Pod
 ↓
Poll Redis queue (every 1000ms)
 ↓ [Get next job, claim lease]
Load job details from Database
 ↓
Execute webhook/cron/delay handler
 ├→ Success: Update database, update metrics
 ├→ Failure: Queue retry (exponential backoff)
 └→ Max retries exceeded: Move to DLQ
 ↓
Update lease in Redis (prevent duplicate)
 ↓
Metrics + Tracing (latency, result)
```

### High Availability

#### Pod-Level HA
- **StatefulSet**: Maintains pod ordering for cache consistency
- **Pod Anti-affinity**: Spreads pods across nodes
- **Health Checks**: 
 - Liveness: Crashes unhealthy pods
 - Readiness: Removes from load balancer
- **Graceful Termination**: 15-second preStop hook allows in-flight requests

#### Cluster-Level HA
- **Minimum 3 nodes**: Kubernetes recommends odd numbers
- **PodDisruptionBudget**: Ensures 2 pods running during maintenance
- **Horizontal Pod Autoscaler**: Adds pods when load increases
- **Multiple Replicas**: Each component has redundancy

#### Database HA
- **PostgreSQL Replication**: Read replicas for read-heavy queries
- **Automated Failover**: Tools like Patroni manage failover
- **Backup Strategy**: Daily snapshots to object storage
- **Point-in-time Recovery**: WAL archiving for recovery to specific time

#### Cache HA
- **Redis Sentinel**: Automatic failover (optional upgrade)
- **Redis Cluster**: Multi-primary setup (optional upgrade)
- **Persistence**: Data survives pod restarts
- **Reconstruction**: Can rebuild cache from database if needed

## Scalability Characteristics

### Horizontal Scalability (adding pods)
- **Network**: Load balancer distributes requests
- **Database**: Connection pooling scales to max_connections
- **Cache**: Redis handles concurrent operations
- **Bottleneck**: PostgreSQL connection limit (currently 200)
- **Mitigation**: Read replicas, connection pooling, query optimization

### Vertical Scalability (bigger pods)
- **Memory**: Increasing heap size improves GC performance
- **CPU**: More cores enable parallel request processing
- **Current Config**: 512MB heap, 2GB limit (safe for 1M+ jobs/day)
- **For 10M jobs/day**: Increase to 2GB heap, 4GB limit

### Throughput Optimization
- **API requests**: Spring Boot handles ~2000 req/s per pod × 3 pods = 6000 req/s
- **Job processing**: Worker processes ~100 jobs/s per pod × 3 pods = 300 jobs/s
- **Database**: PostgreSQL handles ~1000 queries/s
- **Cache**: Redis handles ~10000 ops/s

## Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| Pod crash | Request errors for 10-30s | Kubernetes restarts pod automatically |
| Node failure | 1-3 pods lost (1/3 - 1/1 of traffic) | HPA adds replicas, pods reschedule |
| DB connection pool exhausted | New requests timeout | HPA scales pods, connection limit increases |
| Redis memory full | New cache entries fail | LRU eviction, increase memory, scale replicas |
| Network partition | Some pods unreachable | Network policy blocks traffic, monitoring alerts |
| Disk space full | Database writes fail | Add storage, enable compression, archive logs |

## Security Architecture

```
┌─────────────┐
│ Clients │
└──────┬──────┘
 │ mTLS (optional)
 ▼
┌──────────────────────────────┐
│ Ingress Controller (nginx) │
│ - TLS 1.3 termination │
│ - CORS validation │
│ - Rate limiting │
└──────┬───────────────────────┘
 │ X-API-KEY header
 ▼
┌──────────────────────────────┐
│ Pod (Kubernetes) │
│ - NetworkPolicy (egress) │
│ - ServiceAccount (RBAC) │
│ - securityContext │
│ - Resource limits │
└──────┬───────────────────────┘
 │ Encrypted connections
 ├──→ DB (TLS, password auth)
 ├──→ Redis (password auth)
 └──→ OTEL (optional TLS)
```

## Disaster Recovery

### Recovery Time Objective (RTO)
- **Database corruption**: 15 minutes (restore from RDB backup)
- **Complete cluster loss**: 1 hour (restore from Velero snapshot)
- **Data loss**: 5 minutes (restore from Redis AOF)

### Recovery Point Objective (RPO)
- **Job data**: 0 seconds (synchronous database writes)
- **Cache data**: 30 seconds (background refresh)
- **Audit logs**: 1 second (async writes with batching)

### Backup Strategy
```
Hourly: RDB snapshots (PostgreSQL + Redis)
Daily: Full cluster backup (Velero)
Weekly: Backup verification (restore test)
Monthly: Long-term storage (S3 Glacier)
Annually: Disaster recovery drill
```

## Cost Analysis

### Kubernetes Infrastructure (AWS)
```
3 x t3.large EC2 instances ~$60/month
EBS volumes (150GB total) ~$15/month
Elastic Load Balancer ~$16/month
Data transfer (egress) ~$5/month
────────────────────────────────────────
Subtotal: $96/month

Optional:
RDS PostgreSQL (managed) ~$50/month
ElastiCache Redis (managed) ~$25/month
```

### Performance per Dollar
- Processing 1M jobs: $96/month = $96 per million jobs (bare metal)
- With managed services: $171/month = $171 per million jobs
- Recommendation: Use managed services for HA/backups despite cost

## Monitoring Best Practices

### Key Metrics by Tier

**Application Layer**
- Error rate (should be <0.1%)
- Request latency (P50, P95, P99)
- Throughput (requests/second)
- Job success rate (should be >99%)

**Infrastructure Layer**
- CPU utilization (target 60-70%)
- Memory utilization (target 70-80%)
- Disk utilization (alert at 80%)
- Network I/O (packets/bytes)

**Dependency Layer**
- Database connection utilization
- Query latency and count
- Cache hit ratio (target >90%)
- Redis memory utilization

### Alerting Strategy
```
Severity P1 (5 min response): Error rate >5%, Pod down, DB unreachable
Severity P2 (15 min response): Error rate >1%, Latency P99 >5s, CPU >90%
Severity P3 (1 hour response): Disk >80%, Memory >85%, Replicas <2
Severity P4 (next business day): Code quality issues, low traffic warning
```

## Conclusion

SAB is architected for:
- **High Availability**: Multi-pod, multi-zone, redundant dependencies
- **Scalability**: Horizontal scaling to 10k+ pods theoretically
- **Reliability**: 99.9% SLA with graceful degradation
- **Observability**: Comprehensive metrics, logs, and traces
- **Security**: Defense in depth with multiple layers

This architecture is suitable for production deployments serving millions of jobs daily with enterprise-grade reliability requirements.
