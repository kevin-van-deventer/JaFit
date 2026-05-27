import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Download,
  Dumbbell,
  Flame,
  History,
  Home,
  ListPlus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  RefreshCw,
  Timer,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const DB_KEY = "progressive-workout-coach-db-v1";
const ACTIVE_KEY = "progressive-workout-coach-active-v1";
const CLOUD_TOKEN_KEY = "progressive-workout-coach-cloud-token";
const CLOUD_EMAIL_KEY = "progressive-workout-coach-cloud-email";
const MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Abs"];
const EQUIPMENT = ["Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Kettlebell", "Band"];
const REST_DEFAULTS = { compound: 150, isolation: 90, bodyweight: 75 };
const TABS = [
  ["today", "Today", Home],
  ["programs", "Programs", CalendarDays],
  ["workout", "Active", Dumbbell],
  ["exercises", "Exercises", Search],
  ["progress", "Progress", BarChart3],
  ["settings", "Settings", Settings],
];

const nowIso = () => new Date().toISOString();
const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
const todayKey = () => new Date().toISOString().slice(0, 10);
const totalVolume = (sets) => sets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
const epley = (weight, reps) => Math.round((Number(weight) || 0) * (1 + (Number(reps) || 0) / 30) * 10) / 10;

function beep(enabled) {
  if (!enabled) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    navigator.vibrate?.(200);
  }
}

function seedExercises() {
  const specs = [
    ["Chest", "Barbell Bench Press", "Barbell", "Horizontal press", ["Shoulders", "Triceps"], "compound"],
    ["Chest", "Incline Dumbbell Press", "Dumbbell", "Incline press", ["Shoulders", "Triceps"], "compound"],
    ["Chest", "Machine Chest Press", "Machine", "Horizontal press", ["Triceps"], "compound"],
    ["Chest", "Cable Fly", "Cable", "Fly", ["Shoulders"], "isolation"],
    ["Chest", "Push-Up", "Bodyweight", "Horizontal press", ["Shoulders", "Triceps"], "bodyweight"],
    ["Chest", "Dumbbell Fly", "Dumbbell", "Fly", ["Shoulders"], "isolation"],
    ["Back", "Pull-Up", "Bodyweight", "Vertical pull", ["Biceps"], "compound"],
    ["Back", "Lat Pulldown", "Cable", "Vertical pull", ["Biceps"], "compound"],
    ["Back", "Barbell Row", "Barbell", "Horizontal pull", ["Biceps", "Hamstrings"], "compound"],
    ["Back", "Chest-Supported Row", "Machine", "Horizontal pull", ["Biceps"], "compound"],
    ["Back", "Single-Arm Cable Row", "Cable", "Horizontal pull", ["Biceps"], "compound"],
    ["Back", "Straight-Arm Pulldown", "Cable", "Shoulder extension", ["Triceps"], "isolation"],
    ["Shoulders", "Overhead Press", "Barbell", "Vertical press", ["Triceps"], "compound"],
    ["Shoulders", "Seated Dumbbell Press", "Dumbbell", "Vertical press", ["Triceps"], "compound"],
    ["Shoulders", "Dumbbell Lateral Raise", "Dumbbell", "Lateral raise", ["Traps"], "isolation"],
    ["Shoulders", "Cable Lateral Raise", "Cable", "Lateral raise", ["Traps"], "isolation"],
    ["Shoulders", "Rear Delt Fly", "Machine", "Rear delt", ["Back"], "isolation"],
    ["Shoulders", "Face Pull", "Cable", "External rotation", ["Back"], "isolation"],
    ["Biceps", "Barbell Curl", "Barbell", "Elbow flexion", ["Forearms"], "isolation"],
    ["Biceps", "Incline Dumbbell Curl", "Dumbbell", "Elbow flexion", ["Forearms"], "isolation"],
    ["Biceps", "Cable Curl", "Cable", "Elbow flexion", ["Forearms"], "isolation"],
    ["Biceps", "Preacher Curl", "Machine", "Elbow flexion", ["Forearms"], "isolation"],
    ["Biceps", "Hammer Curl", "Dumbbell", "Neutral curl", ["Forearms"], "isolation"],
    ["Biceps", "Concentration Curl", "Dumbbell", "Elbow flexion", ["Forearms"], "isolation"],
    ["Triceps", "Close-Grip Bench Press", "Barbell", "Horizontal press", ["Chest"], "compound"],
    ["Triceps", "Cable Pressdown", "Cable", "Elbow extension", ["Forearms"], "isolation"],
    ["Triceps", "Overhead Cable Extension", "Cable", "Elbow extension", ["Shoulders"], "isolation"],
    ["Triceps", "Skull Crusher", "Barbell", "Elbow extension", ["Forearms"], "isolation"],
    ["Triceps", "Machine Dip", "Machine", "Pressdown", ["Chest"], "compound"],
    ["Triceps", "Bench Dip", "Bodyweight", "Pressdown", ["Chest"], "compound"],
    ["Quads", "Back Squat", "Barbell", "Squat", ["Glutes", "Hamstrings"], "compound"],
    ["Quads", "Front Squat", "Barbell", "Squat", ["Glutes"], "compound"],
    ["Quads", "Leg Press", "Machine", "Squat", ["Glutes"], "compound"],
    ["Quads", "Hack Squat", "Machine", "Squat", ["Glutes"], "compound"],
    ["Quads", "Leg Extension", "Machine", "Knee extension", [], "isolation"],
    ["Quads", "Bulgarian Split Squat", "Dumbbell", "Single-leg squat", ["Glutes"], "compound"],
    ["Hamstrings", "Romanian Deadlift", "Barbell", "Hip hinge", ["Glutes", "Back"], "compound"],
    ["Hamstrings", "Seated Leg Curl", "Machine", "Knee flexion", ["Calves"], "isolation"],
    ["Hamstrings", "Lying Leg Curl", "Machine", "Knee flexion", ["Calves"], "isolation"],
    ["Hamstrings", "Good Morning", "Barbell", "Hip hinge", ["Glutes", "Back"], "compound"],
    ["Hamstrings", "Single-Leg RDL", "Dumbbell", "Hip hinge", ["Glutes"], "compound"],
    ["Hamstrings", "Nordic Curl", "Bodyweight", "Knee flexion", ["Glutes"], "compound"],
    ["Glutes", "Hip Thrust", "Barbell", "Hip extension", ["Hamstrings"], "compound"],
    ["Glutes", "Glute Bridge", "Barbell", "Hip extension", ["Hamstrings"], "compound"],
    ["Glutes", "Cable Kickback", "Cable", "Hip extension", ["Hamstrings"], "isolation"],
    ["Glutes", "Reverse Lunge", "Dumbbell", "Lunge", ["Quads"], "compound"],
    ["Glutes", "Step-Up", "Dumbbell", "Single-leg squat", ["Quads"], "compound"],
    ["Glutes", "Machine Hip Abduction", "Machine", "Hip abduction", ["Glutes"], "isolation"],
    ["Calves", "Standing Calf Raise", "Machine", "Plantar flexion", [], "isolation"],
    ["Calves", "Seated Calf Raise", "Machine", "Plantar flexion", [], "isolation"],
    ["Calves", "Leg Press Calf Raise", "Machine", "Plantar flexion", [], "isolation"],
    ["Calves", "Single-Leg Calf Raise", "Bodyweight", "Plantar flexion", [], "isolation"],
    ["Calves", "Dumbbell Calf Raise", "Dumbbell", "Plantar flexion", [], "isolation"],
    ["Calves", "Smith Machine Calf Raise", "Machine", "Plantar flexion", [], "isolation"],
    ["Abs", "Cable Crunch", "Cable", "Spinal flexion", [], "isolation"],
    ["Abs", "Hanging Knee Raise", "Bodyweight", "Hip flexion", [], "bodyweight"],
    ["Abs", "Ab Wheel Rollout", "Bodyweight", "Anti-extension", ["Shoulders"], "compound"],
    ["Abs", "Plank", "Bodyweight", "Anti-extension", ["Glutes"], "bodyweight"],
    ["Abs", "Machine Crunch", "Machine", "Spinal flexion", [], "isolation"],
    ["Abs", "Pallof Press", "Cable", "Anti-rotation", ["Shoulders"], "isolation"],
  ];

  return specs.map(([primaryMuscle, name, equipment, movementPattern, secondaryMuscles, type], index) => ({
    id: `ex_${index + 1}`,
    name,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    movementPattern,
    type,
    defaultRestSeconds: REST_DEFAULTS[type],
    setupNotes: `Set up ${name.toLowerCase()} so the target muscle can move through a controlled, repeatable range without joint discomfort.`,
    techniqueCues: [
      "Brace before each rep and keep the path consistent.",
      "Control the lowering phase for about two seconds.",
      "Stop the set when form changes or the target RIR is reached.",
    ],
    commonMistakes: [
      "Using momentum to finish reps.",
      "Shortening the range of motion as fatigue builds.",
      "Changing setup between sets, which makes progression hard to measure.",
    ],
    alternatives: specs.filter((s) => s[0] === primaryMuscle && s[1] !== name).slice(0, 4).map((s) => s[1]),
    custom: false,
  }));
}

