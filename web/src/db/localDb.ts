import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface UserProfile {
  username: string;
  profilePic: string;
  xp: number;
  longestStreak: number;
  currentStreak: number;
  currentGroupId: string | null;
  currentGroupName: string | null;
  totalTasksCompletedAllTime: number;
  badgeCount: number;
  lastResetDateString: string;
  routineStreak: number;
  graceDaysAllowedThisWeek: number;
  graceDaysUsedThisWeek: number;
  level: number;
  disciplineScore: number;
}

export interface TaskConfig {
  id: string;
  name: string;
  description: string;
  category: "tech" | "health" | "discipline" | "recovery" | string;
  xpReward: number;
  streakEnabled: boolean;
  graceDayEligible: boolean;
  isCustom: boolean;
  archived: boolean;
  enabled: boolean;
  order: number;
  createdAt: string;
  taskType: "simple" | "problems";
}

export interface TaskCompletion {
  taskId: string;
  isCompleted: boolean;
  completedAt: string | null;
  remarks?: string;
}

export interface DailySnapshot {
  dateString: string;
  taskCompletions: TaskCompletion[];
  habits: DailyHabits;
  disciplineScore: number;
  xpEarned: number;
  focusMinutes: number;
  sleepHours: number;
  tasksCompleted: number;
  tasksTotal: number;
  mood?: string;
  notes?: string;
}

export interface DailyHabits {
  gymCompleted: boolean;
  dietCompleted: boolean;
  skincareCompleted: boolean;
  sleepCompleted: boolean;
  screenTimeGoal: boolean;
  entertainmentCap: boolean;
  bedtime: string;
  wakeTime: string;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskName: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  xpEarned: number;
  dateString: string;
  isActive: boolean;
}

export interface SleepLog {
  dateString: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number;
  quality: number; // 0-100
}

