// Web Audio API Spray Sound Synthesizer
// Creates the "Pshhh" aerosol sound using white noise with resonance

let audioContext: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
let currentFilter: BiquadFilterNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function createNoiseBuffer(): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  return noiseBuffer;
}

export function startSpraySound(intensity: number = 1) {
  const ctx = getAudioContext();
  
  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  // Stop any existing sound
  stopSpraySound();
  
  // Create noise source
  const buffer = createNoiseBuffer();
  currentSource = ctx.createBufferSource();
  currentSource.buffer = buffer;
  currentSource.loop = true;
  
  // Bandpass filter for resonance (makes it sound like spray)
  currentFilter = ctx.createBiquadFilter();
  currentFilter.type = 'bandpass';
  currentFilter.frequency.value = 2000 + intensity * 1000;
  currentFilter.Q.value = 0.5;
  
  // Gain control
  currentGain = ctx.createGain();
  currentGain.gain.value = 0.15 * intensity;
  
  // Connect nodes
  currentSource.connect(currentFilter);
  currentFilter.connect(currentGain);
  currentGain.connect(ctx.destination);
  
  // Start with fade in
  currentGain.gain.setValueAtTime(0, ctx.currentTime);
  currentGain.gain.linearRampToValueAtTime(0.15 * intensity, ctx.currentTime + 0.05);
  
  currentSource.start();
}

export function updateSpraySound(intensity: number) {
  if (currentGain && currentFilter && audioContext) {
    currentGain.gain.linearRampToValueAtTime(0.15 * intensity, audioContext.currentTime + 0.05);
    currentFilter.frequency.linearRampToValueAtTime(2000 + intensity * 1000, audioContext.currentTime + 0.05);
  }
}

export function stopSpraySound() {
  if (currentGain && audioContext) {
    currentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
  }
  
  if (currentSource) {
    try {
      currentSource.stop(audioContext ? audioContext.currentTime + 0.15 : 0);
    } catch {
      // Source may have already stopped
    }
    currentSource = null;
  }
  
  currentGain = null;
  currentFilter = null;
}

// Play a quick "pop" sound for correct answers / fat cap activation
export function playPopSound() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.15);
}

// Play a "wrong" buzzer sound
export function playBuzzSound() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.2);
}

// Trigger haptic feedback
export function triggerHaptic(pattern: number[] = [10]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
