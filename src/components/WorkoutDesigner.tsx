import { useState, useEffect } from 'react';
import type { Workout, WorkoutSegment, SteadySegment, RampSegment, IntervalsSegment } from '../types/workout';
import { getSegmentDuration, getWorkoutDuration, formatDuration } from '../types/workout';
import {
  getSavedWorkouts,
  saveWorkout,
  deleteWorkout,
  exportWorkoutToFile,
  importWorkoutFromFile,
  getFTP,
  setFTP as saveFTP,
} from '../services/workoutStorage';
import './WorkoutDesigner.css';

interface WorkoutDesignerProps {
  onStartWorkout: (workout: Workout) => void;
  onClose: () => void;
  isConnected: boolean;
}

type SegmentType = 'steady' | 'ramp' | 'intervals';
type PowerMode = 'watts' | 'ftp';

const defaultSegments: Record<SegmentType, WorkoutSegment> = {
  steady: { type: 'steady', name: 'Steady', duration: 300, power: 150 },
  ramp: { type: 'ramp', name: 'Warmup', duration: 300, startPower: 100, endPower: 200 },
  intervals: { type: 'intervals', name: 'Intervals', repetitions: 5, onDuration: 30, onPower: 250, offDuration: 30, offPower: 100 },
};

// FTP-based default segments (in % of FTP)
const defaultFTPSegments: Record<SegmentType, WorkoutSegment> = {
  steady: { type: 'steady', name: 'Steady', duration: 300, power: 75 }, // 75% FTP
  ramp: { type: 'ramp', name: 'Warmup', duration: 300, startPower: 50, endPower: 90 },
  intervals: { type: 'intervals', name: 'Intervals', repetitions: 5, onDuration: 30, onPower: 120, offDuration: 30, offPower: 50 },
};