export interface TechLog {
  id: string;
  topic: string;
  platform: string;
  count: number;
  dateString: string;
  xpEarned: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: 1 | 2 | 3;
  category: string;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface XPLog {
  id: string;
  amount: number;
  source: string;
  description: string;
  dateString: string;
  timestamp: string;
}

export interface GroupMember {
  userId: string;
  username: string;
  dailyCompletionPercentage: number;
  currentStreak: number;
  totalTasksAllTime: number;
  xp: number;
  profilePic: string;
  activeBreakdown: string;
  isMe: boolean;
  focusHours?: number;
  problemsSolved?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getTodayDateString(): string {
  return formatDate(new Date());
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function calculateSleepHours(bed: string, wake: string): number {
  try {
    const [bH, bM] = bed.split(":").map(Number);
    const [wH, wM] = wake.split(":").map(Number);
    let bedMins = bH * 60 + bM;
    let wakeMins = wH * 60 + wM;
    if (wakeMins <= bedMins) wakeMins += 24 * 60;
    return parseFloat(((wakeMins - bedMins) / 60).toFixed(1));
  } catch {
    return 8.0;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_TASK_CONFIGS: TaskConfig[] = [
  // Tech & Learning
  { id: "tech_leetcode", name: "LeetCode", description: "Solve daily LeetCode problems", category: "tech", xpReward: 15, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 0, createdAt: getTodayDateString(), taskType: "problems" },
  { id: "tech_dsa", name: "DSA", description: "Practice Data Structures & Algorithms", category: "tech", xpReward: 15, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 1, createdAt: getTodayDateString(), taskType: "problems" },
  { id: "tech_webdev", name: "Web Development", description: "Build web projects and code", category: "tech", xpReward: 10, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 2, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "tech_projects", name: "Projects", description: "Work on personal coding projects", category: "tech", xpReward: 15, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 3, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "tech_reading", name: "Reading", description: "Read technical or learning material", category: "tech", xpReward: 10, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 4, createdAt: getTodayDateString(), taskType: "simple" },
  // Health & Wellness
  { id: "health_gym", name: "Gym", description: "Complete a full gym or workout session", category: "health", xpReward: 15, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 5, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "health_diet", name: "Clean Diet", description: "Eat a nutrition-focused clean diet today", category: "health", xpReward: 10, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 6, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "health_water", name: "Water Intake", description: "Drink 3 liters of water", category: "health", xpReward: 5, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 7, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "health_meditation", name: "Meditation", description: "Complete a deep meditation session", category: "health", xpReward: 5, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 8, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "health_skincare", name: "Skincare", description: "Perform PM skincare routine", category: "health", xpReward: 5, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 9, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "health_sleep", name: "Sleep", description: "Get 7-8 hours of sound sleep", category: "health", xpReward: 10, streakEnabled: true, graceDayEligible: true, isCustom: false, archived: false, enabled: true, order: 10, createdAt: getTodayDateString(), taskType: "simple" },
  // Lifestyle & Discipline
  { id: "disc_morning", name: "Morning Routine", description: "Wake up early and complete routine", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 11, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "disc_noreels", name: "No Reels", description: "Avoid mindless scroll (Instagram/YouTube)", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 12, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "disc_nonetflix", name: "No Netflix", description: "Skip entertainment streaming platforms", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 13, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "disc_screentime", name: "Screen Time Goal", description: "Keep screen time under target hours", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 14, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "disc_journaling", name: "Journaling", description: "Write down reflections and plan next day", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 15, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "disc_room", name: "Room Clean", description: "Organize and declutter workspace", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 16, createdAt: getTodayDateString(), taskType: "simple" },
  { id: "disc_detox", name: "Digital Detox", description: "Unplug from all screens 1 hour before bed", category: "discipline", xpReward: 10, streakEnabled: true, graceDayEligible: false, isCustom: false, archived: false, enabled: true, order: 17, createdAt: getTodayDateString(), taskType: "simple" },
];

const DEFAULT_HABITS: DailyHabits = {
  gymCompleted: false,
  dietCompleted: false,
  skincareCompleted: false,
  sleepCompleted: false,
  screenTimeGoal: false,
  entertainmentCap: false,
  bedtime: "22:30",
  wakeTime: "06:30",
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "ach_iron", title: "Iron Discipline", description: "Complete 100 morning routines before 6 AM", tier: 1, category: "discipline", target: 100, current: 0, unlocked: false, unlockedAt: null },
  { id: "ach_focus", title: "Deep Work Elite", description: "Log 500 hours of uninterrupted flow state", tier: 3, category: "focus", target: 500, current: 0, unlocked: false, unlockedAt: null },
  { id: "ach_momentum", title: "Momentum Builder", description: "Maintain all daily habits for 60 consecutive days", tier: 2, category: "consistency", target: 60, current: 0, unlocked: false, unlockedAt: null },
  { id: "ach_coding", title: "Coding Machine", description: "Solve 500 coding problems across all platforms", tier: 3, category: "learning", target: 500, current: 0, unlocked: false, unlockedAt: null },
  { id: "ach_consistency", title: "Consistency Architect", description: "Achieve a 30-day streak on any task", tier: 2, category: "consistency", target: 30, current: 0, unlocked: false, unlockedAt: null },
  { id: "ach_sleep", title: "Sleep Optimizer", description: "Log 7+ hours of sleep for 30 consecutive nights", tier: 1, category: "recovery", target: 30, current: 0, unlocked: false, unlockedAt: null },
  { id: "ach_focus_master", title: "Focus Master", description: "Complete 100 focus sessions", tier: 2, category: "focus", target: 100, current: 0, unlocked: false, unlockedAt: null },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEGACY KEYS — guest localStorage fallback only
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const KEYS = {
  PROFILE: "gs3_profile",
  TASK_CONFIGS: "gs3_task_configs",
  DAILY_SNAPSHOTS: "gs3_daily_snapshots",
  FOCUS_SESSIONS: "gs3_focus_sessions",
  SLEEP_LOGS: "gs3_sleep_logs",
  TECH_LOGS: "gs3_tech_logs",
  ACHIEVEMENTS: "gs3_achievements",
  LEADERBOARD: "gs3_leaderboard",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IN-MEMORY SESSION CACHE
//
// This is the PRIMARY data source for all reads.
// It is populated from Firestore (auth users) or
// localStorage (guest users) once on login via
// initializeFromFirestore(). All writes update both
// this cache AND the backing store atomically.
// Reads are always synchronous and instant.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MemCache {
  initialized: boolean;
  isGuest: boolean;
  userId: string | null;
  profile: UserProfile | null;
  snapshots: Record<string, DailySnapshot>;
  taskConfigs: TaskConfig[];
  techLogs: TechLog[];
  focusSessions: FocusSession[];
  sleepLogs: SleepLog[];
  achievements: Achievement[];
  leaderboard: GroupMember[];
  lastSyncTime: number;
}

const mem: MemCache = {
  initialized: false,
  isGuest: false,
  userId: null,
  profile: null,
  snapshots: {},
  taskConfigs: [],
  techLogs: [],
  focusSessions: [],
  sleepLogs: [],
  achievements: [],
  leaderboard: [],
  lastSyncTime: 0,
};

/** Fire-and-forget Firestore write. Errors are logged but never block the UI. */
function fsWrite(promise: Promise<any>): void {
  promise.catch((e: any) => console.error("[Grindstack] Firestore write error:", e));
}

function uid(): string | null { return mem.userId; }
function isAuth(): boolean { return !!mem.userId && !mem.isGuest; }

function makeDefaultProfile(displayName?: string | null): UserProfile {
  return {
    username: displayName || "Grinder",
    profilePic: "avatar_1",
    xp: 20,
    longestStreak: 0,
    currentStreak: 0,
    currentGroupId: null,
    currentGroupName: null,
    totalTasksCompletedAllTime: 0,
    badgeCount: 0,
    lastResetDateString: getTodayDateString(),
    routineStreak: 0,
    graceDaysAllowedThisWeek: 2,
    graceDaysUsedThisWeek: 0,
    level: 1,
    disciplineScore: 0,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOCAL DB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const localDb = {

  // ── INITIALIZATION ────────────────────────────────────────────

  /**
   * Called once at login. Bulk-fetches ALL user data from Firestore
   * in parallel (or localStorage for guests) and populates the cache.
   * All subsequent reads are served from cache — instant, zero network.
   */
  async initializeFromFirestore(userId: string): Promise<UserProfile> {
    // Reset cache for clean init (handles re-login)
    mem.userId = userId;
    mem.isGuest = userId === "guest_user";
    mem.profile = null;
    mem.snapshots = {};
    mem.taskConfigs = [];
    mem.techLogs = [];
    mem.focusSessions = [];
    mem.sleepLogs = [];
    mem.achievements = [];
    mem.leaderboard = [];

    if (mem.isGuest) {
      // Guest: load from localStorage into cache
      try { mem.taskConfigs = JSON.parse(localStorage.getItem(KEYS.TASK_CONFIGS) || "[]"); } catch {}
      if (!mem.taskConfigs.length) {
        mem.taskConfigs = [...DEFAULT_TASK_CONFIGS];
        try { localStorage.setItem(KEYS.TASK_CONFIGS, JSON.stringify(DEFAULT_TASK_CONFIGS)); } catch {}
      }
      try { mem.snapshots = JSON.parse(localStorage.getItem(KEYS.DAILY_SNAPSHOTS) || "{}"); } catch {}
      try { mem.techLogs = JSON.parse(localStorage.getItem(KEYS.TECH_LOGS) || "[]"); } catch {}
      try { mem.focusSessions = JSON.parse(localStorage.getItem(KEYS.FOCUS_SESSIONS) || "[]"); } catch {}
      try { mem.sleepLogs = JSON.parse(localStorage.getItem(KEYS.SLEEP_LOGS) || "[]"); } catch {}
      try { mem.achievements = JSON.parse(localStorage.getItem(KEYS.ACHIEVEMENTS) || "[]"); } catch {}
      if (!mem.achievements.length) mem.achievements = [...DEFAULT_ACHIEVEMENTS];
      try { mem.leaderboard = JSON.parse(localStorage.getItem(KEYS.LEADERBOARD) || "[]"); } catch {}
      try {
        const raw = localStorage.getItem(KEYS.PROFILE);
        if (raw) mem.profile = JSON.parse(raw);
      } catch {}
      if (!mem.profile) {
        mem.profile = makeDefaultProfile();
        try { localStorage.setItem(KEYS.PROFILE, JSON.stringify(mem.profile)); } catch {}
      }

      mem.initialized = true;
      mem.lastSyncTime = Date.now();
      return { ...mem.profile };
    }

    // ── Authenticated user: fetch everything from Firestore in parallel ──
    try {
      const [profileSnap, tasksSnap, snapsSnap, sleepSnap, techSnap, focusSnap, achSnap] = await Promise.all([
        getDoc(doc(db, "users", userId)),
        getDocs(collection(db, "users", userId, "taskConfigs")),
        getDocs(collection(db, "users", userId, "snapshots")),
        getDocs(collection(db, "users", userId, "sleepLogs")),
        getDocs(collection(db, "users", userId, "techLogs")),
        getDocs(collection(db, "users", userId, "focusSessions")),
        getDocs(collection(db, "users", userId, "achievements")),
      ]);

      // Task configs
      // Read profile first to check seeded flag
      const profileData = profileSnap.exists() ? profileSnap.data() : null;
      const isSeeded = profileData?.seeded === true;

      // Profile initialization
      if (profileSnap.exists()) {
        const d = profileData!;
        mem.profile = {
          username: d.username || auth.currentUser?.displayName || "Grinder",
          profilePic: d.profilePic || d.profilePhoto || "avatar_1",
          xp: d.xp ?? 20,
          longestStreak: d.longestStreak ?? 0,
          currentStreak: d.streak ?? d.currentStreak ?? 0,
          currentGroupId: d.currentGroupId ?? null,
          currentGroupName: d.currentGroupName ?? null,
          totalTasksCompletedAllTime: d.totalTasksCompletedAllTime ?? 0,
          badgeCount: d.badgeCount ?? 0,
          lastResetDateString: d.lastResetDateString || getTodayDateString(),
          routineStreak: d.routineStreak ?? 0,
          graceDaysAllowedThisWeek: d.graceDaysAllowedThisWeek ?? 2,
          graceDaysUsedThisWeek: d.graceDaysUsedThisWeek ?? 0,
          level: d.level ?? 1,
          disciplineScore: d.disciplineScore ?? 0,
        };
      } else {
        // Brand-new user
        mem.profile = makeDefaultProfile(auth.currentUser?.displayName);
        fsWrite(setDoc(doc(db, "users", userId), { ...mem.profile, seeded: true, lastSyncTime: Date.now() }));
      }

      // Task configs — only seed defaults if brand new user who has never been seeded
      if (!tasksSnap.empty) {
        const configs: TaskConfig[] = [];
        tasksSnap.forEach(d => configs.push(d.data() as TaskConfig));
        mem.taskConfigs = configs.sort((a, b) => a.order - b.order);
      } else if (!isSeeded) {
        // First-time user seed
        mem.taskConfigs = [...DEFAULT_TASK_CONFIGS];
        for (const cfg of DEFAULT_TASK_CONFIGS) {
          fsWrite(setDoc(doc(db, "users", userId, "taskConfigs", cfg.id), cfg));
        }
        if (mem.profile) {
          fsWrite(setDoc(doc(db, "users", userId), { seeded: true }, { merge: true }));
        }
      } else {
        // User explicitly deleted all tasks
        mem.taskConfigs = [];
      }

    } catch (e) {
      console.error("[Grindstack] Firestore init failed, using defaults:", e);
      if (!mem.profile) mem.profile = makeDefaultProfile(auth.currentUser?.displayName);
      if (!mem.taskConfigs.length) mem.taskConfigs = [...DEFAULT_TASK_CONFIGS];
      if (!mem.achievements.length) mem.achievements = [...DEFAULT_ACHIEVEMENTS];
    }

    // Recompute profile stats (XP, streak, level) from the actual loaded history
    this.recalculateProfileFromHistory();

    // Sync squad leaderboard if member of a group
    if (mem.profile?.currentGroupId) {
      this.syncSquadMembers(mem.profile.currentGroupId, mem.profile).catch(console.error);
    }

    mem.initialized = true;
    mem.lastSyncTime = Date.now();
    return { ...mem.profile! };
  },

  /** Re-fetch everything from Firestore — call when syncing after using another device. */
  async resyncFromFirestore(): Promise<UserProfile> {
    const userId = uid();
    if (!userId) return this.getProfile();
    mem.initialized = false;
    return this.initializeFromFirestore(userId);
  },

  getLastSyncTime(): number {
    return mem.lastSyncTime;
  },

  // ── PROFILE ──────────────────────────────

  getProfile(): UserProfile {
    if (mem.profile) return { ...mem.profile };
    return makeDefaultProfile();
  },

  saveProfile(profile: UserProfile) {
    profile.level = Math.floor(profile.xp / 100) + 1;
    mem.profile = { ...profile };
    const u = uid();
    if (isAuth() && u) {
      fsWrite(setDoc(doc(db, "users", u), { ...profile, lastSyncTime: Date.now() }, { merge: true }));
    } else if (mem.isGuest) {
      try { localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile)); } catch {}
    }
  },

  // ── TASK CONFIGS (CRUD) ─────────────────

  getTaskConfigs(): TaskConfig[] {
    return [...mem.taskConfigs];
  },

  saveTaskConfigs(configs: TaskConfig[]) {
    mem.taskConfigs = [...configs];
    const u = uid();
    if (isAuth() && u) {
      for (const cfg of configs) {
        fsWrite(setDoc(doc(db, "users", u, "taskConfigs", cfg.id), cfg));
      }
    } else if (mem.isGuest) {
      try { localStorage.setItem(KEYS.TASK_CONFIGS, JSON.stringify(configs)); } catch {}
    }
  },

  getActiveTaskConfigs(): TaskConfig[] {
    return mem.taskConfigs.filter(t => !t.archived && t.enabled).sort((a, b) => a.order - b.order);
  },

  createTask(name: string, category: string, description = "", xpReward = 10, taskType: "simple" | "problems" = "simple"): TaskConfig {
    const configs = this.getTaskConfigs();
    const newTask: TaskConfig = {
      id: generateId(),
      name,
      description,
      category,
      xpReward,
      streakEnabled: true,
      graceDayEligible: true,
      isCustom: true,
      archived: false,
      enabled: true,
      order: configs.length,
      createdAt: getTodayDateString(),
      taskType,
    };
    configs.push(newTask);
    this.saveTaskConfigs(configs);

    // Refresh today's snapshot to immediately include the new task
    const todayStr = getTodayDateString();
    this.getSnapshotForDate(todayStr);

    return newTask;
  },

  updateTask(taskId: string, updates: Partial<TaskConfig>): TaskConfig | null {
    const configs = this.getTaskConfigs();
    const idx = configs.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    configs[idx] = { ...configs[idx], ...updates };
    this.saveTaskConfigs(configs);

    // Refresh today's snapshot to recalculate active task count & discipline score
    const todayStr = getTodayDateString();
    this.getSnapshotForDate(todayStr);

    return configs[idx];
  },

  deleteTask(taskId: string) {
    // 1. Remove from memory cache
    mem.taskConfigs = mem.taskConfigs.filter(t => t.id !== taskId);

    // 2. Remove from Firestore (auth) or localStorage (guest)
    const u = uid();
    if (isAuth() && u) {
      fsWrite(deleteDoc(doc(db, "users", u, "taskConfigs", taskId)));
    } else if (mem.isGuest) {
      try { localStorage.setItem(KEYS.TASK_CONFIGS, JSON.stringify(mem.taskConfigs)); } catch {}
    }

    // 3. Clean up today's snapshot so stats and checklist update immediately
    const todayStr = getTodayDateString();
    const snap = mem.snapshots[todayStr];
    if (snap) {
      snap.taskCompletions = snap.taskCompletions.filter(tc => tc.taskId !== taskId);
      const active = this.getActiveTaskConfigs();
      snap.tasksTotal = active.length;
      snap.tasksCompleted = snap.taskCompletions.filter(t => t.isCompleted && active.some(a => a.id === t.taskId)).length;
      snap.disciplineScore = this.calculateDisciplineScore(snap);
      this.saveSnapshotForDate(todayStr, snap);
    }
  },

  archiveTask(taskId: string) {
    this.deleteTask(taskId);
  },

  restoreTask(taskId: string) {
    this.updateTask(taskId, { archived: false });
  },

  duplicateTask(taskId: string): TaskConfig | null {
    const source = this.getTaskConfigs().find(t => t.id === taskId);
    if (!source) return null;
    return this.createTask(source.name + " (copy)", source.category, source.description, source.xpReward);
  },

  reorderTasks(orderedIds: string[]) {
    const configs = this.getTaskConfigs();
    orderedIds.forEach((id, i) => {
      const t = configs.find(c => c.id === id);
      if (t) t.order = i;
    });
    this.saveTaskConfigs(configs);

    // Refresh today's snapshot
    const todayStr = getTodayDateString();
    this.getSnapshotForDate(todayStr);
  },

  // ── DAILY SNAPSHOTS ─────────────────────

  getAllSnapshots(): Record<string, DailySnapshot> {
    return { ...mem.snapshots };
  },

  saveAllSnapshots(snapshots: Record<string, DailySnapshot>) {
    mem.snapshots = { ...snapshots };
    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.DAILY_SNAPSHOTS, JSON.stringify(snapshots)); } catch {}
    }
  },

  getSnapshotForDate(dateString: string): DailySnapshot {
    let snap = mem.snapshots[dateString];
    const activeTasks = this.getActiveTaskConfigs();

    if (!snap) {
      snap = {
        dateString,
        taskCompletions: activeTasks.map(t => ({ taskId: t.id, isCompleted: false, completedAt: null })),
        habits: { ...DEFAULT_HABITS },
        disciplineScore: 0,
        xpEarned: 0,
        focusMinutes: 0,
        sleepHours: 0,
        tasksCompleted: 0,
        tasksTotal: activeTasks.length,
      };
      this.saveSnapshotForDate(dateString, snap);
    } else {
      let modified = false;
      activeTasks.forEach(task => {
        if (!snap.taskCompletions.some(tc => tc.taskId === task.id)) {
          snap.taskCompletions.push({ taskId: task.id, isCompleted: false, completedAt: null });
          modified = true;
        }
      });
      
      const activeCompleted = snap.taskCompletions.filter(t => t.isCompleted && activeTasks.some(at => at.id === t.taskId)).length;
      if (snap.tasksTotal !== activeTasks.length || snap.tasksCompleted !== activeCompleted) {
        snap.tasksTotal = activeTasks.length;
        snap.tasksCompleted = activeCompleted;
        modified = true;
      }

      if (modified) {
        this.saveSnapshotForDate(dateString, snap);
      }
    }

    // Recalculate discipline score if stale
    const newScore = this.calculateDisciplineScore(snap);
    if (snap.disciplineScore !== newScore) {
      snap.disciplineScore = newScore;
      this.saveSnapshotForDate(dateString, snap);
    }

    return snap;
  },

  getSnapshotForDateReadOnly(dateString: string): DailySnapshot | null {
    return mem.snapshots[dateString] || null;
  },

  createEmptySnapshot(dateString: string): DailySnapshot {
    return {
      dateString,
      taskCompletions: [],
      habits: { ...DEFAULT_HABITS },
      disciplineScore: 0,
      xpEarned: 0,
      focusMinutes: 0,
      sleepHours: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
    };
  },

  saveSnapshotForDate(dateString: string, snapshot: DailySnapshot) {
    mem.snapshots[dateString] = snapshot;
    const u = uid();
    if (isAuth() && u) {
      fsWrite(setDoc(doc(db, "users", u, "snapshots", dateString), snapshot));
    } else if (mem.isGuest) {
      try { localStorage.setItem(KEYS.DAILY_SNAPSHOTS, JSON.stringify(mem.snapshots)); } catch {}
    }
  },

  saveSnapshotReflection(dateString: string, mood: string, notes: string) {
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.mood = mood;
    snapshot.notes = notes;
    this.saveSnapshotForDate(dateString, snapshot);
  },

  toggleTaskForDate(taskId: string, dateString: string, isCompleted: boolean, remarks?: string): DailySnapshot {
    const snapshot = this.getSnapshotForDate(dateString);
    const tc = snapshot.taskCompletions.find(t => t.taskId === taskId);
    if (tc) {
      tc.isCompleted = isCompleted;
      tc.completedAt = isCompleted ? new Date().toISOString() : null;
      if (isCompleted && remarks !== undefined) tc.remarks = remarks;
      else if (!isCompleted) delete tc.remarks;
    } else {
      snapshot.taskCompletions.push({
        taskId,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
        remarks: isCompleted ? remarks : undefined,
      });
    }

    const activeTasks = this.getActiveTaskConfigs();
    snapshot.tasksCompleted = snapshot.taskCompletions.filter(t => t.isCompleted && activeTasks.some(at => at.id === t.taskId)).length;
    snapshot.tasksTotal = activeTasks.length;

    let xp = 0;
    for (const comp of snapshot.taskCompletions) {
      if (comp.isCompleted) {
        const config = activeTasks.find(t => t.id === comp.taskId);
        if (config) xp += config.xpReward;
      }
    }
    snapshot.xpEarned = xp;
    snapshot.disciplineScore = this.calculateDisciplineScore(snapshot);

    this.saveSnapshotForDate(dateString, snapshot);
    this.recalculateProfileFromHistory();
    return snapshot;
  },

  calculateDisciplineScore(snapshot: DailySnapshot): number {
    const activeTasks = this.getActiveTaskConfigs();
    if (activeTasks.length === 0) return 0;
    const completedCount = snapshot.taskCompletions.filter(tc => {
      if (!tc.isCompleted) return false;
      return activeTasks.some(at => at.id === tc.taskId);
    }).length;
    return Math.round((completedCount / activeTasks.length) * 100);
  },


  updateHabitsForDate(dateString: string, habits: Partial<DailyHabits>): DailySnapshot {
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.habits = { ...snapshot.habits, ...habits };
    snapshot.disciplineScore = this.calculateDisciplineScore(snapshot);
    this.saveSnapshotForDate(dateString, snapshot);
    return snapshot;
  },

  // ── STREAK CALCULATION ──────────────────

  getTaskStreak(taskId: string): number {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const snap = mem.snapshots[ds];
      if (!snap) { if (i === 0) continue; break; }
      const tc = snap.taskCompletions.find(t => t.taskId === taskId);
      if (tc && tc.isCompleted) { streak++; }
      else { if (i === 0) continue; break; }
    }
    return streak;
  },