function createProgram(profile, exercises) {
  const days = Number(profile.trainingDays || 4);
  const splitNames = days <= 2 ? ["Full Body A", "Full Body B"] : days === 3 ? ["Upper", "Lower", "Full Body"] : days === 4 ? ["Upper A", "Lower A", "Upper B", "Lower B"] : ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body"];
  const templates = {
    Push: ["Chest", "Shoulders", "Triceps"],
    Pull: ["Back", "Biceps"],
    Legs: ["Quads", "Hamstrings", "Glutes", "Calves"],
    Upper: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
    Lower: ["Quads", "Hamstrings", "Glutes", "Calves", "Abs"],
    "Full Body": ["Quads", "Chest", "Back", "Hamstrings", "Abs"],
  };
  const dayList = Array.from({ length: days }, (_, i) => {
    const name = splitNames[i] || `Training Day ${i + 1}`;
    const base = name.includes("Upper") ? templates.Upper : name.includes("Lower") ? templates.Lower : templates[name] || templates["Full Body"];
    const picks = base.map((muscle) => exercises.find((e) => e.primaryMuscle === muscle)).filter(Boolean).slice(0, profile.sessionLength <= 45 ? 4 : 6);
    return {
      id: uid("day"),
      name,
      exercises: picks.map((exercise) => ({
        id: uid("prog_ex"),
        exerciseId: exercise.id,
        sets: exercise.type === "isolation" ? 3 : 4,
        repMin: exercise.type === "compound" ? 6 : 10,
        repMax: exercise.type === "compound" ? 10 : 15,
        rir: profile.experience === "beginner" ? 3 : 2,
        restSeconds: exercise.defaultRestSeconds,
      })),
    };
  });
  return {
    id: uid("program"),
    name: `${profile.goalLabel || "Progressive"} Starter`,
    createdAt: nowIso(),
    active: true,
    days: dayList,
  };
}

function initialDb() {
  const exercises = seedExercises();
  const userProfile = {
    id: "user_single",
    name: "Athlete",
    goal: "",
    goalLabel: "",
    experience: "",
    trainingDays: 4,
    sessionLength: 60,
    units: "kg",
    onboarded: false,
    createdAt: nowIso(),
  };
  return {
    userProfile,
    equipmentProfiles: [{ id: "eq_home", name: "Available Equipment", equipment: EQUIPMENT, active: true }],
    exercises,
    programs: [],
    weeklyRoutine: [],
    activeWorkout: null,
    workoutHistory: [],
    bodyMetrics: [],
    progressPhotos: [],
    settings: {
      units: "kg",
      progressionMode: "weight-first",
      defaultRestTimes: REST_DEFAULTS,
      accentColor: "#FF7A1A",
      wakeLock: true,
      soundAlerts: true,
    },
  };
}

function createFreshUserDb(user) {
  const db = initialDb();
  return {
    ...db,
    userProfile: {
      ...db.userProfile,
      name: user?.name || "Athlete",
      email: user?.email || "",
      onboarded: false,
      createdAt: nowIso(),
    },
  };
}

function loadDb() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (!saved) return initialDb();
    const parsed = JSON.parse(saved);
    return { ...initialDb(), ...parsed, exercises: parsed.exercises?.length >= 60 ? parsed.exercises : seedExercises() };
  } catch {
    return initialDb();
  }
}

function workoutFromProgramDay(program, day, db) {
  return {
    id: uid("workout"),
    programId: program?.id || null,
    dayId: day?.id || null,
    name: day?.name || "Empty Workout",
    startedAt: nowIso(),
    elapsedOffset: 0,
    status: "active",
    exercises: (day?.exercises || []).map((entry) => {
      const ex = db.exercises.find((item) => item.id === entry.exerciseId);
      return {
        id: uid("session_ex"),
        exerciseId: entry.exerciseId,
        name: ex?.name || "Exercise",
        primaryMuscle: ex?.primaryMuscle || "General",
        targetSets: entry.sets,
        repMin: entry.repMin,
        repMax: entry.repMax,
        targetRir: entry.rir,
        restSeconds: entry.restSeconds,
        notesOpen: false,
        sets: Array.from({ length: entry.sets }, (_, index) => ({
          id: uid("set"),
          number: index + 1,
          type: "Working",
          targetReps: `${entry.repMin}-${entry.repMax}`,
          weight: "",
          reps: "",
          rir: entry.rir,
          completed: false,
          completedAt: null,
        })),
      };
    }),
  };
}

function useWakeLock(enabled, active) {
  useEffect(() => {
    let lock;
    async function requestLock() {
      if (!enabled || !active || !("wakeLock" in navigator)) return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        lock = null;
      }
    }
    requestLock();
    return () => lock?.release?.();
  }, [enabled, active]);
}

