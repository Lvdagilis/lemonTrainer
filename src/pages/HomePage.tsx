import { useState, useEffect } from 'react';
import type { Workout } from '../types/workout';
import type { ConnectionStatus } from '../services/ble';
import { WorkoutDesigner } from '../components/WorkoutDesigner';
import { getSavedWorkouts, getWorkoutDuration, formatDuration } from '../services/workoutStorage';
import './HomePage.css';

interface HomePageProps {
  connectionStatus: ConnectionStatus;
  statusMessage: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartWorkout: (workout: Workout | null) => void; // null = free ride
  hrStatus: ConnectionStatus;
  hrDeviceName: string | null;
  onConnectHR: () => void;
  onDisconnectHR: () => void;
}

export function HomePage({
  connectionStatus,
  statusMessage,
  onConnect,
  onDisconnect,
  onStartWorkout,
  hrStatus,
  hrDeviceName,
  onConnectHR,
  onDisconnectHR,
}: HomePageProps) {
  const [showDesigner, setShowDesigner] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    setSavedWorkouts(getSavedWorkouts());
  }, [showDesigner]); // Refresh when closing designer

  const isConnected = connectionStatus === 'connected';

  const handleStartWorkout = (workout: Workout) => {
    setShowDesigner(false);
    onStartWorkout(workout);
  };

  if (showDesigner) {
    return (
      <div className="home-page">
        <WorkoutDesigner
          onStartWorkout={handleStartWorkout}
          onClose={() => setShowDesigner(false)}
          isConnected={isConnected}
        />
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Connection Cards */}
      <section className="card connection-card">
        <div className="connection-info">
          <span className={`status-dot ${connectionStatus}`}></span>
          <span className="connection-text">
            {statusMessage || (isConnected ? 'Trainer connected' : 'No trainer connected')}
          </span>
        </div>
        <button
          className={`btn ${isConnected ? 'btn-secondary' : 'btn-primary'} ${connectionStatus === 'connecting' ? 'loading' : ''}`}
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={connectionStatus === 'connecting'}
        >
          {connectionStatus === 'connecting' ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Trainer'}
        </button>
      </section>

      {/* HR Monitor Card */}
      <section className="card connection-card hr-card">
        <div className="connection-info">
          <span className={`status-dot ${hrStatus}`}></span>
          <span className="connection-text">
            {hrStatus === 'connected' && hrDeviceName
              ? `HR: ${hrDeviceName}`
              : hrStatus === 'connecting'
              ? 'Connecting HR...'
              : 'No HR monitor'}
          </span>
        </div>
        <button
          className={`btn ${hrStatus === 'connected' ? 'btn-secondary' : 'btn-outline'} ${hrStatus === 'connecting' ? 'loading' : ''}`}
          onClick={hrStatus === 'connected' ? onDisconnectHR : onConnectHR}
          disabled={hrStatus === 'connecting'}
        >
          {hrStatus === 'connecting' ? 'Connecting...' : hrStatus === 'connected' ? 'Disconnect' : 'Connect HR'}
        </button>
      </section>

      {/* Quick Start */}
      <section className="card">
        <h2>Quick Start</h2>
        <div className="quick-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={() => onStartWorkout(null)}
            disabled={!isConnected}
          >
            Free Ride
          </button>
          <button
            className="btn btn-secondary btn-large"
            onClick={() => setShowDesigner(true)}
          >
            Create Workout
          </button>
        </div>
      </section>

      {/* Saved Workouts */}
      {savedWorkouts.length > 0 && (
        <section className="card">
          <h2>My Workouts</h2>
          <div className="workout-list">
            {savedWorkouts.map((workout) => (
              <div key={workout.id} className="workout-item">
                <div className="workout-info">
                  <span className="workout-name">{workout.name}</span>
                  <span className="workout-meta">
                    {workout.segments.length} segments · {formatDuration(getWorkoutDuration(workout))}
                  </span>
                </div>
                <button
                  className="btn btn-small"
                  onClick={() => onStartWorkout(workout)}
                  disabled={!isConnected}
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sample Workouts */}
      <section className="card">
        <h2>Templates</h2>
        <div className="workout-list">
          {sampleWorkouts.map((workout) => (
            <div key={workout.id} className="workout-item">
              <div className="workout-info">
                <span className="workout-name">{workout.name}</span>
                <span className="workout-meta">
                  {workout.segments.length} segments · {formatDuration(getWorkoutDuration(workout))}
                </span>
              </div>
              <button
                className="btn btn-small"
                onClick={() => onStartWorkout(workout)}
                disabled={!isConnected}
              >
                Start
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Sample workout templates
const sampleWorkouts: Workout[] = [
  {
    id: 'template-warmup',
    name: 'Quick Warmup',
    segments: [
      { type: 'ramp', name: 'Warmup', duration: 300, startPower: 100, endPower: 150 },
      { type: 'steady', name: 'Hold', duration: 120, power: 150 },
    ],
  },
  {
    id: 'template-endurance',
    name: '30min Endurance',
    segments: [
      { type: 'ramp', name: 'Warmup', duration: 300, startPower: 100, endPower: 160 },
      { type: 'steady', name: 'Endurance', duration: 1200, power: 160 },
      { type: 'ramp', name: 'Cooldown', duration: 300, startPower: 160, endPower: 100 },
    ],
  },
  {
    id: 'template-intervals',
    name: '4x4 Intervals',
    segments: [
      { type: 'ramp', name: 'Warmup', duration: 300, startPower: 100, endPower: 180 },
      { type: 'intervals', name: '4x4min', repetitions: 4, onDuration: 240, onPower: 250, offDuration: 240, offPower: 120 },
      { type: 'ramp', name: 'Cooldown', duration: 300, startPower: 150, endPower: 100 },
    ],
  },
  {
    id: 'template-tabata',
    name: 'Tabata',
    segments: [
      { type: 'ramp', name: 'Warmup', duration: 300, startPower: 100, endPower: 150 },
      { type: 'intervals', name: 'Tabata', repetitions: 8, onDuration: 20, onPower: 350, offDuration: 10, offPower: 100 },
      { type: 'steady', name: 'Recovery', duration: 120, power: 100 },
      { type: 'ramp', name: 'Cooldown', duration: 180, startPower: 120, endPower: 80 },
    ],
  },
];
