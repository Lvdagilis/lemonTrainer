import { useEffect, useState, useRef, useCallback } from 'react';
import type { Workout, IntervalsSegment } from '../types/workout';
import { getWorkoutPosition, getWorkoutDuration, getSegmentDuration, formatDuration } from '../types/workout';
import { audioService } from '../services/audio';
import './WorkoutPlayer.css';

interface WorkoutPlayerProps {
  workout: Workout;
  currentPower: number;
  currentCadence: number;
  onTargetPowerChange: (power: number) => void;
  onComplete: () => void;
  onStop: () => void;
}

export function WorkoutPlayer({
  workout,
  currentPower,
  currentCadence,
  onTargetPowerChange,
  onComplete,
  onStop,
}: WorkoutPlayerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [countdownAlert, setCountdownAlert] = useState<string | null>(null);
  const [stopConfirmPending, setStopConfirmPending] = useState(false);

  const lastPowerRef = useRef<number>(0);
  const lastPositionRef = useRef<{ segmentIndex: number; isOnPhase?: boolean }>({ segmentIndex: 0 });
  const stopConfirmTimeoutRef = useRef<number | null>(null);

  const totalDuration = getWorkoutDuration(workout);
  const position = getWorkoutPosition(workout, elapsedTime);
  const currentSegment = workout.segments[position.segmentIndex];
  const segmentDuration = getSegmentDuration(currentSegment);

  // Timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Handle segment/phase changes and audio alerts
  useEffect(() => {
    const last = lastPositionRef.current;

    // Segment changed
    if (position.segmentIndex !== last.segmentIndex) {
      audioService.segmentChange();
      last.segmentIndex = position.segmentIndex;
      last.isOnPhase = position.intervalState?.isOnPhase;
    }
    // Interval phase changed
    else if (position.intervalState && position.intervalState.isOnPhase !== last.isOnPhase) {
      if (position.intervalState.isOnPhase) {
        audioService.intervalOn();
      } else {
        audioService.intervalOff();
      }
      last.isOnPhase = position.intervalState.isOnPhase;
    }
  }, [position.segmentIndex, position.intervalState?.isOnPhase, position.intervalState?.currentRep]);

  // Countdown alerts
  useEffect(() => {
    if (isPaused || position.isComplete) return;

    const timeUntil = Math.ceil(position.timeUntilChange);

    if (timeUntil <= 3 && timeUntil > 0) {
      audioService.countdownBeep();
      setCountdownAlert(timeUntil.toString());
    } else {
      setCountdownAlert(null);
    }
  }, [Math.ceil(position.timeUntilChange), isPaused, position.isComplete]);

  // Update target power when it changes
  useEffect(() => {
    if (position.isComplete) {
      audioService.workoutComplete();
      onComplete();
      return;
    }

    if (position.targetPower !== lastPowerRef.current) {
      lastPowerRef.current = position.targetPower;
      onTargetPowerChange(position.targetPower);
    }
  }, [position.targetPower, position.isComplete, onTargetPowerChange, onComplete]);

  // Cleanup stop confirm timeout
  useEffect(() => {
    return () => {
      if (stopConfirmTimeoutRef.current) {
        clearTimeout(stopConfirmTimeoutRef.current);
      }
    };
  }, []);

  // Skip functions
  const skipToTime = useCallback((newTime: number) => {
    setElapsedTime(Math.min(newTime, totalDuration));
  }, [totalDuration]);

  const skipCurrentPhase = useCallback(() => {
    if (!position.intervalState) return;
    const newTime = elapsedTime + Math.ceil(position.timeUntilChange);
    skipToTime(newTime);
  }, [elapsedTime, position.intervalState, position.timeUntilChange, skipToTime]);

  const skipToRest = useCallback(() => {
    if (!position.intervalState || !position.intervalState.isOnPhase) return;
    skipCurrentPhase();
  }, [position.intervalState, skipCurrentPhase]);

  const skipCurrentRep = useCallback(() => {
    if (!position.intervalState) return;
    const segment = currentSegment as IntervalsSegment;
    const cycleLength = segment.onDuration + segment.offDuration;
    const currentRepStart = position.timeInSegment - position.intervalState.timeInPhase -
      (position.intervalState.isOnPhase ? 0 : segment.onDuration);
    const nextRepStart = currentRepStart + cycleLength;

    const segmentStartTime = elapsedTime - position.timeInSegment;
    const newTime = segmentStartTime + nextRepStart;
    skipToTime(Math.min(newTime, totalDuration));
  }, [position, currentSegment, elapsedTime, skipToTime, totalDuration]);

  const skipSegment = useCallback(() => {
    let accumulatedTime = 0;
    for (let i = 0; i <= position.segmentIndex; i++) {
      accumulatedTime += getSegmentDuration(workout.segments[i]);
    }
    skipToTime(accumulatedTime);
  }, [position.segmentIndex, workout.segments, skipToTime]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioService.setMuted(newMuted);
  };

  const handleStopClick = () => {
    if (stopConfirmPending) {
      // Second click - actually stop
      if (stopConfirmTimeoutRef.current) {
        clearTimeout(stopConfirmTimeoutRef.current);
      }
      onStop();
    } else {
      // First click - show confirm
      setStopConfirmPending(true);
      stopConfirmTimeoutRef.current = setTimeout(() => {
        setStopConfirmPending(false);
      }, 3000);
    }
  };

  const timeRemaining = totalDuration - elapsedTime;
  const segmentTimeRemaining = segmentDuration - position.timeInSegment;
  const progress = (elapsedTime / totalDuration) * 100;

  // Get next segment info
  const nextSegment = position.segmentIndex < workout.segments.length - 1
    ? workout.segments[position.segmentIndex + 1]
    : null;

  // Power/cadence diff calculations
  const powerDiff = currentPower - position.targetPower;
  const isPowerOnTarget = Math.abs(powerDiff) < 10;
  const cadenceDiff = position.targetCadence !== undefined ? currentCadence - position.targetCadence : 0;
  const isCadenceOnTarget = position.targetCadence === undefined || Math.abs(cadenceDiff) <= 5;

  // Phase time remaining (for intervals)
  const phaseTimeRemaining = position.intervalState
    ? Math.ceil(position.timeUntilChange)
    : null;

  return (
    <div className="workout-player">
      {/* Header with title and mute */}
      <div className="player-header">
        <h2>{workout.name}</h2>
        <button
          className={`btn btn-small btn-mute ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="player-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-segments">
            {workout.segments.map((seg, i) => {
              const segStart = workout.segments.slice(0, i).reduce((t, s) => t + getSegmentDuration(s), 0);
              const segWidth = (getSegmentDuration(seg) / totalDuration) * 100;
              return (
                <div
                  key={i}
                  className={`progress-segment ${i === position.segmentIndex ? 'active' : ''}`}
                  style={{ left: `${(segStart / totalDuration) * 100}%`, width: `${segWidth}%` }}
                />
              );
            })}
          </div>
        </div>
        <div className="progress-times">
          <span>{formatDuration(elapsedTime)}</span>
          <span>-{formatDuration(timeRemaining)}</span>
        </div>
      </div>

      {/* Current Segment Info */}
      <div className="segment-card">
        <div className="segment-header-row">
          <div className="segment-info">
            <span className="segment-label">Current</span>
            <span className="segment-name">{currentSegment.name}</span>
            {position.intervalState && (
              <span className="interval-badge">
                Rep {position.intervalState.currentRep}/{position.intervalState.totalReps}
                {' · '}
                <span className={position.intervalState.isOnPhase ? 'phase-on' : 'phase-off'}>
                  {position.intervalState.isOnPhase ? 'ON' : 'REST'}
                </span>
              </span>
            )}
          </div>
          <div className="segment-times">
            {/* Show phase time for intervals, segment time otherwise */}
            {phaseTimeRemaining !== null ? (
              <>
                <span className="phase-time">-{formatDuration(phaseTimeRemaining)}</span>
                <span className="segment-time-small">Seg: -{formatDuration(Math.ceil(segmentTimeRemaining))}</span>
              </>
            ) : (
              <span className="segment-time">-{formatDuration(Math.ceil(segmentTimeRemaining))}</span>
            )}
          </div>
        </div>

        {/* Skip buttons */}
        <div className="skip-buttons">
          {position.intervalState && position.intervalState.isOnPhase && (
            <button className="btn btn-small btn-outline" onClick={skipToRest}>
              Skip to Rest
            </button>
          )}
          {position.intervalState && (
            <button className="btn btn-small btn-outline" onClick={skipCurrentRep}>
              Skip Rep
            </button>
          )}
          <button className="btn btn-small btn-outline" onClick={skipSegment}>
            Skip Segment
          </button>
        </div>
      </div>

      {/* Targets Row */}
      <div className="targets-row">
        <div className="target-item">
          <span className="target-label">Target Power</span>
          <span className="target-value">{position.targetPower}W</span>
          <span className={`target-diff ${isPowerOnTarget ? 'on-target' : powerDiff > 0 ? 'high' : 'low'}`}>
            {isPowerOnTarget ? '✓' : `${powerDiff > 0 ? '+' : ''}${powerDiff}W`}
          </span>
        </div>
        {position.targetCadence !== undefined && (
          <div className="target-item">
            <span className="target-label">Target Cadence</span>
            <span className="target-value">{position.targetCadence} RPM</span>
            <span className={`target-diff ${isCadenceOnTarget ? 'on-target' : cadenceDiff > 0 ? 'high' : 'low'}`}>
              {isCadenceOnTarget ? '✓' : `${cadenceDiff > 0 ? '+' : ''}${cadenceDiff}`}
            </span>
          </div>
        )}
      </div>

      {/* Up Next */}
      <div className="upcoming-section">
        <span className="upcoming-label">Up Next</span>
        {nextSegment ? (
          <div className="upcoming-card">
            <span className="upcoming-name">{nextSegment.name}</span>
            <span className="upcoming-duration">{formatDuration(getSegmentDuration(nextSegment))}</span>
            <span className="upcoming-power">
              {nextSegment.type === 'steady' && `${nextSegment.power}W`}
              {nextSegment.type === 'ramp' && `${nextSegment.startPower}W → ${nextSegment.endPower}W`}
              {nextSegment.type === 'intervals' && `${nextSegment.onPower}W / ${nextSegment.offPower}W`}
            </span>
          </div>
        ) : (
          <div className="upcoming-card upcoming-complete">
            <span className="upcoming-name">Workout Complete!</span>
          </div>
        )}
      </div>

      {/* Pause Button */}
      <button
        className={`btn btn-large ${isPaused ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setIsPaused(!isPaused)}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>

      {/* Stop Button (requires double click) */}
      <button
        className={`btn btn-large ${stopConfirmPending ? 'btn-danger' : 'btn-outline btn-stop'}`}
        onClick={handleStopClick}
      >
        {stopConfirmPending ? 'Tap again to Stop' : 'Stop Workout'}
      </button>

      {/* Countdown Alert Overlay */}
      {countdownAlert && (
        <div className="countdown-overlay">
          <span className="countdown-number">{countdownAlert}</span>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <div className="paused-overlay">
          <span>PAUSED</span>
        </div>
      )}
    </div>
  );
}