function secondsLabel(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function App() {
  const [db, setDb] = useState(loadDb);
  const [tab, setTab] = useState("today");
  const [cloudToken, setCloudToken] = useState(() => localStorage.getItem(CLOUD_TOKEN_KEY) || "");
  const [auth, setAuth] = useState(() => localStorage.getItem("pwc-auth") === "true" || Boolean(localStorage.getItem(CLOUD_TOKEN_KEY)));
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [syncState, setSyncState] = useState("idle");
  const [loginMode, setLoginMode] = useState("login");
  const [onboarding, setOnboarding] = useState({ step: 0, goal: "hypertrophy", experience: "intermediate", trainingDays: 4, sessionLength: 60, units: "kg" });
  const [activeWorkout, setActiveWorkout] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVE_KEY)) || loadDb().activeWorkout || null;
    } catch {
      return loadDb().activeWorkout || null;
    }
  });
  const [restTimer, setRestTimer] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [elapsed, setElapsed] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const fileInputRef = useRef(null);

  const activeProgram = db.programs.find((p) => p.active) || db.programs[0];
  const todaysDay = activeProgram?.days?.[new Date().getDay() % activeProgram.days.length];
  const isWorkoutActive = Boolean(activeWorkout);
  useWakeLock(db.settings.wakeLock, isWorkoutActive);

  useEffect(() => localStorage.setItem(DB_KEY, JSON.stringify(db)), [db]);
  useEffect(() => {
    if (!cloudToken || !auth) return;
    const id = setTimeout(async () => {
      try {
        setSyncState("Syncing...");
        await apiRequest("/api/sync", {
          method: "PUT",
          token: cloudToken,
          body: { data: db },
        });
        setSyncState("synced");
        setTimeout(() => setSyncState((state) => state === "synced" ? "idle" : state), 1200);
      } catch {
        setSyncState("error");
      }
    }, 900);
    return () => clearTimeout(id);
  }, [db, cloudToken, auth]);
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
    const id = setTimeout(() => {
      setDb((current) => {
        if (JSON.stringify(current.activeWorkout) === JSON.stringify(activeWorkout)) return current;
        return { ...current, activeWorkout };
      });
    }, 0);
    return () => clearTimeout(id);
  }, [activeWorkout]);
  useEffect(() => {
    if (!activeWorkout) return;
    const id = setInterval(() => {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeWorkout));
      setDb((current) => ({ ...current, activeWorkout }));
    }, 3000);
    return () => clearInterval(id);
  }, [activeWorkout]);
  useEffect(() => {
    if (!activeWorkout) return;
    const id = setInterval(() => {
      const started = new Date(activeWorkout.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - started) / 1000) + (activeWorkout.elapsedOffset || 0));
    }, 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);
  useEffect(() => {
    if (!restTimer) return;
    if (restTimer.remaining <= 0) {
      beep(db.settings.soundAlerts);
      setTimeout(() => {
        setToast("Rest complete. Next set is ready.");
        setRestTimer(null);
      }, 0);
      return;
    }
    const id = setTimeout(() => setRestTimer((r) => (r ? { ...r, remaining: r.remaining - 1 } : null)), 1000);
    return () => clearTimeout(id);
  }, [restTimer, db.settings.soundAlerts]);
  useEffect(() => {
    const handler = (event) => {
      if (!activeWorkout) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activeWorkout]);
  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  function updateDb(updater) {
    setDb((current) => (typeof updater === "function" ? updater(current) : updater));
  }

  async function handleAuth(mode, form) {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await apiRequest(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        body: { email: form.email, password: form.password, name: form.name || "Athlete" },
      });
      localStorage.setItem(CLOUD_TOKEN_KEY, result.token);
      localStorage.setItem(CLOUD_EMAIL_KEY, result.user.email);
      localStorage.setItem("pwc-auth", "true");
      setCloudToken(result.token);
      setAuth(true);
      setSyncState("idle");

      const cloud = await apiRequest("/api/sync", { token: result.token });
      if (cloud.data) {
        setDb({ ...initialDb(), ...cloud.data });
        setActiveWorkout(cloud.data.activeWorkout || null);
      } else {
        const freshDb = createFreshUserDb(result.user);
        setDb(freshDb);
        setActiveWorkout(null);
        localStorage.setItem(DB_KEY, JSON.stringify(freshDb));
        localStorage.removeItem(ACTIVE_KEY);
        await apiRequest("/api/sync", { method: "PUT", token: result.token, body: { data: freshDb } });
      }
    } catch (error) {
      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        localStorage.setItem("pwc-auth", "true");
        setAuth(true);
        setSyncState("idle");
      } else {
        setAuthError(error.message || "Could not sign in.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    if (cloudToken) {
      try {
        setSyncState("Saving before logout...");
        await apiRequest("/api/sync", {
          method: "PUT",
          token: cloudToken,
          body: { data: { ...db, activeWorkout } },
        });
        setSyncState("synced");
      } catch {
        setSyncState("Logout blocked: save failed");
        setToast("Could not save to the database. Check your connection and try logout again.");
        setLogoutLoading(false);
        return;
      }
    }
    const freshDb = initialDb();
    localStorage.removeItem("pwc-auth");
    localStorage.removeItem(CLOUD_TOKEN_KEY);
    localStorage.removeItem(CLOUD_EMAIL_KEY);
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.setItem(DB_KEY, JSON.stringify(freshDb));
    setCloudToken("");
    setActiveWorkout(null);
    setDb(freshDb);
    setTab("today");
    setSyncState("idle");
    setAuth(false);
    setLogoutLoading(false);
  }

  function cancelWorkout() {
    localStorage.removeItem(ACTIVE_KEY);
    setActiveWorkout(null);
    setDb((current) => ({ ...current, activeWorkout: null }));
    setTab("today");
    setToast("Workout cancelled. Nothing was saved to history.");
  }

  function finishOnboarding() {
    const goalLabel = { hypertrophy: "Hypertrophy", strength: "Strength", general: "General Fitness", fatloss: "Fat Loss Support" }[onboarding.goal];
    const nextProfile = { ...db.userProfile, ...onboarding, goalLabel, onboarded: true };
    const program = createProgram(nextProfile, db.exercises);
    updateDb((current) => ({
      ...current,
      userProfile: nextProfile,
      settings: { ...current.settings, units: onboarding.units },
      programs: [program],
      weeklyRoutine: program.days.map((day, index) => ({ weekday: index, dayId: day.id, programId: program.id })),
    }));
  }

  function startWorkout(day = todaysDay, program = activeProgram) {
    const workout = workoutFromProgramDay(program, day, db);
    if (!workout.exercises.length) {
      workout.exercises.push(createSessionExercise(db.exercises[0]));
    }
    setActiveWorkout(workout);
    setTab("workout");
  }

  function createSessionExercise(exercise) {
    return {
      id: uid("session_ex"),
      exerciseId: exercise.id,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      targetSets: 3,
      repMin: exercise.type === "compound" ? 6 : 10,
      repMax: exercise.type === "compound" ? 10 : 15,
      targetRir: 2,
      restSeconds: exercise.defaultRestSeconds,
      notesOpen: false,
      sets: Array.from({ length: 3 }, (_, index) => ({
        id: uid("set"),
        number: index + 1,
        type: "Working",
        targetReps: exercise.type === "compound" ? "6-10" : "10-15",
        weight: "",
        reps: "",
        rir: 2,
        completed: false,
        completedAt: null,
      })),
    };
  }

  function updateWorkoutExercise(exerciseId, updater) {
    setActiveWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)),
    }));
  }

  function updateSet(exerciseId, setId, patch) {
    updateWorkoutExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => {
        if (set.id !== setId) return set;
        const next = { ...set, ...patch };
        if (patch.completed === true && !set.completed) {
          next.completedAt = nowIso();
          setRestTimer({ exercise: exercise.name, remaining: exercise.restSeconds, total: exercise.restSeconds });
        }
        return next;
      }),
    }));
  }

  function addSet(exerciseId) {
    updateWorkoutExercise(exerciseId, (exercise) => ({
      ...exercise,
      targetSets: exercise.targetSets + 1,
      sets: [
        ...exercise.sets,
        {
          id: uid("set"),
          number: exercise.sets.length + 1,
          type: "Working",
          targetReps: `${exercise.repMin}-${exercise.repMax}`,
          weight: "",
          reps: "",
          rir: exercise.targetRir,
          completed: false,
          completedAt: null,
        },
      ],
    }));
  }

  function removeSet(exerciseId) {
    updateWorkoutExercise(exerciseId, (exercise) => ({
      ...exercise,
      targetSets: Math.max(1, exercise.targetSets - 1),
      sets: exercise.sets.length > 1 ? exercise.sets.slice(0, -1).map((set, i) => ({ ...set, number: i + 1 })) : exercise.sets,
    }));
  }

  function summarizeWorkout(workout) {
    const allSets = workout.exercises.flatMap((ex) => ex.sets.map((set) => ({ ...set, exercise: ex })));
    const completed = allSets.filter((set) => set.completed);
    const working = completed.filter((set) => set.type === "Working");
    const volumeByMuscle = MUSCLES.map((muscle) => ({
      muscle,
      volume: totalVolume(working.filter((set) => set.exercise.primaryMuscle === muscle)),
    })).filter((item) => item.volume > 0);
    const prs = detectPrs(db.workoutHistory, workout);
    const progression = workout.exercises.map((exercise) => progressExercise(exercise, db.settings.progressionMode));
    return {
      duration: elapsed,
      totalSets: completed.length,
      workingSets: working.length,
      volume: totalVolume(working),
      volumeByMuscle,
      exercisesCompleted: workout.exercises.filter((ex) => ex.sets.some((set) => set.completed)).length,
      prs,
      progression,
    };
  }

  function saveWorkout(workout) {
    const summary = summarizeWorkout(workout);
    const saved = { ...workout, status: "finished", finishedAt: nowIso(), summary };
    updateDb((current) => ({
      ...current,
      workoutHistory: [saved, ...current.workoutHistory],
      activeWorkout: null,
    }));
    setActiveWorkout(null);
    setModal({ type: "summary", workout: saved, summary });
    setTab("progress");
  }

  function detectPrs(history, workout) {
    const prior = {};
    history.forEach((entry) => entry.exercises.forEach((exercise) => exercise.sets.forEach((set) => {
      if (!set.completed || set.type !== "Working") return;
      const key = exercise.exerciseId;
      prior[key] ||= { maxWeight: 0, maxOneRm: 0, maxVolume: 0, repsAtWeight: {} };
      const weight = Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;
      prior[key].maxWeight = Math.max(prior[key].maxWeight, weight);
      prior[key].maxOneRm = Math.max(prior[key].maxOneRm, epley(weight, reps));
      prior[key].repsAtWeight[weight] = Math.max(prior[key].repsAtWeight[weight] || 0, reps);
    })));
    const prs = [];
    workout.exercises.forEach((exercise) => {
      const completed = exercise.sets.filter((set) => set.completed && set.type === "Working");
      const previous = prior[exercise.exerciseId] || { maxWeight: 0, maxOneRm: 0, repsAtWeight: {} };
      const volume = totalVolume(completed);
      const maxWeight = Math.max(0, ...completed.map((set) => Number(set.weight) || 0));
      const maxOneRm = Math.max(0, ...completed.map((set) => epley(set.weight, set.reps)));
      if (maxWeight > previous.maxWeight) prs.push(`${exercise.name}: heaviest weight ${maxWeight}${db.settings.units}`);
      if (maxOneRm > previous.maxOneRm) prs.push(`${exercise.name}: best estimated 1RM ${maxOneRm}${db.settings.units}`);
      completed.forEach((set) => {
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        if (reps > (previous.repsAtWeight[weight] || 0)) prs.push(`${exercise.name}: most reps at ${weight}${db.settings.units} (${reps})`);
      });
      if (volume > 0 && volume > Math.max(...history.map((h) => totalVolume(h.exercises.find((ex) => ex.exerciseId === exercise.exerciseId)?.sets || [])), 0)) {
        prs.push(`${exercise.name}: highest session volume ${volume}${db.settings.units}`);
      }
    });
    return [...new Set(prs)].slice(0, 8);
  }

  function progressExercise(exercise, mode) {
    const working = exercise.sets.filter((set) => set.type === "Working");
    const complete = working.length > 0 && working.every((set) => set.completed);
    const reps = working.map((set) => Number(set.reps) || 0);
    const avgRir = working.reduce((sum, set) => sum + Number(set.rir || 0), 0) / Math.max(working.length, 1);
    const topHit = complete && reps.every((rep) => rep >= exercise.repMax);
    const lowerMisses = reps.filter((rep) => rep < exercise.repMin).length;
    const source = db.exercises.find((item) => item.id === exercise.exerciseId);
    const latestWeight = Math.max(...working.map((set) => Number(set.weight) || 0), 0);
    if (topHit && avgRir >= 1) {
      const lower = ["Quads", "Hamstrings", "Glutes"].includes(exercise.primaryMuscle);
      const increment = source?.type === "isolation" ? 1.25 : lower ? 5 : 2.5;
      return { exercise: exercise.name, action: mode === "reps-first" ? "Add reps until the range ceiling is consistent, then load." : `Increase to ${latestWeight + increment}${db.settings.units}.`, note: "Performance met the progression standard." };
    }
    if (complete && lowerMisses === 0 && avgRir === 0) {
      return { exercise: exercise.name, action: "Repeat same load and reps.", note: "Matched target, but effort was too high. Repeat next time." };
    }
    if (lowerMisses >= 2) {
      return { exercise: exercise.name, action: `Repeat or reduce to ${Math.round(latestWeight * 0.95 * 10) / 10}${db.settings.units}.`, note: "Recovery or load may need adjustment." };
    }
    return { exercise: exercise.name, action: "Keep target stable.", note: "More completed working-set data needed." };
  }

  if (!auth) {
    return <AuthScreen mode={loginMode} setMode={setLoginMode} onAuth={handleAuth} error={authError} loading={authLoading} />;
  }

  if (!db.userProfile.onboarded) {
    return <Onboarding state={onboarding} setState={setOnboarding} finish={finishOnboarding} />;
  }

  return (
    <div className="app" style={{ "--accent": db.settings.accentColor }}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Progressive Workout Coach</p>
          <h1>{TABS.find(([id]) => id === tab)?.[1]}</h1>
        </div>
        <div className="header-actions">
          <SyncIndicator state={syncState} />
          {activeWorkout && <button className="session-pill" onClick={() => setTab("workout")}><Timer size={16} /> {secondsLabel(elapsed)}</button>}
          <button className="icon-button" onClick={() => setTab("settings")} aria-label="Settings"><User size={20} /></button>
        </div>
      </header>

      <main className="shell">
        {tab === "today" && <Today db={db} activeProgram={activeProgram} todaysDay={todaysDay} startWorkout={startWorkout} setTab={setTab} setModal={setModal} />}
        {tab === "programs" && <Programs db={db} updateDb={updateDb} setModal={setModal} startWorkout={startWorkout} />}
        {tab === "workout" && <WorkoutScreen db={db} activeWorkout={activeWorkout} elapsed={elapsed} startWorkout={startWorkout} updateWorkoutExercise={updateWorkoutExercise} updateSet={updateSet} addSet={addSet} removeSet={removeSet} setModal={setModal} cancelWorkout={cancelWorkout} />}
        {tab === "exercises" && <Exercises db={db} query={query} setQuery={setQuery} muscleFilter={muscleFilter} setMuscleFilter={setMuscleFilter} equipmentFilter={equipmentFilter} setEquipmentFilter={setEquipmentFilter} setModal={setModal} />}
        {tab === "progress" && <Progress db={db} setModal={setModal} updateDb={updateDb} />}
        {tab === "settings" && <SettingsScreen db={db} updateDb={updateDb} onLogout={handleLogout} logoutLoading={logoutLoading} fileInputRef={fileInputRef} installPrompt={installPrompt} setInstallPrompt={setInstallPrompt} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {restTimer && <RestBanner timer={restTimer} setTimer={setRestTimer} />}
      {toast && <div className="toast">{toast}</div>}
      {modal && <AppModal modal={modal} setModal={setModal} db={db} updateDb={updateDb} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} saveWorkout={saveWorkout} />}
    </div>
  );
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
}

