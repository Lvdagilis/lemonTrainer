import { useState } from 'react';
import { useTrainer } from './hooks/useTrainer';
import type { RecordedWorkout } from './services/recorder';
import type { Workout } from './types/workout';
import { HomePage } from './pages/HomePage';
import { RidePage } from './pages/RidePage';
import { SummaryPage } from './pages/SummaryPage';
import { BrowserCheck } from './components/BrowserCheck';
import './App.css';

type Page = 'home' | 'ride' | 'summary';

function App() {
  const {
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
    hrStatus,
    hrDeviceName,
    connectHR,
    disconnectHR,
  } = useTrainer();

  const [page, setPage] = useState<Page>('home');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<RecordedWorkout | null>(null);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleStartWorkout = (workout: Workout | null) => {
    setActiveWorkout(workout);
    setPage('ride');
  };

  const handleEndRide = (recorded: RecordedWorkout | null) => {
    setActiveWorkout(null);
    setTargetPower(0);
    if (recorded) {
      setCompletedWorkout(recorded);
      setPage('summary');
    } else {
      setPage('home');
    }
  };

  const handleSummaryDone = () => {
    setCompletedWorkout(null);
    setPage('home');
  };

  return (
    <>
      <BrowserCheck />
      <div className="app">
        <header className="header">
          <h1 onClick={() => page !== 'ride' && setPage('home')} style={{ cursor: page !== 'ride' ? 'pointer' : 'default' }}>
            lemonTrainer
          </h1>
          {page === 'ride' && (
            <div className="connection-status">
              <span className={`status-dot ${status}`}></span>
              <span>Connected</span>
            </div>
          )}
        </header>

      <main className="main">
        {page === 'home' && (
          <HomePage
            connectionStatus={status}
            statusMessage={statusMessage}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onStartWorkout={handleStartWorkout}
            hrStatus={hrStatus}
            hrDeviceName={hrDeviceName}
            onConnectHR={connectHR}
            onDisconnectHR={disconnectHR}
          />
        )}

        {page === 'ride' && (
          <RidePage
            workout={activeWorkout}
            currentData={currentData}
            targetPower={targetPower}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onSetTargetPower={setTargetPower}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onEndRide={handleEndRide}
          />
        )}

        {page === 'summary' && completedWorkout && (
          <SummaryPage
            workout={completedWorkout}
            onDone={handleSummaryDone}
          />
        )}
      </main>

      <footer className="footer">
        <p>Web Bluetooth API required - Use Chrome, Edge, or Opera</p>
      </footer>
      </div>
    </>
  );
}

export default App;
