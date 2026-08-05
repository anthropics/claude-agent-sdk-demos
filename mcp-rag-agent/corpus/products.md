# Nexora Products

Nexora Technologies offers three main products, all built on the shared Nexora Platform runtime.

## Nexora Flow

Nexora Flow is the company's flagship workflow automation engine. It provides a visual drag-and-drop builder for designing multi-step business processes, combined with a code editor for advanced logic.

### Key Features

- **Visual Workflow Builder** - Drag-and-drop interface for creating automation flows without writing code.
- **200+ Pre-built Connectors** - Integrations with popular SaaS tools including Salesforce, HubSpot, Jira, Slack, Zendesk, Stripe, and Snowflake.
- **Branching and Conditional Logic** - Support for if/else conditions, loops, parallel execution, and error-handling branches.
- **Version Control** - Built-in versioning for workflows with rollback support.
- **Scheduling and Triggers** - Flows can be triggered by webhooks, schedules (cron), database changes, or external events.
- **Audit Trail** - Complete execution history with step-level detail for compliance and debugging.

### Pricing

- **Starter:** $49/month - Up to 5 active flows, 1,000 executions/month.
- **Professional:** $199/month - Unlimited flows, 25,000 executions/month, priority support.
- **Enterprise:** Custom pricing - Unlimited executions, SSO, dedicated support, SLA guarantees.

### Performance

Nexora Flow processes an average of 12 million workflow executions per month across all customers. Median end-to-end execution latency is 340 milliseconds for standard flows.

## Nexora Connect

Nexora Connect is a data integration platform that synchronizes data between applications, databases, and warehouses.

### Key Features

- **Real-time and Batch Sync** - Choose between continuous real-time synchronization or scheduled batch transfers.
- **Schema Mapping** - Visual tool for mapping fields between source and destination systems.
- **Data Transformation** - Built-in transformation layer with support for filtering, enrichment, deduplication, and custom SQL transforms.
- **Change Data Capture (CDC)** - Efficiently captures and replicates only the changed data from source systems.
- **Monitoring Dashboard** - Real-time visibility into sync status, throughput, errors, and data volumes.
- **Compliance Controls** - Field-level encryption, PII detection, and data residency controls.

### Pricing

- **Team:** $299/month - Up to 10 connections, 1 million records/month.
- **Business:** $799/month - Up to 50 connections, 10 million records/month, advanced transformations.
- **Enterprise:** Custom pricing - Unlimited connections and records, dedicated infrastructure.

### Performance

Nexora Connect handles approximately 2.3 billion records per month in aggregate across all customers. Peak throughput reaches 45,000 records per second for enterprise deployments.

## Nexora Assist

Nexora Assist is an AI-powered assistant that sits on top of Flow and Connect, providing natural-language interfaces for workflow creation, anomaly detection, and operational recommendations.

### Key Features

- **Natural Language Workflow Creation** - Describe a workflow in plain English and Assist generates the flow definition.
- **Anomaly Detection** - Monitors workflow executions and data pipelines, alerting users when patterns deviate from historical norms.
- **Root Cause Analysis** - When a workflow fails, Assist traces the failure through the execution graph and suggests fixes.
- **Performance Recommendations** - Analyzes workflow execution patterns and recommends optimizations.
- **Conversational Interface** - Users can ask questions about their data and workflows in natural language.

### Pricing

Nexora Assist is included at no additional cost with Professional and Enterprise plans for both Flow and Connect. Standalone access is available for $99/month.

### Technical Details

Nexora Assist is powered by a fine-tuned large language model that has been trained on Nexora's workflow DSL, connector schemas, and anonymized execution patterns. The model runs on Nexora's own infrastructure, and no customer data is sent to third-party AI providers. Response latency averages 1.2 seconds for generation tasks and 200 milliseconds for classification tasks.