function AuthScreen({ mode, setMode, onAuth, error, loading }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand-mark"><Dumbbell /></div>
        <p className="eyebrow">Free personal training log</p>
        <h1>Progressive Workout Coach</h1>
        <p className="muted">Science-based training logs, progression targets, PR tracking, and workout history. No subscriptions, no pricing page, no payment code.</p>
        <div className="segmented">
          <button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        {mode === "signup" && <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />}
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" />
        {error && <p className="auth-error">{error}</p>}
        <button className="primary large" disabled={loading} onClick={() => onAuth(mode, form)}>{loading ? "Connecting..." : mode === "login" ? "Login" : "Create Free Account"}</button>
      </div>
    </div>
  );
}

function SyncIndicator({ state }) {
  if (state === "idle" || state === "synced") return null;
  return (
    <span className={state === "error" ? "sync-icon error" : "sync-icon syncing"} title={state === "error" ? "Sync failed" : "Syncing"}>
      <RefreshCw size={17} />
    </span>
  );
}

function Onboarding({ state, setState, finish }) {
  const steps = [
    ["goal", "Choose your goal", [["hypertrophy", "Hypertrophy"], ["strength", "Strength"], ["general", "General fitness"], ["fatloss", "Fat loss support"]]],
    ["experience", "Training experience", [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]]],
    ["trainingDays", "Training days per week", [2, 3, 4, 5, 6].map((n) => [n, `${n} days`])],
    ["sessionLength", "Session length", [30, 45, 60, 75, 90].map((n) => [n, `${n} min`])],
    ["units", "Preferred units", [["kg", "Kilograms"], ["lbs", "Pounds"]]],
  ];
  const [key, title, options] = steps[state.step];
  return (
    <div className="auth-screen">
      <div className="auth-card onboarding">
        <p className="eyebrow">Setup {state.step + 1} of {steps.length}</p>
        <h1>{title}</h1>
        <div className="choice-grid">
          {options.map(([value, label]) => (
            <button key={value} className={state[key] === value ? "choice selected" : "choice"} onClick={() => setState({ ...state, [key]: value })}>
              {label}<Check size={18} />
            </button>
          ))}
        </div>
        <div className="row">
          <button className="secondary" disabled={state.step === 0} onClick={() => setState({ ...state, step: state.step - 1 })}>Back</button>
          <button className="primary" onClick={() => state.step === steps.length - 1 ? finish() : setState({ ...state, step: state.step + 1 })}>{state.step === steps.length - 1 ? "Generate Starter Program" : "Continue"}</button>
        </div>
      </div>
    </div>
  );
}

function Today({ db, activeProgram, todaysDay, startWorkout, setTab, setModal }) {
  const weekSets = db.workoutHistory.slice(0, 7).reduce((sum, workout) => sum + (workout.summary?.workingSets || 0), 0);
  const volume = db.workoutHistory.slice(0, 7).reduce((sum, workout) => sum + (workout.summary?.volume || 0), 0);
  const latestPrs = db.workoutHistory.flatMap((w) => w.summary?.prs || []).slice(0, 3);
  const todayExercises = todaysDay?.exercises?.length || 0;
  return (
    <section className="grid desktop-2">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Today</p>
          <h2>{todaysDay?.name || "No planned workout"}</h2>
          <p className="muted">{activeProgram?.name || "Create a program to begin"} · {todayExercises} exercises</p>
        </div>
        <div className="hero-stats">
          <span><strong>{db.userProfile.sessionLength}</strong> min</span>
          <span><strong>{db.userProfile.trainingDays}</strong> days/wk</span>
          <span><strong>{db.userProfile.goalLabel}</strong></span>
        </div>
        <button className="primary large" onClick={() => startWorkout()}><Dumbbell size={20} /> Start Workout</button>
      </div>
      <MetricGrid items={[
        ["Current streak", `${calcStreak(db.workoutHistory)} days`, Flame],
        ["Weekly sets", weekSets, Activity],
        ["Weekly volume", `${Math.round(volume)}${db.settings.units}`, BarChart3],
        ["Workouts logged", db.workoutHistory.length, History],
      ]} />
      <Card title="Weekly Calendar">
        <div className="week-row">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => <div key={d} className={i === new Date().getDay() ? "day-pill active" : "day-pill"}>{d}<span>{activeProgram?.days?.[i % activeProgram.days.length]?.name || "Rest"}</span></div>)}</div>
      </Card>
      <Card title="Latest PRs">{latestPrs.length ? latestPrs.map((pr) => <p className="list-line" key={pr}>{pr}</p>) : <p className="muted">PRs appear after saved workouts.</p>}</Card>
      <div className="quick-actions">
        <button onClick={() => setModal({ type: "bodyWeight" })}><Plus /> Log Body Weight</button>
        <button onClick={() => setTab("exercises")}><ListPlus /> Add Exercise</button>
        <button onClick={() => startWorkout(null, null)}><Dumbbell /> Start Empty Workout</button>
      </div>
    </section>
  );
}

