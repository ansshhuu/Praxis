import { buildCategoryTemplates, type ScenarioMeta, type WorkflowTemplate } from '@/lib/workflow/templates/builder'

const SCENARIOS: ScenarioMeta[] = [
  { slug: 'ci-build-failure-triage', name: 'CI Build Failure Triage', description: 'Triage a failed continuous integration build.', tags: ['ci', 'build'] },
  { slug: 'production-deployment-approval', name: 'Production Deployment Approval', description: 'Approve a production deployment request.', tags: ['deployment', 'approval'] },
  { slug: 'rollback-trigger', name: 'Rollback Trigger', description: 'Trigger a rollback after a failed release.', tags: ['rollback'] },
  { slug: 'infrastructure-drift-detection', name: 'Infrastructure Drift Detection', description: 'Detect infrastructure configuration drift.', tags: ['infrastructure'] },
  { slug: 'canary-release-monitoring', name: 'Canary Release Monitoring', description: 'Monitor a canary release for regressions.', tags: ['release'] },
  { slug: 'secrets-rotation', name: 'Secrets Rotation', description: 'Rotate expiring application secrets.', tags: ['security', 'secrets'] },
  { slug: 'on-call-incident-response', name: 'On-Call Incident Response', description: 'Coordinate on-call response to a production incident.', tags: ['incident', 'on-call'] },
  { slug: 'post-incident-review', name: 'Post-Incident Review', description: 'Compile a post-incident review document.', tags: ['incident', 'postmortem'] },
  { slug: 'capacity-planning-alert', name: 'Capacity Planning Alert', description: 'Alert on approaching infrastructure capacity limits.', tags: ['capacity'] },
  { slug: 'container-image-scan', name: 'Container Image Scan', description: 'Scan a container image for vulnerabilities before push.', tags: ['security', 'containers'] },
  { slug: 'database-migration-gate', name: 'Database Migration Gate', description: 'Gate a database migration behind review.', tags: ['database', 'migration'] },
  { slug: 'feature-flag-rollout', name: 'Feature Flag Rollout', description: 'Roll out a feature flag to a percentage of users.', tags: ['feature-flags'] },
  { slug: 'load-test-result-review', name: 'Load Test Result Review', description: 'Review results from a scheduled load test.', tags: ['performance'] },
  { slug: 'certificate-expiry-renewal', name: 'Certificate Expiry Renewal', description: 'Renew a TLS certificate nearing expiry.', tags: ['security', 'certificates'] },
  { slug: 'blue-green-cutover', name: 'Blue-Green Cutover', description: 'Cut traffic over during a blue-green deployment.', tags: ['deployment'] },
  { slug: 'autoscaling-threshold-breach', name: 'Autoscaling Threshold Breach', description: 'Respond to an autoscaling threshold breach.', tags: ['autoscaling'] },
  { slug: 'release-notes-publishing', name: 'Release Notes Publishing', description: 'Draft and publish release notes for a shipped version.', tags: ['release'] },
]

export const DEVOPS_WORKFLOW_TEMPLATES: WorkflowTemplate[] = buildCategoryTemplates('DevOps', SCENARIOS)
