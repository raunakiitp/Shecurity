// ShecurityProvider: global app state — user, engines, black-box, dual-verification FSM.
// Lives ABOVE the router so the audio engine keeps running across route changes
// (calculator ↔ dashboard) without interruption.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ShecurityContext,
  PRE_ROLL_SEC,
  POST_ROLL_SEC,
  type ShecurityContextValue,
  type AlertPhase,
} from './shecurity-context';
import type {
  ClipMeta,
  GeoSnap,
  Settings,
  StoredUser,
  TriggerType,
} from '../lib/types';
import { AudioEngine } from '../engine/audio/AudioEngine';
import { RingBuffer } from '../engine/audio/RingBuffer';
import { DetectionEngine } from '../engine/detection/DetectionEngine';
import { KeywordEngine } from '../engine/detection/KeywordEngine';
import { LocationEngine } from '../engine/location/LocationEngine';
import { Siren, vibrate } from '../engine/alert/siren';
import { encodeWav } from '../engine/storage/wav';
import { saveClip } from '../engine/storage/db';
import { sha256Hex } from '../engine/crypto/secrets';
import { currentUser, logout as authLogout, updateUser } from './auth';
import { addHistory } from '../engine/storage/localStore';
import { deviceInfo, uid } from '../lib/format';


const SAMPLE_RATE = 16000;
const SIGNAL_WINDOW_MS = 8000;
const PROMPT_MS = 15000;
const COUNTDOWN_MS = 10000;