  getAllTaskStreaks(): Record<string, number> {
    const tasks = this.getActiveTaskConfigs();
    const streaks: Record<string, number> = {};
    for (const t of tasks) streaks[t.id] = this.getTaskStreak(t.id);
    return streaks;
  },

  recalculateProfileFromHistory() {
    const profile = this.getProfile();
    const snapshots = mem.snapshots;
    const dates = Object.keys(snapshots).sort();

    // Total XP from all sources
    let totalXP = 20;
    for (const ds of dates) totalXP += snapshots[ds].xpEarned;
    for (const fs of mem.focusSessions) totalXP += fs.xpEarned;
    for (const tl of mem.techLogs) totalXP += tl.xpEarned;

    // Current streak — consecutive days with ≥50% completion
    const today = new Date();
    let currentStreak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const snap = snapshots[ds];
      if (!snap) { if (i === 0) continue; break; }
      const pct = snap.tasksTotal > 0 ? snap.tasksCompleted / snap.tasksTotal : 0;
      if (pct >= 0.5) currentStreak++;
      else { if (i === 0) continue; break; }
    }

    // Total tasks completed all time
    let totalCompleted = 0;
    for (const ds of dates) totalCompleted += snapshots[ds].tasksCompleted;

    const todaySnap = snapshots[getTodayDateString()];
    const disciplineScore = todaySnap ? todaySnap.disciplineScore : 0;