function MetricGrid({ items }) {
  return <div className="metric-grid">{items.map(([label, value, Icon]) => <div className="metric" key={label}><Icon size={19} /><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function Programs({ db, updateDb, setModal, startWorkout }) {
  function regenerate() {
    const program = createProgram(db.userProfile, db.exercises);
    updateDb((current) => ({ ...current, programs: [{ ...program, active: true }, ...current.programs.map((p) => ({ ...p, active: false }))] }));
  }
  return (
    <section className="grid">
      <div className="action-bar">
        <button className="primary" onClick={regenerate}><RotateCcw /> Generate Routine</button>
        <button className="secondary" onClick={() => setModal({ type: "customProgram" })}><Plus /> Custom Program</button>
      </div>
      {db.programs.map((program) => (
        <Card key={program.id} title={program.name} action={<button className="chip" onClick={() => updateDb((c) => ({ ...c, programs: c.programs.map((p) => ({ ...p, active: p.id === program.id })) }))}>Set active</button>}>
          <div className="program-days">
            {program.days.map((day) => <ProgramDay key={day.id} day={day} program={program} db={db} updateDb={updateDb} startWorkout={startWorkout} setModal={setModal} />)}
          </div>
        </Card>
      ))}
    </section>
  );
}

function ProgramDay({ day, program, db, updateDb, startWorkout, setModal }) {
  function patchDay(patch) {
    updateDb((current) => ({
      ...current,
      programs: current.programs.map((p) => p.id === program.id ? { ...p, days: p.days.map((d) => d.id === day.id ? { ...d, ...patch } : d) } : p),
    }));
  }
  function addExercise() {
    setModal({ type: "programAddExercise", programId: program.id, dayId: day.id });
  }
  return (
    <div className="program-day">
      <div className="row">
        <input value={day.name} onChange={(e) => patchDay({ name: e.target.value })} />
        <button className="icon-button" onClick={() => startWorkout(day, program)}><Dumbbell size={17} /></button>
        <button className="icon-button" onClick={() => updateDb((c) => ({ ...c, programs: c.programs.map((p) => p.id === program.id ? { ...p, days: [...p.days, { ...day, id: uid("day"), name: `${day.name} Copy` }] } : p) }))}><Copy size={17} /></button>
        <button className="icon-button danger" onClick={() => updateDb((c) => ({ ...c, programs: c.programs.map((p) => p.id === program.id ? { ...p, days: p.days.filter((d) => d.id !== day.id) } : p) }))}><Trash2 size={17} /></button>
      </div>
      {day.exercises.map((entry, idx) => {
        const ex = db.exercises.find((item) => item.id === entry.exerciseId);
        return <div className="exercise-row compact" key={entry.id}>
          <span className="drag">{idx + 1}</span><strong>{ex?.name}</strong>
          <input type="number" value={entry.sets} onChange={(e) => patchProgramExercise(updateDb, program.id, day.id, entry.id, { sets: Number(e.target.value) })} />
          <input value={`${entry.repMin}-${entry.repMax}`} onChange={(e) => {
            const [a, b] = e.target.value.split("-").map(Number);
            patchProgramExercise(updateDb, program.id, day.id, entry.id, { repMin: a || 1, repMax: b || a || 1 });
          }} />
          <input type="number" value={entry.rir} onChange={(e) => patchProgramExercise(updateDb, program.id, day.id, entry.id, { rir: Number(e.target.value) })} />
          <button className="icon-button" title="Swap exercise" onClick={() => setModal({ type: "programSwap", programId: program.id, dayId: day.id, entryId: entry.id, primaryMuscle: ex?.primaryMuscle || "Chest" })}><Shuffle size={16} /></button>
          <button className="icon-button" onClick={() => patchDay({ exercises: move(day.exercises, idx, Math.max(0, idx - 1)) })}>↑</button>
          <button className="icon-button" onClick={() => patchDay({ exercises: move(day.exercises, idx, Math.min(day.exercises.length - 1, idx + 1)) })}>↓</button>
        </div>;
      })}
      <button className="secondary full" onClick={addExercise}><Plus /> Add Exercise</button>
    </div>
  );
}

function patchProgramExercise(updateDb, programId, dayId, entryId, patch) {
  updateDb((current) => ({ ...current, programs: current.programs.map((p) => p.id === programId ? { ...p, days: p.days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.map((e) => e.id === entryId ? { ...e, ...patch } : e) } : d) } : p) }));
}

function addProgramExercise(updateDb, programId, dayId, exercise) {
  const entry = {
    id: uid("prog_ex"),
    exerciseId: exercise.id,
    sets: exercise.type === "isolation" ? 3 : 4,
    repMin: exercise.type === "compound" ? 6 : 10,
    repMax: exercise.type === "compound" ? 10 : 15,
    rir: 2,
    restSeconds: exercise.defaultRestSeconds,
  };
  updateDb((current) => ({
    ...current,
    programs: current.programs.map((program) => program.id === programId ? {
      ...program,
      days: program.days.map((day) => day.id === dayId ? { ...day, exercises: [...day.exercises, entry] } : day),
    } : program),
  }));
}

function move(items, from, to) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function WorkoutScreen({ db, activeWorkout, elapsed, startWorkout, updateWorkoutExercise, updateSet, addSet, removeSet, setModal, cancelWorkout }) {
  if (!activeWorkout) {
    return <section className="empty-state"><Dumbbell size={44} /><h2>No active workout</h2><p className="muted">Start today’s plan or open an empty session.</p><button className="primary large" onClick={() => startWorkout()}>Start Workout</button></section>;
  }
  const completedSets = activeWorkout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length;
  const totalSets = activeWorkout.exercises.flatMap((exercise) => exercise.sets).length;
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  return (
    <section className="workout-screen">
      <div className="workout-top">
        <div><span>Live Session</span><strong>{secondsLabel(elapsed)}</strong></div>
        <div className="session-progress">
          <span>{completedSets}/{totalSets} sets</span>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="workout-actions">
          <button className="secondary" onClick={() => setModal({ type: "cancelWorkout", onCancel: cancelWorkout })}>Cancel</button>
          <button className="danger-button" onClick={() => setModal({ type: "finish", workout: activeWorkout })}>Finish</button>
        </div>
      </div>
      <div className="grid">
        {activeWorkout.exercises.map((exercise) => {
          const source = db.exercises.find((ex) => ex.id === exercise.exerciseId);
          const last = findLastPerformance(db.workoutHistory, exercise.exerciseId, db.settings.units);
          return (
            <Card key={exercise.id} title={exercise.name} subtitle={`${exercise.primaryMuscle} · Last: ${last}`} action={<button className="chip" onClick={() => setModal({ type: "swap", sessionExerciseId: exercise.id, primaryMuscle: exercise.primaryMuscle })}><Shuffle size={15} /> Swap</button>}>
              <div className="target-grid">
                <span>{exercise.targetSets} sets</span><span>{exercise.repMin}-{exercise.repMax} reps</span><span>RIR {exercise.targetRir}</span><span>{exercise.restSeconds}s rest</span>
              </div>
              <button className="notes-toggle" onClick={() => updateWorkoutExercise(exercise.id, (ex) => ({ ...ex, notesOpen: !ex.notesOpen }))}>Technique Notes <ChevronDown size={16} /></button>
              {exercise.notesOpen && <div className="notes">{source?.techniqueCues.map((cue) => <p key={cue}>{cue}</p>)}</div>}
              <div className="sets-table">
                {exercise.sets.map((set) => <SetRow key={set.id} set={set} exercise={exercise} updateSet={updateSet} setModal={setModal} />)}
              </div>
              <div className="row">
                <button className="secondary" onClick={() => addSet(exercise.id)}><Plus /> Add Set</button>
                <button className="secondary" onClick={() => removeSet(exercise.id)}><Trash2 /> Remove Set</button>
              </div>
            </Card>
          );
        })}
        <button className="secondary full" onClick={() => setModal({ type: "addWorkoutExercise" })}><Plus /> Add Exercise</button>
      </div>
    </section>
  );
}

function SetRow({ set, exercise, updateSet, setModal }) {
  return (
    <div className={set.completed ? "set-row complete" : "set-row"}>
      <strong><span>Set</span>{set.number}</strong>
      <label><span>Type</span><select value={set.type} onChange={(e) => updateSet(exercise.id, set.id, { type: e.target.value })}>
        <option>Warm-up</option><option>Working</option><option>Drop Set</option>
      </select></label>
      <span className="target"><small>Target</small>{set.targetReps}</span>
      <label><span>Load</span><input inputMode="decimal" placeholder="kg" value={set.weight} onChange={(e) => updateSet(exercise.id, set.id, { weight: e.target.value })} onFocus={() => setModal({ type: "plates", weight: set.weight })} /></label>
      <label><span>Reps</span><input inputMode="numeric" placeholder="reps" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, { reps: e.target.value })} /></label>
      <label><span>RIR</span><select value={set.rir} onChange={(e) => updateSet(exercise.id, set.id, { rir: e.target.value })}><option>0</option><option>1</option><option>2</option><option>3</option><option>4+</option></select></label>
      <button className={set.completed ? "check active" : "check"} onClick={() => updateSet(exercise.id, set.id, { completed: !set.completed })}><Check size={16} /></button>
    </div>
  );
}

function Exercises({ db, query, setQuery, muscleFilter, setMuscleFilter, equipmentFilter, setEquipmentFilter, setModal }) {
  const filtered = db.exercises.filter((ex) => (muscleFilter === "All" || ex.primaryMuscle === muscleFilter) && (equipmentFilter === "All" || ex.equipment === equipmentFilter) && ex.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="grid">
      <div className="filter-bar">
        <label><Search size={17} /><input placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)}><option>All</option>{MUSCLES.map((m) => <option key={m}>{m}</option>)}</select>
        <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)}><option>All</option>{EQUIPMENT.map((m) => <option key={m}>{m}</option>)}</select>
        <button className="primary" onClick={() => setModal({ type: "customExercise" })}><Plus /> Add Custom</button>
      </div>
      <div className="exercise-library">
        {filtered.map((ex) => (
          <button className="library-card" key={ex.id} onClick={() => setModal({ type: "exerciseDetail", exercise: ex })}>
            <strong>{ex.name}</strong><span>{ex.primaryMuscle} · {ex.equipment}</span><small>{ex.movementPattern}</small>
            {ex.custom && <Pencil size={16} onClick={(e) => { e.stopPropagation(); setModal({ type: "customExercise", exercise: ex }); }} />}
          </button>
        ))}
      </div>
    </section>
  );
}

