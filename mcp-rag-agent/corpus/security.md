# Nexora Security and Compliance

## Security Overview

Nexora Technologies takes a defense-in-depth approach to security, with controls at every layer of the stack. The security program is overseen by the CISO, reporting directly to the CEO.

## Certifications and Compliance

- **SOC 2 Type II** - Certified since 2021. Annual audit conducted by a Big Four accounting firm. Latest report covers the period January 2024 through December 2024.
- **ISO 27001** - Certified since 2022. Certification renewed in October 2024.
- **HIPAA** - Business Associate Agreement (BAA) available for healthcare customers. Technical safeguards validated by an independent assessor.
- **GDPR** - Data Processing Agreement (DPA) available. EU customer data can be restricted to the EU-West region.
- **SOC 1 Type II** - Available for financial services customers requiring controls over financial reporting.
- **PCI DSS Level 1** - In progress, expected completion Q2 2025.

## Data Security

### Encryption

- **In Transit:** All data in transit is encrypted using TLS 1.3. Certificate management is automated via Let's Encrypt with 90-day rotation.
- **At Rest:** All data at rest is encrypted using AES-256. Encryption keys are managed through AWS KMS with automatic key rotation every 365 days.
- **Field-Level Encryption:** Available in Nexora Connect for sensitive fields (e.g., SSN, credit card numbers, health records). Uses envelope encryption with customer-managed keys.

### Access Control

- **Authentication:** SSO via SAML 2.0 and OIDC. Multi-factor authentication (MFA) is required for all employee accounts and available for customer accounts.
- **Authorization:** Role-based access control (RBAC) with predefined roles (Admin, Editor, Viewer) and support for custom roles.
- **API Security:** API keys with configurable scopes and expiration. OAuth 2.0 for machine-to-machine authentication.
- **Network Security:** All services run in private VPCs. Customer-facing endpoints are protected by WAF and DDoS mitigation. IP allowlisting available for Enterprise customers.

### Data Residency

Customers can choose their data residency region:
- **US East** (Virginia)
- **US West** (Oregon)
- **EU West** (Ireland)
- **Canada** (Montreal)
- **Asia Pacific** (Singapore) - Available Q3 2025

## Application Security

- **Secure SDLC:** Security is integrated into every phase of the development lifecycle. Threat modeling is conducted for all new features.
- **Static Analysis (SAST):** Automated code scanning on every pull request using Semgrep and CodeQL.
- **Dynamic Analysis (DAST):** Weekly automated scans of production endpoints.
- **Dependency Scanning:** Automated vulnerability detection for third-party dependencies. Critical vulnerabilities are patched within 24 hours.
- **Penetration Testing:** Annual third-party penetration test. Latest test completed in September 2024 with no critical findings.
- **Bug Bounty Program:** Public bug bounty program managed through HackerOne. Average response time to valid reports is 4 hours.

## Incident Response

- **Incident Response Plan:** Documented and tested quarterly through tabletop exercises.
- **Detection:** Average time from event to detection (MTTD) is 2.3 minutes for infrastructure incidents and 15 minutes for security events.
- **Response SLAs:**
  - Critical (data breach, service outage): Response within 15 minutes, customer notification within 1 hour.
  - High (potential vulnerability, degraded performance): Response within 1 hour.
  - Medium: Response within 4 hours.
  - Low: Response within 1 business day.
- **Post-Incident Review:** All Critical and High incidents trigger a blameless post-incident review within 48 hours.

## Vendor Security

- All third-party vendors undergo a security review before onboarding.
- Critical vendors (those with access to customer data) are reviewed annually.
- Vendor inventory is maintained and includes risk ratings, data access levels, and contract terms.
- Nexora uses 47 third-party vendors, of which 12 are classified as critical.

## Security Metrics (2024)

- Total security incidents: 3 (all Medium severity, none involving customer data exposure)
- Vulnerability patch SLA compliance: 98.7%
- Phishing simulation click rate: 2.1% (industry average: 8.5%)
- MFA adoption (employees): 100%
- MFA adoption (customers on Enterprise plans): 89%
- Mean time to remediate critical vulnerabilities: 6 hours
- Security training completion rate: 100% of employees
