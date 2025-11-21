import { useState, useEffect, useCallback, useRef } from 'react';
import { bleService, hrMonitorService } from '../services/ble';
import type { TrainerData, ConnectionStatus } from '../services/ble';
import { workoutRecorder } from '../services/recorder';
import type { RecordedWorkout } from '../services/recorder';

export function useTrainer() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentData, setCurrentData] = useState<TrainerData | null>(null);
  const [targetPower, setTargetPowerState] = useState<number>(100);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // HR Monitor state
  const [hrStatus, setHrStatus] = useState<ConnectionStatus>('disconnected');
  const [hrDeviceName, setHrDeviceName] = useState<string | null>(null);
  const latestHR = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unsubData = bleService.onData((data) => {
      // Merge HR data from separate HR monitor if available
      const mergedData: TrainerData = {
        ...data,
        heartRate: data.heartRate ?? latestHR.current,
      };
      setCurrentData(mergedData);
      workoutRecorder.record(mergedData);
    });

    const unsubStatus = bleService.onStatus((newStatus, message) => {
      setStatus(newStatus);
      setStatusMessage(message || '');
    });

    // HR Monitor subscriptions
    const unsubHR = hrMonitorService.onHeartRate((hr) => {
      latestHR.current = hr;
      // Also update currentData with new HR if we have trainer data
      setCurrentData((prev) => prev ? { ...prev, heartRate: hr } : prev);
    });

    const unsubHRStatus = hrMonitorService.onStatus((newStatus) => {
      setHrStatus(newStatus);
      if (newStatus === 'connected') {
        setHrDeviceName(hrMonitorService.getDeviceName());
      } else {
        setHrDeviceName(null);
        if (newStatus === 'disconnected') {
          latestHR.current = undefined;
        }
      }
    });

    return () => {
      unsubData();
      unsubStatus();
      unsubHR();
      unsubHRStatus();
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setRecordingTime(workoutRecorder.getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const connect = useCallback(async () => {
    await bleService.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await bleService.disconnect();
  }, []);

  const setTargetPower = useCallback(async (watts: number) => {
    setTargetPowerState(watts);
    await bleService.setTargetPower(watts);
  }, []);

  const startRecording = useCallback(() => {
    workoutRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  }, []);

  const stopRecording = useCallback((): RecordedWorkout | null => {
    const workout = workoutRecorder.stop();
    setIsRecording(false);
    setRecordingTime(0);
    return workout;
  }, []);

  const connectHR = useCallback(async () => {
    await hrMonitorService.connect();
  }, []);

  const disconnectHR = useCallback(async () => {
    await hrMonitorService.disconnect();
  }, []);

  return {
    status,
    statusMessage,
    currentData,
    targetPower,
    isRecording,
    recordingTime,
    connect,
    disconnect,
    setTargetPower,
    startRecording,
    stopRecording,
    // HR Monitor
    hrStatus,
    hrDeviceName,
    connectHR,
    disconnectHR,
  };
}
