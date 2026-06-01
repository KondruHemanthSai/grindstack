import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb, getTodayDateString, formatDate } from "../db/localDb";
import type { TaskConfig, DailySnapshot } from "../db/localDb";
import { DateSelector } from "../components/DateSelector";
import { StreakBars } from "../components/StreakBars";
import { 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Dumbbell, 
  Moon, 
  Flame,
  Check,
  Brain,
  CalendarDays
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; emoji: string }> = {
  tech: { label: "Tech & Learning", icon: <Code size={20} />, color: "var(--tertiary)", emoji: "💻" },
  health: { label: "Health & Wellness", icon: <Dumbbell size={20} />, color: "var(--primary)", emoji: "🏋️" },
  discipline: { label: "Lifestyle & Discipline", icon: <Brain size={20} />, color: "var(--secondary)", emoji: "📋" },
};

const SUBJECTS = ["DSA", "Web Development", "AI/ML", "System Design", "Projects", "LeetCode"];
const PLATFORMS = ["LeetCode", "CodeChef", "HackerRank", "Smart Interviews Primary", "Smart Interviews Basic", "Custom Platform"];

export const MissionScreen: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [activeTasks, setActiveTasks] = useState<TaskConfig[]>([]);

  // Accordion Expand State
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    tech: true,
    health: true,
    discipline: true,
  });

  // Modal State for Learning Log
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [activeProblemsTaskId, setActiveProblemsTaskId] = useState<string | null>(null);
  const [learnSubject, setLearnSubject] = useState(SUBJECTS[0]);
  const [learnPlatform, setLearnPlatform] = useState(PLATFORMS[0]);
  const [problemsCount, setProblemsCount] = useState(1);
  const [learnNotes, setLearnNotes] = useState("");
  const [showLearningSuccess, setShowLearningSuccess] = useState(false);

  // Sleep Logging inputs
  const [bedtime, setBedtime] = useState("22:30");
  const [waketime, setWaketime] = useState("06:30");
  const [sleepQuality, setSleepQuality] = useState(85);
  const [showSleepSuccess, setShowSleepSuccess] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  // Remarks Modal inputs
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [remarksTaskId, setRemarksTaskId] = useState<string | null>(null);
  const [taskRemarks, setTaskRemarks] = useState("");

  const toggleCategory = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const loadData = useCallback(() => {
    // Self-repair check: Ensure default health_sleep is active and in sync
    const allConfigs = localDb.getTaskConfigs();
    const sleepTask = allConfigs.find(t => t.id === "health_sleep");
    let needsSave = false;
    if (!sleepTask) {
      const sleepConfig: TaskConfig = {
        id: "health_sleep",
        name: "Sleep",
        description: "Get 7-8 hours of sound sleep",
        category: "health",
        xpReward: 10,
        streakEnabled: true,
        graceDayEligible: true,
        isCustom: false,
        archived: false,
        enabled: true,
        order: 10,
        createdAt: getTodayDateString(),
        taskType: "simple"
      };
      allConfigs.push(sleepConfig);
      needsSave = true;
      localDb.pushTaskConfigToFirestore(sleepConfig);
    } else if (sleepTask.archived || !sleepTask.enabled) {
      sleepTask.archived = false;
      sleepTask.enabled = true;
      needsSave = true;
      localDb.pushTaskConfigToFirestore(sleepTask);
    }
    if (needsSave) {
      localDb.saveTaskConfigs(allConfigs);
    }

    const snap = localDb.getSnapshotForDate(selectedDate);
    setSnapshot(snap);
    setActiveTasks(localDb.getActiveTaskConfigs());
    
    // Load current sleep log if exists
    const sleepLog = localDb.getSleepLogForDate(selectedDate);
    if (sleepLog) {
      setBedtime(sleepLog.bedtime);
      setWaketime(sleepLog.wakeTime);
      setSleepQuality(sleepLog.quality);
    } else {
      setBedtime("22:30");
      setWaketime("06:30");
      setSleepQuality(85);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleTask = async (taskId: string, currentValue: boolean) => {
    if (!snapshot) return;
    if (!currentValue) {
      // Opening remarks modal to complete task
      setRemarksTaskId(taskId);
      setTaskRemarks("");
      setIsRemarksModalOpen(true);
    } else {
      // Directly uncheck task
      localDb.toggleTaskForDate(taskId, selectedDate, false);
      loadData();
      await refreshProfile();
    }
  };

  const handleSaveRemarksAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshot || !remarksTaskId) return;
    
    // Save completion state with remarks!
    localDb.toggleTaskForDate(remarksTaskId, selectedDate, true, taskRemarks.trim());
    
    setIsRemarksModalOpen(false);
    setRemarksTaskId(null);
    setTaskRemarks("");
    loadData();
    await refreshProfile();
  };

  const handleAddLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    localDb.addTechLog(learnSubject, learnPlatform, problemsCount, selectedDate);
    
    if (activeProblemsTaskId) {
      localDb.toggleTaskForDate(activeProblemsTaskId, selectedDate, true);
    }

    setShowLearningSuccess(true);
    setTimeout(async () => {
      setShowLearningSuccess(false);
      setIsLearningModalOpen(false);
      setActiveProblemsTaskId(null);
      setProblemsCount(1);
      setLearnNotes("");
      loadData();
      await refreshProfile();
    }, 1500);
  };

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    localDb.saveSleepLog(selectedDate, bedtime, waketime, sleepQuality);
    
    // Also toggle the Sleep task in check completions
    localDb.toggleTaskForDate("health_sleep", selectedDate, true);

    setShowSleepSuccess(true);
    setTimeout(async () => {
      setShowSleepSuccess(false);
      setIsSleepModalOpen(false);
      loadData();
      await refreshProfile();
    }, 1500);
  };

  // Helper calculations
  const calculateSleepDuration = (bed: string, wake: string) => {
    try {
      const [bH, bM] = bed.split(":").map(Number);
      const [wH, wM] = wake.split(":").map(Number);
      let bedMins = bH * 60 + bM;
      let wakeMins = wH * 60 + wM;
      if (wakeMins <= bedMins) wakeMins += 24 * 60;
      const totalMins = wakeMins - bedMins;
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return { hours, mins, totalHours: parseFloat((totalMins / 60).toFixed(1)) };
    } catch {
      return { hours: 8, mins: 0, totalHours: 8.0 };
    }
  };

  const sleepCalc = calculateSleepDuration(bedtime, waketime);
  const recoveryScore = Math.min(100, Math.round(sleepQuality * 0.7 + sleepCalc.totalHours * 3.5));

  // Get 7-day completion history for a task
  const getTaskHistory = (taskId: string) => {
    const baseDate = new Date(selectedDate);
    const result: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const ds = formatDate(d);
      const snap = localDb.getSnapshotForDate(ds);
      const tc = snap.taskCompletions.find(t => t.taskId === taskId);
      result.push(tc ? tc.isCompleted : false);
    }
    return result;
  };

  if (!snapshot) return null;

  // Group tasks by category
  const groupedTasks: Record<string, { config: TaskConfig; isCompleted: boolean; remarks?: string }[]> = {
    tech: [],
    health: [],
    discipline: [],
  };

  for (const tc of snapshot.taskCompletions) {
    const config = activeTasks.find(t => t.id === tc.taskId);
    if (!config) continue;
    const cat = config.category in groupedTasks ? config.category : "discipline";
    groupedTasks[cat].push({ config, isCompleted: tc.isCompleted, remarks: tc.remarks });
  }

  return (
    <div className="screen-content">
      {/* Title */}
      <div className="flex-row-between" style={{ alignItems: "center" }}>
        <div>
          <h2 className="text-section bold text-glow" style={{ letterSpacing: "-0.02em" }}>MISSION CENTER</h2>
          <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
            Log physical restorative cycles, register coding milestones, and complete daily tasks.
          </p>
        </div>
        <div 
          className="btn-icon-only" 
          onClick={() => {
            if (dateInputRef.current) {
              try {
                if (typeof dateInputRef.current.showPicker === 'function') {
                  dateInputRef.current.showPicker();
                } else {
                  dateInputRef.current.click();
                }
              } catch (err) {
                dateInputRef.current.click();
              }
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <CalendarDays size={20} className="text-primary-accent" />
        </div>
        <input 
          type="date" 
          ref={dateInputRef}
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(e.target.value);
            }
          }}
          style={{
            display: "none"
          }}
        />
      </div>

      {/* Date Strip */}
      <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} numDays={10} />

      {/* Expandable Categories */}
      <div className="flex-column" style={{ gap: "20px" }}>
        {Object.entries(groupedTasks).map(([catKey, tasks]) => {
          const meta = CATEGORY_META[catKey];
          if (!meta) return null;

          const completedCount = tasks.filter(t => t.isCompleted).length;
          const totalCount = tasks.length;
          const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isOpen = expanded[catKey];

          return (
            <div 
              key={catKey} 
              className="glass-card" 
              style={{ 
                padding: "0px", 
                overflow: "hidden", 
                border: "1px solid var(--glass-border-nav)",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
                background: "rgba(10, 10, 12, 0.45)"
              }}
            >
              {/* Category Header */}
              <button 
                onClick={() => toggleCategory(catKey)}
                className="flex-row-between"
                style={{ 
                  width: "100%", 
                  padding: "20px", 
                  textAlign: "left",
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: isOpen ? "1px solid var(--glass-border)" : "none",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center", width: "80%" }}>
                  <div 
                    style={{ 
                      width: "36px", 
                      height: "36px", 
                      borderRadius: "10px", 
                      background: `${meta.color}22`,
                      border: `1px solid ${meta.color}44`,
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: meta.color
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="text-card-title bold" style={{ fontSize: "16px", color: "var(--on-surface)" }}>
                      {meta.label}
                    </h4>
                    {/* Category Progress Bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <div style={{ width: "120px", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: meta.color, transition: "var(--ease-smooth)" }} />
                      </div>
                      <span className="text-xs bold" style={{ color: meta.color }}>{progressPct}%</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="badge" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-secondary)", fontSize: "10px" }}>
                    {completedCount}/{totalCount} DONE
                  </span>
                  {isOpen ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                </div>
              </button>

              {/* Collapsed/Expanded Content */}
              {isOpen && (
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* Category-Specific Logging Additions */}


                  {/* Tasks List */}
                  <div className="flex-column" style={{ gap: "10px" }}>
                    {tasks.map(({ config, isCompleted, remarks }) => {
                      const history = getTaskHistory(config.id);
                      const streak = localDb.getTaskStreak(config.id);

                      {/* Check task type */}
                      const isProblemsTask = config.taskType === "problems";
                      const isSleepTask = config.id === "health_sleep";
                      const techLogs = localDb.getTechLogs().filter(l => l.dateString === selectedDate);
                      const matchingLogs = isProblemsTask ? techLogs.filter(l => l.topic === config.name) : [];
                      const sleepLog = isSleepTask ? localDb.getSleepLogForDate(selectedDate) : null;

                      const handleTaskClick = () => {
                        if (isProblemsTask) {
                          setActiveProblemsTaskId(config.id);
                          setLearnSubject(config.name);
                          setIsLearningModalOpen(true);
                        } else if (isSleepTask) {
                          if (isCompleted) {
                            handleToggleTask(config.id, isCompleted);
                          } else {
                            setIsSleepModalOpen(true);
                          }
                        } else {
                          handleToggleTask(config.id, isCompleted);
                        }
                      };

                      return (
                        <div 
                          key={config.id}
                          className="mission-card"
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: isCompleted ? "rgba(52, 211, 153, 0.03)" : "rgba(255,255,255,0.01)",
                            border: isCompleted ? "1px solid rgba(52, 211, 153, 0.15)" : "1px solid rgba(255,255,255,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                        >
                          <div className="flex-row-between" style={{ width: "100%", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              {/* Complete Checkbox */}
                              <button 
                                onClick={handleTaskClick}
                                className={`task-checkbox ${isCompleted ? "checked" : ""}`}
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  border: isCompleted ? `1.5px solid ${meta.color}` : "1.5px solid var(--text-muted)",
                                  background: isCompleted ? meta.color : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: isCompleted ? `0 0 10px ${meta.color}66` : "none",
                                  transition: "all 0.25s ease"
                                }}
                              >
                                {isCompleted && <Check size={12} color="#000" style={{ strokeWidth: 3 }} />}
                              </button>

                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span 
                                  className={`task-name ${isCompleted ? "completed" : ""}`}
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: isCompleted ? "var(--text-muted)" : "var(--on-surface)",
                                    textDecoration: isCompleted ? "line-through" : "none",
                                    opacity: isCompleted ? 0.6 : 1
                                  }}
                                >
                                  {config.name}
                                </span>
                                {config.description && (
                                  <span className="text-xs text-muted" style={{ marginTop: "2px" }}>
                                    {config.description}
                                  </span>
                                )}

                                {isCompleted && remarks && (
                                  <span className="text-xs text-muted" style={{ display: "inline-block", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "6px 10px", marginTop: "8px", fontStyle: "italic", alignSelf: "flex-start" }}>
                                    💬 Remarks: "{remarks}"
                                  </span>
                                )}
                                
                                {/* Problems Task dynamic completion summary */}
                                {isProblemsTask && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                                    {matchingLogs.length > 0 && (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {matchingLogs.map((log) => (
                                          <span key={log.id} className="badge badge-tertiary" style={{ fontSize: "10px" }}>
                                            {log.platform.toUpperCase()} | {log.count} SOLVED TODAY
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskClick();
                                      }}
                                      className="badge hover-glow"
                                      style={{
                                        alignSelf: "flex-start",
                                        background: "rgba(255, 255, 255, 0.03)",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                        color: "var(--primary)",
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        marginTop: "4px"
                                      }}
                                    >
                                      + LOG MORE SOLVES
                                    </button>
                                  </div>
                                )}

                                {/* Sleep Task dynamic log summary */}
                                {isSleepTask && sleepLog && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      <span className="badge badge-primary" style={{ fontSize: "10px" }}>
                                        {sleepLog.durationHours} HRS SLEEP | {sleepLog.quality}% QUALITY
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSleepModalOpen(true);
                                      }}
                                      className="badge hover-glow"
                                      style={{
                                        alignSelf: "flex-start",
                                        background: "rgba(255, 255, 255, 0.03)",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                        color: "var(--primary)",
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        marginTop: "4px"
                                      }}
                                    >
                                      + EDIT SLEEP LOG
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <span className="badge" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25`, fontSize: "10px" }}>
                              +{config.xpReward} XP
                            </span>
                          </div>

                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }} />

                          <div className="flex-row-between" style={{ alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Flame size={14} className="text-secondary-accent" />
                              <span className="text-xs bold text-secondary-accent">{streak} DAY STREAK</span>
                            </div>
                            <StreakBars data={history} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* learning activity modal */}
      {isLearningModalOpen && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.85)", 
            backdropFilter: "blur(8px)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1100, 
            padding: "24px" 
          }}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: "100%", 
              maxWidth: "400px", 
              background: "#0d0d0f", 
              border: "1px solid var(--glass-border-nav)",
              position: "relative",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
              animation: "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          >
            {showLearningSuccess && (
              <div 
                style={{ 
                  position: "absolute", 
                  inset: 0, 
                  background: "rgba(52, 211, 153, 0.98)", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  borderRadius: "16px",
                  zIndex: 20, 
                  animation: "fadeIn 0.3s ease" 
                }}
              >
                <Check size={54} color="#000" style={{ strokeWidth: 3 }} />
                <h3 style={{ color: "#000", fontWeight: "bold", marginTop: "14px" }}>Milestone registered!</h3>
                <p style={{ color: "rgba(0,0,0,0.7)", fontSize: "13px", marginTop: "4px" }}>+15 XP Earned</p>
              </div>
            )}

            <div className="flex-row-between" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Brain size={20} className="text-tertiary-accent" />
                <h3 className="text-card-title bold">Add Learning Log</h3>
              </div>
              <button 
                onClick={() => setIsLearningModalOpen(false)}
                className="text-muted text-xs hover-glow"
                style={{ fontSize: "18px", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLearning} className="flex-column" style={{ gap: "16px" }}>
              <div className="input-group">
                <label className="input-label">Subject</label>
                <select 
                  value={learnSubject} 
                  onChange={(e) => setLearnSubject(e.target.value)} 
                  className="text-input"
                  style={{ background: "#131316", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Platform</label>
                <select 
                  value={learnPlatform} 
                  onChange={(e) => setLearnPlatform(e.target.value)} 
                  className="text-input"
                  style={{ background: "#131316", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                >
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Problems Solved</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30" 
                  value={problemsCount}
                  onChange={(e) => setProblemsCount(Number(e.target.value))} 
                  className="text-input"
                  style={{ background: "#131316" }}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Notes</label>
                <textarea 
                  rows={2} 
                  value={learnNotes}
                  onChange={(e) => setLearnNotes(e.target.value)} 
                  className="text-input" 
                  placeholder="What did you study/solve?"
                  style={{ background: "#131316", resize: "none" }}
                />
              </div>

              {/* XP Preview */}
              <div 
                style={{ 
                  background: "rgba(56, 189, 248, 0.05)", 
                  border: "1px solid rgba(56, 189, 248, 0.15)",
                  padding: "12px", 
                  borderRadius: "10px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center"
                }}
              >
                <span className="text-xs text-muted">XP Reward Preview</span>
                <span className="badge badge-tertiary bold">+15 XP</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  background: "var(--tertiary)", 
                  color: "var(--void)",
                  fontWeight: "bold"
                }}
              >
                Register Milestone
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Completion Remarks Modal */}
      {isRemarksModalOpen && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.85)", 
            backdropFilter: "blur(8px)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1100, 
            padding: "24px" 
          }}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: "100%", 
              maxWidth: "400px", 
              background: "#0d0d0f", 
              border: "1px solid var(--glass-border-nav)",
              position: "relative",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
              animation: "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              borderRadius: "16px"
            }}
          >
            <div className="flex-row-between" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Check size={20} className="text-primary-accent" />
                <h3 className="text-card-title bold">Complete Task Remarks</h3>
              </div>
              <button 
                onClick={() => {
                  setIsRemarksModalOpen(false);
                  setRemarksTaskId(null);
                }}
                className="text-muted text-xs hover-glow"
                style={{ fontSize: "18px", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRemarksAndComplete} className="flex-column" style={{ gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px", textAlign: "left" }}>
                <span className="text-sm bold text-primary-accent" style={{ display: "block" }}>
                  {activeTasks.find(t => t.id === remarksTaskId)?.name}
                </span>
                <span className="text-xs text-muted" style={{ display: "block", marginTop: "4px" }}>
                  {activeTasks.find(t => t.id === remarksTaskId)?.description || "No description configured."}
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Completion Remarks / Comment</label>
                <textarea 
                  rows={3} 
                  value={taskRemarks}
                  onChange={(e) => setTaskRemarks(e.target.value)} 
                  className="text-input" 
                  placeholder="What did you accomplish? Any notes or details?"
                  style={{ background: "#131316", resize: "none" }}
                  required
                />
              </div>

              {/* XP Preview */}
              <div 
                style={{ 
                  background: "rgba(52, 211, 153, 0.05)", 
                  border: "1px solid rgba(52, 211, 153, 0.15)",
                  padding: "12px", 
                  borderRadius: "10px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center"
                }}
              >
                <span className="text-xs text-muted">XP Reward Preview</span>
                <span className="badge badge-primary bold">
                  +{activeTasks.find(t => t.id === remarksTaskId)?.xpReward || 10} XP
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  background: "var(--primary)", 
                  color: "var(--void)",
                  fontWeight: "bold"
                }}
              >
                Complete Task & Submit Streak
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sleep Logging Modal */}
      {isSleepModalOpen && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.85)", 
            backdropFilter: "blur(8px)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1100, 
            padding: "24px" 
          }}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: "100%", 
              maxWidth: "400px", 
              background: "#0d0d0f", 
              border: "1px solid var(--glass-border-nav)",
              position: "relative",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
              animation: "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            {showSleepSuccess && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(52, 211, 153, 0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: "16px", animation: "fadeIn 0.3s ease" }}>
                <Check size={48} color="#000" style={{ strokeWidth: 3 }} />
                <h3 style={{ color: "#000", fontWeight: "bold", marginTop: "12px" }}>Sleep restored successfully!</h3>
              </div>
            )}

            <div className="flex-row-between" style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Moon size={20} className="text-primary-accent" />
                <h3 className="text-card-title bold">Log Sleep Duration</h3>
              </div>
              <button 
                onClick={() => {
                  setIsSleepModalOpen(false);
                }}
                className="text-muted text-xs hover-glow"
                style={{ fontSize: "18px", fontWeight: "bold", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Display sleep metrics live update */}
            <div style={{ textAlign: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <h2 className="text-hero bold text-glow" style={{ fontSize: "24px", color: "var(--on-surface)" }}>
                You slept {sleepCalc.hours}h {sleepCalc.mins}m
              </h2>
              <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px" }}>
                <div>
                  <p className="text-xs text-muted">Recovery Indicator</p>
                  <span className="badge badge-primary" style={{ marginTop: "4px" }}>{recoveryScore}% Optimal</span>
                </div>
                <div>
                  <p className="text-xs text-muted">Health Contribution</p>
                  <span className="badge badge-tertiary" style={{ marginTop: "4px" }}>
                    +{sleepCalc.totalHours >= 7 ? (activeTasks.find(t => t.id === "health_sleep")?.xpReward || 10) : 0} XP
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSleep} className="flex-column" style={{ gap: "16px" }}>
              <div className="grid-2" style={{ gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label">Bedtime</label>
                  <input 
                    type="time" 
                    value={bedtime} 
                    onChange={(e) => setBedtime(e.target.value)} 
                    className="text-input"
                    style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Wake Time</label>
                  <input 
                    type="time" 
                    value={waketime} 
                    onChange={(e) => setWaketime(e.target.value)} 
                    className="text-input"
                    style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Interactive Sleep Quality range slider */}
              <div className="input-group">
                <div className="flex-row-between" style={{ alignItems: "center" }}>
                  <label className="input-label" style={{ margin: 0 }}>Sleep Quality (%)</label>
                  <span className="text-xs bold text-primary-accent" style={{ fontSize: "12px" }}>{sleepQuality}%</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="100" 
                  value={sleepQuality} 
                  onChange={(e) => setSleepQuality(Number(e.target.value))} 
                  style={{ 
                    width: "100%", 
                    accentColor: "var(--primary)",
                    background: "rgba(255,255,255,0.05)",
                    height: "6px",
                    borderRadius: "3px",
                    outline: "none",
                    marginTop: "6px",
                    cursor: "pointer"
                  }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  background: "var(--primary)", 
                  color: "var(--void)",
                  fontWeight: "bold",
                  fontSize: "13px",
                  cursor: "pointer",
                  border: "none",
                  borderRadius: "8px"
                }}
              >
                Log Sleep & Complete Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
