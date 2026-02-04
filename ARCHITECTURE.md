# Teeth Damage Analysis System - Architecture & Database Design

## System Overview

The Teeth Damage Analysis System is a healthcare-oriented web application that enables students to upload dental images for automated ML-based analysis, while administrators manage records, monitor trends, and generate reports.

### Core Entities

```
users (Students & Admins)
  ├── profiles (Student-specific data)
  ├── submissions (Image uploads)
  │   └── analysis_results (ML analysis output)
  └── notifications (Email alerts)

admin_logs (Audit trail)
analytics_events (Usage tracking)
```

## Database Schema

### Users Table (Extended)
- **id** (PK): Auto-increment
- **openId** (Unique): Manus OAuth identifier
- **name, email**: User identity
- **role**: 'user' | 'admin'
- **createdAt, updatedAt, lastSignedIn**: Timestamps

### Student Profiles Table
- **id** (PK): Auto-increment
- **userId** (FK): Reference to users
- **firstName, middleName, surname**: Full name components
- **studentId** (Unique): Student identifier
- **age**: Integer
- **address**: Text
- **course**: String (e.g., "Dentistry", "General Health")
- **yearLevel**: Integer (1-4)
- **createdAt, updatedAt**: Timestamps

### Submissions Table (Image Uploads)
- **id** (PK): Auto-increment
- **userId** (FK): Student who uploaded
- **imageKey**: S3 file key
- **imageUrl**: S3 public URL
- **fileName**: Original filename
- **mimeType**: image/jpeg or image/png
- **fileSize**: Bytes
- **imageQuality**: 'good' | 'fair' | 'poor' (validation result)
- **status**: 'pending' | 'analyzing' | 'completed' | 'failed'
- **createdAt, updatedAt**: Timestamps

### Analysis Results Table
- **id** (PK): Auto-increment
- **submissionId** (FK): Reference to submission
- **userId** (FK): Denormalized for quick queries
- **detectedIssues**: JSON array of detected conditions
  ```json
  [
    {
      "type": "cavity" | "decay" | "crack" | "plaque" | "inflammation" | "healthy",
      "location": "tooth_number" (1-32),
      "severity": "low" | "moderate" | "high",
      "confidence": 0.0-1.0,
      "description": "string"
    }
  ]
  ```
- **overallSeverity**: 'low' | 'moderate' | 'high'
- **recommendations**: JSON array of care recommendations
- **disclaimer**: Fixed text about non-diagnostic nature
- **mlModelVersion**: String (e.g., "v1.0.2")
- **processingTime**: Milliseconds
- **createdAt**: Timestamp

### Admin Logs Table
- **id** (PK): Auto-increment
- **adminId** (FK): Admin who performed action
- **action**: 'view_submission' | 'export_report' | 'filter_records' | etc.
- **targetUserId** (FK, nullable): User affected by action
- **details**: JSON (context-specific data)
- **createdAt**: Timestamp

### Analytics Events Table
- **id** (PK): Auto-increment
- **eventType**: 'submission_uploaded' | 'analysis_completed' | 'report_exported' | etc.
- **userId** (FK, nullable): Associated user
- **metadata**: JSON (event-specific data)
- **createdAt**: Timestamp

## API Contract (tRPC Procedures)

### Authentication
- `auth.me` → Get current user
- `auth.logout` → Clear session

### User Module (Protected)
- `student.createProfile(data)` → Register student profile
- `student.getProfile()` → Get own profile
- `student.updateProfile(data)` → Update profile
- `submission.upload(file, metadata)` → Upload image
- `submission.getHistory()` → List own submissions
- `submission.getDetails(submissionId)` → Get submission + analysis
- `submission.delete(submissionId)` → Delete submission