export function ShecurityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => currentUser());
  const [monitoring, setMonitoringState] = useState(false);
  const [score, setScore] = useState(0);
  const [raw, setRaw] = useState(0);
  const [top3, setTop3] = useState<{ name: string; score: number }[]>([]);
  const [levels, setLevels] = useState<number[]>(() => new Array(160).fill(0));
  const [uptime, setUptime] = useState(0);
  const [modelState, setModelState] = useState<'unloaded' | 'loading' | 'ready' | 'error'>('unloaded');
  const [modelError, setModelError] = useState<string | null>(null);
  const [kwEnabled, setKwEnabled] = useState(false);
  const [kwRunning, setKwRunning] = useState(false);
  const [kwHeard, setKwHeard] = useState('');
  const [kwHit] = useState<string | null>(null);
  const [soundAt, setSoundAt] = useState(0);
  const [wordsAt, setWordsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [alertPhase, setAlertPhase] = useState<AlertPhase>('idle');
  const [promptDeadline, setPromptDeadline] = useState<number | null>(null);
  const [countdownEnd, setCountdownEnd] = useState<number | null>(null);
  const [recordingLeft, setRecordingLeft] = useState<number | null>(null);
  const [location, setLocation] = useState<GeoSnap | null>(null);
  const [sharing, setSharing] = useState(false);
  const [duressSilent, setDuressSilent] = useState(false);

  const audioRef = useRef<AudioEngine | null>(null);
  const detectionRef = useRef<DetectionEngine | null>(null);
  const keywordRef = useRef<KeywordEngine | null>(null);
  const locationRef = useRef<LocationEngine | null>(null);
  const sirenRef = useRef<Siren | null>(null);
  const ringRef = useRef<RingBuffer | null>(null);
  const postRollRef = useRef<Float32Array[]>([]);
  const postRollCountRef = useRef(0);
  const capturingRef = useRef(false);
  const triggerRef = useRef<TriggerType>('scream');
  const peakRef = useRef(0);
  const promptTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const phaseRef = useRef<AlertPhase>('idle');

  if (!audioRef.current) {
    audioRef.current = new AudioEngine();
    detectionRef.current = new DetectionEngine();
    keywordRef.current = new KeywordEngine();
    locationRef.current = new LocationEngine();
    sirenRef.current = new Siren();
    ringRef.current = new RingBuffer(PRE_ROLL_SEC, SAMPLE_RATE);
  }

  const audio = audioRef.current!;
  const detection = detectionRef.current!;
  const keyword = keywordRef.current!;
  const locationEngine = locationRef.current!;
  const siren = sirenRef.current!;
  const ring = ringRef.current!;

  const settings = user?.settings ?? null;

  // ---------- global 1Hz tick for countdowns/uptime ----------
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  // ---------- engine event wiring ----------
  useEffect(() => {
    const offScore = detection.on('score', (payload?: unknown) => {
      const s = payload as { ema: number; raw: number; top3: { name: string; score: number }[] };
      setScore(s.ema);
      setRaw(s.raw);
      setTop3(s.top3);
      if (s.ema > peakRef.current) peakRef.current = s.ema;
      if (s.ema >= detection.threshold) setSoundAt(Date.now());
    });
    const offTrigger = detection.on('trigger', () => {
      handleScreamTrigger();
    });
    const offLevel = audio.on('level', (rms: number) => {
      setLevels((prev) => {
        const next = prev.slice(1);
        next.push(Math.min(1, rms * 6));
        return next;
      });
    });
    const offPcm = audio.on('pcm', (data: Float32Array) => {
      ring.write(data);
      if (capturingRef.current) {
        postRollRef.current.push(data);
        postRollCountRef.current += data.length;
        const left = POST_ROLL_SEC - postRollCountRef.current / SAMPLE_RATE;
        setRecordingLeft(Math.max(0, left));
        if (left <= 0) finalizeEvidence();
      }
    });
    const offKw = keyword.on('keyword', () => {
      setWordsAt(Date.now());
      handleKeywordTrigger();
    });
    const offKwState = keyword.on('state', (payload?: unknown) => {
      const s = payload as { running?: boolean; heard?: string };
      if (s.running !== undefined) setKwRunning(s.running);
      if (s.heard !== undefined) setKwHeard(s.heard);
    });
    return () => {
      offScore();
      offTrigger();
      offLevel();
      offPcm();
      offKw();
      offKwState();
    };
    // engines are stable singletons; wiring is intentional-once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- uptime ----------
  useEffect(() => {
    if (!monitoring) return;
    const t = window.setInterval(() => setUptime(Math.round((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [monitoring]);

  // ---------- user/settings ----------
  const onUserChanged = useCallback((u: StoredUser | null) => {
    setUser(u);
    if (u) {
      setKwEnabled(u.settings.keywords && keyword.supported);
    } else {
      setKwEnabled(false);
    }
  }, [keyword]);

  const logout = useCallback(() => {
    stopEverything();
    authLogout();
    setUser(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = useCallback(
    (s: Partial<Settings>) => {
      setUser((prev: StoredUser | null) => {
        if (!prev) return prev;
        const updated: StoredUser = { ...prev, settings: { ...prev.settings, ...s } };
        updateUser(updated);
        if (s.sensitivity) detection.setSensitivity(s.sensitivity);
        if (s.keywords !== undefined) {
          setKwEnabled(s.keywords && keyword.supported);
          if (monitoring) {
            if (s.keywords && keyword.supported) keyword.start(s.lang ?? updated.settings.lang);
            else keyword.stop();
          }
        }
        return updated;
      });
    },
    [detection, keyword, monitoring],
  );

  // ---------- monitoring ----------
  const setMonitoring = useCallback(
    async (on: boolean) => {
      if (on) {
        try {
          setModelState('loading');
          await detection.loadModel();
          setModelState('ready');
        } catch (e) {
          setModelState('error');
          setModelError(e instanceof Error ? e.message : String(e));
          return;
        }
        try {
          await audio.start();
        } catch {
          setMonitoringState(false);
          throw new Error('Microphone permission denied. Enable it in your browser settings to start monitoring.');
        }
        detection.setSensitivity(settings?.sensitivity ?? 'medium');
        detection.ema = 0;
        peakRef.current = 0;
        ring.clear();
        startedAtRef.current = Date.now();
        setUptime(0);
        setMonitoringState(true);
        // wire windows → classifier
        audio.on('window', (data: Float32Array) => {
          detection.classifyWindow(data);
        });
        if (settings?.keywords && keyword.supported) {
          setKwEnabled(true);
          keyword.start(settings.lang);
        }
        requestWakeLock();
      } else {
        setMonitoringState(false);
        await audio.stop();
        keyword.stop();
        releaseWakeLock();
      }
    },
    // engine singletons are stable; settings drive re-creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings?.sensitivity, settings?.keywords, settings?.lang],
  );

  // re-register window handler whenever monitoring toggles (handler identity)
  useEffect(() => {
    if (!monitoring) return;
    const off = audio.on('window', (data: Float32Array) => {
      detection.classifyWindow(data);
    });
    return () => {
      off();
    };
  }, [monitoring, audio, detection]);

  // ---------- wake lock ----------
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request(t: 'screen'): Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      /* wake lock unsupported */
    }
  };
  const releaseWakeLock = () => {
    try {
      wakeLockRef.current?.release();
    } catch {
      /* noop */
    }
    wakeLockRef.current = null;
  };
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && monitoring) requestWakeLock();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [monitoring]);

  // ---------- dual verification ----------
  const soundFresh = now - soundAt < SIGNAL_WINDOW_MS && soundAt > 0;
  const wordsFresh = now - wordsAt < SIGNAL_WINDOW_MS && wordsAt > 0;
  const confidence = Math.round(
    soundFresh && wordsFresh ? 95 + Math.min(4, (score * 100) / 25) : soundFresh ? 60 + score * 15 : wordsFresh ? 60 : 0,
  );

  const handleScreamTrigger = () => {
    if (phaseRef.current !== 'idle') return;
    if (wordsFresh) {
      startCountdown('dual');
    } else {
      startPrompt('scream');
    }
  };

  const handleKeywordTrigger = () => {
    if (phaseRef.current !== 'idle') return;
    if (soundFresh) {
      startCountdown('dual');
    } else {
      startPrompt('keyword');
    }
  };

  const startPrompt = (trigger: TriggerType) => {
    phaseRef.current = 'prompt';
    triggerRef.current = trigger;
    setAlertPhase('prompt');
    setPromptDeadline(Date.now() + PROMPT_MS);
    vibrate([120, 80, 120]);
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = window.setTimeout(() => {
      // no response in 15s → escalate
      startCountdown(triggerRef.current);
    }, PROMPT_MS);
  };

  const answerSafe = useCallback(() => {
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    phaseRef.current = 'idle';
    setAlertPhase('idle');
    setPromptDeadline(null);
    addHistory({
      id: uid(),
      at: new Date().toISOString(),
      trigger: triggerRef.current,
      outcome: 'cancelled',
      contactsNotified: 0,
    });
  }, []);

  const startCountdown = (trigger: TriggerType) => {
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    phaseRef.current = 'countdown';
    triggerRef.current = trigger;
    setAlertPhase('countdown');
    setPromptDeadline(null);
    setCountdownEnd(Date.now() + COUNTDOWN_MS);
    if (settings?.siren !== false) siren.start(0.4);
    if (settings?.vibration !== false) vibrate([400, 200, 400, 200, 400]);
    window.setTimeout(() => {
      if (phaseRef.current === 'countdown') {
        // 10s with no valid PIN → proceed silently (as if duress)
        proceedWithAlert('countdown');
      }
    }, COUNTDOWN_MS + 300);
  };

  const submitPin = useCallback(
    async (pin: string): Promise<'real' | 'duress' | 'none'> => {
      const { verifyPin } = await import('./auth');
      const result = user ? await verifyPin(user.id, pin) : 'none';
      if (result === 'real') {
        siren.stop();
        phaseRef.current = 'idle';
        setAlertPhase('idle');
        setCountdownEnd(null);
        addHistory({
          id: uid(),
          at: new Date().toISOString(),
          trigger: triggerRef.current,
          outcome: 'cancelled',
          contactsNotified: 0,
        });
        return 'real';
      }
      if (result === 'duress') {
        siren.stop();
        // FAKE cancel: show "cancelled", then silently continue
        phaseRef.current = 'recording';
        setAlertPhase('recording');
        setCountdownEnd(null);
        setDuressSilent(true);
        beginEvidence(triggerRef.current, true);
        return 'duress';
      }
      return 'none';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const triggerAlert = useCallback(
    (trigger: TriggerType) => {
      if (phaseRef.current !== 'idle') return;
      startCountdown(trigger);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings?.siren, settings?.vibration],
  );

  const proceedWithAlert = (trigger: TriggerType) => {
    siren.stop();
    phaseRef.current = 'recording';
    setAlertPhase('recording');
    setCountdownEnd(null);
    beginEvidence(trigger, false);
  };

  // ---------- evidence ----------
  const beginEvidence = (trigger: TriggerType, duress: boolean) => {
    capturingRef.current = true;
    postRollRef.current = [];
    postRollCountRef.current = 0;
    triggerRef.current = trigger;
    setDuressSilent(duress);
    setRecordingLeft(POST_ROLL_SEC);
    // ensure location
    locationEngine.getCurrent().then((snap) => {
      if (snap) setLocation(snap);
    });
    locationEngine.startWatch((snap) => setLocation(snap));
    setSharing(true);
  };

  const finalizeEvidence = async () => {
    capturingRef.current = false;
    setRecordingLeft(null);
    locationEngine.stopWatch();
    setSharing(false);
    const pre = ring.read();
    const post = postRollRef.current;
    const total = new Float32Array(pre.length + post.reduce((a, b) => a + b.length, 0));
    total.set(pre, 0);
    let off = pre.length;
    for (const chunk of post) {
      total.set(chunk, off);
      off += chunk.length;
    }
    const wav = encodeWav(total, SAMPLE_RATE);
    const hash = await sha256Hex(wav);
    const nowIso = new Date();
    const meta: ClipMeta = {
      id: uid(),
      createdAt: nowIso.toISOString(),
      localTime: nowIso.toLocaleString(),
      duration: total.length / SAMPLE_RATE,
      trigger: triggerRef.current,
      peakScore: peakRef.current,
      location: locationEngine.last ?? undefined,
      device: deviceInfo(),
      sha256: hash,
      duress: duressSilent || triggerRef.current === 'countdown',
      fileName: `shecurity-clip-${nowIso.getTime()}.wav`,
    };
    try {
      await saveClip(meta, wav);
    } catch {
      /* storage full — surfaced in Vault */
    }
    addHistory({
      id: uid(),
      at: meta.createdAt,
      trigger: meta.trigger,
      outcome: duressSilent ? 'silent-duress' : 'proceeded',
      location: meta.location,
      contactsNotified: user?.contacts.length ?? 0,
      clipId: meta.id,
    });
    phaseRef.current = 'sharing';
    setAlertPhase('sharing');
    // auto-resolve after 90s of sharing screen
    window.setTimeout(() => {
      if (phaseRef.current === 'sharing') {
        phaseRef.current = 'done';
        setAlertPhase('done');
      }
    }, 90000);
  };

  const dismissAlertUI = useCallback(() => {
    phaseRef.current = 'idle';
    setAlertPhase('idle');
    setDuressSilent(false);
    setRecordingLeft(null);
    setSharing(false);
    locationEngine.stopWatch();
  }, [locationEngine]);

  const sendLocationUpdate = useCallback(async (): Promise<string> => {
    const snap = await locationEngine.getCurrent();
    if (snap) setLocation(snap);
    const name = user?.name ?? 'Shecurity user';
    const { buildMessage } = await import('../engine/location/share');
    return buildMessage(name, snap, new Date().toLocaleTimeString());
  }, [user, locationEngine]);

  const requestLocation = useCallback(async (): Promise<GeoSnap | null> => {
    return locationEngine.getCurrent();
  }, [locationEngine]);

  const testSound = useCallback(() => {
    const a = new Audio('/sounds/sample-scream.wav');
    a.volume = 1;
    a.play().catch(() => {
      /* autoplay blocked until user gesture — the click IS the gesture */
    });
  }, []);

  const stopEverything = () => {
    audio.stop();
    keyword.stop();
    siren.stop();
    releaseWakeLock();
    locationEngine.stopWatch();
    setMonitoringState(false);
    phaseRef.current = 'idle';
    setAlertPhase('idle');
  };

  // 2-minute location update nudge while sharing
  useEffect(() => {
    if (alertPhase !== 'sharing') return;
    const t = window.setInterval(() => {
      // in-app nudge handled by the sharing screen itself via `now` re-render
    }, 120000);
    return () => window.clearInterval(t);
  }, [alertPhase]);

  const value: ShecurityContextValue = {
    user,
    settings,
    monitoring,
    score,
    raw,
    top3,
    levels,
    uptime,
    modelState,
    modelError,
    worklet: audio.usingWorklet,
    keyword: {
      supported: keyword.supported,
      enabled: kwEnabled,
      running: kwRunning,
      lastHeard: kwHeard,
      lastHit: kwHit,
    },
    verification: {
      sound: soundFresh,
      words: wordsFresh,
      confidence,
    },
    alertPhase,
    promptDeadline,
    countdownEnd,
    recordingLeft,
    location,
    sharing,
    onUserChanged,
    logout,
    saveSettings,
    setMonitoring,
    triggerAlert,
    answerSafe,
    submitPin,
    dismissAlertUI,
    sendLocationUpdate,
    requestLocation,
    testSound,
  };

  return <ShecurityContext.Provider value={value}>{children}</ShecurityContext.Provider>;
}

interface WakeLockSentinel extends EventTarget {
  released: boolean;
  release(): Promise<void>;
}
