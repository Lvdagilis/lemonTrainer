import { useMemo } from 'react';
import type { RecordedWorkout } from '../services/recorder';
import { exportToJSON, exportToFIT, downloadFile } from '../services/export';
import { formatDuration } from '../types/workout';
import './SummaryPage.css';

interface SummaryPageProps {
  workout: RecordedWorkout;
  onDone: () => void;
}

export function SummaryPage({ workout, onDone }: SummaryPageProps) {
  const handleExportJSON = () => {
    const json = exportToJSON(workout);
    const filename = `workout-${new Date(workout.summary.startTime).toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    downloadFile(json, filename, 'application/json');
  };

  const handleExportFIT = () => {
    const fit = exportToFIT(workout);
    const filename = `workout-${new Date(workout.summary.startTime).toISOString().slice(0, 19).replace(/:/g, '-')}.fit`;
    downloadFile(fit, filename, 'application/octet-stream');
  };

  // Generate chart data points (downsample if needed)
  const chartData = useMemo(() => {
    const maxPoints = 200;
    const data = workout.data;
    if (data.length <= maxPoints) return data;

    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0);
  }, [workout.data]);

  const maxPower = useMemo(() => {
    return Math.max(...chartData.map(d => d.power), 100);
  }, [chartData]);

  const maxCadence = useMemo(() => {
    return Math.max(...chartData.map(d => d.cadence), 100);
  }, [chartData]);

  const maxHeartRate = useMemo(() => {
    const hrs = chartData.map(d => d.heartRate).filter((hr): hr is number => hr !== undefined && hr > 0);
    return hrs.length > 0 ? Math.max(...hrs, 100) : 200;
  }, [chartData]);

  const hasHeartRateData = useMemo(() => {
    return chartData.some(d => d.heartRate !== undefined && d.heartRate > 0);
  }, [chartData]);

  return (
    <div className="summary-page">
      <h1>Ride Summary</h1>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{formatDuration(workout.summary.duration)}</span>
          <span className="stat-label">Duration</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{workout.summary.avgPower}</span>
          <span className="stat-label">Avg Power (W)</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{workout.summary.maxPower}</span>
          <span className="stat-label">Max Power (W)</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{workout.summary.avgCadence}</span>
          <span className="stat-label">Avg Cadence</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{workout.summary.avgHeartRate || '--'}</span>
          <span className="stat-label">Avg HR (BPM)</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{workout.summary.maxHeartRate || '--'}</span>
          <span className="stat-label">Max HR (BPM)</span>
        </div>
      </section>

      {/* Combined Chart */}
      <section className="chart-section">
        <div className="chart-header">
          <h2>Performance</h2>
          <div className="chart-legend">
            <span className="legend-item legend-power">Power</span>
            <span className="legend-item legend-cadence">Cadence</span>
            {hasHeartRateData && <span className="legend-item legend-hr">HR</span>}
          </div>
        </div>
        <div className="chart-container">
          <svg viewBox="0 0 400 120" className="chart chart-combined" preserveAspectRatio="none">
            <CombinedChart
              data={chartData}
              maxPower={maxPower}
              maxCadence={maxCadence}
              maxHeartRate={maxHeartRate}
            />
          </svg>
          <div className="chart-labels-multi">
            <div className="chart-label-group">
              <span className="label-power">{maxPower}W</span>
              <span className="label-cadence">{maxCadence}</span>
              {hasHeartRateData && <span className="label-hr">{maxHeartRate}</span>}
            </div>
            <div className="chart-label-group">
              <span className="label-power">0</span>
              <span className="label-cadence">0</span>
              {hasHeartRateData && <span className="label-hr">0</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Export Options */}
      <section className="export-section">
        <h2>Export</h2>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={handleExportFIT}>
            Download FIT
          </button>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            Download JSON
          </button>
        </div>
      </section>

      {/* Done Button */}
      <button className="btn btn-primary btn-large" onClick={onDone}>
        Done
      </button>
    </div>
  );
}

interface CombinedChartProps {
  data: { power: number; cadence: number; heartRate?: number }[];
  maxPower: number;
  maxCadence: number;
  maxHeartRate: number;
}

function CombinedChart({ data, maxPower, maxCadence, maxHeartRate }: CombinedChartProps) {
  if (data.length < 2) return null;

  const height = 120;

  // Power line (yellow/accent)
  const powerPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 400;
    const y = height - (d.power / maxPower) * height;
    return `${x},${y}`;
  }).join(' ');

  // Cadence line (green)
  const cadencePoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 400;
    const y = height - (d.cadence / maxCadence) * height;
    return `${x},${y}`;
  }).join(' ');

  // Heart rate line (red) - only if we have data
  const hrData = data.filter(d => d.heartRate !== undefined && d.heartRate > 0);
  const hasHR = hrData.length > 0;

  let hrPoints = '';
  if (hasHR) {
    hrPoints = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 400;
      const hr = d.heartRate ?? 0;
      const y = hr > 0 ? height - (hr / maxHeartRate) * height : height;
      return `${x},${y}`;
    }).join(' ');
  }

  return (
    <>
      {/* Power area and line */}
      <polygon points={`0,${height} ${powerPoints} 400,${height}`} fill="var(--accent)" fillOpacity="0.15" />
      <polyline points={powerPoints} fill="none" stroke="var(--accent)" strokeWidth="2" />

      {/* Cadence line */}
      <polyline points={cadencePoints} fill="none" stroke="var(--success)" strokeWidth="1.5" strokeOpacity="0.8" />

      {/* Heart rate line */}
      {hasHR && (
        <polyline points={hrPoints} fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeOpacity="0.8" />
      )}
    </>
  );
}
