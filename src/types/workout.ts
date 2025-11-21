// Workout segment types
export type SegmentType = 'steady' | 'ramp' | 'intervals';

export interface SteadySegment {
  type: 'steady';
  name: string;
  duration: number;    // seconds
  power: number;       // watts
  cadence?: number;    // target cadence (RPM) - optional
}

export interface RampSegment {
  type: 'ramp';
  name: string;
  duration: number;    // seconds
  startPower: number;  // watts
  endPower: number;    // watts
  cadence?: number;    // target cadence (RPM) - optional
}

export interface IntervalsSegment {
  type: 'intervals';
  name: string;
  repetitions: number;
  onDuration: number;  // seconds
  onPower: number;     // watts
  onCadence?: number;  // target cadence during ON (RPM) - optional
  offDuration: number; // seconds
  offPower: number;    // watts
  offCadence?: number; // target cadence during OFF (RPM) - optional
}

export type WorkoutSegment = SteadySegment | RampSegment | IntervalsSegment;

export interface Workout {
  id: string;
  name: string;
  description?: string;
  segments: WorkoutSegment[];
}

// Calculate total duration of a segment
export function getSegmentDuration(segment: WorkoutSegment): number {
  switch (segment.type) {
    case 'steady':
    case 'ramp':
      return segment.duration;
    case 'intervals':
      return segment.repetitions * (segment.onDuration + segment.offDuration);
  }
}

// Calculate total workout duration
export function getWorkoutDuration(workout: Workout): number {
  return workout.segments.reduce((total, seg) => total + getSegmentDuration(seg), 0);
}

// Get target power at a specific time within a segment
export function getSegmentPowerAtTime(segment: WorkoutSegment, timeInSegment: number): number {
  switch (segment.type) {
    case 'steady':
      return segment.power;
    case 'ramp': {
      const progress = Math.min(timeInSegment / segment.duration, 1);
      return Math.round(segment.startPower + (segment.endPower - segment.startPower) * progress);
    }
    case 'intervals': {
      const cycleLength = segment.onDuration + segment.offDuration;
      const positionInCycle = timeInSegment % cycleLength;
      return positionInCycle < segment.onDuration ? segment.onPower : segment.offPower;
    }
  }
}

// Get target cadence at a specific time within a segment (returns undefined if not set)
export function getSegmentCadenceAtTime(segment: WorkoutSegment, timeInSegment: number): number | undefined {
  switch (segment.type) {
    case 'steady':
    case 'ramp':
      return segment.cadence;
    case 'intervals': {
      const cycleLength = segment.onDuration + segment.offDuration;
      const positionInCycle = timeInSegment % cycleLength;
      return positionInCycle < segment.onDuration ? segment.onCadence : segment.offCadence;
    }
  }
}

// Interval state info
export interface IntervalState {
  currentRep: number;      // 1-based rep number
  totalReps: number;
  isOnPhase: boolean;      // true = ON (work), false = OFF (rest)
  timeInPhase: number;     // seconds into current phase
  phaseDuration: number;   // duration of current phase
}

// Extended position info
export interface WorkoutPosition {
  segmentIndex: number;
  timeInSegment: number;
  targetPower: number;
  targetCadence: number | undefined;
  isComplete: boolean;
  // Interval-specific (only set for interval segments)
  intervalState?: IntervalState;
  // Time until next phase/segment change
  timeUntilChange: number;
}

// Get current segment and time within it based on total elapsed time
export function getWorkoutPosition(workout: Workout, elapsedTime: number): WorkoutPosition {
  let remainingTime = elapsedTime;

  for (let i = 0; i < workout.segments.length; i++) {
    const segment = workout.segments[i];
    const segmentDuration = getSegmentDuration(segment);

    if (remainingTime < segmentDuration) {
      const result: WorkoutPosition = {
        segmentIndex: i,
        timeInSegment: remainingTime,
        targetPower: getSegmentPowerAtTime(segment, remainingTime),
        targetCadence: getSegmentCadenceAtTime(segment, remainingTime),
        isComplete: false,
        timeUntilChange: segmentDuration - remainingTime,
      };

      // Add interval state if this is an intervals segment
      if (segment.type === 'intervals') {
        const cycleLength = segment.onDuration + segment.offDuration;
        const currentCycle = Math.floor(remainingTime / cycleLength);
        const positionInCycle = remainingTime % cycleLength;
        const isOnPhase = positionInCycle < segment.onDuration;
        const phaseDuration = isOnPhase ? segment.onDuration : segment.offDuration;
        const timeInPhase = isOnPhase ? positionInCycle : positionInCycle - segment.onDuration;

        result.intervalState = {
          currentRep: currentCycle + 1,
          totalReps: segment.repetitions,
          isOnPhase,
          timeInPhase,
          phaseDuration,
        };
        // Time until phase change (ON->OFF or OFF->next rep)
        result.timeUntilChange = phaseDuration - timeInPhase;
      }

      return result;
    }
    remainingTime -= segmentDuration;
  }

  // Workout complete
  const lastSegment = workout.segments[workout.segments.length - 1];
  return {
    segmentIndex: workout.segments.length - 1,
    timeInSegment: getSegmentDuration(lastSegment),
    targetPower: 0,
    targetCadence: undefined,
    isComplete: true,
    timeUntilChange: 0,
  };
}

// Format seconds as MM:SS or HH:MM:SS
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
