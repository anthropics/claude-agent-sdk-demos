# Nexora Engineering

## Architecture Overview

Nexora's platform follows a microservices architecture deployed on Kubernetes. The system is divided into several core service groups.

### Service Groups

1. **Flow Engine** - Executes workflow definitions. Written in Go for performance. Handles scheduling, branching, retries, and parallel execution. Deployed as a stateless service that reads workflow definitions from a central store.

2. **Connector Runtime** - Manages API connections to third-party services. Each connector runs as an isolated container with its own credential store. The runtime handles authentication refresh, rate limiting, and connection pooling.

3. **Data Pipeline** - Powers Nexora Connect. Built on Apache Kafka for event streaming and Apache Flink for stream processing. Batch jobs use Apache Spark. The pipeline supports exactly-once semantics for critical data flows.

4. **AI Services** - Hosts the models behind Nexora Assist. Inference runs on GPU-accelerated nodes. Model serving uses a custom framework optimized for low-latency responses.

5. **API Gateway** - A unified REST and GraphQL gateway that sits in front of all services. Handles authentication, rate limiting, request routing, and API versioning.

6. **Web Application** - A React-based single-page application that provides the Nexora UI. Served via a global CDN. The frontend communicates with the API Gateway over HTTPS and WebSocket.

### Infrastructure

- **Cloud Provider:** Multi-cloud deployment on AWS (primary) and GCP (disaster recovery).
- **Compute:** Kubernetes clusters managed with Terraform and Helm. Production runs approximately 1,200 pods across 3 regions.
- **Storage:** PostgreSQL for relational data, Redis for caching and session state, S3-compatible object storage for artifacts and logs.
- **Messaging:** Apache Kafka clusters with 12 brokers handling approximately 500,000 messages per second at peak.
- **CI/CD:** GitHub Actions for CI. ArgoCD for continuous deployment to Kubernetes. Average deployment frequency is 8 deploys per day to production.
- **Monitoring:** Datadog for metrics and APM. PagerDuty for alerting. Custom dashboards for business metrics.

## Engineering Team

The engineering team consists of approximately 180 people, split across Austin and Toronto.

### Team Structure

- **Platform Team (25 engineers)** - Owns Kubernetes infrastructure, CI/CD, developer tooling, and observability.
- **Flow Team (35 engineers)** - Builds and maintains the workflow engine, visual builder, and scheduling system.
- **Connect Team (30 engineers)** - Develops the data integration platform, connectors, and CDC system.
- **AI Team (20 engineers and researchers)** - Builds and maintains Nexora Assist, including model training, inference infrastructure, and the NLP pipeline.
- **Frontend Team (25 engineers)** - Develops the web application, component library, and design system.
- **Security Team (10 engineers)** - Handles application security, compliance automation, penetration testing, and incident response.
- **QA and Release (15 engineers)** - End-to-end testing, release management, and quality assurance.
- **Data Engineering (20 engineers)** - Internal analytics, data warehouse, and customer-facing reporting features.

### Engineering Practices

- **Code Review:** All changes require at least one approval. Critical path changes require two.
- **Testing:** Unit test coverage target is 85%. Integration tests run on every PR. Load tests run weekly.
- **On-Call:** 24/7 on-call rotation across teams. Each team has a primary and secondary on-call engineer.
- **Tech Radar:** The engineering org maintains a quarterly tech radar to evaluate and adopt new technologies.
- **Architecture Decision Records (ADRs):** Significant design decisions are documented as ADRs and stored in the mono-repo.
- **Sprint Cadence:** Two-week sprints with planning on Monday and retrospective on alternate Fridays.

## Development Workflow

1. Engineer picks up a ticket from the team's Jira board.
2. Creates a feature branch from `main`.
3. Writes code, tests, and documentation.
4. Opens a pull request. CI runs linting, unit tests, and integration tests.
5. After review approval, the PR is merged to `main`.
6. ArgoCD detects the change and deploys to staging within 5 minutes.
7. After smoke tests pass on staging, the change is promoted to production.
8. Average time from merge to production: 45 minutes.

## Reliability

- **Uptime SLA:** 99.95% for Enterprise customers.
- **Actual Uptime (2024):** 99.98% across all services.
- **Mean Time to Detection (MTTD):** 2.3 minutes.
- **Mean Time to Recovery (MTTR):** 18 minutes.
- **Incident Postmortems:** Published for all Severity 1 and 2 incidents. 100% blameless postmortem completion rate.
