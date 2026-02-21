#!/bin/bash
# Setup script for UPXL API Nginx configuration
# Run this on your VPS as root or with sudo

set -e

DOMAIN="upxl.sandbox.be.tibebai.com"
CONFIG_NAME="upxl-api"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "=========================================="
echo "UPXL API Nginx Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Nginx is not installed. Installing..."
    apt update
    apt install -y nginx
fi

echo "Step 1: Installing certbot for SSL..."
apt update
apt install -y certbot python3-certbot-nginx

echo ""
echo "Step 2: Obtaining SSL certificate..."
echo "Make sure DNS is pointing to this server!"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Stop nginx temporarily for certbot standalone
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@tibebai.com || {
    echo "SSL certificate generation failed. Please check:"
    echo "1. DNS is pointing to this server"
    echo "2. Port 80 is accessible"
    echo "3. Domain name is correct"
    systemctl start nginx
    exit 1
}

# Start nginx again
systemctl start nginx

echo ""
echo "Step 3: Copying nginx configuration..."

# Backup existing config if it exists
if [ -f "$NGINX_AVAILABLE/$CONFIG_NAME" ]; then
    echo "Backing up existing config..."
    cp "$NGINX_AVAILABLE/$CONFIG_NAME" "$NGINX_AVAILABLE/$CONFIG_NAME.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy config (you'll need to upload the config file first)
if [ -f "./upxl-api.conf" ]; then
    cp ./upxl-api.conf "$NGINX_AVAILABLE/$CONFIG_NAME"
else
    echo "Error: upxl-api.conf not found in current directory"
    echo "Please upload the config file first"
    exit 1
fi

echo ""
echo "Step 4: Enabling site..."

# Remove old symlink if exists
if [ -L "$NGINX_ENABLED/$CONFIG_NAME" ]; then
    rm "$NGINX_ENABLED/$CONFIG_NAME"
fi

# Create symlink
ln -s "$NGINX_AVAILABLE/$CONFIG_NAME" "$NGINX_ENABLED/$CONFIG_NAME"

echo ""
echo "Step 5: Testing nginx configuration..."
nginx -t || {
    echo "Nginx configuration test failed!"
    exit 1
}

echo ""
echo "Step 6: Reloading nginx..."
systemctl reload nginx

echo ""
echo "Step 7: Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "Step 8: Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your API is now available at:"
echo "  https://$DOMAIN/auth"
echo "  https://$DOMAIN/profile"
echo "  https://$DOMAIN/ai"
echo "  https://$DOMAIN/proposal"
echo ""
echo "Health check: https://$DOMAIN/health"
echo ""
echo "SSL certificate will auto-renew via certbot timer"
echo ""
echo "Useful commands:"
echo "  sudo nginx -t              # Test config"
echo "  sudo systemctl reload nginx # Reload nginx"
echo "  sudo certbot renew --dry-run # Test SSL renewal"
echo "  sudo tail -f /var/log/nginx/upxl-api-error.log # View logs"
echo ""
