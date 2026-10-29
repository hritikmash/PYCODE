import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FastForward, Volume2, VolumeX, MousePointerClick, Sparkles } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

// Procedural audio synthesizer using Web Audio API (zero external assets, 100% reliable)
class CinematicSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playCyberHum() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 3);
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 1.5);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 3.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 3.3);
    } catch {}
  }

  playClickBoom() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.38, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    } catch {}
  }

  playVortex() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 3.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1700, this.ctx.currentTime + 1.8);
      filter.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 3.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 3.6);
    } catch {}
  }

  playStartingChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    } catch {}
  }
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundEngineRef = useRef<CinematicSoundEngine>(new CinematicSoundEngine());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [fadeAlpha, setFadeAlpha] = useState(1);
  const [showStartingUI, setShowStartingUI] = useState(false);
  const [startingText, setStartingText] = useState('S T A R T I N G');

  // Mutable animation state references
  const animStateRef = useRef<{
    stage: 'waiting_for_click' | 'blackhole' | 'starting' | 'fadeout';
    clickTime: number;
    blackHoleX: number;
    blackHoleY: number;
  }>({
    stage: 'waiting_for_click',
    clickTime: 0,
    blackHoleX: 0,
    blackHoleY: 0,
  });

  const handleSkip = () => {
    setIsSkipped(true);
    setFadeAlpha(0);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundEngineRef.current.enabled = next;
  };

  // Trigger Black Hole on click anywhere
  const handleScreenClick = useCallback((e?: React.MouseEvent) => {
    if (animStateRef.current.stage !== 'waiting_for_click') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const clickX = e ? e.clientX : width / 2;
    const clickY = e ? e.clientY : height / 2;

    animStateRef.current.stage = 'blackhole';
    animStateRef.current.clickTime = performance.now();
    animStateRef.current.blackHoleX = clickX;
    animStateRef.current.blackHoleY = clickY;

    setHasClicked(true);

    soundEngineRef.current.playClickBoom();
    soundEngineRef.current.playVortex();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const sound = soundEngineRef.current;
    sound.playCyberHum();

    // ------------------------------------------------------------------
    // PYTHON MATRIX KEYWORDS & GLYPHS
    // ------------------------------------------------------------------
    const pythonKeywords = [
      'def', 'class', 'lambda', 'return', 'yield', 'import', 'from', 'if', 'elif',
      'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'async',
      'await', 'pass', 'raise', 'assert', 'in', 'is', 'not', 'and', 'or', 'None',
      'True', 'False', 'self', '__init__', 'len()', 'print()', 'sorted()',
      'enumerate()', 'range()', 'zip()', 'pythonDecode', 'x', 'y', 'val', 'data',
      '0', '1', 'λ', '::', '->', ':=', '==', '!=', '[]', '{}', '()'
    ];

    type StreamDirection = 'top_to_bottom' | 'bottom_to_top' | 'left_to_right' | 'right_to_left';

    interface DirectionalStream {
      direction: StreamDirection;
      x: number;
      y: number;
      speed: number;
      chars: string[];
      fontSize: number;
      opacity: number;
    }

    const streams: DirectionalStream[] = [];

    // Device-adaptive parameters for Mobile (<640px), Tablet (640-1024px), Laptop/Desktop (>=1024px)
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    const colStep = isMobile ? 26 : isTablet ? 22 : 20;
    const rowStep = isMobile ? 44 : isTablet ? 36 : 32;
    const baseFontSize = isMobile ? 11 : isTablet ? 12 : 14;
    const streamLen = isMobile ? 16 : isTablet ? 22 : 28;

    // 1. Top-to-Bottom Streams
    const vColumns = Math.ceil(width / colStep);
    for (let i = 0; i < vColumns; i++) {
      streams.push({
        direction: 'top_to_bottom',
        x: i * colStep + (Math.random() * 4 - 2),
        y: Math.random() * height * 1.5 - height * 0.5,
        speed: (isMobile ? 1.8 : 2.2) + Math.random() * 3.0,
        chars: Array.from({ length: streamLen }, () => pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)]),
        fontSize: Math.random() < 0.5 ? baseFontSize : baseFontSize + 1,
        opacity: 0.55 + Math.random() * 0.45,
      });
    }

    // 2. Bottom-to-Top Streams (Rising anti-gravity code)
    const bottomStreamRatio = isMobile ? 0.4 : 0.7;
    for (let i = 0; i < Math.floor(vColumns * bottomStreamRatio); i++) {
      streams.push({
        direction: 'bottom_to_top',
        x: Math.random() * width,
        y: Math.random() * height * 1.5,
        speed: -((isMobile ? 1.6 : 2.0) + Math.random() * 2.8),
        chars: Array.from({ length: streamLen }, () => pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)]),
        fontSize: Math.random() < 0.5 ? baseFontSize - 1 : baseFontSize,
        opacity: 0.45 + Math.random() * 0.4,
      });
    }

    // 3. Left-to-Right Horizontal Streams
    const hRows = Math.ceil(height / rowStep);
    for (let i = 0; i < hRows; i++) {
      streams.push({
        direction: 'left_to_right',
        x: Math.random() * width * 1.5 - width * 0.5,
        y: i * rowStep + (Math.random() * 6 - 3),
        speed: (isMobile ? 2.2 : 2.8) + Math.random() * 3.2,
        chars: Array.from({ length: Math.min(streamLen, 20) }, () => pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)]),
        fontSize: baseFontSize,
        opacity: 0.5 + Math.random() * 0.4,
      });
    }

    // 4. Right-to-Left Horizontal Streams
    const rightStreamRatio = isMobile ? 0.5 : 0.8;
    for (let i = 0; i < Math.floor(hRows * rightStreamRatio); i++) {
      streams.push({
        direction: 'right_to_left',
        x: Math.random() * width * 1.5,
        y: Math.random() * height,
        speed: -((isMobile ? 2.0 : 2.5) + Math.random() * 3.0),
        chars: Array.from({ length: Math.min(streamLen, 20) }, () => pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)]),
        fontSize: baseFontSize,
        opacity: 0.45 + Math.random() * 0.4,
      });
    }

    // Black Hole Particles - Scaled for device GPU efficiency
    const vortexParticleCount = isMobile ? 180 : isTablet ? 320 : 480;
    interface VortexParticle {
      angle: number;
      distance: number;
      speed: number;
      size: number;
      color: string;
      glyph: string;
    }

    const vortexParticles: VortexParticle[] = [];
    for (let i = 0; i < vortexParticleCount; i++) {
      vortexParticles.push({
        angle: Math.random() * Math.PI * 2,
        distance: 60 + Math.random() * Math.max(width, height) * 0.75,
        speed: 0.04 + Math.random() * 0.07,
        size: 1 + Math.random() * 3,
        color: Math.random() > 0.45 ? '#00ff66' : Math.random() > 0.6 ? '#00f0ff' : '#c7ffd8',
        glyph: pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)],
      });
    }

    let shockwaveRadius = 0;
    let shockwaveAlpha = 0;

    const blackHoleDuration = 3800;
    const startingDuration = 1100;
    let startingSoundTriggered = false;

    // Scramble glyphs for original digital Matrix decoding effect
    const targetWord = "S T A R T I N G";
    const decodeGlyphs = "01$#%&><?_~λ∑√πΩPY";

    // Helper to draw stream
    const drawStream = (
      s: DirectionalStream,
      vortexProgress: number,
      bhX: number,
      bhY: number,
      inVortex: boolean,
      singularityRadius: number
    ) => {
      if (s.direction === 'top_to_bottom') {
        s.y += s.speed;
        if (s.y > height + 250) s.y = -60;
      } else if (s.direction === 'bottom_to_top') {
        s.y += s.speed;
        if (s.y < -250) s.y = height + 60;
      } else if (s.direction === 'left_to_right') {
        s.x += s.speed;
        if (s.x > width + 250) s.x = -60;
      } else if (s.direction === 'right_to_left') {
        s.x += s.speed;
        if (s.x < -250) s.x = width + 60;
      }

      if (inVortex) {
        const dx = bhX - s.x;
        const dy = bhY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const pull = (4200 / (dist + 40)) * (1 + vortexProgress * 3.5);
        s.x += (dx / (dist + 1)) * pull * 0.12;
        s.y += (dy / (dist + 1)) * pull * 0.12;

        const currentAngle = Math.atan2(s.y - bhY, s.x - bhX);
        const spinSpeed = (130 / (dist + 30)) * (1 + vortexProgress * 2.5);
        const newAngle = currentAngle + spinSpeed * 0.05;
        const newDist = Math.max(singularityRadius * 0.5, dist * (1 - vortexProgress * 0.03));

        s.x = bhX + Math.cos(newAngle) * newDist;
        s.y = bhY + Math.sin(newAngle) * newDist;

        if (newDist <= singularityRadius * 0.85) {
          return;
        }
      }

      ctx.font = `${s.fontSize}px 'JetBrains Mono', monospace`;
      const charCount = Math.min(s.chars.length, 18);

      for (let j = 0; j < charCount; j++) {
        let posX = s.x;
        let posY = s.y;

        if (s.direction === 'top_to_bottom') {
          posY = s.y - j * (s.fontSize + 3);
        } else if (s.direction === 'bottom_to_top') {
          posY = s.y + j * (s.fontSize + 3);
        } else if (s.direction === 'left_to_right') {
          posX = s.x - j * 24;
        } else if (s.direction === 'right_to_left') {
          posX = s.x + j * 24;
        }

        if (posX < -40 || posX > width + 40 || posY < -40 || posY > height + 40) continue;

        const isLead = j === 0;
        const fade = (1 - j / charCount) * s.opacity * (inVortex ? Math.max(0, 1 - vortexProgress * 0.95) : 1);

        if (isLead) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 10;
        } else if (j < 2) {
          ctx.fillStyle = '#c7ffd8';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = `rgba(0, 255, 102, ${fade})`;
          ctx.shadowBlur = 0;
        }

        ctx.fillText(s.chars[j], posX, posY);
      }
    };

    // ------------------------------------------------------------------
    // RENDER LOOP
    // ------------------------------------------------------------------
    const render = (currentTime: number) => {
      const state = animStateRef.current;
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = '#050807';
      ctx.fillRect(0, 0, width, height);

      // ================================================================
      // STAGE 1: WAITING FOR CLICK (4-Directional Unstopped Matrix)
      // ================================================================
      if (state.stage === 'waiting_for_click') {
        for (let s of streams) {
          drawStream(s, 0, cx, cy, false, 0);
        }
        ctx.shadowBlur = 0;
      }

      // ================================================================
      // STAGE 2: BLACK HOLE GRAVITATIONAL ABSORPTION
      // ================================================================
      else if (state.stage === 'blackhole') {
        const vortexElapsed = currentTime - state.clickTime;
        const vortexProgress = Math.min(1, vortexElapsed / blackHoleDuration);

        const bhX = state.blackHoleX || cx;
        const bhY = state.blackHoleY || cy;

        // Shockwave ripple
        if (shockwaveRadius === 0) {
          shockwaveRadius = 5;
          shockwaveAlpha = 1;
        }
        if (shockwaveAlpha > 0.01) {
          shockwaveRadius += 22;
          shockwaveAlpha *= 0.94;
          ctx.beginPath();
          ctx.arc(bhX, bhY, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 136, ${shockwaveAlpha})`;
          ctx.lineWidth = 4;
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 30;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        const baseRadius = Math.min(width, height);
        const singularityRadius = Math.max(34, Math.min(56, baseRadius * 0.055)) + Math.sin(vortexElapsed * 0.012) * 6;
        const diskRadius = Math.max(160, Math.min(340, baseRadius * 0.32)) + Math.sin(vortexElapsed * 0.006) * 35;

        // Accretion disk
        const diskGrad = ctx.createRadialGradient(bhX, bhY, singularityRadius * 0.75, bhX, bhY, diskRadius);
        diskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        diskGrad.addColorStop(0.18, 'rgba(0, 255, 136, 0.95)');
        diskGrad.addColorStop(0.35, 'rgba(0, 230, 255, 0.75)');
        diskGrad.addColorStop(0.65, 'rgba(0, 255, 102, 0.3)');
        diskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.arc(bhX, bhY, diskRadius, 0, Math.PI * 2);
        ctx.fill();

        // Event Horizon
        ctx.beginPath();
        ctx.arc(bhX, bhY, singularityRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 35;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.95)';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        for (let s of streams) {
          drawStream(s, vortexProgress, bhX, bhY, true, singularityRadius);
        }
        ctx.shadowBlur = 0;

        for (let p of vortexParticles) {
          p.angle += p.speed * (1 + (diskRadius / (p.distance + 15))) * (1 + vortexProgress * 1.5);
          p.distance -= (2.5 + vortexProgress * 6);

          if (p.distance < singularityRadius * 0.8) {
            p.distance = diskRadius * (0.8 + Math.random() * 0.6);
            p.angle = Math.random() * Math.PI * 2;
          }

          const px = bhX + Math.cos(p.angle) * p.distance;
          const py = bhY + Math.sin(p.angle) * p.distance;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        if (vortexProgress >= 1) {
          state.stage = 'starting';
          state.clickTime = currentTime;
          setShowStartingUI(true);
        }
      }

      // ================================================================
      // STAGE 3: ORIGINAL "STARTING" DIGITAL MATRIX SCRAMBLE EFFECT
      // WITH CONTINUOUS MATRIX BACKGROUND
      // ================================================================
      else if (state.stage === 'starting') {
        if (!startingSoundTriggered) {
          startingSoundTriggered = true;
          sound.playStartingChime();
        }

        const startElapsed = currentTime - state.clickTime;
        const startProgress = Math.min(1, startElapsed / startingDuration);

        // 1. Matrix Background actively running behind "STARTING"
        for (let s of streams) {
          drawStream(s, 0, cx, cy, false, 0);
        }
        ctx.shadowBlur = 0;

        // Subtle dark backdrop scrim for crisp neon readability
        ctx.fillStyle = 'rgba(5, 8, 7, 0.55)';
        ctx.fillRect(0, 0, width, height);

        // 2. Original digital Matrix code scrambling algorithm
        const charsArray = targetWord.split('');
        const scrambled = charsArray.map((ch, idx) => {
          if (ch === ' ') return ' ';
          const lockThreshold = (idx / charsArray.length) * 0.75;
          if (startProgress > lockThreshold + 0.1) {
            return ch;
          }
          return decodeGlyphs[Math.floor(Math.random() * decodeGlyphs.length)];
        }).join('');

        setStartingText(scrambled);

        // Transition to main app after 1 second
        if (startProgress >= 1) {
          state.stage = 'fadeout';
          setFadeAlpha(0);
          setTimeout(() => {
            onComplete();
          }, 450);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

  if (isSkipped) return null;

  return (
    <div
      onClick={handleScreenClick}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          handleScreenClick({ clientX: t.clientX, clientY: t.clientY } as any);
        }
      }}
      style={{ opacity: fadeAlpha }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#050807] overflow-hidden transition-opacity duration-700 select-none ${
        !hasClicked ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* 60FPS Fullscreen Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* ORIGINAL "STARTING" DIGITAL MATRIX ANIMATION OVERLAY - Responsive for mobile, tablet, laptop */}
      {showStartingUI && (
        <div className="relative z-20 flex flex-col items-center justify-center space-y-3 sm:space-y-4 px-4 text-center animate-in fade-in zoom-in-95 duration-200 select-none pointer-events-none max-w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.25em] text-[#00ff88]/90">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00ff88] animate-spin" />
            <span>pythonDecode Initializing</span>
          </div>

          <h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-mono font-extrabold tracking-[0.1em] sm:tracking-[0.16em] md:tracking-[0.2em] lg:tracking-[0.25em] text-white whitespace-nowrap"
            style={{
              textShadow: '0 0 20px #00ff66, 0 0 45px #00e575, 0 0 80px rgba(0,255,102,0.7)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {startingText}
          </h1>

          <div className="w-32 sm:w-48 md:w-64 h-1 sm:h-1.5 bg-[#1a2e1d] rounded-full overflow-hidden shadow-[0_0_12px_#00ff66]">
            <div className="h-full bg-[#00ff66] animate-pulse w-full shadow-[0_0_14px_#00ff66]" />
          </div>
        </div>
      )}

      {/* Top Floating Controls: Audio & Skip - Responsive spacing for mobile, tablet & desktop */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 md:top-6 md:right-6 z-20 flex items-center gap-2 sm:gap-3">
        {/* Procedural Audio Toggle */}
        <button
          type="button"
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleAudio();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#0a140d]/80 hover:bg-[#122818] border border-[#00ff66]/30 text-[#8ec89e] hover:text-[#00ff88] text-[11px] sm:text-xs md:text-sm font-mono transition-all backdrop-blur-md shadow-lg cursor-pointer"
          title={audioEnabled ? 'Mute cinematic audio' : 'Enable cinematic synth audio'}
        >
          {audioEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00ff88]" />
              <span className="hidden sm:inline">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sound</span>
            </>
          )}
        </button>

        {/* Skip Intro Button */}
        <button
          type="button"
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/40 text-[#00ff88] hover:text-white text-[11px] sm:text-xs md:text-sm font-mono font-semibold transition-all backdrop-blur-md shadow-[0_0_15px_rgba(0,255,102,0.2)] group cursor-pointer"
          title="Skip directly to pythonDecode"
        >
          <span>Skip</span>
          <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Clean Bottom Notification - Responsive device messaging */}
      {!hasClicked && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 z-20 flex items-center justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-black/65 border border-[#00ff66]/40 text-[#00ff88] text-[11px] sm:text-xs md:text-sm font-mono font-medium backdrop-blur-md shadow-[0_0_20px_rgba(0,255,102,0.25)] animate-pulse text-center">
            <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce text-[#00ff88] shrink-0" />
            <span>Tap or click anywhere to initiate Black Hole</span>
          </div>
        </div>
      )}
    </div>
  );
};
