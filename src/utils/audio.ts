/**
 * Ambient cinematic room tone audio synthesizer using Web Audio API.
 * Provides a warm, low-frequency analog drone reminiscent of a quiet grading suite.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;
let filter: BiquadFilterNode | null = null;

export function toggleCinematicAudio(enable: boolean): boolean {
  try {
    if (!enable) {
      if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
      }
      return false;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);

      filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, audioCtx.currentTime);
      filter.Q.setValueAtTime(2.0, audioCtx.currentTime);

      // Low warm fundamental (55Hz = A1)
      osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, audioCtx.currentTime);

      // Gentle harmonic overtone (82.4Hz = E2)
      osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(82.4, audioCtx.currentTime);

      const oscGain1 = audioCtx.createGain();
      oscGain1.gain.setValueAtTime(0.08, audioCtx.currentTime);

      const oscGain2 = audioCtx.createGain();
      oscGain2.gain.setValueAtTime(0.03, audioCtx.currentTime);

      osc1.connect(oscGain1);
      osc2.connect(oscGain2);

      oscGain1.connect(filter);
      oscGain2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
    }

    masterGain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.8);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format milliseconds into standard SMPTE timecode (HH:MM:SS:FF at 24fps)
 */
export function formatSMPTE(elapsedMs: number, fps = 24): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const frames = Math.floor(((elapsedMs % 1000) / 1000) * fps);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}
