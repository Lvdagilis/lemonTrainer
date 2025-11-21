import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Workout } from '../types/workout';
import type { TrainerData } from '../services/ble';
import type { RecordedWorkout } from '../services/recorder';
import { WorkoutPlayer } from '../components/WorkoutPlayer';
import { formatDuration } from '../types/workout';
import { audioService } from '../services/audio';
import './RidePage.css';

interface Averages {
  power: number;
  cadence: number;
  speed: number;
  heartRate: number;
  samples: number;
  hrSamples: number;
}

type RideState = 'waiting' | 'countdown' | 'active';

// Keep last N data points for live charts
const CHART_HISTORY_SIZE = 60;

interface RidePageProps {
  workout: Workout | null; // null = free ride
  currentData: TrainerData | null;
  targetPower: number;
  isRecording: boolean;
  recordingTime: number;
  onSetTargetPower: (power: number) => void;
  onStartRecording: () => void;
  onStopRecording: () => RecordedWorkout | null;
  onEndRide: (recordedWorkout: RecordedWorkout | null) => void;
}

export function RidePage({
  workout,
  currentData,
  targetPower,
  recordingTime,
  onSetTargetPower,
  onStartRecording,
  onStopRecording,
  onEndRide,
}: RidePageProps) {
  const [rideState, setRideState] = useState<RideState>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [powerInput, setPowerInput] = useState(targetPower || 150);
  const [showAverages, setShowAverages] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const averagesRef = useRef<Averages>({ power: 0, cadence: 0, speed: 0, heartRate: 0, samples: 0, hrSamples: 0 });
  const [averages, setAverages] = useState<Averages>({ power: 0, cadence: 0, speed: 0, heartRate: 0, samples: 0, hrSamples: 0 });

  // Chart data history
  const [chartHistory, setChartHistory] = useState<{ power: number; cadence: number; heartRate?: number }[]>([]);

  // Handle countdown timer
  useEffect(() => {
    if (rideState !== 'countdown') return;

    if (countdown <= 0) {
      setRideState('active');
      onStartRecording();
      return;
    }

    audioService.countdownBeep();
    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rideState, countdown, onStartRecording]);

  const handleStartCountdown = () => {
    setRideState('countdown');
    setCountdown(3);
  };

  // Track averages and chart history
  useEffect(() => {
    if (!currentData) return;

    // Update averages
    const avg = averagesRef.current;
    avg.samples++;
    avg.power = avg.power + (currentData.power - avg.power) / avg.samples;
    avg.cadence = avg.cadence + (currentData.cadence - avg.cadence) / avg.samples;
    avg.speed = avg.speed + (currentData.speed - avg.speed) / avg.samples;
    if (currentData.heartRate) {
      avg.hrSamples++;
      avg.heartRate = avg.heartRate + (currentData.heartRate - avg.heartRate) / avg.hrSamples;
    }
    setAverages({ ...avg });

    // Update chart history (only during active ride)
    if (rideState === 'active') {
      setChartHistory(prev => {
        const newHistory = [...prev, {
          power: currentData.power,
          cadence: currentData.cadence,
          heartRate: currentData.heartRate
        }];
        return newHistory.slice(-CHART_HISTORY_SIZE);
      });
    }
  }, [currentData, rideState]);

  const handleSetPower = () => {
    onSetTargetPower(powerInput);
  };

  const handlePowerChange = (delta: number) => {
    const newPower = Math.max(0, Math.min(1000, powerInput + delta));
    setPowerInput(newPower);
  };

  const handleWorkoutTargetChange = useCallback((power: number) => {
    onSetTargetPower(power);
  }, [onSetTargetPower]);

  const handleWorkoutComplete = () => {
    const recorded = onStopRecording();
    onEndRide(recorded);
  };

  const handleEndRide = () => {
    const recorded = onStopRecording();
    onEndRide(recorded);
  };

  // Chart calculations
  const maxPower = useMemo(() => {
    if (chartHistory.length < 2) return 300;
    return Math.max(...chartHistory.map(d => d.power), targetPower || 100, 100);
  }, [chartHistory, targetPower]);

  const maxCadence = useMemo(() => {
    if (chartHistory.length < 2) return 120;
    return Math.max(...chartHistory.map(d => d.cadence), 80);
  }, [chartHistory]);

  // Show waiting/countdown screen before ride starts
  if (rideState === 'waiting' || rideState === 'countdown') {
    return (
      <div className="ride-page">
        {/* Live Metrics - visible during waiting */}
        <section className="stats-grid">
          <div className="stat-card stat-large">
            <span className="stat-value-large">{currentData?.power ?? '--'}</span>
            <span className="stat-label">Power (W)</span>
          </div>
          <div className="stat-card stat-large">
            <span className="stat-value-large">{currentData?.cadence ?? '--'}</span>
            <span className="stat-label">Cadence</span>
          </div>
          <div className="stat-card stat-large">
            <span className="stat-value-large">{currentData?.speed?.toFixed(1) ?? '--'}</span>
            <span className="stat-label">Speed (km/h)</span>
          </div>
          <div className={`stat-card stat-large ${!currentData?.heartRate ? 'stat-placeholder' : ''}`}>
            <span className="stat-value-large">{currentData?.heartRate ?? '--'}</span>
            <span className="stat-label">Heart Rate</span>
          </div>
        </section>

        {/* Pre-start info */}
        <div className="pre-start-card">
          <h2>{workout ? workout.name : 'Free Ride'}</h2>
          {workout && (
            <p className="pre-start-info">
              Duration: {formatDuration(workout.segments.reduce((t, s) => {
                if (s.type === 'steady' || s.type === 'ramp') return t + s.duration;
                if (s.type === 'intervals') return t + (s.onDuration + s.offDuration) * s.repetitions;
                return t;
              }, 0))}
            </p>
          )}

          {rideState === 'countdown' ? (
            <div className="countdown-display">
              <span className="countdown-big">{countdown}</span>
              <span className="countdown-text">Get Ready!</span>
            </div>
          ) : (
            <button className="btn btn-primary btn-large start-btn" onClick={handleStartCountdown}>
              Start {workout ? 'Workout' : 'Ride'}
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => onEndRide(null)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ride-page">
      {/* Workout Progress - at top for workouts only */}
      {workout && (
        <WorkoutPlayer
          workout={workout}
          currentPower={currentData?.power ?? 0}
          currentCadence={currentData?.cadence ?? 0}
          onTargetPowerChange={handleWorkoutTargetChange}
          onComplete={handleWorkoutComplete}
          onStop={handleEndRide}
        />
      )}

      {/* Recording Bar - for free ride show at top */}
      {!workout && (
        <div className="recording-bar">
          <span className="rec-dot"></span>
          <span className="rec-time">{formatDuration(recordingTime)}</span>
        </div>
      )}

      {/* Stats Grid - like Summary page */}
      <section className="stats-grid">
        <div className="stat-card stat-large">
          <span className="stat-value-large">{currentData?.power ?? '--'}</span>
          <span className="stat-label">Power (W)</span>
        </div>
        <div className="stat-card stat-large">
          <span className="stat-value-large">{currentData?.cadence ?? '--'}</span>
          <span className="stat-label">Cadence</span>
        </div>
        <div className="stat-card stat-large">
          <span className="stat-value-large">{currentData?.speed?.toFixed(1) ?? '--'}</span>
          <span className="stat-label">Speed (km/h)</span>
        </div>
        <div className={`stat-card stat-large ${!currentData?.heartRate ? 'stat-placeholder' : ''}`}>
          <span className="stat-value-large">{currentData?.heartRate ?? '--'}</span>
          <span className="stat-label">Heart Rate</span>
        </div>
      </section>

      {/* Averages Grid - toggleable */}
      {showAverages && (
        <section className="stats-grid stats-grid-small">
          <div className="stat-card stat-small">
            <span className="stat-value">{Math.round(averages.power)}</span>
            <span className="stat-label">Avg Power</span>
          </div>
          <div className="stat-card stat-small">
            <span className="stat-value">{Math.round(averages.cadence)}</span>
            <span className="stat-label">Avg Cadence</span>
          </div>
          <div className="stat-card stat-small">
            <span className="stat-value">{averages.speed.toFixed(1)}</span>
            <span className="stat-label">Avg Speed</span>
          </div>
          <div className="stat-card stat-small">
            <span className="stat-value">{averages.heartRate ? Math.round(averages.heartRate) : '--'}</span>
            <span className="stat-label">Avg HR</span>
          </div>
        </section>
      )}

      {/* Live Charts - toggleable */}
      {showCharts && chartHistory.length >= 2 && (
        <section className="chart-section">
          <h2>Live Power</h2>
          <div className="chart-container">
            <svg viewBox="0 0 400 80" className="chart" preserveAspectRatio="none">
              <LivePowerChart data={chartHistory} maxPower={maxPower} targetPower={targetPower} />
            </svg>
            <div className="chart-labels">
              <span>{maxPower}W</span>
              <span>0W</span>
            </div>
          </div>
        </section>
      )}

      {showCharts && chartHistory.length >= 2 && (
        <section className="chart-section">
          <h2>Live Cadence</h2>
          <div className="chart-container">
            <svg viewBox="0 0 400 60" className="chart" preserveAspectRatio="none">
              <LiveCadenceChart data={chartHistory} maxCadence={maxCadence} />
            </svg>
            <div className="chart-labels">
              <span>{maxCadence}</span>
              <span>0</span>
            </div>
          </div>
        </section>
      )}

      {/* Toggle Buttons */}
      <div className="toggle-buttons">
        <button className={`btn btn-small ${showAverages ? 'btn-active' : 'btn-outline'}`} onClick={() => setShowAverages(!showAverages)}>
          {showAverages ? 'Hide Avg' : 'Show Avg'}
        </button>
        <button className={`btn btn-small ${showCharts ? 'btn-active' : 'btn-outline'}`} onClick={() => setShowCharts(!showCharts)}>
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </button>
      </div>

      {/* ERG Controls - only for free ride */}
      {!workout && (
        <section className="card erg-controls">
          <h2>ERG Mode</h2>
          <div className="power-control">
            <button className="btn btn-small" onClick={() => handlePowerChange(-10)}>-10</button>
            <button className="btn btn-small" onClick={() => handlePowerChange(-5)}>-5</button>
            <input
              type="number"
              className="power-input"
              value={powerInput}
              onChange={(e) => setPowerInput(Number(e.target.value))}
              min={0}
              max={1000}
            />
            <button className="btn btn-small" onClick={() => handlePowerChange(5)}>+5</button>
            <button className="btn btn-small" onClick={() => handlePowerChange(10)}>+10</button>
          </div>
          <button className="btn btn-secondary" onClick={handleSetPower}>
            Set Target: {powerInput}W
          </button>
          {targetPower > 0 && (
            <p className="current-target">Current target: {targetPower}W</p>
          )}
        </section>
      )}

      {/* End Ride Button - only for free ride (workouts have Stop in WorkoutPlayer) */}
      {!workout && (
        <button className="btn btn-danger btn-large end-ride-btn" onClick={handleEndRide}>
          End Ride
        </button>
      )}
    </div>
  );
}

// Live Chart Components
interface LiveChartProps {
  data: { power: number; cadence: number; heartRate?: number }[];
  maxPower?: number;
  maxCadence?: number;
  targetPower?: number;
}

function LivePowerChart({ data, maxPower = 300, targetPower }: LiveChartProps) {
  if (data.length < 2) return null;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 400;
    const y = 80 - (d.power / maxPower) * 80;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,80 ${points} 400,80`;
  const targetY = targetPower ? 80 - (targetPower / maxPower) * 80 : null;

  return (
    <>
      <polygon points={areaPoints} fill="var(--accent)" fillOpacity="0.2" />
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {targetY !== null && targetPower && targetPower > 0 && (
        <line x1="0" y1={targetY} x2="400" y2={targetY} stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4,4" />
      )}
    </>
  );
}

function LiveCadenceChart({ data, maxCadence = 120 }: LiveChartProps) {
  if (data.length < 2) return null;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 400;
    const y = 60 - (d.cadence / maxCadence) * 60;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,60 ${points} 400,60`;

  return (
    <>
      <polygon points={areaPoints} fill="var(--success)" fillOpacity="0.2" />
      <polyline points={points} fill="none" stroke="var(--success)" strokeWidth="2" />
    </>
  );
}
