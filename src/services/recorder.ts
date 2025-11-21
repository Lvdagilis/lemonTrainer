import type { TrainerData } from './ble';

export interface WorkoutSummary {
  startTime: number;
  endTime: number;
  duration: number;      // seconds
  avgPower: number;
  maxPower: number;
  avgCadence: number;
  avgSpeed: number;
  avgHeartRate: number;
  maxHeartRate: number;
  totalDistance: number; // meters
  dataPoints: number;
}

export interface RecordedWorkout {
  summary: WorkoutSummary;
  data: TrainerData[];
}

class WorkoutRecorder {
  private data: TrainerData[] = [];
  private isRecording = false;
  private startTime: number | null = null;

  start() {
    this.data = [];
    this.isRecording = true;
    this.startTime = Date.now();
  }

  stop(): RecordedWorkout | null {
    if (!this.isRecording) {
      return null;
    }

    this.isRecording = false;
    const endTime = Date.now();

    const summary = this.calculateSummary(endTime);
    return {
      summary,
      data: [...this.data],
    };
  }

  record(data: TrainerData) {
    if (this.isRecording) {
      this.data.push(data);
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getDataPointCount(): number {
    return this.data.length;
  }

  getElapsedTime(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private calculateSummary(endTime: number): WorkoutSummary {
    const powers = this.data.map(d => d.power).filter(p => p > 0);
    const cadences = this.data.map(d => d.cadence).filter(c => c > 0);
    const speeds = this.data.map(d => d.speed).filter(s => s > 0);
    const heartRates = this.data.map(d => d.heartRate).filter((hr): hr is number => hr !== undefined && hr > 0);

    // Calculate total distance from speed data
    let totalDistance = 0;
    for (let i = 1; i < this.data.length; i++) {
      const timeDelta = (this.data[i].timestamp - this.data[i - 1].timestamp) / 1000; // seconds
      if (timeDelta > 0 && timeDelta < 10) { // Sanity check
        const speedMs = this.data[i].speed / 3.6; // km/h to m/s
        totalDistance += speedMs * timeDelta;
      }
    }

    return {
      startTime: this.startTime!,
      endTime,
      duration: Math.floor((endTime - this.startTime!) / 1000),
      avgPower: powers.length ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : 0,
      maxPower: powers.length ? Math.max(...powers) : 0,
      avgCadence: cadences.length ? Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length) : 0,
      avgSpeed: speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10 : 0,
      avgHeartRate: heartRates.length ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 0,
      maxHeartRate: heartRates.length ? Math.max(...heartRates) : 0,
      totalDistance: Math.round(totalDistance),
      dataPoints: this.data.length,
    };
  }
}

export const workoutRecorder = new WorkoutRecorder();
