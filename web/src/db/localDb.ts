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
  const d = new Date();
  return formatDate(d);
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
// STORAGE KEYS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const KEYS = {
  PROFILE: "gs3_profile",
  TASK_CONFIGS: "gs3_task_configs",
  DAILY_SNAPSHOTS: "gs3_daily_snapshots",
  FOCUS_SESSIONS: "gs3_focus_sessions",
  SLEEP_LOGS: "gs3_sleep_logs",
  TECH_LOGS: "gs3_tech_logs",
  ACHIEVEMENTS: "gs3_achievements",
  XP_LOGS: "gs3_xp_logs",
  LEADERBOARD: "gs3_leaderboard",
  SETTINGS: "gs3_settings",
  // Legacy keys for migration
  LEGACY_PROFILE: "grindstack_profile",
  LEGACY_TASKS: "grindstack_tasks",
  LEGACY_HABITS: "grindstack_habits",
  LEGACY_TECH_LOGS: "grindstack_tech_logs",
};

// TOP LEVEL FORCE PRODUCTION DATA RESET & VERSION UPGRADE
// This runs once instantly on file import (before React/AuthContext loads!)
try {
  const version = localStorage.getItem("gs3_db_version");
  if (version !== "4.1") {
    localStorage.setItem("gs3_db_version", "4.1");
    localStorage.removeItem("gs3_profile");
    localStorage.removeItem("gs3_daily_snapshots");
    localStorage.removeItem("gs3_sleep_logs");
    localStorage.removeItem("gs3_tech_logs");
    localStorage.removeItem("gs3_focus_sessions");
    localStorage.removeItem("gs3_achievements");
    localStorage.removeItem("gs3_leaderboard");
    localStorage.removeItem("gs3_settings");
    localStorage.removeItem("gs3_task_configs");
    
    // Legacy keys
    localStorage.removeItem("grindstack_profile");
    localStorage.removeItem("grindstack_tasks");
    localStorage.removeItem("grindstack_habits");
    localStorage.removeItem("grindstack_tech_logs");
  }
} catch (e) {
  console.error("Failed to run database version upgrade:", e);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOCAL DB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const localDb = {
  // ── PROFILE ──────────────────────────────
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error("Failed to parse profile, resetting to default.", e);
      try { localStorage.removeItem(KEYS.PROFILE); } catch {}
    }

    try {
      // Check legacy migration
      const legacy = localStorage.getItem(KEYS.LEGACY_PROFILE);
      if (legacy) {
        const old = JSON.parse(legacy);
        const migrated: UserProfile = {
          username: old.username || "Grinder",
          profilePic: old.profilePic || "avatar_1",
          xp: old.xp || 20,
          longestStreak: old.longestStreak || 0,
          currentStreak: old.routineStreak || 0,
          currentGroupId: old.currentGroupId || null,
          currentGroupName: old.currentGroupName || null,
          totalTasksCompletedAllTime: old.totalTasksCompletedAllTime || 0,
          badgeCount: old.badgeCount || 0,
          lastResetDateString: old.lastResetDateString || getTodayDateString(),
          routineStreak: old.routineStreak || 0,
          graceDaysAllowedThisWeek: old.graceDaysAllowedThisWeek || 2,
          graceDaysUsedThisWeek: old.graceDaysUsedThisWeek || 0,
          level: Math.floor((old.xp || 20) / 100) + 1,
          disciplineScore: 0,
        };
        this.saveProfile(migrated);
        return migrated;
      }
    } catch (e) {
      console.error("Failed to parse legacy profile", e);
    }

    const newProfile: UserProfile = {
      username: "Grinder",
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
    this.saveProfile(newProfile);
    return newProfile;
  },

  saveProfile(profile: UserProfile) {
    profile.level = Math.floor(profile.xp / 100) + 1;
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  // ── TASK CONFIGS (CRUD) ─────────────────
  getTaskConfigs(): TaskConfig[] {
    try {
      const data = localStorage.getItem(KEYS.TASK_CONFIGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse task configs:", e);
    }

    try {
      // Migrate legacy tasks if present
      const legacy = localStorage.getItem(KEYS.LEGACY_TASKS);
      if (legacy) {
        const oldTasks = JSON.parse(legacy);
        const migrated: TaskConfig[] = oldTasks.map((t: any, i: number) => ({
          id: t.id,
          name: t.name,
          description: "",
          category: t.category || "discipline",
          xpReward: 10,
          streakEnabled: true,
          graceDayEligible: true,
          isCustom: t.isCustom || false,
          archived: false,
          enabled: true,
          order: i,
          createdAt: getTodayDateString(),
        }));
        this.saveTaskConfigs(migrated);
        return migrated;
      }
    } catch (e) {
      console.error("Failed to migrate legacy tasks:", e);
    }

    this.saveTaskConfigs(DEFAULT_TASK_CONFIGS);
    return [...DEFAULT_TASK_CONFIGS];
  },

  saveTaskConfigs(configs: TaskConfig[]) {
    localStorage.setItem(KEYS.TASK_CONFIGS, JSON.stringify(configs));
  },

  getActiveTaskConfigs(): TaskConfig[] {
    return this.getTaskConfigs().filter(t => !t.archived && t.enabled).sort((a, b) => a.order - b.order);
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
    this.pushTaskConfigToFirestore(newTask);
    return newTask;
  },

  updateTask(taskId: string, updates: Partial<TaskConfig>): TaskConfig | null {
    const configs = this.getTaskConfigs();
    const idx = configs.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    configs[idx] = { ...configs[idx], ...updates };
    this.saveTaskConfigs(configs);
    this.pushTaskConfigToFirestore(configs[idx]);
    return configs[idx];
  },

  deleteTask(taskId: string) {
    const configs = this.getTaskConfigs().filter(t => t.id !== taskId);
    this.saveTaskConfigs(configs);
    this.deleteTaskConfigFromFirestore(taskId);
  },

  archiveTask(taskId: string) {
    this.updateTask(taskId, { archived: true });
  },

  restoreTask(taskId: string) {
    this.updateTask(taskId, { archived: false });
  },

  duplicateTask(taskId: string): TaskConfig | null {
    const configs = this.getTaskConfigs();
    const source = configs.find(t => t.id === taskId);
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
  },

  // ── DAILY SNAPSHOTS ─────────────────────
  getAllSnapshots(): Record<string, DailySnapshot> {
    try {
      const data = localStorage.getItem(KEYS.DAILY_SNAPSHOTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse daily snapshots:", e);
      try { localStorage.removeItem(KEYS.DAILY_SNAPSHOTS); } catch {}
    }
    return {};
  },

  saveAllSnapshots(snapshots: Record<string, DailySnapshot>) {
    localStorage.setItem(KEYS.DAILY_SNAPSHOTS, JSON.stringify(snapshots));
  },

  getSnapshotForDate(dateString: string): DailySnapshot {
    const all = this.getAllSnapshots();
    let snap = all[dateString];
    const activeTasks = this.getActiveTaskConfigs();

    if (!snap) {
      snap = {
        dateString,
        taskCompletions: activeTasks.map(t => ({
          taskId: t.id,
          isCompleted: false,
          completedAt: null,
        })),
        habits: { ...DEFAULT_HABITS },
        disciplineScore: 0,
        xpEarned: 0,
        focusMinutes: 0,
        sleepHours: 0,
        tasksCompleted: 0,
        tasksTotal: activeTasks.length,
      };
      all[dateString] = snap;
      this.saveAllSnapshots(all);
    } else {
      // Sync active tasks to ensure any new custom tasks are in the completions array!
      let modified = false;
      activeTasks.forEach(task => {
        const exists = snap.taskCompletions.some(tc => tc.taskId === task.id);
        if (!exists) {
          snap.taskCompletions.push({
            taskId: task.id,
            isCompleted: false,
            completedAt: null
          });
          modified = true;
        }
      });
      if (modified) {
        snap.tasksTotal = activeTasks.length;
        snap.tasksCompleted = snap.taskCompletions.filter(t => t.isCompleted).length;
        all[dateString] = snap;
        this.saveAllSnapshots(all);
      }
    }
    
    // Force dynamically recalculate discipline score with latest algorithm
    const newScore = this.calculateDisciplineScore(snap);
    if (snap.disciplineScore !== newScore) {
      snap.disciplineScore = newScore;
      all[dateString] = snap;
      this.saveAllSnapshots(all);
    }
    
    return snap;
  },

  saveSnapshotForDate(dateString: string, snapshot: DailySnapshot) {
    const all = this.getAllSnapshots();
    all[dateString] = snapshot;
    this.saveAllSnapshots(all);
  },

  saveSnapshotReflection(dateString: string, mood: string, notes: string) {
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.mood = mood;
    snapshot.notes = notes;
    this.saveSnapshotForDate(dateString, snapshot);
    this.pushSnapshotToFirestore(dateString, snapshot);
  },

  toggleTaskForDate(taskId: string, dateString: string, isCompleted: boolean, remarks?: string): DailySnapshot {
    const snapshot = this.getSnapshotForDate(dateString);
    const tc = snapshot.taskCompletions.find(t => t.taskId === taskId);
    if (tc) {
      tc.isCompleted = isCompleted;
      tc.completedAt = isCompleted ? new Date().toISOString() : null;
      if (isCompleted && remarks !== undefined) {
        tc.remarks = remarks;
      } else if (!isCompleted) {
        delete tc.remarks;
      }
    } else {
      snapshot.taskCompletions.push({
        taskId,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
        remarks: isCompleted ? remarks : undefined
      });
    }

    // Recalculate snapshot metrics
    const activeTasks = this.getActiveTaskConfigs();
    snapshot.tasksCompleted = snapshot.taskCompletions.filter(t => t.isCompleted).length;
    snapshot.tasksTotal = activeTasks.length;

    // Calculate XP earned for this snapshot
    let xp = 0;
    for (const comp of snapshot.taskCompletions) {
      if (comp.isCompleted) {
        const config = activeTasks.find(t => t.id === comp.taskId);
        if (config) xp += config.xpReward;
      }
    }
    snapshot.xpEarned = xp;

    // Calculate discipline score (0-100)
    snapshot.disciplineScore = this.calculateDisciplineScore(snapshot);

    this.saveSnapshotForDate(dateString, snapshot);
    this.pushSnapshotToFirestore(dateString, snapshot);

    // Recalculate streaks and update profile
    this.recalculateProfileFromHistory();

    return snapshot;
  },

  calculateDisciplineScore(snapshot: DailySnapshot): number {
    return snapshot.tasksTotal > 0 ? Math.round((snapshot.tasksCompleted / snapshot.tasksTotal) * 100) : 0;
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
      const all = this.getAllSnapshots();
      const snap = all[ds];
      if (!snap) {
        if (i === 0) continue; // today might not have data yet
        break;
      }
      const tc = snap.taskCompletions.find(t => t.taskId === taskId);
      if (tc && tc.isCompleted) {
        streak++;
      } else {
        if (i === 0) continue; // today isn't done yet
        break;
      }
    }
    return streak;
  },

  getAllTaskStreaks(): Record<string, number> {
    const tasks = this.getActiveTaskConfigs();
    const streaks: Record<string, number> = {};
    for (const t of tasks) {
      streaks[t.id] = this.getTaskStreak(t.id);
    }
    return streaks;
  },

  recalculateProfileFromHistory() {
    const profile = this.getProfile();
    const snapshots = this.getAllSnapshots();
    const dates = Object.keys(snapshots).sort();

    // Recalculate total XP from all snapshots + focus + tech logs
    let totalXP = 20; // base XP
    for (const ds of dates) {
      totalXP += snapshots[ds].xpEarned;
    }
    const focusSessions = this.getFocusSessions();
    for (const fs of focusSessions) {
      totalXP += fs.xpEarned;
    }
    const techLogs = this.getTechLogs();
    for (const tl of techLogs) {
      totalXP += tl.xpEarned;
    }

    // Calculate current streak (consecutive days with >50% completion)
    const today = new Date();
    let currentStreak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const snap = snapshots[ds];
      if (!snap) {
        if (i === 0) continue;
        break;
      }
      const pct = snap.tasksTotal > 0 ? snap.tasksCompleted / snap.tasksTotal : 0;
      if (pct >= 0.5) {
        currentStreak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }

    // Total tasks completed all time
    let totalCompleted = 0;
    for (const ds of dates) {
      totalCompleted += snapshots[ds].tasksCompleted;
    }

    // Today's discipline score
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
    try {
      const data = localStorage.getItem(KEYS.FOCUS_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse focus sessions:", e);
      try { localStorage.removeItem(KEYS.FOCUS_SESSIONS); } catch {}
    }
    return [];
  },

  saveFocusSessions(sessions: FocusSession[]) {
    localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
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
    const sessions = this.getFocusSessions();
    sessions.push(session);
    this.saveFocusSessions(sessions);
    this.pushFocusSessionToFirestore(session);
    return session;
  },

  endFocusSession(sessionId: string): FocusSession | null {
    const sessions = this.getFocusSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    session.endTime = new Date().toISOString();
    session.isActive = false;
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    session.durationMinutes = Math.round((end - start) / 60000);
    session.xpEarned = session.durationMinutes; // 1 XP per minute

    this.saveFocusSessions(sessions);
    this.pushFocusSessionToFirestore(session);

    // Update today's snapshot focus minutes
    const snapshot = this.getSnapshotForDate(getTodayDateString());
    const todaySessions = sessions.filter(s => s.dateString === getTodayDateString() && !s.isActive);
    snapshot.focusMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    this.saveSnapshotForDate(getTodayDateString(), snapshot);
    this.pushSnapshotToFirestore(getTodayDateString(), snapshot);

    // Update profile
    this.recalculateProfileFromHistory();

    return session;
  },

  getActiveFocusSession(): FocusSession | null {
    return this.getFocusSessions().find(s => s.isActive) || null;
  },

  getTodayFocusMinutes(): number {
    const sessions = this.getFocusSessions().filter(s => s.dateString === getTodayDateString() && !s.isActive);
    return sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  },

  getWeekFocusMinutes(): number {
    const today = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const sessions = this.getFocusSessions().filter(s => s.dateString === ds && !s.isActive);
      total += sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    }
    return total;
  },

  // ── SLEEP LOGS ──────────────────────────
  getSleepLogs(): SleepLog[] {
    try {
      const data = localStorage.getItem(KEYS.SLEEP_LOGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse sleep logs:", e);
      try { localStorage.removeItem(KEYS.SLEEP_LOGS); } catch {}
    }
    return [];
  },

  saveSleepLogs(logs: SleepLog[]) {
    localStorage.setItem(KEYS.SLEEP_LOGS, JSON.stringify(logs));
  },

  saveSleepLog(dateString: string, bedtime: string, wakeTime: string, quality = 80): SleepLog {
    const duration = calculateSleepHours(bedtime, wakeTime);
    const log: SleepLog = { dateString, bedtime, wakeTime, durationHours: duration, quality };
    const logs = this.getSleepLogs();
    const idx = logs.findIndex(l => l.dateString === dateString);
    if (idx >= 0) logs[idx] = log;
    else logs.push(log);
    this.saveSleepLogs(logs);
    this.pushSleepLogToFirestore(log);

    // Update snapshot
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.sleepHours = duration;
    snapshot.habits.bedtime = bedtime;
    snapshot.habits.wakeTime = wakeTime;
    snapshot.habits.sleepCompleted = duration >= 7;
    snapshot.disciplineScore = this.calculateDisciplineScore(snapshot);
    this.saveSnapshotForDate(dateString, snapshot);
    this.pushSnapshotToFirestore(dateString, snapshot);

    return log;
  },

  getSleepLogForDate(dateString: string): SleepLog | null {
    return this.getSleepLogs().find(l => l.dateString === dateString) || null;
  },

  // ── TECH / ACADEMY LOGS ─────────────────
  getTechLogs(): TechLog[] {
    try {
      const data = localStorage.getItem(KEYS.TECH_LOGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse tech logs:", e);
      try { localStorage.removeItem(KEYS.TECH_LOGS); } catch {}
    }

    try {
      const legacy = localStorage.getItem(KEYS.LEGACY_TECH_LOGS);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse legacy tech logs:", e);
    }
    return [];
  },

  saveTechLogs(logs: TechLog[]) {
    localStorage.setItem(KEYS.TECH_LOGS, JSON.stringify(logs));
  },

  addTechLog(topic: string, platform: string, count: number, dateString = getTodayDateString()): TechLog {
    const xpEarned = 15;
    const newLog: TechLog = {
      id: generateId(),
      topic,
      platform,
      count,
      dateString,
      xpEarned,
    };
    const logs = this.getTechLogs();
    logs.unshift(newLog);
    this.saveTechLogs(logs);
    this.pushTechLogToFirestore(newLog);

    // Increment snapshot XP for the target date
    const snapshot = this.getSnapshotForDate(dateString);
    snapshot.xpEarned = (snapshot.xpEarned || 0) + xpEarned;
    this.saveSnapshotForDate(dateString, snapshot);
    this.pushSnapshotToFirestore(dateString, snapshot);

    this.recalculateProfileFromHistory();
    return newLog;
  },

  getTotalProblemsSolved(): number {
    return this.getTechLogs().reduce((sum, l) => sum + l.count, 0);
  },

  // ── ACHIEVEMENTS ────────────────────────
  getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse achievements:", e);
      try { localStorage.removeItem(KEYS.ACHIEVEMENTS); } catch {}
    }
    this.saveAchievements(DEFAULT_ACHIEVEMENTS);
    return [...DEFAULT_ACHIEVEMENTS];
  },

  saveAchievements(achievements: Achievement[]) {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  },

  checkAndUnlockAchievements(): Achievement[] {
    const achievements = this.getAchievements();
    const profile = this.getProfile();
    const focusSessions = this.getFocusSessions().filter(s => !s.isActive);
    const totalFocusHours = focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    const totalProblems = this.getTotalProblemsSolved();

    for (const ach of achievements) {
      if (ach.unlocked) continue;

      switch (ach.id) {
        case "ach_iron":
          ach.current = Math.min(ach.target, profile.totalTasksCompletedAllTime);
          break;
        case "ach_focus":
          ach.current = Math.min(ach.target, Math.round(totalFocusHours));
          break;
        case "ach_momentum":
          ach.current = Math.min(ach.target, profile.currentStreak);
          break;
        case "ach_coding":
          ach.current = Math.min(ach.target, totalProblems);
          break;
        case "ach_consistency":
          ach.current = Math.min(ach.target, profile.longestStreak);
          break;
        case "ach_sleep": {
          // Count consecutive nights with 7+ hours
          const sleepLogs = this.getSleepLogs().sort((a, b) => b.dateString.localeCompare(a.dateString));
          let sleepStreak = 0;
          for (const log of sleepLogs) {
            if (log.durationHours >= 7) sleepStreak++;
            else break;
          }
          ach.current = Math.min(ach.target, sleepStreak);
          break;
        }
        case "ach_focus_master":
          ach.current = Math.min(ach.target, focusSessions.length);
          break;
      }

      if (ach.current >= ach.target) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString();
      }
    }

    this.saveAchievements(achievements);
    return achievements;
  },

  // ── LEADERBOARD / SQUADS ────────────────
  getLeaderboardCache(): GroupMember[] {
    try {
      const data = localStorage.getItem(KEYS.LEADERBOARD);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse leaderboard cache:", e);
      try { localStorage.removeItem(KEYS.LEADERBOARD); } catch {}
    }
    return [];
  },

  saveLeaderboardCache(members: GroupMember[]) {
    localStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(members));
  },

  generateGuestSquadMembers(profile: UserProfile): GroupMember[] {
    const todaySnap = this.getSnapshotForDate(getTodayDateString());
    const pct = todaySnap.tasksTotal > 0 ? (todaySnap.tasksCompleted / todaySnap.tasksTotal) * 100 : 0;
    const configs = this.getActiveTaskConfigs();
    const completedNames = todaySnap.taskCompletions
      .filter(t => t.isCompleted)
      .map(t => configs.find(c => c.id === t.taskId)?.name || "")
      .filter(Boolean)
      .join(",");

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

    const aria: GroupMember = {
      userId: "guest_mock_aria",
      username: "Aria (Mastermind)",
      dailyCompletionPercentage: 90.0,
      currentStreak: 18,
      totalTasksAllTime: 142,
      xp: 2450,
      profilePic: "avatar_5",
      activeBreakdown: "System Design Practice,Solve 3 LeetCode,Cardio Session",
      isMe: false,
      focusHours: 4.2,
      problemsSolved: 124,
    };

    const sarah: GroupMember = {
      userId: "guest_mock_sarah",
      username: "Sarah (Developer)",
      dailyCompletionPercentage: 75.0,
      currentStreak: 7,
      totalTasksAllTime: 68,
      xp: 1840,
      profilePic: "avatar_1",
      activeBreakdown: "React Refactoring,Read Tech Blog",
      isMe: false,
      focusHours: 3.0,
      problemsSolved: 89,
    };

    const john: GroupMember = {
      userId: "guest_mock_john",
      username: "John (Fighter)",
      dailyCompletionPercentage: 60.0,
      currentStreak: 4,
      totalTasksAllTime: 32,
      xp: 950,
      profilePic: "avatar_3",
      activeBreakdown: "Daily Gym Session,Hydration Protocol",
      isMe: false,
      focusHours: 1.5,
      problemsSolved: 34,
    };

    return [me, aria, sarah, john];
  },

  extractSquadId(input: string): string {
    const trimmed = input.trim();
    const hubRegex = /(hub-[a-z0-9\-]+)/i;
    const match = trimmed.match(hubRegex);
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
      } catch {
        finalGroupName = "Squad Tribe";
      }
    }
    const profile = this.getProfile();
    profile.currentGroupId = cleanGroupId;
    profile.currentGroupName = finalGroupName;
    this.saveProfile(profile);
    if (auth.currentUser) {
      if (auth.currentUser.uid !== "guest_user") {
        await this.pushUserProfileToFirestore(profile);
        await this.syncSquadMembers(cleanGroupId, profile);
      } else {
        const mockMembers = this.generateGuestSquadMembers(profile);
        this.saveLeaderboardCache(mockMembers);
      }
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
      try {
        await deleteDoc(doc(db, "squads", oldGroupId, "members", user.uid));
        await this.pushUserProfileToFirestore(profile);
      } catch (e) {
        console.error("Firestore leave squad failed", e);
      }
    }
    return profile;
  },

  async pushTaskConfigToFirestore(config: TaskConfig) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await setDoc(doc(db, "users", user.uid, "taskConfigs", config.id), config);
    } catch (e) {
      console.error("Firestore push task config failed", e);
    }
  },

  async deleteTaskConfigFromFirestore(taskId: string) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "taskConfigs", taskId));
    } catch (e) {
      console.error("Firestore delete task config failed", e);
    }
  },

  async pushSnapshotToFirestore(dateString: string, snapshot: DailySnapshot) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await setDoc(doc(db, "users", user.uid, "snapshots", dateString), snapshot);
    } catch (e) {
      console.error("Firestore push snapshot failed", e);
    }
  },

  async pushSleepLogToFirestore(log: SleepLog) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await setDoc(doc(db, "users", user.uid, "sleepLogs", log.dateString), log);
    } catch (e) {
      console.error("Firestore push sleep log failed", e);
    }
  },

  async pushTechLogToFirestore(log: TechLog) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await setDoc(doc(db, "users", user.uid, "techLogs", log.id), log);
    } catch (e) {
      console.error("Firestore push tech log failed", e);
    }
  },

  async pushFocusSessionToFirestore(session: FocusSession) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await setDoc(doc(db, "users", user.uid, "focusSessions", session.id), session);
    } catch (e) {
      console.error("Firestore push focus session failed", e);
    }
  },

  async syncAllDataFromFirestore() {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      // 1. Pull Task Configs
      const tasksSnap = await getDocs(collection(db, "users", user.uid, "taskConfigs"));
      if (!tasksSnap.empty) {
        const configs: TaskConfig[] = [];
        tasksSnap.forEach(d => configs.push(d.data() as TaskConfig));
        this.saveTaskConfigs(configs);
      }

      // 2. Pull Snapshots
      const snapsSnap = await getDocs(collection(db, "users", user.uid, "snapshots"));
      if (!snapsSnap.empty) {
        const snaps: Record<string, DailySnapshot> = {};
        snapsSnap.forEach(d => {
          snaps[d.id] = d.data() as DailySnapshot;
        });
        this.saveAllSnapshots(snaps);
      }

      // 3. Pull Sleep Logs
      const sleepSnap = await getDocs(collection(db, "users", user.uid, "sleepLogs"));
      if (!sleepSnap.empty) {
        const logs: SleepLog[] = [];
        sleepSnap.forEach(d => logs.push(d.data() as SleepLog));
        this.saveSleepLogs(logs);
      }

      // 4. Pull Tech Logs
      const techSnap = await getDocs(collection(db, "users", user.uid, "techLogs"));
      if (!techSnap.empty) {
        const logs: TechLog[] = [];
        techSnap.forEach(d => logs.push(d.data() as TechLog));
        this.saveTechLogs(logs);
      }

      // 5. Pull Focus Sessions
      const focusSnap = await getDocs(collection(db, "users", user.uid, "focusSessions"));
      if (!focusSnap.empty) {
        const sessions: FocusSession[] = [];
        focusSnap.forEach(d => sessions.push(d.data() as FocusSession));
        this.saveFocusSessions(sessions);
      }
    } catch (e) {
      console.error("Firestore sync all data failed", e);
    }
  },

  async pushUserProfileToFirestore(profile: UserProfile) {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: profile.username,
        profilePhoto: profile.profilePic,
        xp: profile.xp,
        streak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        totalTasksCompletedAllTime: profile.totalTasksCompletedAllTime,
        currentGroupId: profile.currentGroupId,
        currentGroupName: profile.currentGroupName,
      }, { merge: true });
    } catch (e) {
      console.error("Firestore user profile push failed", e);
    }
  },

  async syncUserProfileFromFirestore(): Promise<UserProfile> {
    const user = auth.currentUser;
    const profile = this.getProfile();
    if (!user || user.uid === "guest_user") return profile;

    // Sync all subcollections first to restore full history and tasks!
    await this.syncAllDataFromFirestore();

    try {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const updated: UserProfile = {
          ...profile,
          username: data.username || user.displayName || "Grinder",
          profilePic: data.profilePhoto || "avatar_1",
          currentGroupId: data.currentGroupId || null,
          currentGroupName: data.currentGroupName || null,
          xp: data.xp !== undefined ? data.xp : profile.xp,
          currentStreak: data.streak !== undefined ? data.streak : profile.currentStreak,
          longestStreak: data.longestStreak !== undefined ? data.longestStreak : profile.longestStreak,
          totalTasksCompletedAllTime: data.totalTasksCompletedAllTime !== undefined ? data.totalTasksCompletedAllTime : profile.totalTasksCompletedAllTime,
        };
        this.saveProfile(updated);
        if (updated.currentGroupId) {
          await this.syncSquadMembers(updated.currentGroupId, updated);
        }
        return updated;
      } else {
        // Document does not exist in Firestore yet: initialize it for first-time logged-in user!
        if (user.displayName && profile.username === "Grinder") {
          profile.username = user.displayName;
        }
        await this.pushUserProfileToFirestore(profile);
      }
    } catch (e) {
      console.error("Firestore user profile pull failed", e);
    }
    return profile;
  },

  async syncSquadMembers(groupId: string, profile: UserProfile): Promise<GroupMember[]> {
    const user = auth.currentUser;
    if (!user || user.uid === "guest_user") {
      const cached = this.getLeaderboardCache();
      if (cached.length > 0 && cached.some(m => m.isMe && m.userId === "guest_user")) {
        const todaySnap = this.getSnapshotForDate(getTodayDateString());
        const pct = todaySnap.tasksTotal > 0 ? (todaySnap.tasksCompleted / todaySnap.tasksTotal) * 100 : 0;
        const configs = this.getActiveTaskConfigs();
        const completedNames = todaySnap.taskCompletions
          .filter(t => t.isCompleted)
          .map(t => configs.find(c => c.id === t.taskId)?.name || "")
          .filter(Boolean)
          .join(",");

        const updated = cached.map(m => {
          if (m.isMe) {
            return {
              ...m,
              username: profile.username,
              dailyCompletionPercentage: parseFloat(pct.toFixed(1)),
              currentStreak: profile.currentStreak,
              totalTasksAllTime: profile.totalTasksCompletedAllTime,
              xp: profile.xp,
              profilePic: profile.profilePic,
              activeBreakdown: completedNames,
              focusHours: parseFloat((this.getTodayFocusMinutes() / 60).toFixed(1)),
              problemsSolved: this.getTotalProblemsSolved(),
            };
          }
          return m;
        });
        this.saveLeaderboardCache(updated);
        return updated;
      }
      const mockMembers = this.generateGuestSquadMembers(profile);
      this.saveLeaderboardCache(mockMembers);
      return mockMembers;
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
    } catch (e) {
      console.error("Firestore sync squad members failed", e);
    }
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
      .filter(Boolean)
      .join(",");

    const me: GroupMember = {
      userId: user.uid,
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
    } catch (e) {
      console.error("Firestore member leaderboard push failed", e);
    }
    return me;
  },

  // ── PROFILE MANAGEMENT ──────────────────
  updateProfileInfo(username: string, profilePic: string): UserProfile {
    const profile = this.getProfile();
    profile.username = username;
    profile.profilePic = profilePic;
    this.saveProfile(profile);
    if (auth.currentUser) {
      this.pushUserProfileToFirestore(profile);
      this.syncLocalToLeaderboard(profile);
    }
    return profile;
  },

  // ── MIDNIGHT RESET ──────────────────────
  async checkAndPerformMidnightReset(): Promise<{ resetDone: boolean; profile: UserProfile }> {
    const profile = this.getProfile();
    const today = getTodayDateString();

    if (profile.lastResetDateString !== today) {
      // Ensure today's snapshot exists
      this.getSnapshotForDate(today);

      // Update profile
      profile.lastResetDateString = today;
      this.recalculateProfileFromHistory();
      const updatedProfile = this.getProfile();
      updatedProfile.lastResetDateString = today;
      this.saveProfile(updatedProfile);

      // Firestore sync
      if (auth.currentUser) {
        await this.pushUserProfileToFirestore(updatedProfile);
        if (updatedProfile.currentGroupId) {
          await this.syncSquadMembers(updatedProfile.currentGroupId, updatedProfile);
        }
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
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const all = this.getAllSnapshots();
      if (all[ds]) snapshots.push(all[ds]);
    }
    return snapshots;
  },

  getMonthlySnapshots(): DailySnapshot[] {
    const today = new Date();
    const snapshots: DailySnapshot[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const all = this.getAllSnapshots();
      if (all[ds]) snapshots.push(all[ds]);
    }
    return snapshots;
  },

  getAverageDisciplineScore(days = 7): number {
    const today = new Date();
    const all = this.getAllSnapshots();
    let total = 0;
    let count = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      if (all[ds]) {
        total += all[ds].disciplineScore;
        count++;
      }
    }
    return count > 0 ? Math.round(total / count) : 0;
  },

  getHabitCompletionRate(days = 7): number {
    const today = new Date();
    const all = this.getAllSnapshots();
    let totalHabits = 0;
    let completedHabits = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      if (all[ds]) {
        const h = all[ds].habits;
        totalHabits += 4;
        if (h.gymCompleted) completedHabits++;
        if (h.dietCompleted) completedHabits++;
        if (h.skincareCompleted) completedHabits++;
        if (h.sleepCompleted) completedHabits++;
      }
    }
    return totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  },

  // ── HEATMAP DATA ────────────────────────
  getHeatmapDays(numDays = 21): { dateString: string; label: number; isToday: boolean; completionLevel: number }[] {
    const days = [];
    const today = new Date();
    const all = this.getAllSnapshots();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      const snap = all[ds];
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
      "DSA": 100,
      "Web Development": 100,
      "AI/ML": 50,
      "System Design": 50,
      "Projects": 30,
      "LeetCode": 200,
    };
    const logs = this.getTechLogs();
    const progress: Record<string, { count: number; target: number; percentage: number }> = {};
    for (const [subj, target] of Object.entries(TARGETS)) {
      const count = logs.filter(l => l.topic === subj).reduce((sum, l) => sum + l.count, 0);
      progress[subj] = { count, target, percentage: Math.min(100, Math.round((count / target) * 100)) };
    }
    return progress;
  },

  // ── CLEAR DATA ──────────────────────────
  clearAllData() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  },

  // ── MOCK DATA FOR DEMO ──────────────────
  prepopulateMockHistory() {
    // Completely disabled in production. Everything is based on real user data!
  },
};