### Admin Module (Admin-only)
- `admin.students.list(filters)` → Get all students with pagination
- `admin.students.search(query)` → Search by name/ID
- `admin.students.getProfile(userId)` → View student details
- `admin.submissions.list(filters)` → Get all submissions
- `admin.submissions.filter(criteria)` → Filter by course, year, severity
- `admin.analytics.getSummary()` → Dashboard summary
- `admin.analytics.getIssueDistribution()` → Common dental issues chart
- `admin.analytics.getSeverityDistribution()` → Severity breakdown
- `admin.analytics.getSubmissionTrend(period)` → Time-series data
- `admin.reports.exportPDF(filters)` → Generate PDF report
- `admin.reports.exportCSV(filters)` → Generate CSV export

### Notifications (Protected)
- `notification.sendAnalysisComplete(submissionId)` → Trigger email
- `notification.sendCriticalFinding(submissionId)` → Alert admins

## ML Pipeline Architecture

### Input Processing
1. Image validation (resolution, format, blur detection)
2. Preprocessing (resize to 512x512, normalization)
3. Tooth segmentation (identify individual teeth)

### Model Output
- Classification: Cavity, decay, crack, plaque, inflammation, healthy
- Localization: Tooth number (1-32 FDI notation)
- Confidence scores: 0.0-1.0 per detection
- Severity mapping: Confidence → Low/Moderate/High

### Processing Pipeline
- Async job queue (Bull/RabbitMQ)
- Webhook callback to update analysis_results table
- Email notification on completion

## File Storage Strategy

### S3 Structure
```
s3://bucket/
  submissions/
    {userId}/
      {submissionId}-{timestamp}.jpg
  exports/
    {adminId}/
      report-{timestamp}.pdf
```

### Metadata in Database
- Store S3 key + URL in submissions table
- Never store file bytes in database (use S3 only)
- Implement presigned URLs for secure access

## Security & Privacy

### Authentication & Authorization
- Manus OAuth for user authentication
- Role-based access control (user vs admin)
- Session cookies with secure flags
- JWT for API token validation

### Data Protection
- Encrypt sensitive fields (address, student ID)
- HTTPS only
- S3 bucket policies restrict public access
- Admin audit logs for compliance

### Compliance
- HIPAA-adjacent design (not full compliance, educational context)
- User consent before image analysis
- Data retention policies
- Right to deletion (cascade delete user data)

## Performance Considerations

### Database Indexing
- `users.openId` (unique)
- `student_profiles.userId` (FK)
- `submissions.userId, status` (composite)
- `analysis_results.userId, createdAt` (for history queries)
- `admin_logs.adminId, createdAt` (audit trail)

### Caching Strategy
- Cache user profiles (5 min TTL)
- Cache analytics summaries (15 min TTL)
- Cache student list with filters (10 min TTL)

### Query Optimization
- Denormalize userId in analysis_results for fast filtering
- Pagination for all list endpoints (20-50 items per page)
- Lazy load analysis details on demand

## Deployment Architecture

### Frontend
- Vite build → static assets
- Deployed to CDN with aggressive caching
- Environment variables injected at build time

### Backend
- Express server with tRPC router
- Database connection pooling
- S3 client with retry logic
- ML service integration (HTTP API)

### ML Service
- Separate Python service (Flask/FastAPI)
- Accepts image URLs from S3
- Returns JSON analysis results
- Async processing with webhooks

## Error Handling & Monitoring

### User-Facing Errors
- Image upload validation errors (format, size, quality)
- Analysis failures with retry option
- Network errors with offline fallback

### Admin Monitoring
- Failed analysis tracking
- Processing time metrics
- Error rate dashboards
- System health checks

## Testing Strategy

### Unit Tests
- Database query helpers
- ML result parsing
- Email template rendering
- Validation functions

### Integration Tests
- OAuth flow
- Image upload → S3 → Analysis pipeline
- Admin filtering and reporting
- Email notification dispatch

### E2E Tests
- Student registration → upload → analysis view
- Admin dashboard filtering and export
- Role-based access control enforcement