function Progress({ db, setModal, updateDb }) {
  const volumeData = MUSCLES.map((muscle) => ({ muscle, volume: db.workoutHistory.reduce((sum, workout) => sum + (workout.summary?.volumeByMuscle?.find((x) => x.muscle === muscle)?.volume || 0), 0) })).filter((x) => x.volume > 0);
  const bodyData = db.bodyMetrics.slice().reverse().map((m) => ({ date: m.date.slice(5), weight: Number(m.weight) }));
  const frequency = lastNDays(21).map((date) => ({ date: date.slice(5), workouts: db.workoutHistory.some((w) => w.startedAt?.slice(0, 10) === date) ? 1 : 0 }));
  const oneRm = db.workoutHistory.slice().reverse().map((w) => ({ date: w.startedAt.slice(5, 10), oneRm: Math.max(0, ...w.exercises.flatMap((ex) => ex.sets.filter((s) => s.completed).map((s) => epley(s.weight, s.reps)))) }));
  return (
    <section className="grid desktop-2">
      <ChartCard title="Weekly Volume by Muscle" data={volumeData} type="bar" x="muscle" y="volume" />
      <ChartCard title="Estimated 1RM Trend" data={oneRm} type="line" x="date" y="oneRm" />
      <ChartCard title="Workout Frequency" data={frequency} type="bar" x="date" y="workouts" />
      <ChartCard title="Body Weight Trend" data={bodyData} type="line" x="date" y="weight" />
      <BodyWeightCalendar db={db} updateDb={updateDb} setModal={setModal} />
      <Card title="PR History">{db.workoutHistory.flatMap((w) => w.summary?.prs || []).slice(0, 12).map((pr) => <p className="list-line" key={pr}>{pr}</p>) || <p className="muted">No PRs yet.</p>}</Card>
      <Card title="Workout History">
        {db.workoutHistory.map((workout) => <div className="history-row" key={workout.id}><button onClick={() => setModal({ type: "history", workout })}>{workout.name} · {new Date(workout.startedAt).toLocaleDateString()}</button><button className="icon-button danger" onClick={() => updateDb((c) => ({ ...c, workoutHistory: c.workoutHistory.filter((w) => w.id !== workout.id) }))}><Trash2 size={16} /></button></div>)}
      </Card>
    </section>
  );
}

function BodyWeightCalendar({ db, updateDb, setModal }) {
  const days = lastNDays(35);
  const byDate = db.bodyMetrics.reduce((map, entry) => {
    const key = entry.date.slice(0, 10);
    map[key] ||= [];
    map[key].push(entry);
    return map;
  }, {});
  const latestByDate = Object.fromEntries(Object.entries(byDate).map(([date, entries]) => [date, entries.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0]]));
  const latest = db.bodyMetrics.slice(0, 8);
  return (
    <Card title="Body Weight Calendar" subtitle="Logged weigh-ins by date" action={<button className="chip" onClick={() => setModal({ type: "bodyWeight" })}><Plus size={15} /> Log</button>}>
      <div className="weight-calendar">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span className="calendar-heading" key={`${day}-${index}`}>{day}</span>)}
        {days.map((date) => {
          const entry = latestByDate[date];
          const day = new Date(`${date}T00:00:00`).getDate();
          return (
            <button className={entry ? "weight-day logged" : "weight-day"} key={date} onClick={() => entry ? setModal({ type: "bodyWeight", metric: entry }) : setModal({ type: "bodyWeight", date })}>
              <small>{day}</small>
              {entry ? <strong>{entry.weight}{db.settings.units}</strong> : <span />}
            </button>
          );
        })}
      </div>
      <div className="weight-log">
        {latest.length ? latest.map((entry) => (
          <div className="history-row" key={entry.id}>
            <button onClick={() => setModal({ type: "bodyWeight", metric: entry })}>{new Date(entry.date).toLocaleDateString()} · {entry.weight}{db.settings.units}</button>
            <button className="icon-button danger" onClick={() => updateDb((c) => ({ ...c, bodyMetrics: c.bodyMetrics.filter((item) => item.id !== entry.id) }))}><Trash2 size={16} /></button>
          </div>
        )) : <p className="muted">Use Log Body Weight on Today or here to start tracking weigh-ins.</p>}
      </div>
    </Card>
  );
}

function ChartCard({ title, data, type, x, y }) {
  return (
    <Card title={title}>
      <div className="chart">
        {data.length ? (
          <ResponsiveContainer width="100%" height={230}>
            {type === "bar" ? <BarChart data={data}><CartesianGrid stroke="#2a2f3a" /><XAxis dataKey={x} stroke="#9aa3b2" /><YAxis stroke="#9aa3b2" /><Tooltip contentStyle={{ background: "#181B22", border: "1px solid #303643" }} /><Bar dataKey={y} fill="#FF7A1A" radius={[6, 6, 0, 0]} /></BarChart> : <LineChart data={data}><CartesianGrid stroke="#2a2f3a" /><XAxis dataKey={x} stroke="#9aa3b2" /><YAxis stroke="#9aa3b2" /><Tooltip contentStyle={{ background: "#181B22", border: "1px solid #303643" }} /><Line dataKey={y} stroke="#2ECC71" strokeWidth={3} dot={false} /></LineChart>}
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty"><BarChart3 size={34} /><span>Start logging workouts to build this chart.</span></div>
        )}
      </div>
    </Card>
  );
}

function SettingsScreen({ db, updateDb, onLogout, logoutLoading, fileInputRef, installPrompt, setInstallPrompt }) {
  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progressive-workout-coach-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => updateDb(JSON.parse(text)));
  }
  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    setInstallPrompt(null);
  }
  return (
    <section className="grid">
      <Card title="Preferences">
        <Setting label="Units"><select value={db.settings.units} onChange={(e) => updateDb((c) => ({ ...c, settings: { ...c.settings, units: e.target.value } }))}><option>kg</option><option>lbs</option></select></Setting>
        <Setting label="Progression mode"><select value={db.settings.progressionMode} onChange={(e) => updateDb((c) => ({ ...c, settings: { ...c.settings, progressionMode: e.target.value } }))}><option value="reps-first">reps-first</option><option value="weight-first">weight-first</option></select></Setting>
        <Setting label="Accent color"><input type="color" value={db.settings.accentColor} onChange={(e) => updateDb((c) => ({ ...c, settings: { ...c.settings, accentColor: e.target.value } }))} /></Setting>
        <Setting label="Wake Lock"><input type="checkbox" checked={db.settings.wakeLock} onChange={(e) => updateDb((c) => ({ ...c, settings: { ...c.settings, wakeLock: e.target.checked } }))} /></Setting>
        <Setting label="Sound alerts"><input type="checkbox" checked={db.settings.soundAlerts} onChange={(e) => updateDb((c) => ({ ...c, settings: { ...c.settings, soundAlerts: e.target.checked } }))} /></Setting>
      </Card>
      <Card title="Data">
        <div className="action-bar">
          <button className="primary" disabled={!installPrompt} onClick={installApp}><Download /> Install Web App</button>
          <button className="secondary" onClick={exportData}><Save /> Export JSON</button>
          <button className="secondary" onClick={() => fileInputRef.current?.click()}><Upload /> Import JSON</button>
          <input ref={fileInputRef} className="hidden" type="file" accept="application/json" onChange={importData} />
          <button className="danger-button" onClick={() => { localStorage.clear(); location.reload(); }}><Trash2 /> Reset App Data</button>
          <button className="secondary" disabled={logoutLoading} onClick={onLogout}><User /> {logoutLoading ? "Saving..." : "Logout"}</button>
        </div>
      </Card>
      <Card title="Database Model">
        <div className="model-grid">{["userProfile", "equipmentProfiles", "exercises", "programs", "weeklyRoutine", "activeWorkout", "workoutHistory", "bodyMetrics", "progressPhotos", "settings"].map((item) => <span key={item}>{item}</span>)}</div>
      </Card>
    </section>
  );
}

