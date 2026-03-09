// Web Audio API sound engine — no external files needed
let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playTone({ frequency = 440, type = 'sine', duration = 0.1, volume = 0.3, attack = 0.01, decay = 0.05, startFreq, endFreq }) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = type
    const now = ctx.currentTime

    if (startFreq && endFreq) {
      osc.frequency.setValueAtTime(startFreq, now)
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration)
    } else {
      osc.frequency.setValueAtTime(frequency, now)
    }

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay + duration)

    osc.start(now)
    osc.stop(now + attack + decay + duration + 0.05)
  } catch (e) {
    // silently fail if audio not available
  }
}

function playChord(notes, opts = {}) {
  notes.forEach((freq, i) => {
    setTimeout(() => playTone({ frequency: freq, ...opts }), i * (opts.stagger || 0))
  })
}

export const SFX = {
  // Food eaten — rising blip
  eat() {
    playTone({ frequency: 440, type: 'sine', duration: 0.05, volume: 0.4, attack: 0.005, decay: 0.1 })
    setTimeout(() => playTone({ frequency: 660, type: 'sine', duration: 0.05, volume: 0.3, attack: 0.005, decay: 0.08 }), 60)
    setTimeout(() => playTone({ frequency: 880, type: 'sine', duration: 0.08, volume: 0.25, attack: 0.005, decay: 0.1 }), 110)
  },

  // Snake collision — impact buzz
  collide() {
    playTone({ startFreq: 300, endFreq: 80, type: 'sawtooth', duration: 0.15, volume: 0.5, attack: 0.005, decay: 0.2 })
    setTimeout(() => playTone({ frequency: 60, type: 'sine', duration: 0.1, volume: 0.3, attack: 0.01, decay: 0.15 }), 80)
  },

  // Win — ascending fanfare
  win() {
    const melody = [523, 659, 784, 1047]
    melody.forEach((freq, i) => {
      setTimeout(() => playTone({ frequency: freq, type: 'sine', duration: 0.12, volume: 0.4, attack: 0.01, decay: 0.18 }), i * 120)
    })
  },

  // Lose — descending
  lose() {
    const melody = [440, 330, 220, 165]
    melody.forEach((freq, i) => {
      setTimeout(() => playTone({ frequency: freq, type: 'triangle', duration: 0.12, volume: 0.35, attack: 0.01, decay: 0.18 }), i * 110)
    })
  },

  // Game start — power up
  start() {
    playTone({ startFreq: 200, endFreq: 800, type: 'square', duration: 0.3, volume: 0.25, attack: 0.01, decay: 0.4 })
    setTimeout(() => playTone({ startFreq: 400, endFreq: 1200, type: 'sine', duration: 0.3, volume: 0.3, attack: 0.01, decay: 0.4 }), 150)
  },

  // Countdown tick
  tick() {
    playTone({ frequency: 880, type: 'square', duration: 0.03, volume: 0.2, attack: 0.002, decay: 0.05 })
  },

  // Final tick (last 3 seconds)
  urgentTick() {
    playTone({ frequency: 1320, type: 'square', duration: 0.04, volume: 0.3, attack: 0.002, decay: 0.06 })
  },

  // Player join
  join() {
    playChord([523, 659], { type: 'sine', duration: 0.08, volume: 0.25, attack: 0.01, decay: 0.12, stagger: 80 })
  },

  // Score penalty
  penalty() {
    playTone({ startFreq: 200, endFreq: 100, type: 'sawtooth', duration: 0.1, volume: 0.4, attack: 0.005, decay: 0.15 })
  },

  // Score bonus (head-on win)
  bonus() {
    playTone({ frequency: 523, type: 'sine', duration: 0.08, volume: 0.35, attack: 0.005, decay: 0.1 })
    setTimeout(() => playTone({ frequency: 784, type: 'sine', duration: 0.1, volume: 0.35, attack: 0.005, decay: 0.12 }), 90)
  },
}

// Mute state
let muted = false
export function isMuted() { return muted }
export function toggleMute() { muted = !muted; return muted }

// Wrap all SFX to respect mute
const wrapped = {}
Object.keys(SFX).forEach(key => {
  wrapped[key] = (...args) => {
    if (!muted) SFX[key](...args)
  }
})
export const sound = wrapped

// Resume audio context on first user interaction
export function initAudio() {
  try { getCtx() } catch (e) {}
}