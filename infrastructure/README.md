# UPXL Infrastructure Setup

This directory contains infrastructure configuration for the UPXL API platform.

## Quick Start

### Prerequisites
- VPS with Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- DNS record pointing to your VPS: `upxl.sandbox.be.tibebai.com`

### Setup Steps

1. **Verify DNS is configured**
   ```bash
   nslookup upxl.sandbox.be.tibebai.com
   # Should return your VPS IP
   ```

2. **Upload files to VPS**
   ```bash
   # From your local machine
   scp -r infrastructure/ root@YOUR_VPS_IP:/root/
   ```

3. **SSH into VPS**
   ```bash
   ssh root@YOUR_VPS_IP
   cd /root/infrastructure
   ```

4. **Run setup script**
   ```bash
   chmod +x scripts/setup-nginx.sh
   sudo ./scripts/setup-nginx.sh
   ```

5. **Verify setup**
   ```bash
   # Check nginx status
   sudo systemctl status nginx
   
   # Test endpoints
   curl https://upxl.sandbox.be.tibebai.com/health
   ```

## Architecture

```
Internet (HTTPS)
    ↓
Nginx (443) - SSL Termination
    ↓
┌─────────────────────────────────┐
│  Reverse Proxy Routing          │
├─────────────────────────────────┤
│ /auth     → localhost:3008      │
│ /profile  → localhost:3009      │
│ /ai       → localhost:3007      │
│ /proposal → localhost:3010      │
└─────────────────────────────────┘
    ↓
Docker Containers (Internal Network)
```

## API Endpoints

After setup, your services will be available at:

- **Auth Service**: `https://upxl.sandbox.be.tibebai.com/auth`
- **Profile Service**: `https://upxl.sandbox.be.tibebai.com/profile`
- **AI Gateway**: `https://upxl.sandbox.be.tibebai.com/ai`
- **Proposal Service**: `https://upxl.sandbox.be.tibebai.com/proposal`
- **Health Check**: `https://upxl.sandbox.be.tibebai.com/health`

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Install Certbot
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Get SSL Certificate
```bash
sudo certbot certonly --nginx -d upxl.sandbox.be.tibebai.com
```

### 3. Copy Nginx Config
```bash
sudo cp nginx/upxl-api.conf /etc/nginx/sites-available/upxl-api
sudo ln -s /etc/nginx/sites-available/upxl-api /etc/nginx/sites-enabled/
```

### 4. Test and Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Configure Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Maintenance

### View Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/upxl-api-access.log

# Error logs
sudo tail -f /var/log/nginx/upxl-api-error.log
```

### Reload Nginx (after config changes)
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

### Test SSL Renewal
```bash
sudo certbot renew --dry-run
```

### Restart Services
```bash
# Restart specific service
docker restart auth-service-staging

# Restart all services
docker restart $(docker ps -q)
```

## Troubleshooting

### Service not responding
```bash
# Check if container is running
docker ps | grep staging

# Check container logs
docker logs auth-service-staging

# Check nginx error logs
sudo tail -50 /var/log/nginx/upxl-api-error.log
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check nginx SSL config
sudo nginx -t
```

### 502 Bad Gateway
- Service container is not running
- Service is not listening on expected port
- Check with: `docker ps` and `docker logs <container-name>`

### 504 Gateway Timeout
- Service is taking too long to respond
- Check service logs for performance issues
- Increase timeout in nginx config if needed

## Security Notes

- SSL certificates auto-renew via certbot timer
- All HTTP traffic redirects to HTTPS
- Security headers are configured (HSTS, XSS Protection, etc.)
- Rate limiting can be added in nginx config if needed

## Configuration Files

- `nginx/upxl-api.conf` - Main nginx configuration
- `scripts/setup-nginx.sh` - Automated setup script

## Support

For issues or questions, contact the DevOps team.
