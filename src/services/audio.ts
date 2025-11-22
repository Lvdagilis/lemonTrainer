// Audio service for workout alerts and countdown beeps

class AudioService {
  private audioContext: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  // Play a beep with specified frequency and duration
  private playTone(frequency: number, duration: number, volume = 0.3) {
    if (this.muted) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently handle audio failure - not critical for app functionality
    }
  }

  // Countdown beep (3, 2, 1)
  countdownBeep() {
    this.playTone(880, 0.1, 0.2); // A5, short beep
  }

  // Final countdown beep (GO!)
  countdownFinal() {
    this.playTone(1760, 0.3, 0.4); // A6, longer higher beep
  }

  // Segment change notification
  segmentChange() {
    this.playTone(523, 0.15, 0.3); // C5
    setTimeout(() => this.playTone(659, 0.15, 0.3), 150); // E5
    setTimeout(() => this.playTone(784, 0.2, 0.3), 300); // G5
  }

  // Interval ON phase start (work!)
  intervalOn() {
    this.playTone(1047, 0.1, 0.4); // C6 - high energy
    setTimeout(() => this.playTone(1319, 0.15, 0.4), 100); // E6
  }

  // Interval OFF phase start (rest)
  intervalOff() {
    this.playTone(523, 0.2, 0.25); // C5 - lower, calmer
  }

  // Workout complete fanfare
  workoutComplete() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 0.3), i * 200);
    });
  }
}

export const audioService = new AudioService();
