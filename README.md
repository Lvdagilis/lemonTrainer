# lemonTrainer

A web-based cycling trainer app for Wahoo Kickr Core and other Bluetooth smart trainers. Control ERG mode, follow structured workouts, and track your rides - all from your browser!

## ✨ Features

- **Bluetooth Smart Trainer Control** - Connect to Wahoo Kickr Core and compatible trainers via Web Bluetooth
- **Heart Rate Monitor Support** - Connect Bluetooth HR monitors for heart rate tracking
- **ERG Mode** - Set and control target power output
- **Structured Workouts** - Create and follow interval workouts with:
  - Steady-state segments
  - Ramp segments (progressive power changes)
  - Interval segments (on/off repetitions)
- **Live Metrics** - Real-time display of power, cadence, speed, and heart rate
- **Live Charts** - Visual graphs of power and cadence during rides
- **Workout Recording** - Automatic recording with summary statistics
- **FIT File Export** - Export rides in standard FIT format for upload to Strava, Garmin Connect, etc.
- **Audio Cues** - Countdown beeps and segment change alerts
- **PWA Support** - Install on your phone or tablet home screen

## 📋 Requirements

### Browser Compatibility
- **Desktop**: Chrome, Edge, or Opera (Web Bluetooth required)
- **Mobile**: Chrome on Android (iOS Safari does not support Web Bluetooth)
- **HTTPS Required**: The app must be served over HTTPS (or localhost)

### Hardware
- Bluetooth smart trainer (Wahoo Kickr Core, etc.)
- Optional: Bluetooth heart rate monitor

## 🚀 Quick Start

### Want it Publicly Available?

Deploy to the web for free! See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step guides:
- ⭐ **Vercel** (Recommended - 1-click deploy)
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**

All provide free HTTPS hosting!

### Self-Hosting at Home

### Option 1: Docker (Easiest for Self-Hosting)

```bash
# Run the quick start script
./quick-start.sh

# Access at https://localhost:3000
```

Or manually with Docker:

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# Access at https://localhost:3000
```

### Option 2: Simple Node.js Server

```bash
# Install dependencies
npm install

# Generate SSL certificates
./setup-ssl.sh

# Build and start the server
npm start

# Access at https://localhost:3000
```

### Option 3: Development Mode

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Access at https://localhost:5173
```

## 🌐 Accessing from Other Devices

To use the app on your phone or tablet:

1. **Find your computer's IP address**:
   - **macOS/Linux**: `ifconfig | grep 'inet '` or `ip addr show`
   - **Windows**: `ipconfig`

2. **Access from your device**:
   - Open Chrome on your Android device
   - Navigate to `https://<your-ip>:3000`
   - Accept the self-signed certificate warning

3. **Install as PWA** (optional):
   - Tap the menu and select "Install App" or "Add to Home Screen"
   - The app will now work like a native app!

## 📱 Mobile Browser Support

| Browser | Platform | Supported |
|---------|----------|-----------|
| Chrome | Android | ✅ Yes |
| Chrome | iOS | ❌ No (Web Bluetooth not supported) |
| Safari | iOS | ❌ No (Web Bluetooth not supported) |
| Safari | macOS | ❌ No (Web Bluetooth not supported) |
| Firefox | All | ❌ No (Web Bluetooth not supported) |
| Edge | Android | ✅ Yes |
| Edge | Desktop | ✅ Yes |

**Note**: Web Bluetooth API is not available on iOS devices. Android with Chrome is recommended for mobile use.

## 🏠 Self-Hosting Options

### Docker Deployment

The easiest way to self-host is using Docker:

```bash
# Build the image
docker build -t lemontrainer .

# Run the container
docker run -d -p 3000:3000 --name lemontrainer lemontrainer

# Or use docker-compose
docker-compose up -d
```

### Network Access

To make the app accessible on your local network:

1. **Allow port 3000** in your firewall
2. **Find your local IP**: `192.168.x.x` or similar
3. **Access from devices**: `https://192.168.x.x:3000`

### Port Forwarding (External Access)

To access from outside your home network:

1. **Set up port forwarding** on your router (port 3000 → your computer's local IP)
2. **Find your public IP**: Visit `https://whatismyip.com`
3. **Access externally**: `https://<your-public-ip>:3000`

**Security Note**: Self-signed certificates will show warnings. For production use, consider:
- Using a reverse proxy (nginx, Caddy) with Let's Encrypt
- Deploying to a cloud platform (Vercel, Netlify, etc.)

## 🔧 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📖 Usage Guide

1. **Connect Your Trainer**
   - Click "Connect Trainer" button
   - Select your trainer from the Bluetooth device list
   - Wait for connection to establish

2. **Optional: Connect Heart Rate Monitor**
   - Click "Connect HR Monitor"
   - Select your HR monitor from the list

3. **Choose Your Workout Mode**
   - **Free Ride**: Manual power control
   - **Structured Workout**: Follow pre-designed intervals

4. **Start Riding**
   - The app will control your trainer's resistance
   - Follow the on-screen power targets
   - Monitor your live stats and charts

5. **Export Your Ride**
   - After finishing, view your summary
   - Export as FIT file for Strava, Garmin Connect, etc.

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **APIs**: Web Bluetooth API, Web Audio API
- **Data Format**: FIT (Flexible and Interoperable Data Transfer)
- **PWA**: Service Workers for offline support

## 🐛 Troubleshooting

### "Web Bluetooth not supported" error
- Ensure you're using Chrome, Edge, or Opera
- Check that you're accessing via HTTPS or localhost
- Update your browser to the latest version

### Connection fails
- Make sure your trainer is in pairing mode
- Check Bluetooth is enabled on your device
- Try restarting both the app and your trainer
- Ensure no other app is connected to the trainer

### Certificate warnings
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost (unsafe)"
- For production, use proper SSL certificates

### Can't access from phone
- Ensure phone and computer are on the same network
- Check firewall isn't blocking port 3000
- Use Chrome on Android (iOS Safari not supported)
- Accept the certificate warning

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## ⚠️ Disclaimer

This is an independent project and is not affiliated with or endorsed by Wahoo Fitness.
