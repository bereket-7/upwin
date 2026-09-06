# UPXL Nginx Setup - Quick Guide

## Step-by-Step Setup (5 minutes)

### 1. Verify DNS Configuration
Ask your DNS admin to add:
```
Type: A
Name: upxl.sandbox.be.tibebai.com
Value: YOUR_VPS_IP
TTL: 300
```

Verify it's working:
```bash
nslookup upxl.sandbox.be.tibebai.com
# Should return your VPS IP
```

### 2. Upload Files to VPS
From your local machine:
```bash
# Navigate to project root
cd /path/to/upwin

# Upload infrastructure folder
scp -r infrastructure/ root@YOUR_VPS_IP:/root/
```

### 3. Run Setup Script
SSH into your VPS and run:
```bash
ssh root@YOUR_VPS_IP

cd /root/infrastructure
chmod +x scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh
```

The script will:
- ✅ Install certbot
- ✅ Get SSL certificate
- ✅ Configure nginx
- ✅ Setup firewall
- ✅ Enable auto-renewal

### 4. Test Your Setup
```bash
# Test health endpoint
curl https://upxl.sandbox.be.tibebai.com/health

# Should return: {"status":"healthy","timestamp":"..."}
```

### 5. Deploy Your Services
From your local machine:
```bash
git add .
git commit -m "Add nginx configuration"
git push origin staging
```

This will trigger GitHub Actions to deploy all services.

### 6. Verify Services
After deployment completes (check GitHub Actions):
```bash
# Test each service
curl https://upxl.sandbox.be.tibebai.com/auth/health
curl https://upxl.sandbox.be.tibebai.com/profile/health
curl https://upxl.sandbox.be.tibebai.com/ai/health
curl https://upxl.sandbox.be.tibebai.com/proposal/health
```

## Your API Endpoints

After setup, your services are available at:

| Service | URL | Port |
|---------|-----|------|
| Auth | `https://upxl.sandbox.be.tibebai.com/auth` | 3008 |
| Profile | `https://upxl.sandbox.be.tibebai.com/profile` | 3009 |
| AI Gateway | `https://upxl.sandbox.be.tibebai.com/ai` | 3007 |
| Proposal | `https://upxl.sandbox.be.tibebai.com/proposal` | 3010 |
| Health | `https://upxl.sandbox.be.tibebai.com/health` | - |

## Common Commands

### View Logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/upxl-api-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/upxl-api-error.log

# Service logs
docker logs -f auth-service-staging
docker logs -f profile-service-staging
docker logs -f ai-gateway-staging
docker logs -f proposal-service-staging
```

### Restart Services
```bash
# Restart nginx
sudo systemctl restart nginx

# Restart a service
docker restart auth-service-staging

# Restart all services
docker restart $(docker ps -q)
```

### Check Status
```bash
# Nginx status
sudo systemctl status nginx

# Docker containers
docker ps

# SSL certificate
sudo certbot certificates
```

## Troubleshooting

### Problem: DNS not resolving
**Solution**: Wait 5-10 minutes for DNS propagation, then verify with `nslookup`

### Problem: SSL certificate failed
**Solution**: 
1. Ensure DNS is pointing to your VPS
2. Ensure port 80 is open: `sudo ufw allow 80/tcp`
3. Try again: `sudo certbot certonly --nginx -d upxl.sandbox.be.tibebai.com`

### Problem: 502 Bad Gateway
**Solution**: Service container is not running
```bash
docker ps  # Check if container is running
docker logs auth-service-staging  # Check logs
docker restart auth-service-staging  # Restart service
```

### Problem: 504 Gateway Timeout
**Solution**: Service is slow or not responding
```bash
docker logs auth-service-staging  # Check for errors
# Increase timeout in nginx config if needed
```

## What's Next?

1. ✅ Update your frontend (separate repo) to use: `https://upxl.sandbox.be.tibebai.com`
2. ✅ Update GitHub secrets:
   - `ALLOWED_ORIGINS=https://upxl.sandbox.be.tibebai.com` (frontend origin for credentialed CORS; no `*`)
   - `FRONTEND_URL=https://upxl.sandbox.be.tibebai.com` (or the real FE origin if different)
   - `API_URL=https://upxl.sandbox.be.tibebai.com`
   - See root [README.md](../README.md) **Frontend integration** and **Required GitHub Actions secrets**
3. ✅ Test all API endpoints with Postman
4. ✅ Monitor logs for any issues

## Support

If you encounter issues:
1. Check nginx logs: `sudo tail -50 /var/log/nginx/upxl-api-error.log`
2. Check service logs: `docker logs <service-name>`
3. Test nginx config: `sudo nginx -t`
4. Verify DNS: `nslookup upxl.sandbox.be.tibebai.com`

---

**Setup Time**: ~5 minutes  
**SSL Certificate**: Auto-renews every 90 days  
**Monitoring**: Check logs regularly
