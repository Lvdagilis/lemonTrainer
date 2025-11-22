# lemonTrainer Quick Reference

## 🚀 Getting Started in 60 Seconds

### Docker Users (Recommended)
```bash
./quick-start.sh
# Open Chrome → https://localhost:3000
```

### Node.js Users
```bash
npm install && ./setup-ssl.sh && npm start
# Open Chrome → https://localhost:3000
```

### Developers
```bash
npm install && npm run dev
# Open Chrome → https://localhost:5173
```

---

## 📱 Access from Phone

1. Find your computer's IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
2. On Android + Chrome: `https://<your-ip>:3000`
3. Accept certificate warning
4. Install as PWA (optional): Menu → "Add to Home Screen"

**⚠️ iOS not supported** (Safari doesn't support Web Bluetooth)

---

## 🎯 Quick Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start development server |
| `npm start` | Build and run production server |
| `npm run build` | Build for production |
| `./setup-ssl.sh` | Generate SSL certificates |
| `./quick-start.sh` | One-command Docker setup |
| `docker-compose up -d` | Start Docker container |
| `docker-compose down` | Stop Docker container |
| `docker logs lemontrainer` | View Docker logs |

---

## ✅ Browser Compatibility

| ✅ Supported | ❌ Not Supported |
|--------------|------------------|
| Chrome (Desktop/Android) | Safari (all platforms) |
| Edge (Desktop/Android) | Firefox (all platforms) |
| Opera (Desktop) | Chrome iOS |

**Requirements:**
- HTTPS (or localhost)
- Web Bluetooth API
- Modern browser

---

## 🔧 Common Issues

### "Web Bluetooth not supported"
→ Use Chrome/Edge/Opera, ensure HTTPS, update browser

### Can't connect to trainer
→ Check Bluetooth enabled, trainer in pairing mode, close other apps

### Certificate warning
→ Normal for self-signed certs, safe to proceed on localhost

### Can't access from phone
→ Same WiFi network, use `https://<ip>:3000`, Android + Chrome only

### Port 3000 already in use
→ Change PORT in docker-compose.yml or kill process using port

---

## 🏠 Self-Hosting

### Local Network Access
```bash
# Your devices can access at:
https://<your-local-ip>:3000
# Example: https://192.168.1.100:3000
```

### External Access (Advanced)
1. Port forward 3000 on your router
2. Use your public IP: `https://<public-ip>:3000`
3. Consider using a reverse proxy with Let's Encrypt

### Production SSL (Recommended)
```bash
# Use Caddy (automatic HTTPS)
caddy reverse-proxy --from yourdomain.com --to localhost:3000
```

---

## 📊 Feature Checklist

- ✅ Connect Bluetooth smart trainer
- ✅ Connect heart rate monitor
- ✅ Free ride with manual power control
- ✅ Create structured workouts
- ✅ Follow interval workouts
- ✅ Real-time power/cadence/HR metrics
- ✅ Live charts during ride
- ✅ Record workouts
- ✅ Export to FIT format
- ✅ Upload to Strava/Garmin
- ✅ Audio countdown cues
- ✅ PWA install on phone

---

## 🔐 Ports & URLs

| Mode | Port | URL |
|------|------|-----|
| Development | 5173 | https://localhost:5173 |
| Production | 3000 | https://localhost:3000 |
| Docker | 3000 | https://localhost:3000 |
| Network | 3000 | https://\<your-ip\>:3000 |

---

## 📝 Default Paths

```
Project root
├── src/             - Source code
├── dist/            - Built files (after npm run build)
├── certs/           - SSL certificates (generated)
├── public/          - Static assets
├── server.js        - Production HTTPS server
├── Dockerfile       - Docker image
├── docker-compose.yml - Docker setup
└── setup-ssl.sh     - SSL cert generator
```

---

## 💡 Pro Tips

1. **Docker = Easiest** - If you have Docker, use it
2. **PWA on Phone** - Install to home screen for app-like feel
3. **Same Network** - Keep all devices on same WiFi
4. **Chrome Android** - Best mobile experience
5. **Close Other Apps** - Disconnect trainer from Zwift/TrainerRoad/etc
6. **FIT Export** - Works with Strava, Garmin Connect, Training Peaks
7. **Firewall** - Allow port 3000 if phone can't connect

---

## 🆘 Need Help?

1. Read [INSTALL.md](INSTALL.md) for detailed setup
2. Read [README.md](README.md) for full documentation
3. Check troubleshooting sections in both files
4. Open an issue on GitHub

---

**Remember:** This app requires HTTPS and Web Bluetooth. Use Chrome/Edge/Opera on desktop or Android!