    profile.xp = totalXP;
    profile.currentStreak = currentStreak;
    profile.longestStreak = Math.max(profile.longestStreak, currentStreak);
    profile.totalTasksCompletedAllTime = totalCompleted;
    profile.disciplineScore = disciplineScore;
    profile.level = Math.floor(totalXP / 100) + 1;

    this.saveProfile(profile);
  },

  // ── FOCUS SESSIONS ──────────────────────

  getFocusSessions(): FocusSession[] {
    return [...mem.focusSessions];
  },

  saveFocusSessions(sessions: FocusSession[]) {
    mem.focusSessions = [...sessions];
    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions)); } catch {}
    }
    // Auth: individual start/end ops write their own Firestore docs
  },

  startFocusSession(taskName = "Deep Work"): FocusSession {
    const session: FocusSession = {
      id: generateId(),
      taskId: null,
      taskName,
      startTime: new Date().toISOString(),
      endTime: null,
      durationMinutes: 0,
      xpEarned: 0,
      dateString: getTodayDateString(),
      isActive: true,
    };
    mem.focusSessions.push(session);
    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(mem.focusSessions)); } catch {}
    }
    const u = uid();
    if (isAuth() && u) {
      fsWrite(setDoc(doc(db, "users", u, "focusSessions", session.id), session));
    }
    return session;
  },

  endFocusSession(sessionId: string): FocusSession | null {
    const session = mem.focusSessions.find(s => s.id === sessionId);
    if (!session) return null;

    session.endTime = new Date().toISOString();
    session.isActive = false;
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    session.durationMinutes = Math.round((end - start) / 60000);
    session.xpEarned = session.durationMinutes; // 1 XP per minute

    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(mem.focusSessions)); } catch {}
    }
    const u = uid();
    if (isAuth() && u) {
      fsWrite(setDoc(doc(db, "users", u, "focusSessions", session.id), session));
    }

    // Update today's snapshot focus minutes
    const todayStr = getTodayDateString();
    const snapshot = this.getSnapshotForDate(todayStr);
    snapshot.focusMinutes = mem.focusSessions
      .filter(s => s.dateString === todayStr && !s.isActive)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    this.saveSnapshotForDate(todayStr, snapshot);
    this.recalculateProfileFromHistory();
    return session;
  },

  getActiveFocusSession(): FocusSession | null {
    return mem.focusSessions.find(s => s.isActive) || null;
  },

  getTodayFocusMinutes(): number {
    const today = getTodayDateString();
    return mem.focusSessions
      .filter(s => s.dateString === today && !s.isActive)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  },

  getWeekFocusMinutes(): number {
    const today = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      total += mem.focusSessions
        .filter(s => s.dateString === ds && !s.isActive)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
    }
    return total;
  },

  // ── SLEEP LOGS ──────────────────────────

  getSleepLogs(): SleepLog[] {
    return [...mem.sleepLogs];
  },

  saveSleepLogs(logs: SleepLog[]) {
    mem.sleepLogs = [...logs];
    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.SLEEP_LOGS, JSON.stringify(logs)); } catch {}
    }
  },

  saveSleepLog(dateString: string, bedtime: string, wakeTime: string, quality = 80): SleepLog {
    const duration = calculateSleepHours(bedtime, wakeTime);
    const log: SleepLog = { dateString, bedtime, wakeTime, durationHours: duration, quality };
    const idx = mem.sleepLogs.findIndex(l => l.dateString === dateString);
    if (idx >= 0) mem.sleepLogs[idx] = log;
    else mem.sleepLogs.push(log);

    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.SLEEP_LOGS, JSON.stringify(mem.sleepLogs)); } catch {}
    }
    const u = uid();
    if (isAuth() && u) {
      fsWrite(setDoc(doc(db, "users", u, "sleepLogs", dateString), log));
    }

    // Update snapshot
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.sleepHours = duration;
    snapshot.habits.bedtime = bedtime;
    snapshot.habits.wakeTime = wakeTime;
    snapshot.habits.sleepCompleted = duration >= 7;
    snapshot.disciplineScore = this.calculateDisciplineScore(snapshot);
    this.saveSnapshotForDate(dateString, snapshot);
    return log;
  },

  getSleepLogForDate(dateString: string): SleepLog | null {
    return mem.sleepLogs.find(l => l.dateString === dateString) || null;
  },

  // ── TECH / ACADEMY LOGS ─────────────────

  getTechLogs(): TechLog[] {
    return [...mem.techLogs];
  },

  saveTechLogs(logs: TechLog[]) {
    mem.techLogs = [...logs];
    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.TECH_LOGS, JSON.stringify(logs)); } catch {}
    }
  },

  addTechLog(topic: string, platform: string, count: number, dateString = getTodayDateString()): TechLog {
    const xpEarned = 15;
    const newLog: TechLog = { id: generateId(), topic, platform, count, dateString, xpEarned };
    mem.techLogs.unshift(newLog);

    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.TECH_LOGS, JSON.stringify(mem.techLogs)); } catch {}
    }
    const u = uid();
    if (isAuth() && u) {
      fsWrite(setDoc(doc(db, "users", u, "techLogs", newLog.id), newLog));
    }

    // Update snapshot XP for the target date
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.xpEarned = (snapshot.xpEarned || 0) + xpEarned;
    this.saveSnapshotForDate(dateString, snapshot);
    this.recalculateProfileFromHistory();
    return newLog;
  },

  getTotalProblemsSolved(): number {
    return mem.techLogs.reduce((sum, l) => sum + l.count, 0);
  },

  // ── ACHIEVEMENTS ────────────────────────

  getAchievements(): Achievement[] {
    return [...mem.achievements];
  },

  saveAchievements(achievements: Achievement[]) {
    mem.achievements = [...achievements];
    const u = uid();
    if (isAuth() && u) {
      for (const ach of achievements) {
        fsWrite(setDoc(doc(db, "users", u, "achievements", ach.id), ach));
      }
    } else if (mem.isGuest) {
      try { localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements)); } catch {}
    }
  },

  checkAndUnlockAchievements(): Achievement[] {
    const achievements = this.getAchievements();
    const profile = this.getProfile();
    const focusSessions = mem.focusSessions.filter(s => !s.isActive);
    const totalFocusHours = focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    const totalProblems = this.getTotalProblemsSolved();

    for (const ach of achievements) {
      if (ach.unlocked) continue;
      switch (ach.id) {
        case "ach_iron": ach.current = Math.min(ach.target, profile.totalTasksCompletedAllTime); break;
        case "ach_focus": ach.current = Math.min(ach.target, Math.round(totalFocusHours)); break;
        case "ach_momentum": ach.current = Math.min(ach.target, profile.currentStreak); break;
        case "ach_coding": ach.current = Math.min(ach.target, totalProblems); break;
        case "ach_consistency": ach.current = Math.min(ach.target, profile.longestStreak); break;
        case "ach_sleep": {
          const sleepLogs = [...mem.sleepLogs].sort((a, b) => b.dateString.localeCompare(a.dateString));
          let sleepStreak = 0;
          for (const log of sleepLogs) { if (log.durationHours >= 7) sleepStreak++; else break; }
          ach.current = Math.min(ach.target, sleepStreak);
          break;
        }
        case "ach_focus_master": ach.current = Math.min(ach.target, focusSessions.length); break;
      }
      if (ach.current >= ach.target) { ach.unlocked = true; ach.unlockedAt = new Date().toISOString(); }
    }
    this.saveAchievements(achievements);
    return achievements;
  },

  // ── LEADERBOARD / SQUADS ────────────────

  getLeaderboardCache(): GroupMember[] {
    return [...mem.leaderboard];
  },

  saveLeaderboardCache(members: GroupMember[]) {
    mem.leaderboard = [...members];
    if (mem.isGuest) {
      try { localStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(members)); } catch {}
    }
  },

  generateGuestSquadMembers(profile: UserProfile): GroupMember[] {
    const todaySnap = this.getSnapshotForDate(getTodayDateString());
    const pct = todaySnap.tasksTotal > 0 ? (todaySnap.tasksCompleted / todaySnap.tasksTotal) * 100 : 0;
    const configs = this.getActiveTaskConfigs();
    const completedNames = todaySnap.taskCompletions
      .filter(t => t.isCompleted)
      .map(t => configs.find(c => c.id === t.taskId)?.name || "")
      .filter(Boolean).join(",");

    const me: GroupMember = {
      userId: "guest_user",
      username: profile.username,
      dailyCompletionPercentage: parseFloat(pct.toFixed(1)),
      currentStreak: profile.currentStreak,
      totalTasksAllTime: profile.totalTasksCompletedAllTime,
      xp: profile.xp,
      profilePic: profile.profilePic,
      activeBreakdown: completedNames,
      isMe: true,
      focusHours: parseFloat((this.getTodayFocusMinutes() / 60).toFixed(1)),
      problemsSolved: this.getTotalProblemsSolved(),
    };

    return [me,
      { userId: "guest_mock_aria", username: "Aria (Grinder)", dailyCompletionPercentage: 92.0, currentStreak: 12, totalTasksAllTime: 142, xp: 3800, profilePic: "avatar_2", activeBreakdown: "LeetCode,Morning Routine,Gym,Skincare", isMe: false, focusHours: 4.5, problemsSolved: 156 },
      { userId: "guest_mock_sarah", username: "Sarah (Developer)", dailyCompletionPercentage: 75.0, currentStreak: 7, totalTasksAllTime: 68, xp: 1840, profilePic: "avatar_1", activeBreakdown: "React Refactoring,Read Tech Blog", isMe: false, focusHours: 3.0, problemsSolved: 89 },
      { userId: "guest_mock_john", username: "John (Fighter)", dailyCompletionPercentage: 60.0, currentStreak: 4, totalTasksAllTime: 32, xp: 950, profilePic: "avatar_3", activeBreakdown: "Daily Gym Session,Hydration Protocol", isMe: false, focusHours: 1.5, problemsSolved: 34 },
    ];
  },

  extractSquadId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/(hub-[a-z0-9\-]+)/i);
    if (match) return match[1].toLowerCase().trim();
    if (trimmed.includes("/")) return trimmed.split("/").pop()?.trim() || trimmed;
    return trimmed;
  },

  async joinSquad(squadIdInput: string, squadNameInput: string): Promise<UserProfile> {
    const cleanGroupId = this.extractSquadId(squadIdInput);
    let finalGroupName = squadNameInput.trim();
    if (!finalGroupName || finalGroupName === cleanGroupId) {
      try {
        const snap = await getDoc(doc(db, "squads", cleanGroupId));
        finalGroupName = snap.exists() ? (snap.data().name || "Squad Tribe") : "Squad Tribe";
      } catch { finalGroupName = "Squad Tribe"; }
    }
    const profile = this.getProfile();
    profile.currentGroupId = cleanGroupId;
    profile.currentGroupName = finalGroupName;
    this.saveProfile(profile);
    if (auth.currentUser && auth.currentUser.uid !== "guest_user") {
      await this.syncSquadMembers(cleanGroupId, profile);
    } else {
      this.saveLeaderboardCache(this.generateGuestSquadMembers(profile));
    }
    return profile;
  },

  async leaveSquad(): Promise<UserProfile> {
    const profile = this.getProfile();
    const user = auth.currentUser;
    const oldGroupId = profile.currentGroupId;
    profile.currentGroupId = null;
    profile.currentGroupName = null;
    this.saveProfile(profile);
    this.saveLeaderboardCache([]);
    if (user && oldGroupId && user.uid !== "guest_user") {
      try { await deleteDoc(doc(db, "squads", oldGroupId, "members", user.uid)); }
      catch (e) { console.error("Firestore leave squad failed", e); }
    }
    return profile;
  },

  async syncSquadMembers(groupId: string, profile: UserProfile): Promise<GroupMember[]> {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") {
      const cached = this.getLeaderboardCache();
      if (cached.length > 0 && cached.some(m => m.isMe)) {
        const todaySnap = this.getSnapshotForDate(getTodayDateString());
        const pct = todaySnap.tasksTotal > 0 ? (todaySnap.tasksCompleted / todaySnap.tasksTotal) * 100 : 0;
        const configs = this.getActiveTaskConfigs();
        const completedNames = todaySnap.taskCompletions
          .filter(t => t.isCompleted)
          .map(t => configs.find(c => c.id === t.taskId)?.name || "")
          .filter(Boolean).join(",");
        const updated = cached.map(m => m.isMe ? {
          ...m, username: profile.username,
          dailyCompletionPercentage: parseFloat(pct.toFixed(1)),
          currentStreak: profile.currentStreak,
          totalTasksAllTime: profile.totalTasksCompletedAllTime,
          xp: profile.xp, profilePic: profile.profilePic,
          activeBreakdown: completedNames,
          focusHours: parseFloat((this.getTodayFocusMinutes() / 60).toFixed(1)),
          problemsSolved: this.getTotalProblemsSolved(),
        } : m);
        this.saveLeaderboardCache(updated);
        return updated;
      }
      const mock = this.generateGuestSquadMembers(profile);
      this.saveLeaderboardCache(mock);
      return mock;
    }

    await this.syncLocalToLeaderboard(profile);
    try {
      const snap = await getDocs(collection(db, "squads", groupId, "members"));
      if (!snap.empty) {
        const members: GroupMember[] = [];
        snap.forEach(d => {
          const data = d.data() as Omit<GroupMember, "userId" | "isMe">;
          members.push({ ...data, userId: d.id, isMe: user ? d.id === user.uid : false });
        });
        this.saveLeaderboardCache(members);
        return members;
      }
    } catch (e) { console.error("Firestore sync squad members failed", e); }
    return this.getLeaderboardCache();
  },

  async syncLocalToLeaderboard(profile: UserProfile): Promise<GroupMember | null> {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return null;
    const todaySnap = this.getSnapshotForDate(getTodayDateString());
    const pct = todaySnap.tasksTotal > 0 ? (todaySnap.tasksCompleted / todaySnap.tasksTotal) * 100 : 0;
    const configs = this.getActiveTaskConfigs();
    const completedNames = todaySnap.taskCompletions
      .filter(t => t.isCompleted)
      .map(t => configs.find(c => c.id === t.taskId)?.name || "")
      .filter(Boolean).join(",");

    const me: GroupMember = {
      userId: user.uid,
      username: profile.username,
      dailyCompletionPercentage: parseFloat(pct.toFixed(1)),
      currentStreak: profile.currentStreak,
      totalTasksAllTime: profile.totalTasksCompletedAllTime,
      xp: profile.xp, profilePic: profile.profilePic,
      activeBreakdown: completedNames, isMe: true,
      focusHours: parseFloat((this.getTodayFocusMinutes() / 60).toFixed(1)),
      problemsSolved: this.getTotalProblemsSolved(),
    };

    const cached = this.getLeaderboardCache().filter(m => m.userId !== user.uid);
    cached.push(me);
    this.saveLeaderboardCache(cached);

    try {
      if (profile.currentGroupId) {
        if (profile.currentGroupName) {
          await setDoc(doc(db, "squads", profile.currentGroupId), { name: profile.currentGroupName }, { merge: true });
        }
        await setDoc(doc(db, "squads", profile.currentGroupId, "members", user.uid), me);
      }
    } catch (e) { console.error("Firestore member leaderboard push failed", e); }
    return me;
  },

  // ── PROFILE MANAGEMENT ──────────────────

  updateProfileInfo(username: string, profilePic: string): UserProfile {
    const profile = this.getProfile();
    profile.username = username;
    profile.profilePic = profilePic;
    this.saveProfile(profile);
    if (auth.currentUser) this.syncLocalToLeaderboard(profile);
    return profile;
  },

  // ── MIDNIGHT RESET ──────────────────────

  async checkAndPerformMidnightReset(): Promise<{ resetDone: boolean; profile: UserProfile }> {
    const profile = this.getProfile();
    const today = getTodayDateString();

    if (profile.lastResetDateString !== today) {
      this.getSnapshotForDate(today);
      profile.lastResetDateString = today;
      this.recalculateProfileFromHistory();
      const updatedProfile = this.getProfile();
      updatedProfile.lastResetDateString = today;
      this.saveProfile(updatedProfile);
      if (auth.currentUser && auth.currentUser.uid !== "guest_user" && updatedProfile.currentGroupId) {
        await this.syncSquadMembers(updatedProfile.currentGroupId, updatedProfile);
      }
      return { resetDone: true, profile: updatedProfile };
    }
    return { resetDone: false, profile };
  },

  // ── INSIGHTS / ANALYTICS ────────────────

  getWeeklySnapshots(): DailySnapshot[] {
    const today = new Date();
    const snapshots: DailySnapshot[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      if (mem.snapshots[ds]) snapshots.push(mem.snapshots[ds]);
    }
    return snapshots;
  },

  getMonthlySnapshots(): DailySnapshot[] {
    const today = new Date();
    const snapshots: DailySnapshot[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      if (mem.snapshots[ds]) snapshots.push(mem.snapshots[ds]);
    }
    return snapshots;
  },

  getAverageDisciplineScore(days = 7): number {
    const today = new Date();
    let total = 0, count = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const snap = mem.snapshots[formatDate(d)];
      if (snap) { total += snap.disciplineScore; count++; }
    }
    return count > 0 ? Math.round(total / count) : 0;
  },

  getHabitCompletionRate(days = 7): number {
    const today = new Date();
    let totalH = 0, completedH = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const snap = mem.snapshots[formatDate(d)];
      if (snap) {
        const h = snap.habits;
        totalH += 4;
        if (h.gymCompleted) completedH++;
        if (h.dietCompleted) completedH++;
        if (h.skincareCompleted) completedH++;
        if (h.sleepCompleted) completedH++;
      }
    }
    return totalH > 0 ? Math.round((completedH / totalH) * 100) : 0;
  },

  // ── HEATMAP DATA ────────────────────────

  getHeatmapDays(numDays = 21): { dateString: string; label: number; isToday: boolean; completionLevel: number }[] {
    const days = [];
    const today = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const snap = mem.snapshots[ds];
      let level = 0;
      if (snap) {
        const pct = snap.tasksTotal > 0 ? snap.tasksCompleted / snap.tasksTotal : 0;
        if (pct >= 0.9) level = 4;
        else if (pct >= 0.7) level = 3;
        else if (pct >= 0.4) level = 2;
        else if (pct > 0) level = 1;
      }
      days.push({ dateString: ds, label: d.getDate(), isToday: i === 0, completionLevel: level });
    }
    return days;
  },

  // ── SUBJECT PROGRESS (Academy) ──────────

  getSubjectProgress(): Record<string, { count: number; target: number; percentage: number }> {
    const TARGETS: Record<string, number> = {
      "DSA": 100, "Web Development": 100, "AI/ML": 50,
      "System Design": 50, "Projects": 30, "LeetCode": 200,
    };
    const progress: Record<string, { count: number; target: number; percentage: number }> = {};
    for (const [subj, target] of Object.entries(TARGETS)) {
      const count = mem.techLogs.filter(l => l.topic === subj).reduce((sum, l) => sum + l.count, 0);
      progress[subj] = { count, target, percentage: Math.min(100, Math.round((count / target) * 100)) };
    }
    return progress;
  },

  // ── CLEAR DATA ──────────────────────────

  clearAllData() {
    // For auth users: only clears the session cache. Data stays in Firestore for next login.
    // For guests: also clears localStorage.
    if (mem.isGuest) {
      Object.values(KEYS).forEach(key => { try { localStorage.removeItem(key); } catch {} });
    }
    mem.initialized = false;
    mem.isGuest = false;
    mem.userId = null;
    mem.profile = null;
    mem.snapshots = {};
    mem.taskConfigs = [];
    mem.techLogs = [];
    mem.focusSessions = [];
    mem.sleepLogs = [];
    mem.achievements = [];
    mem.leaderboard = [];
    mem.lastSyncTime = 0;
  },

  // ── BACKWARD-COMPAT ALIASES ──────────────
  // These keep old callers working without changes.

  async syncUserProfileFromFirestore(): Promise<UserProfile> {
    const u = uid() || auth.currentUser?.uid;
    if (!u) return this.getProfile();
    return this.initializeFromFirestore(u);
  },

  async syncAllDataFromFirestore() {
    const u = uid() || auth.currentUser?.uid;
    if (!u || u === "guest_user") return;
    await this.initializeFromFirestore(u);
  },

  async pushUserProfileToFirestore(profile: UserProfile) { this.saveProfile(profile); },
  async pushTaskConfigToFirestore(config: TaskConfig) {
    const u = uid();
    if (isAuth() && u) fsWrite(setDoc(doc(db, "users", u, "taskConfigs", config.id), config));
  },
  async deleteTaskConfigFromFirestore(taskId: string) {
    const u = uid();
    if (isAuth() && u) fsWrite(deleteDoc(doc(db, "users", u, "taskConfigs", taskId)));
  },
  async pushSnapshotToFirestore(dateString: string, snapshot: DailySnapshot) {
    this.saveSnapshotForDate(dateString, snapshot);
  },
  async pushSleepLogToFirestore(_log: SleepLog) { /* now handled in saveSleepLog */ },
  async pushTechLogToFirestore(_log: TechLog) { /* now handled in addTechLog */ },
  async pushFocusSessionToFirestore(_session: FocusSession) { /* now handled in start/endFocusSession */ },

  // ── MOCK DATA FOR DEMO ──────────────────
  prepopulateMockHistory() {
    // Completely disabled in production. Everything is based on real user data!
  },
};
