# lemonTrainer

A web-based cycling trainer app for Wahoo Kickr Core and other Bluetooth smart trainers. Control ERG mode, follow structured workouts, and track your rides.

## Features

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

## Requirements

- Modern browser with Web Bluetooth support (Chrome, Edge, or Opera)
- Bluetooth smart trainer (Wahoo Kickr Core, etc.)
- Optional: Bluetooth heart rate monitor

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Open the app in a supported browser
2. Click "Connect Trainer" to pair your smart trainer
3. Optionally connect a heart rate monitor
4. Choose "Free Ride" for manual ERG control, or select/create a structured workout
5. Start your ride and follow the on-screen targets
6. After your ride, view the summary and export your workout

## Tech Stack

- React 18 + TypeScript
- Vite
- Web Bluetooth API
- FIT SDK for workout export

## License

MIT
