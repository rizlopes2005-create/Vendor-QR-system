# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and merged into main
- [ ] Environment variables configured
- [ ] Database backups taken
- [ ] Dependencies updated and tested
- [ ] Security vulnerabilities checked
- [ ] Performance optimization done

## Development vs Production

### Development (Current Setup)
- SQLite database
- CORS: Allow all origins
- Debug mode: Enabled
- Hot reload: Enabled
- Logs: Console output

### Production Setup
- PostgreSQL database
- CORS: Specific domains only
- Debug mode: Disabled
- Hot reload: Disabled
- Logs: File-based logging
- HTTPS: Required
- Environment: .env.production

## Production Deployment on Windows

### Prerequisites
- Windows Server 2016 or later
- Python 3.10+
- PostgreSQL installed
- IIS (Internet Information Services) or Nginx

### Backend Deployment (FastAPI with Uvicorn)

#### Option 1: Using Uvicorn with Windows Service

1. **Install pywin32** for Windows service support:
   ```bash
   pip install pywin32 pyinstaller
   ```

2. **Create startup script** `backend/run.py`:
   ```python
   import uvicorn
   
   if __name__ == "__main__":
       uvicorn.run(
           "main:app",
           host="0.0.0.0",
           port=8000,
           log_level="info"
       )
   ```

3. **Create Windows Service**:
   ```bash
   python win_service.py install
   python win_service.py start
   ```

#### Option 2: Using Gunicorn (Recommended)

1. **Install production dependencies**:
   ```bash
   pip install gunicorn psycopg2-binary python-dotenv
   ```

2. **Update requirements.txt**:
   ```
   fastapi
   uvicorn
   sqlalchemy
   pydantic
   websockets
   python-multipart
   gunicorn
   psycopg2-binary
   python-dotenv
   ```

3. **Create `.env.production`**:
   ```
   DATABASE_URL=postgresql://user:password@db_host:5432/arun_bites
   DEBUG=False
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

4. **Start with Gunicorn**:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:8000 main:app
   ```

### Frontend Deployment

#### Option 1: Static Hosting (Recommended)

Deploy to:
- **Vercel** (https://vercel.com)
- **Netlify** (https://netlify.com)
- **GitHub Pages** (https://pages.github.com)
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**

#### Option 2: Self-Hosted

1. **Build optimization**:
   ```bash
   cd frontend
   # Minify CSS and JS manually or use build tools
   ```

2. **Use Nginx as reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           root /var/www/arun-bites/frontend;
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://127.0.0.1:8000/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

3. **Enable HTTPS with Let's Encrypt**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Database Setup (PostgreSQL)

1. **Install PostgreSQL** on production server

2. **Create database and user**:
   ```sql
   CREATE DATABASE arun_bites;
   CREATE USER vendor_user WITH PASSWORD 'secure_password';
   ALTER ROLE vendor_user SET client_encoding TO 'utf8';
   ALTER ROLE vendor_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE vendor_user SET default_transaction_deferrable TO on;
   ALTER ROLE vendor_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE arun_bites TO vendor_user;
   ```

3. **Update backend/database.py**:
   ```python
   from dotenv import load_dotenv
   import os
   
   load_dotenv('.env.production')
   
   SQLALCHEMY_DATABASE_URL = os.getenv(
       "DATABASE_URL",
       "postgresql://vendor_user:password@localhost/arun_bites"
   )
   ```

### Environment Variables

**Production `.env.production`**:
```
DATABASE_URL=postgresql://user:password@host/arun_bites
DEBUG=False
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECRET_KEY=your-secret-key-here
LOG_LEVEL=info
```

### Security Configuration

1. **Update CORS in backend/main.py**:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   import os
   
   allowed_origins = os.getenv(
       "ALLOWED_ORIGINS",
       "http://localhost:8080"
   ).split(",")
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=allowed_origins,
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Enable HTTPS**:
   - Use Let's Encrypt for free SSL certificates
   - Force HTTPS redirects
   - Set HSTS headers

3. **Database Security**:
   - Use strong passwords
   - Restrict database access to app server only
   - Regular backups to secure location
   - Encrypt database connections

4. **API Security**:
   - Rate limiting
   - Input validation
   - CSRF protection
   - XSS protection headers

### Monitoring & Logs

1. **Setup logging**:
   ```python
   import logging
   
   logging.basicConfig(
       filename='app.log',
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   )
   ```

2. **Monitor with**:
   - PM2 for process management
   - ELK Stack for logs
   - Prometheus + Grafana for metrics
   - New Relic or Datadog for monitoring

### Automated Backups

1. **Database backup script**:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/var/backups/arun_bites"
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump arun_bites > $BACKUP_DIR/backup_$DATE.sql
   ```

2. **Schedule with cron** (Linux):
   ```bash
   0 2 * * * /path/to/backup.sh
   ```

3. **Schedule with Task Scheduler** (Windows):
   - Create scheduled task
   - Run backup script daily at 2 AM

### Rollback Plan

1. **Keep previous version** in separate directory
2. **Database migration rollback** script
3. **Health check endpoint**:
   ```python
   @app.get("/health")
   def health_check():
       return {"status": "healthy"}
   ```

4. **Gradual rollout** using feature flags

### Performance Optimization

1. **Enable gzip compression**:
   ```python
   from fastapi.middleware.gzip import GZipMiddleware
   app.add_middleware(GZipMiddleware, minimum_size=1000)
   ```

2. **Use Redis caching**:
   ```python
   import redis
   cache = redis.Redis(host='localhost', port=6379)
   ```

3. **Database optimization**:
   - Add indexes on foreign keys
   - Use query optimization
   - Connection pooling

4. **Frontend optimization**:
   - Minify CSS/JS
   - Compress images
   - Use CDN for static assets

### Post-Deployment

1. **Verify deployment**:
   - Check all endpoints working
   - Test WebSocket connection
   - Verify database connectivity
   - Test payment flow

2. **Monitor logs** for errors

3. **Setup alerts** for critical issues

4. **Document** any custom configurations

5. **Notify users** of deployment

---

## Scaling Considerations

- **Load balancing** for multiple API servers
- **Database replication** for redundancy
- **Cache layer** (Redis) for frequently accessed data
- **CDN** for frontend assets
- **Message queue** (RabbitMQ) for async tasks

---

## Support

For deployment issues:
- Check application logs
- Verify environment variables
- Check database connectivity
- Verify firewall rules
- Check API documentation at http://yourapp.com/docs

---

For more help, see [README.md](README.md) and [SETUP.md](SETUP.md)