function AppModal({ modal, setModal, db, updateDb, activeWorkout, setActiveWorkout, saveWorkout }) {
  const [draft, setDraft] = useState(modal.exercise || { name: "", primaryMuscle: "Chest", equipment: "Dumbbell", movementPattern: "", setupNotes: "", techniqueCues: [""], commonMistakes: [""], alternatives: [] });
  const [weight, setWeight] = useState(modal.weight || 100);
  const [bar, setBar] = useState(20);
  const summary = modal.workout ? summarizeForModal(modal.workout, db) : null;
  function close() { setModal(null); }
  function saveCustomExercise() {
    const exercise = { ...draft, id: draft.id || uid("custom_ex"), secondaryMuscles: draft.secondaryMuscles || [], defaultRestSeconds: 90, type: "isolation", custom: true, techniqueCues: draft.techniqueCues.filter(Boolean), commonMistakes: draft.commonMistakes.filter(Boolean), alternatives: draft.alternatives || [] };
    updateDb((c) => ({ ...c, exercises: draft.id ? c.exercises.map((e) => e.id === draft.id ? exercise : e) : [exercise, ...c.exercises] }));
    close();
  }
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}><X /></button>
        {modal.type === "bodyWeight" && <BodyWeightModal db={db} updateDb={updateDb} close={close} metric={modal.metric} date={modal.date} />}
        {modal.type === "customExercise" && <>
          <h2>{draft.id ? "Edit Custom Exercise" : "Add Custom Exercise"}</h2>
          <input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <select value={draft.primaryMuscle} onChange={(e) => setDraft({ ...draft, primaryMuscle: e.target.value })}>{MUSCLES.map((m) => <option key={m}>{m}</option>)}</select>
          <select value={draft.equipment} onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}>{EQUIPMENT.map((m) => <option key={m}>{m}</option>)}</select>
          <input placeholder="Movement pattern" value={draft.movementPattern} onChange={(e) => setDraft({ ...draft, movementPattern: e.target.value })} />
          <textarea placeholder="Setup notes" value={draft.setupNotes} onChange={(e) => setDraft({ ...draft, setupNotes: e.target.value })} />
          <button className="primary" onClick={saveCustomExercise}>Save Exercise</button>
        </>}
        {modal.type === "exerciseDetail" && <ExerciseDetail exercise={modal.exercise} db={db} />}
        {modal.type === "plates" && <PlateCalculator weight={weight} setWeight={setWeight} bar={bar} setBar={setBar} />}
        {modal.type === "swap" && <SwapExercise db={db} modal={modal} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} close={close} />}
        {modal.type === "programSwap" && <ProgramSwapExercise db={db} updateDb={updateDb} modal={modal} close={close} />}
        {modal.type === "programAddExercise" && <ProgramAddExercise db={db} updateDb={updateDb} modal={modal} close={close} />}
        {modal.type === "addWorkoutExercise" && <AddWorkoutExercise db={db} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} close={close} />}
        {modal.type === "finish" && <FinishModal summary={summary} close={close} onSave={() => { saveWorkout(modal.workout); close(); }} />}
        {modal.type === "cancelWorkout" && <CancelWorkoutModal close={close} onCancel={() => { modal.onCancel(); close(); }} />}
        {modal.type === "summary" && <FinishModal summary={modal.summary} close={close} saved />}
      {modal.type === "history" && <HistoryEditor workout={modal.workout} db={db} updateDb={updateDb} close={close} />}
        {modal.type === "customProgram" && <CustomProgramModal updateDb={updateDb} close={close} />}
      </div>
    </div>
  );
}

function BodyWeightModal({ db, updateDb, close, metric, date }) {
  const [weight, setWeight] = useState(metric?.weight || "");
  const [entryDate, setEntryDate] = useState((metric?.date || date || todayKey()).slice(0, 10));
  return <><h2>{metric ? "Edit Body Weight" : "Log Body Weight"}</h2><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} /><input inputMode="decimal" placeholder={`Weight (${db.settings.units})`} value={weight} onChange={(e) => setWeight(e.target.value)} /><button className="primary" onClick={() => { const saved = { id: metric?.id || uid("metric"), date: `${entryDate}T12:00:00.000Z`, weight }; updateDb((c) => ({ ...c, bodyMetrics: metric ? c.bodyMetrics.map((item) => item.id === metric.id ? saved : item) : [saved, ...c.bodyMetrics] })); close(); }}>Save</button></>;
}

function PlateCalculator({ weight, setWeight, bar, setBar }) {
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  let side = Math.max(0, (Number(weight) - Number(bar)) / 2);
  const result = [];
  plates.forEach((plate) => {
    const count = Math.floor(side / plate);
    if (count) result.push([plate, count]);
    side = Math.round((side - count * plate) * 100) / 100;
  });
  return <><h2>Plate Calculator</h2><input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /><div className="segmented"><button className={bar === 20 ? "selected" : ""} onClick={() => setBar(20)}>20kg</button><button className={bar === 15 ? "selected" : ""} onClick={() => setBar(15)}>15kg</button><input value={bar} onChange={(e) => setBar(e.target.value)} /></div><div className="plate-list">{result.map(([p, c]) => <span key={p}>{c} x {p}kg per side</span>)}</div></>;
}

function SwapExercise({ db, modal, activeWorkout, setActiveWorkout, close }) {
  const available = db.equipmentProfiles.find((p) => p.active)?.equipment || EQUIPMENT;
  const options = db.exercises.filter((ex) => ex.primaryMuscle === modal.primaryMuscle).sort((a, b) => Number(available.includes(b.equipment)) - Number(available.includes(a.equipment)));
  return <><h2>Swap Exercise</h2>{options.map((ex) => <button className="swap-option" key={ex.id} onClick={() => { setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.map((item) => item.id === modal.sessionExerciseId ? { ...item, exerciseId: ex.id, name: ex.name, primaryMuscle: ex.primaryMuscle, restSeconds: ex.defaultRestSeconds } : item) }); close(); }}>{ex.name}<span>{ex.equipment}</span></button>)}</>;
}

function ProgramSwapExercise({ db, updateDb, modal, close }) {
  const available = db.equipmentProfiles.find((p) => p.active)?.equipment || EQUIPMENT;
  const options = db.exercises
    .filter((ex) => ex.primaryMuscle === modal.primaryMuscle)
    .sort((a, b) => Number(available.includes(b.equipment)) - Number(available.includes(a.equipment)) || a.name.localeCompare(b.name));
  function swap(exerciseId) {
    patchProgramExercise(updateDb, modal.programId, modal.dayId, modal.entryId, { exerciseId });
    close();
  }
  return <><h2>Swap Program Exercise</h2><p className="muted">Targets for sets, reps, RIR, and rest stay the same.</p>{options.map((ex) => <button className="swap-option" key={ex.id} onClick={() => swap(ex.id)}>{ex.name}<span>{ex.equipment}</span></button>)}</>;
}

function ProgramAddExercise({ db, updateDb, modal, close }) {
  return <ExercisePicker title="Add Program Exercise" db={db} onSelect={(exercise) => { addProgramExercise(updateDb, modal.programId, modal.dayId, exercise); close(); }} />;
}

function AddWorkoutExercise({ db, activeWorkout, setActiveWorkout, close }) {
  return <><h2>Add Exercise</h2>{db.exercises.slice(0, 40).map((ex) => <button className="swap-option" key={ex.id} onClick={() => { setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, { ...createAdHocSessionExercise(ex) }] }); close(); }}>{ex.name}<span>{ex.primaryMuscle} · {ex.equipment}</span></button>)}</>;
}

function ExercisePicker({ title, db, onSelect }) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const filtered = db.exercises
    .filter((exercise) => muscle === "All" || exercise.primaryMuscle === muscle)
    .filter((exercise) => equipment === "All" || exercise.equipment === equipment)
    .filter((exercise) => exercise.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.primaryMuscle.localeCompare(b.primaryMuscle) || a.name.localeCompare(b.name));
  return <>
    <h2>{title}</h2>
    <div className="picker-filters">
      <label><Search size={16} /><input placeholder="Search exercise" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      <select value={muscle} onChange={(e) => setMuscle(e.target.value)}><option>All</option>{MUSCLES.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={equipment} onChange={(e) => setEquipment(e.target.value)}><option>All</option>{EQUIPMENT.map((item) => <option key={item}>{item}</option>)}</select>
    </div>
    <div className="picker-list">
      {filtered.map((exercise) => <button className="swap-option" key={exercise.id} onClick={() => onSelect(exercise)}><span><strong>{exercise.name}</strong><small>{exercise.primaryMuscle} · {exercise.movementPattern}</small></span><span>{exercise.equipment}</span></button>)}
    </div>
  </>;
}

function createAdHocSessionExercise(ex) {
  return {
    id: uid("session_ex"), exerciseId: ex.id, name: ex.name, primaryMuscle: ex.primaryMuscle, targetSets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: ex.defaultRestSeconds, notesOpen: false,
    sets: Array.from({ length: 3 }, (_, i) => ({ id: uid("set"), number: i + 1, type: "Working", targetReps: "8-12", weight: "", reps: "", rir: 2, completed: false, completedAt: null })),
  };
}

function FinishModal({ summary, close, onSave, saved }) {
  return <><h2>{saved ? "Workout Saved" : "Finish Workout"}</h2><MetricGrid items={[["Duration", secondsLabel(summary.duration), Timer], ["Sets", summary.totalSets, Activity], ["Working", summary.workingSets, ShieldCheck], ["Volume", Math.round(summary.volume), BarChart3]]} /><h3>Progression Updates</h3>{summary.progression.map((p) => <p className="list-line" key={p.exercise}><strong>{p.exercise}</strong>: {p.action} {p.note}</p>)}<h3>PRs</h3>{summary.prs.length ? summary.prs.map((pr) => <p className="list-line" key={pr}>{pr}</p>) : <p className="muted">No PRs detected.</p>} {!saved && <div className="row"><button className="secondary" onClick={close}>Edit before saving</button><button className="primary" onClick={onSave}>Save Workout</button></div>}</>;
}

