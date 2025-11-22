# Changelog

All notable changes to lemonTrainer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-22

### Added
- Initial public release of lemonTrainer
- Web Bluetooth support for FTMS-compatible smart trainers (Wahoo Kickr, etc.)
- Heart rate monitor connection via Bluetooth
- ERG mode power control
- Structured workout designer with three segment types:
  - Steady-state segments
  - Ramp segments (progressive power changes)
  - Interval segments (on/off repetitions)
- Live metrics display (power, cadence, speed, heart rate)
- Real-time power and cadence charts during rides
- Workout recording with automatic statistics
- FIT file export for Strava, Garmin Connect, Training Peaks
- Audio countdown cues and segment alerts
- PWA support for installable home screen app
- Multiple deployment options (Vercel, Netlify, GitHub Pages, Cloudflare Pages)
- Docker containerization for easy self-hosting
- HTTPS server with self-signed certificates for local development
- Content Security Policy (CSP) headers
- React Error Boundary for graceful error handling
- Browser compatibility detection and warnings
- Comprehensive documentation (README, INSTALL, DEPLOYMENT, QUICK_REFERENCE)

### Security
- Content Security Policy (CSP) to prevent XSS attacks
- Proper null checking throughout codebase
- No production console logging
- HTTPS requirement enforced
- Error boundary catches React errors gracefully

### Developer Experience
- TypeScript with strict mode enabled
- ESLint configuration for code quality
- JSDoc comments on public APIs
- Clean component architecture
- Comprehensive build and deployment scripts

[1.0.0]: https://github.com/Lvdagilis/lemonTrainer/releases/tag/v1.0.0
