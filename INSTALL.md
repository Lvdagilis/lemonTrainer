# lemonTrainer Installation Guide

This guide will help you get lemonTrainer up and running on your computer or phone.

## Table of Contents
- [For Non-Technical Users](#for-non-technical-users)
- [For Technical Users](#for-technical-users)
- [Phone/Tablet Setup](#phonetablet-setup)
- [Troubleshooting](#troubleshooting)

---

## For Non-Technical Users

### The Easiest Way: Docker

If you have Docker installed (or can install it), this is the simplest method.

#### Step 1: Install Docker

**Windows & Mac:**
1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Run the installer
3. Follow the on-screen instructions
4. Restart your computer

**Linux:**
```bash
# Run this command in your terminal
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### Step 2: Download lemonTrainer

1. Download this project as a ZIP file
2. Extract it to a folder (e.g., `Documents/lemonTrainer`)
3. Open Terminal (Mac/Linux) or Command Prompt (Windows)
4. Navigate to the folder:
   ```bash
   cd Documents/lemonTrainer
   ```

#### Step 3: Run lemonTrainer

**Mac/Linux:**
```bash
./quick-start.sh
```

**Windows:**
```bash
docker-compose up -d --build
```

#### Step 4: Access the App

1. Open Chrome browser
2. Go to: `https://localhost:3000`
3. You'll see a security warning - this is normal
4. Click "Advanced" → "Proceed to localhost (unsafe)"
5. You're ready to ride!

### Alternative: Node.js Method

If you can't use Docker, try this method.

#### Step 1: Install Node.js

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Follow the on-screen instructions

#### Step 2: Download and Setup

1. Download this project as a ZIP file
2. Extract it to a folder
3. Open Terminal/Command Prompt
4. Navigate to the folder:
   ```bash
   cd path/to/lemonTrainer
   ```

#### Step 3: Install and Run

**Mac/Linux:**
```bash
# Install dependencies
npm install

# Generate SSL certificates
./setup-ssl.sh

# Start the server
npm start
```

**Windows:**
```bash
# Install dependencies
npm install

# Generate SSL certificates (you may need OpenSSL installed)
# Or skip this and use: npm run dev instead

# Start the server
npm start
```

#### Step 4: Access the App

1. Open Chrome browser
2. Go to: `https://localhost:3000` (or `https://localhost:5173` if using `npm run dev`)
3. Accept the security warning
4. Start using the app!

---

## For Technical Users

### Quick Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd wahooapp

# Option 1: Docker
docker-compose up -d --build

# Option 2: Node.js
npm install
./setup-ssl.sh
npm start

# Option 3: Development
npm install
npm run dev
```

Access at `https://localhost:3000` (or `:5173` for dev mode)

### Self-Hosting on Your Network

```bash
# Using Docker
docker-compose up -d

# Find your local IP
# Mac/Linux: ifconfig | grep "inet "
# Windows: ipconfig

# Access from any device on your network
# https://<your-local-ip>:3000
```

### Production Deployment

For production use, consider:

1. **Reverse Proxy with SSL**
   - Use nginx or Caddy
   - Get free SSL with Let's Encrypt
   - Example nginx config:
   ```nginx
   server {
       listen 443 ssl;
       server_name trainer.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass https://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Cloud Hosting**
   - Deploy to Vercel, Netlify, or similar
   - They handle HTTPS automatically
   - Just push your code and deploy

---

## Phone/Tablet Setup

### Android (Supported)

1. **Make sure your computer is running lemonTrainer**
   - Follow one of the installation methods above
   - Note your computer's IP address

2. **On your Android device**:
   - Open Chrome browser
   - Go to: `https://<your-computer-ip>:3000`
   - Example: `https://192.168.1.100:3000`
   - Accept the certificate warning

3. **Install as an App** (Optional):
   - Tap the menu (three dots)
   - Select "Install App" or "Add to Home Screen"
   - Now you can launch it like a regular app!

### iOS (Not Supported)

Unfortunately, iOS Safari does not support Web Bluetooth API, which is required for trainer communication.

**Workarounds**:
- Use an Android device
- Use a laptop/desktop with Chrome, Edge, or Opera
- Wait for Apple to add Web Bluetooth support (not currently planned)

---

## Troubleshooting

### "Command not found" errors

**Problem**: Terminal says `npm: command not found` or `docker: command not found`

**Solution**:
- For npm: Install Node.js from [nodejs.org](https://nodejs.org)
- For docker: Install Docker from [docker.com](https://docker.com)
- Close and reopen your terminal after installing

### "Permission denied" errors

**Mac/Linux**:
```bash
chmod +x quick-start.sh
chmod +x setup-ssl.sh
```

**Windows**: Run Command Prompt as Administrator

### "Port already in use"

**Problem**: Port 3000 is already being used

**Solution**:
```bash
# Find what's using port 3000
# Mac/Linux:
lsof -i :3000

# Windows:
netstat -ano | findstr :3000

# Then kill that process, or change the port in server.js
```

### Can't connect to trainer

1. **Check browser**: Must use Chrome, Edge, or Opera
2. **Check HTTPS**: URL must start with `https://`
3. **Check Bluetooth**: Make sure Bluetooth is enabled
4. **Check trainer**: Ensure trainer is powered on and in pairing mode
5. **Check other apps**: Close any other apps connected to the trainer

### Certificate warnings

This is normal for self-signed certificates in local development.

**Safe to proceed if**:
- You're accessing localhost or your own computer's IP
- You generated the certificates yourself

**How to proceed**:
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)" or similar
3. The warning appears because the certificate isn't from a trusted authority

**For production**, use a real SSL certificate from Let's Encrypt or your hosting provider.

### Can't access from phone

1. **Same network**: Phone and computer must be on the same WiFi
2. **Firewall**: Your computer's firewall might be blocking connections
   - Mac: System Preferences → Security & Privacy → Firewall
   - Windows: Windows Defender Firewall → Allow an app
3. **Correct IP**: Make sure you're using the right IP address
   - Should be something like `192.168.1.x`
   - Not `127.0.0.1` (that's localhost only)
4. **Port**: Include `:3000` at the end of the URL
5. **HTTPS**: Use `https://`, not `http://`

### "Web Bluetooth not supported"

**Possible causes**:
1. Wrong browser (use Chrome, Edge, or Opera)
2. Not using HTTPS (URL must be `https://`)
3. Browser is outdated (update to latest version)
4. Using iOS (not supported - see iOS section above)

---

## Getting Help

If you're still having issues:

1. Check the main [README.md](README.md) for more details
2. Search for your error message online
3. Create an issue on GitHub with:
   - Your operating system
   - Your browser and version
   - Steps to reproduce the problem
   - Any error messages you see

---

## Tips for Best Experience

1. **Use Chrome on Android** for mobile (best compatibility)
2. **Install as PWA** for app-like experience on phone
3. **Use Docker** if you're comfortable with it (easiest setup)
4. **Keep devices on same network** for phone access
5. **Accept certificate warnings** for localhost (safe in this case)
6. **Close other trainer apps** before connecting
7. **Use ERG mode** for the best smart trainer experience

Happy riding! 🚴‍♂️