function CancelWorkoutModal({ close, onCancel }) {
  return <><h2>Cancel Workout?</h2><p className="muted">This clears the active workout and does not save it to workout history.</p><div className="row"><button className="secondary" onClick={close}>Keep Workout</button><button className="danger-button" onClick={onCancel}>Cancel Workout</button></div></>;
}

function HistoryEditor({ workout, db, updateDb, close }) {
  const [draft, setDraft] = useState(workout);
  const [addingExercise, setAddingExercise] = useState(false);
  function patchSet(exId, setId, patch) {
    setDraft({ ...draft, exercises: draft.exercises.map((ex) => ex.id === exId ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, ...patch } : s) } : ex) });
  }
  function addSet(exerciseId) {
    setDraft({
      ...draft,
      exercises: draft.exercises.map((exercise) => exercise.id === exerciseId ? {
        ...exercise,
        sets: [...exercise.sets, { id: uid("set"), number: exercise.sets.length + 1, type: "Working", targetReps: `${exercise.repMin || 8}-${exercise.repMax || 12}`, weight: "", reps: "", rir: 2, completed: true, completedAt: nowIso() }],
      } : exercise),
    });
  }
  function addExercise(exercise) {
    setDraft({ ...draft, exercises: [...draft.exercises, createCompletedHistoryExercise(exercise)] });
    setAddingExercise(false);
  }
  if (addingExercise) {
    return <><button className="secondary" onClick={() => setAddingExercise(false)}>Back to Workout Edit</button><ExercisePicker title="Add Forgotten Exercise" db={db} onSelect={addExercise} /></>;
  }
  return <><h2>Edit Past Workout</h2><div className="action-bar"><button className="secondary" onClick={() => setAddingExercise(true)}><Plus /> Add Forgotten Exercise</button></div>{draft.exercises.map((ex) => <Card key={ex.id} title={ex.name} action={<button className="chip" onClick={() => addSet(ex.id)}><Plus size={15} /> Set</button>}>{ex.sets.map((set) => <div className="set-row history-set-row" key={set.id}><strong>{set.number}</strong><input value={set.weight} placeholder="Weight" onChange={(e) => patchSet(ex.id, set.id, { weight: e.target.value })} /><input value={set.reps} placeholder="Reps" onChange={(e) => patchSet(ex.id, set.id, { reps: e.target.value })} /><select value={set.rir} onChange={(e) => patchSet(ex.id, set.id, { rir: e.target.value })}><option>0</option><option>1</option><option>2</option><option>3</option><option>4+</option></select><button className="icon-button danger" onClick={() => setDraft({ ...draft, exercises: draft.exercises.map((x) => x.id === ex.id ? { ...x, sets: x.sets.filter((s) => s.id !== set.id).map((next, index) => ({ ...next, number: index + 1 })) } : x) })}><Trash2 size={15} /></button></div>)}</Card>)}<button className="primary" onClick={() => { const summary = summarizeEdited(draft); updateDb((c) => ({ ...c, workoutHistory: c.workoutHistory.map((w) => w.id === draft.id ? { ...draft, summary } : w) })); close(); }}>Save Edits and Recalculate</button></>;
}

function createCompletedHistoryExercise(exercise) {
  const repMin = exercise.type === "compound" ? 6 : 10;
  const repMax = exercise.type === "compound" ? 10 : 15;
  return {
    id: uid("history_ex"),
    exerciseId: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    targetSets: 1,
    repMin,
    repMax,
    targetRir: 2,
    restSeconds: exercise.defaultRestSeconds,
    notesOpen: false,
    sets: [{ id: uid("set"), number: 1, type: "Working", targetReps: `${repMin}-${repMax}`, weight: "", reps: "", rir: 2, completed: true, completedAt: nowIso() }],
  };
}

function CustomProgramModal({ updateDb, close }) {
  const [name, setName] = useState("Custom Program");
  return <><h2>Create Custom Program</h2><input value={name} onChange={(e) => setName(e.target.value)} /><button className="primary" onClick={() => { updateDb((c) => ({ ...c, programs: [{ id: uid("program"), name, active: true, createdAt: nowIso(), days: [{ id: uid("day"), name: "Day 1", exercises: [] }] }, ...c.programs.map((p) => ({ ...p, active: false }))] })); close(); }}>Create Program</button></>;
}

function ExerciseDetail({ exercise, db }) {
  const history = db.workoutHistory.flatMap((w) => w.exercises.filter((ex) => ex.exerciseId === exercise.id).map((ex) => ({ date: w.startedAt, sets: ex.sets })));
  return <><h2>{exercise.name}</h2><p className="muted">{exercise.primaryMuscle} · {exercise.equipment} · {exercise.movementPattern}</p><h3>Setup</h3><p>{exercise.setupNotes}</p><h3>Technique Cues</h3>{exercise.techniqueCues.map((cue) => <p className="list-line" key={cue}>{cue}</p>)}<h3>Common Mistakes</h3>{exercise.commonMistakes.map((cue) => <p className="list-line" key={cue}>{cue}</p>)}<h3>Alternatives</h3><p>{exercise.alternatives.join(", ")}</p><h3>History</h3>{history.length ? history.map((h) => <p className="list-line" key={h.date}>{new Date(h.date).toLocaleDateString()} · {h.sets.length} sets</p>) : <p className="muted">No history yet.</p>}</>;
}

function RestBanner({ timer, setTimer }) {
  return <div className="rest-banner"><Bell /><div><strong>{timer.exercise}</strong><span>Rest {secondsLabel(timer.remaining)}</span></div><button onClick={() => setTimer({ ...timer, remaining: timer.remaining + 30 })}>+30s</button><button onClick={() => setTimer({ ...timer, remaining: Math.max(0, timer.remaining - 30) })}>-30s</button><button onClick={() => setTimer(null)}>Skip</button></div>;
}

function Card({ title, subtitle, action, children }) {
  return <article className="card"><div className="card-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</article>;
}

function Setting({ label, children }) {
  return <label className="setting"><span>{label}</span>{children}</label>;
}

function calcStreak(history) {
  const days = new Set(history.map((w) => w.startedAt?.slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (days.has(date.toISOString().slice(0, 10))) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

function findLastPerformance(history, exerciseId, units) {
  const found = history.find((w) => w.exercises.some((ex) => ex.exerciseId === exerciseId));
  if (!found) return "none";
  const ex = found.exercises.find((item) => item.exerciseId === exerciseId);
  const top = ex.sets.filter((s) => s.completed).sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0))[0];
  return top ? `${top.weight}${units} x ${top.reps}` : "logged";
}

function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (n - 1 - i));
    return date.toISOString().slice(0, 10);
  });
}

function summarizeForModal(workout, db) {
  const allSets = workout.exercises.flatMap((ex) => ex.sets.map((set) => ({ ...set, exercise: ex })));
  const completed = allSets.filter((set) => set.completed);
  const working = completed.filter((set) => set.type === "Working");
  return {
    duration: Math.floor((Date.now() - new Date(workout.startedAt).getTime()) / 1000),
    totalSets: completed.length,
    workingSets: working.length,
    volume: totalVolume(working),
    volumeByMuscle: MUSCLES.map((muscle) => ({ muscle, volume: totalVolume(working.filter((set) => set.exercise.primaryMuscle === muscle)) })).filter((m) => m.volume),
    exercisesCompleted: workout.exercises.filter((ex) => ex.sets.some((set) => set.completed)).length,
    prs: [],
    progression: workout.exercises.map((exercise) => {
      const workingSets = exercise.sets.filter((set) => set.type === "Working");
      const latestWeight = Math.max(...workingSets.map((set) => Number(set.weight) || 0), 0);
      const complete = workingSets.every((set) => set.completed);
      const topHit = complete && workingSets.every((set) => Number(set.reps) >= exercise.repMax);
      return topHit ? { exercise: exercise.name, action: `Increase next target from ${latestWeight}${db.settings.units}.`, note: "Top of range achieved." } : { exercise: exercise.name, action: "Keep target stable.", note: "Complete more working sets to progress." };
    }),
  };
}

function summarizeEdited(workout) {
  const allSets = workout.exercises.flatMap((ex) => ex.sets.map((set) => ({ ...set, exercise: ex })));
  const completed = allSets.filter((set) => set.completed);
  const working = completed.filter((set) => set.type === "Working");
  return {
    ...(workout.summary || {}),
    totalSets: completed.length,
    workingSets: working.length,
    volume: totalVolume(working),
    volumeByMuscle: MUSCLES.map((muscle) => ({ muscle, volume: totalVolume(working.filter((set) => set.exercise.primaryMuscle === muscle)) })).filter((m) => m.volume),
  };
}

export default App;
