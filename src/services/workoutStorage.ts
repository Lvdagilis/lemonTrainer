import type { Workout } from '../types/workout';
import { getWorkoutDuration as _getWorkoutDuration } from '../types/workout';
export { formatDuration } from '../types/workout';

export const getWorkoutDuration = _getWorkoutDuration;

const WORKOUTS_KEY = 'wahoo_workouts';
const FTP_KEY = 'wahoo_ftp';

export function getSavedWorkouts(): Workout[] {
  try {
    const data = localStorage.getItem(WORKOUTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWorkout(workout: Workout): void {
  const workouts = getSavedWorkouts();
  const existing = workouts.findIndex((w) => w.id === workout.id);
  if (existing >= 0) {
    workouts[existing] = workout;
  } else {
    workouts.push(workout);
  }
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function deleteWorkout(id: string): void {
  const workouts = getSavedWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function exportWorkoutToFile(workout: Workout): void {
  const json = JSON.stringify(workout, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workout.name.replace(/[^a-z0-9]/gi, '_')}.workout.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importWorkoutFromFile(): Promise<Workout | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.workout.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const workout = JSON.parse(text) as Workout;
        // Assign new ID to avoid conflicts
        workout.id = Date.now().toString();
        resolve(workout);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function getFTP(): number {
  try {
    const ftp = localStorage.getItem(FTP_KEY);
    return ftp ? Number(ftp) : 200;
  } catch {
    return 200;
  }
}

export function setFTP(ftp: number): void {
  localStorage.setItem(FTP_KEY, String(ftp));
}
