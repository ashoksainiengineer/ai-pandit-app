# AI-Pandit Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `TURSO_DATABASE_URL` - libSQL connection string
- [ ] `TURSO_AUTH_TOKEN` - Turso authentication token
- [ ] `AI_API_KEY` - DeepSeek/OpenRouter API key
- [ ] `CLERK_SECRET_KEY` - Clerk backend secret
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk frontend key
- [ ] `ENCRYPTION_SECRET` - 32-byte hex key for AES-256
- [ ] `NEXT_PUBLIC_BACKEND_URL` - Backend URL (frontend only)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Backend port (default: 7860)
- [ ] `SWISSEPH_PATH` - Path to ephemeris files

### 2. Database Setup
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify database connection
- [ ] Test CRUD operations
- [ ] Set up backup strategy

### 3. Build Verification
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] TypeScript compilation succeeds

### 4. Health Checks
- [ ] `/api/health` returns 200
- [ ] `/api/health/ready` returns 200
- [ ] `/api/health/live` returns 200
- [ ] SSE endpoint accepts connections

### 5. Security
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Authentication middleware working
- [ ] Input validation active
- [ ] Error handling configured
- [ ] Secrets not in code

### 6. Performance
- [ ] Memory usage under limits
- [ ] Response times acceptable
- [ ] SSE streaming works
- [ ] Queue manager handles concurrent sessions
- [ ] AI API calls have retry logic

---

## Platform-Specific Checklists

### Render Deployment

#### Prerequisites
- [ ] Render account created
- [ ] Payment method added
- [ ] GitHub repository connected

#### Backend Service
- [ ] Create new web service
- [ ] Select Docker runtime
- [ ] Set Dockerfile path: `./Dockerfile`
- [ ] Set plan: Performance (8GB RAM)
- [ ] Add persistent disk (10GB for ephemeris)
- [ ] Configure environment variables
- [ ] Set health check: `/api/health`
- [ ] Enable auto-deploy from main branch

#### Frontend Service
- [ ] Create new web service
- [ ] Select Node runtime
- [ ] Set build command: `cd apps/web && npm run build`
- [ ] Set start command: `cd apps/web && npm start`
- [ ] Set plan: Starter (2GB RAM)
- [ ] Configure environment variables
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` to backend URL
- [ ] Enable auto-deploy from main branch

#### Post-Deployment
- [ ] Test frontend → backend connectivity
- [ ] Test SSE streaming
- [ ] Test BTR analysis flow
- [ ] Verify error handling
- [ ] Check logs for errors

---

### Railway Deployment

#### Prerequisites
- [ ] Railway account created
- [ ] Payment method added
- [ ] GitHub repository connected

#### Backend Service
- [ ] Create new service from repo
- [ ] Select Docker runtime
- [ ] Set plan: Plus (2GB RAM) or Pro (4GB RAM)
- [ ] Configure environment variables
- [ ] Add persistent volume
- [ ] Set health check: `/api/health`

#### Frontend Service
- [ ] Create new service from repo
- [ ] Select Node runtime
- [ ] Set root directory: `apps/web`
- [ ] Set build command: `npm run build`
- [ ] Set start command: `npm start`
- [ ] Configure environment variables
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` to backend service URL

#### Database Service
- [ ] Create PostgreSQL service (optional, or use Turso)
- [ ] Create Redis service (for queue/cache)
- [ ] Connect services via private networking

#### Post-Deployment
- [ ] Test all services are running
- [ ] Test private networking
- [ ] Test SSE streaming
- [ ] Test BTR analysis flow

---

### Fly.io Deployment

#### Prerequisites
- [ ] `flyctl` CLI installed
- [ ] Fly.io account created
- [ ] Payment method added
- [ ] Logged in: `flyctl auth login`

#### Backend Deployment
```bash
# Create app
flyctl launch --name ai-pandit-api --region bom

# Configure fly.toml
# - Set primary_region = "bom"
# - Configure mounts for ephemeris
# - Set internal_port = 7860

# Set secrets
flyctl secrets set TURSO_DATABASE_URL="..."
flyctl secrets set TURSO_AUTH_TOKEN="..."
flyctl secrets set AI_API_KEY="..."
flyctl secrets set CLERK_SECRET_KEY="..."
flyctl secrets set ENCRYPTION_SECRET="..."
flyctl secrets set NODE_ENV="production"

# Deploy
flyctl deploy

# Scale up (4GB RAM)
flyctl scale memory 4096

# Check status
flyctl status
```

#### Frontend Deployment
```bash
# Create app
flyctl launch --name ai-pandit-web --region bom

# Set secrets
flyctl secrets set NEXT_PUBLIC_BACKEND_URL="https://ai-pandit-api.fly.dev"
flyctl secrets set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."

# Deploy
flyctl deploy
```

#### Post-Deployment
- [ ] Test both apps are running
- [ ] Test connectivity between apps
- [ ] Test SSE streaming
- [ ] Test BTR analysis flow

---

