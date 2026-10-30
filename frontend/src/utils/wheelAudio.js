/**
 * wheelAudio.js — Synthesized tactile mechanical tick audio & haptics for wheel pickers.
 *
 * Simulates the mechanical ratchet click of iOS/Apple Watch picker wheels
 * using Web Audio API without needing external audio files.
 */

let audioCtx = null
let lastTickTime = 0

export function playWheelTickSound() {
  const now = Date.now()
  // Throttle ticks to avoid audio buffer saturation during ultra-fast momentum scroll
  if (now - lastTickTime < 32) return
  lastTickTime = now

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    if (!audioCtx) {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }

    const ctx = audioCtx
    const t = ctx.currentTime

    // Create a crisp mechanical click via damped frequency impulse
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    // Bandpass filter to give a refined mechanical/wooden ratchet snap
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1400, t)
    filter.Q.setValueAtTime(2.5, t)

    // Rapid micro pitch-drop (mechanical contact & release)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(800, t)
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.012)

    // Sharp attack and quick exponential decay (12ms)
    gain.gain.setValueAtTime(0.09, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.014)
  } catch {
    // Non-blocking fallback if AudioContext is unsupported/blocked
  }

  // Tactile haptic feedback on mobile phones (Android / iOS web vibrator)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(6)
    } catch {
      // Ignored
    }
  }
}