export function WorkoutDesigner({ onStartWorkout, onClose, isConnected }: WorkoutDesignerProps) {
  const [name, setName] = useState('My Workout');
  const [segments, setSegments] = useState<WorkoutSegment[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [powerMode, setPowerMode] = useState<PowerMode>('watts');
  const [ftp, setFtp] = useState(200);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved workouts and FTP on mount
  useEffect(() => {
    setSavedWorkouts(getSavedWorkouts());
    setFtp(getFTP());
  }, []);

  // Initialize with a default workout
  useEffect(() => {
    if (segments.length === 0) {
      setSegments([
        { type: 'ramp', name: 'Warmup', duration: 300, startPower: 100, endPower: 180 },
        { type: 'steady', name: 'Base', duration: 600, power: 180 },
        { type: 'intervals', name: 'Intervals', repetitions: 4, onDuration: 60, onPower: 250, offDuration: 60, offPower: 120 },
        { type: 'ramp', name: 'Cooldown', duration: 300, startPower: 150, endPower: 100 },
      ]);
    }
  }, [segments.length]);

  const handleFTPChange = (newFTP: number) => {
    setFtp(newFTP);
    saveFTP(newFTP);
  };

  // Convert FTP percentage to watts
  const ftpToWatts = (percent: number) => Math.round((percent / 100) * ftp);

  // Convert watts to FTP percentage
  const wattsToFtp = (watts: number) => Math.round((watts / ftp) * 100);

  // Get display value based on mode
  const getDisplayPower = (watts: number) => {
    if (powerMode === 'ftp') return wattsToFtp(watts);
    return watts;
  };

  // Convert input to watts based on mode
  const inputToWatts = (value: number) => {
    if (powerMode === 'ftp') return ftpToWatts(value);
    return value;
  };

  const addSegment = (type: SegmentType) => {
    const defaults = powerMode === 'ftp' ? defaultFTPSegments : defaultSegments;
    const newSeg = { ...defaults[type] };

    // Convert FTP percentages to watts if in FTP mode
    if (powerMode === 'ftp') {
      if (newSeg.type === 'steady') {
        newSeg.power = ftpToWatts(newSeg.power);
      } else if (newSeg.type === 'ramp') {
        newSeg.startPower = ftpToWatts(newSeg.startPower);
        newSeg.endPower = ftpToWatts(newSeg.endPower);
      } else if (newSeg.type === 'intervals') {
        newSeg.onPower = ftpToWatts(newSeg.onPower);
        newSeg.offPower = ftpToWatts(newSeg.offPower);
      }
    }

    setSegments([...segments, newSeg]);
  };

  const removeSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index));
  };

  const updateSegment = (index: number, updates: Partial<WorkoutSegment>) => {
    setSegments(segments.map((seg, i) => (i === index ? { ...seg, ...updates } as WorkoutSegment : seg)));
  };

  const moveSegment = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= segments.length) return;
    const newSegments = [...segments];
    [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];
    setSegments(newSegments);
  };

  const duplicateSegment = (index: number) => {
    const newSegments = [...segments];
    const copy = { ...segments[index] };
    newSegments.splice(index + 1, 0, copy);
    setSegments(newSegments);
  };

  const handleStart = () => {
    const workout: Workout = {
      id: Date.now().toString(),
      name,
      segments,
    };
    onStartWorkout(workout);
  };

  const handleSave = () => {
    const workout: Workout = {
      id: Date.now().toString(),
      name,
      segments,
    };
    saveWorkout(workout);
    setSavedWorkouts(getSavedWorkouts());
  };

  const handleLoad = (workout: Workout) => {
    setName(workout.name);
    setSegments([...workout.segments]);
    setShowSaved(false);
  };

  const handleDelete = (id: string) => {
    deleteWorkout(id);
    setSavedWorkouts(getSavedWorkouts());
  };

  const handleExport = () => {
    const workout: Workout = {
      id: Date.now().toString(),
      name,
      segments,
    };
    exportWorkoutToFile(workout);
  };

  const handleImport = async () => {
    const workout = await importWorkoutFromFile();
    if (workout) {
      setName(workout.name);
      setSegments(workout.segments);
    }
  };

  const totalDuration = getWorkoutDuration({ id: '', name: '', segments });
  const powerUnit = powerMode === 'ftp' ? '% FTP' : 'W';

  return (
    <div className="workout-designer">
      <div className="designer-header">
        <h2>Workout Designer</h2>
        <button className="btn btn-small" onClick={onClose}>Close</button>
      </div>

      {/* Workout Preview Graph - Always Visible at Top */}
      <div className="workout-preview">
        <WorkoutGraph segments={segments} ftp={powerMode === 'ftp' ? ftp : undefined} />
      </div>

      {/* Toolbar Row: Mode, Add Segment, File Actions */}
      <div className="designer-toolbar">
        {/* Power Mode Toggle */}
        <div className="power-mode-toggle">
          <button
            className={`mode-btn ${powerMode === 'watts' ? 'active' : ''}`}
            onClick={() => setPowerMode('watts')}
          >
            Watts
          </button>
          <button
            className={`mode-btn ${powerMode === 'ftp' ? 'active' : ''}`}
            onClick={() => setPowerMode('ftp')}
          >
            % FTP
          </button>
          {powerMode === 'ftp' && (
            <div className="ftp-input">
              <label>
                FTP:
                <input
                  type="number"
                  value={ftp}
                  onChange={(e) => handleFTPChange(Number(e.target.value))}
                  min={100}
                  max={500}
                />
                W
              </label>
            </div>
          )}
        </div>

        {/* Add Segment */}
        <div className="add-segment">
          <span>Add:</span>
          <button className="btn btn-small" onClick={() => addSegment('steady')}>Steady</button>
          <button className="btn btn-small" onClick={() => addSegment('ramp')}>Ramp</button>
          <button className="btn btn-small" onClick={() => addSegment('intervals')}>Intervals</button>
        </div>

        {/* File Actions */}
        <div className="workout-actions">
          <button className="btn btn-small" onClick={handleSave}>Save</button>
          <button className="btn btn-small" onClick={() => setShowSaved(!showSaved)}>
            Load ({savedWorkouts.length})
          </button>
          <button className="btn btn-small" onClick={handleExport}>Export</button>
          <button className="btn btn-small" onClick={handleImport}>Import</button>
        </div>
      </div>

      {/* Saved Workouts List */}
      {showSaved && savedWorkouts.length > 0 && (
        <div className="saved-workouts">
          {savedWorkouts.map((w) => (
            <div key={w.id} className="saved-workout-item">
              <span className="saved-name">{w.name}</span>
              <span className="saved-duration">{formatDuration(getWorkoutDuration(w))}</span>
              <button className="btn btn-small" onClick={() => handleLoad(w)}>Load</button>
              <button className="btn btn-small" onClick={() => handleDelete(w.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="workout-name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workout name"
        />
        <span className="total-duration">Total: {formatDuration(totalDuration)}</span>
      </div>

      <div className="segments-list">
        {segments.map((segment, index) => (
          <SegmentEditor
            key={index}
            segment={segment}
            index={index}
            totalSegments={segments.length}
            onUpdate={(updates) => updateSegment(index, updates)}
            onRemove={() => removeSegment(index)}
            onMove={(dir) => moveSegment(index, dir)}
            onDuplicate={() => duplicateSegment(index)}
            powerMode={powerMode}
            getDisplayPower={getDisplayPower}
            inputToWatts={inputToWatts}
            powerUnit={powerUnit}
          />
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={segments.length === 0 || !isConnected}
      >
        {isConnected ? 'Start Workout' : 'Connect Trainer to Start'}
      </button>
    </div>
  );
}

interface SegmentEditorProps {
  segment: WorkoutSegment;
  index: number;
  totalSegments: number;
  onUpdate: (updates: Partial<WorkoutSegment>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  powerMode: PowerMode;
  getDisplayPower: (watts: number) => number;
  inputToWatts: (value: number) => number;
  powerUnit: string;
}

function SegmentEditor({
  segment,
  index,
  totalSegments,
  onUpdate,
  onRemove,
  onMove,
  onDuplicate,
  powerMode,
  getDisplayPower,
  inputToWatts,
  powerUnit,
}: SegmentEditorProps) {
  const duration = getSegmentDuration(segment);

  return (
    <div className="segment-editor">
      <div className="segment-header">
        <input
          type="text"
          className="segment-name"
          value={segment.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <span className="segment-type">{segment.type}</span>
        <span className="segment-duration">{formatDuration(duration)}</span>
        <div className="segment-actions">
          <button onClick={() => onMove(-1)} disabled={index === 0} title="Move up">↑</button>
          <button onClick={() => onMove(1)} disabled={index === totalSegments - 1} title="Move down">↓</button>
          <button onClick={onDuplicate} title="Duplicate">⧉</button>
          <button onClick={onRemove} title="Remove">×</button>
        </div>
      </div>

      <div className="segment-fields">
        {segment.type === 'steady' && (
          <SteadyFields
            segment={segment}
            onUpdate={onUpdate}
            powerMode={powerMode}
            getDisplayPower={getDisplayPower}
            inputToWatts={inputToWatts}
            powerUnit={powerUnit}
          />
        )}
        {segment.type === 'ramp' && (
          <RampFields
            segment={segment}
            onUpdate={onUpdate}
            powerMode={powerMode}
            getDisplayPower={getDisplayPower}
            inputToWatts={inputToWatts}
            powerUnit={powerUnit}
          />
        )}
        {segment.type === 'intervals' && (
          <IntervalsFields
            segment={segment}
            onUpdate={onUpdate}
            powerMode={powerMode}
            getDisplayPower={getDisplayPower}
            inputToWatts={inputToWatts}
            powerUnit={powerUnit}
          />
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  powerMode: PowerMode;
  getDisplayPower: (watts: number) => number;
  inputToWatts: (value: number) => number;
  powerUnit: string;
}

function SteadyFields({ segment, onUpdate, getDisplayPower, inputToWatts, powerUnit }: {
  segment: SteadySegment;
  onUpdate: (u: Partial<SteadySegment>) => void;
} & FieldProps) {
  return (
    <>
      <label>
        Duration (min)
        <input
          type="number"
          value={segment.duration / 60}
          onChange={(e) => onUpdate({ duration: Number(e.target.value) * 60 })}
          min={0.5}
          step={0.5}
        />
      </label>
      <label>
        Power ({powerUnit})
        <input
          type="number"
          value={getDisplayPower(segment.power)}
          onChange={(e) => onUpdate({ power: inputToWatts(Number(e.target.value)) })}
          min={0}
        />
      </label>
      <label>
        Cadence (RPM)
        <input
          type="number"
          value={segment.cadence ?? ''}
          onChange={(e) => onUpdate({ cadence: e.target.value ? Number(e.target.value) : undefined })}
          min={0}
          max={200}
          placeholder="—"
        />
      </label>
    </>
  );
}

function RampFields({ segment, onUpdate, getDisplayPower, inputToWatts, powerUnit }: {
  segment: RampSegment;
  onUpdate: (u: Partial<RampSegment>) => void;
} & FieldProps) {
  return (
    <>
      <label>
        Duration (min)
        <input
          type="number"
          value={segment.duration / 60}
          onChange={(e) => onUpdate({ duration: Number(e.target.value) * 60 })}
          min={0.5}
          step={0.5}
        />
      </label>
      <label>
        Start ({powerUnit})
        <input
          type="number"
          value={getDisplayPower(segment.startPower)}
          onChange={(e) => onUpdate({ startPower: inputToWatts(Number(e.target.value)) })}
          min={0}
        />
      </label>
      <label>
        End ({powerUnit})
        <input
          type="number"
          value={getDisplayPower(segment.endPower)}
          onChange={(e) => onUpdate({ endPower: inputToWatts(Number(e.target.value)) })}
          min={0}
        />
      </label>
      <label>
        Cadence (RPM)
        <input
          type="number"
          value={segment.cadence ?? ''}
          onChange={(e) => onUpdate({ cadence: e.target.value ? Number(e.target.value) : undefined })}
          min={0}
          max={200}
          placeholder="—"
        />
      </label>
    </>
  );
}

function IntervalsFields({ segment, onUpdate, getDisplayPower, inputToWatts, powerUnit }: {
  segment: IntervalsSegment;
  onUpdate: (u: Partial<IntervalsSegment>) => void;
} & FieldProps) {
  return (
    <>
      <label>
        Reps
        <input
          type="number"
          value={segment.repetitions}
          onChange={(e) => onUpdate({ repetitions: Number(e.target.value) })}
          min={1}
          max={50}
        />
      </label>
      <label>
        On (sec)
        <input
          type="number"
          value={segment.onDuration}
          onChange={(e) => onUpdate({ onDuration: Number(e.target.value) })}
          min={5}
        />
      </label>
      <label>
        On ({powerUnit})
        <input
          type="number"
          value={getDisplayPower(segment.onPower)}
          onChange={(e) => onUpdate({ onPower: inputToWatts(Number(e.target.value)) })}
          min={0}
        />
      </label>
      <label>
        On Cadence (RPM)
        <input
          type="number"
          value={segment.onCadence ?? ''}
          onChange={(e) => onUpdate({ onCadence: e.target.value ? Number(e.target.value) : undefined })}
          min={0}
          max={200}
          placeholder="—"
        />
      </label>
      <label>
        Off (sec)
        <input
          type="number"
          value={segment.offDuration}
          onChange={(e) => onUpdate({ offDuration: Number(e.target.value) })}
          min={5}
        />
      </label>
      <label>
        Off ({powerUnit})
        <input
          type="number"
          value={getDisplayPower(segment.offPower)}
          onChange={(e) => onUpdate({ offPower: inputToWatts(Number(e.target.value)) })}
          min={0}
        />
      </label>
      <label>
        Off Cadence (RPM)
        <input
          type="number"
          value={segment.offCadence ?? ''}
          onChange={(e) => onUpdate({ offCadence: e.target.value ? Number(e.target.value) : undefined })}
          min={0}
          max={200}
          placeholder="—"
        />
      </label>
    </>
  );
}

function WorkoutGraph({ segments, ftp }: { segments: WorkoutSegment[]; ftp?: number }) {
  const totalDuration = segments.reduce((t, s) => t + getSegmentDuration(s), 0);
  if (totalDuration === 0) return null;

  const maxPower = Math.max(
    ...segments.flatMap((s) => {
      if (s.type === 'steady') return [s.power];
      if (s.type === 'ramp') return [s.startPower, s.endPower];
      return [s.onPower, s.offPower];
    }),
    100
  );

  const width = 100;
  const height = 60;
  const points: string[] = [];
  let x = 0;

  for (const segment of segments) {
    const segDuration = getSegmentDuration(segment);
    const segWidth = (segDuration / totalDuration) * width;

    if (segment.type === 'steady') {
      const y = height - (segment.power / maxPower) * height;
      points.push(`${x},${y}`);
      points.push(`${x + segWidth},${y}`);
    } else if (segment.type === 'ramp') {
      const y1 = height - (segment.startPower / maxPower) * height;
      const y2 = height - (segment.endPower / maxPower) * height;
      points.push(`${x},${y1}`);
      points.push(`${x + segWidth},${y2}`);
    } else {
      const cycleWidth = segWidth / segment.repetitions;
      const onWidth = (segment.onDuration / (segment.onDuration + segment.offDuration)) * cycleWidth;
      const yOn = height - (segment.onPower / maxPower) * height;
      const yOff = height - (segment.offPower / maxPower) * height;

      for (let i = 0; i < segment.repetitions; i++) {
        const cx = x + i * cycleWidth;
        points.push(`${cx},${yOn}`);
        points.push(`${cx + onWidth},${yOn}`);
        points.push(`${cx + onWidth},${yOff}`);
        points.push(`${cx + cycleWidth},${yOff}`);
      }
    }
    x += segWidth;
  }

  // FTP line position
  const ftpY = ftp ? height - (ftp / maxPower) * height : null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="workout-graph">
      {ftpY !== null && ftpY >= 0 && ftpY <= height && (
        <line
          x1="0"
          y1={ftpY}
          x2={width}
          y2={ftpY}
          stroke="var(--warning)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      )}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