### AWS Deployment

#### Prerequisites
- [ ] AWS account created
- [ ] AWS CLI installed and configured
- [ ] ECR repositories created
- [ ] ECS cluster created
- [ ] RDS PostgreSQL instance created
- [ ] ElastiCache Redis cluster created

#### Backend Deployment
```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker build -t ai-pandit-api .
docker tag ai-pandit-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-pandit-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-pandit-api:latest

# Create ECS task definition
aws ecs register-task-definition --cli-input-json file://task-definition-api.json

# Create ECS service
aws ecs create-service \
  --cluster ai-pandit-cluster \
  --service-name api-service \
  --task-definition ai-pandit-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### Frontend Deployment
```bash
# Build and push Docker image
docker build -f apps/web/Dockerfile -t ai-pandit-web .
docker tag ai-pandit-web:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-pandit-web:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-pandit-web:latest

# Create ECS task definition
aws ecs register-task-definition --cli-input-json file://task-definition-web.json

# Create ECS service
aws ecs create-service \
  --cluster ai-pandit-cluster \
  --service-name web-service \
  --task-definition ai-pandit-web \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### Load Balancer Setup
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name ai-pandit-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups
aws elbv2 create-target-group \
  --name api-targets \
  --port 7860 \
  --protocol HTTP \
  --vpc-id vpc-xxx

aws elbv2 create-target-group \
  --name web-targets \
  --port 3000 \
  --protocol HTTP \
  --vpc-id vpc-xxx

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### Post-Deployment
- [ ] Test load balancer routing
- [ ] Test SSL/TLS (use ACM)
- [ ] Test auto-scaling
- [ ] Test health checks
- [ ] Configure CloudWatch alarms
- [ ] Set up log aggregation

---

## Monitoring Setup

### Error Tracking (Sentry)
```bash
# Install Sentry
npm install @sentry/nextjs @sentry/node

# Configure backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Configure frontend
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});
```

### Log Aggregation (Logtail)
```bash
# Install Logtail
npm install @logtail/node

# Configure backend
import { Logtail } from "@logtail/node";

const logger = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

logger.info("BTR analysis started", { sessionId, userId });
```

### Performance Monitoring
- [ ] Set up APM (Application Performance Monitoring)
- [ ] Configure custom metrics
- [ ] Set up alerts for:
  - High memory usage (>80%)
  - High error rate (>5%)
  - Slow AI API responses (>30s)
  - SSE connection failures

---

## Testing Checklist

### Backend Tests
- [ ] Health check endpoints work
- [ ] SSE streaming works
- [ ] Queue manager handles concurrent sessions
- [ ] AI API calls succeed with retry logic
- [ ] Database operations work
- [ ] Error handling works correctly
- [ ] Rate limiting works
- [ ] Authentication works

### Frontend Tests
- [ ] Page loads without errors
- [ ] SSE connection establishes
- [ ] Progress updates display
- [ ] Analysis completes successfully
- [ ] Results page displays correctly
- [ ] Page refresh restores state
- [ ] Edit & Reanalyze works
- [ ] Error boundaries catch errors

### Integration Tests
- [ ] Full BTR analysis flow works
- [ ] SSE streaming persists for 10+ minutes
- [ ] Multiple concurrent analyses work
- [ ] Failed analyses show error messages
- [ ] Cancelled analyses clean up properly

---

## Rollback Plan

### If Deployment Fails:
1. Check logs for errors
2. Verify environment variables
3. Test database connection
4. Test AI API connectivity
5. Revert to previous deployment

### If Issues After Deployment:
1. Enable debug logging
2. Monitor error rates
3. Check memory usage
4. Test with a single session
5. Scale up if needed
6. Rollback if critical issues

---

## Post-Deployment Tasks

### Week 1
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Test with real users
- [ ] Gather feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Optimize based on metrics
- [ ] Scale resources if needed
- [ ] Implement additional monitoring
- [ ] Document issues and solutions
- [ ] Plan improvements

### Ongoing
- [ ] Regular security updates
- [ ] Performance optimization
- [ ] Feature development
- [ ] User feedback integration
- [ ] Cost optimization

---

## Cost Monitoring

### Monthly Cost Targets
- Development: $50-100/month
- Staging: $100-200/month
- Production: $200-500/month (Render) or $500-800/month (AWS)

### Cost Optimization Tips
- [ ] Use spot instances for workers
- [ ] Scale down during off-peak hours
- [ ] Cache frequently accessed data
- [ ] Optimize AI API calls
- [ ] Compress SSE payloads
- [ ] Use CDN for static assets
- [ ] Implement session timeouts

---

## Contact & Support

### Platform Support
- Render: https://render.com/support
- Railway: https://docs.railway.app/contact
- Fly.io: https://community.fly.io
- AWS: https://aws.amazon.com/support

### Emergency Contacts
- [ ] DevOps contact
- [ ] Backend developer contact
- [ ] Frontend developer contact
- [ ] Database administrator contact
