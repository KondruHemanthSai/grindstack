import React, { useState, useEffect, useMemo } from "react";
import { localDb, formatDate } from "../db/localDb";
import type { SleepLog, TechLog, DailySnapshot, FocusSession, TaskConfig } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { ChartLine } from "../components/ChartLine";
import { 
  Users, 
  Activity,
  Calendar,
  TrendingUp,
  ShieldAlert,
  Moon
} from "lucide-react";

type FilterType = "today" | "7d" | "30d" | "90d" | "6m" | "1y" | "custom";
type TabType = "summary" | "lifestyle" | "performance" | "learning" | "wellness" | "focus" | "correlations" | "squad";
type ChartType = "line" | "area" | "moving";

export const InsightsScreen: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>("7d");
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [chartType, setChartType] = useState<ChartType>("area");
  
  // Custom Date Range State
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  // Compare Metrics State
  const [metricA, setMetricA] = useState<string>("sleepHours");
  const [metricB, setMetricB] = useState<string>("disciplineScore");

  // Heatmap Calendar Month/Year State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  // Selected Member in Squad State
  const [selectedMember, setSelectedMember] = useState<string>("Aria");
  
  // Interactive Modal Snapshot State
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string | null>(null);
  
  // Modal Edit Reflection States
  const [modalMood, setModalMood] = useState<string>("🧠");
  const [modalNotes, setModalNotes] = useState<string>("");

  // Raw Database Cache Lists
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [techLogs, setTechLogs] = useState<TechLog[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [configs, setConfigs] = useState<TaskConfig[]>([]);

  useEffect(() => {
    setSleepLogs(localDb.getSleepLogs());
    setTechLogs(localDb.getTechLogs());
    setFocusSessions(localDb.getFocusSessions());
    setConfigs(localDb.getActiveTaskConfigs());
  }, [selectedSnapshotDate]); // Refresh lists when reflection is saved and modal opens/closes

  // 1. Dynamic Time Filter Snapshot Engine (Current Period)
  const snapshots = useMemo(() => {
    const today = new Date();
    const result: DailySnapshot[] = [];
    
    if (filter === "custom") {
      if (!customStart || !customEnd) return [];
      const start = new Date(customStart);
      const end = new Date(customEnd);
      let curr = new Date(start);
      let iterations = 0;
      while (curr <= end && iterations < 366) {
        const ds = formatDate(curr);
        result.push(localDb.getSnapshotForDate(ds));
        curr.setDate(curr.getDate() + 1);
        iterations++;
      }
      return result;
    }

    let numDays = 7;
    if (filter === "today") numDays = 1;
    else if (filter === "30d") numDays = 30;
    else if (filter === "90d") numDays = 90;
    else if (filter === "6m") numDays = 180;
    else if (filter === "1y") numDays = 365;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      result.push(localDb.getSnapshotForDate(ds));
    }
    return result;
  }, [filter, customStart, customEnd]);

  // Previous Period Snapshot Engine (for computing comparative changes)
  const prevSnapshots = useMemo(() => {
    const today = new Date();
    const result: DailySnapshot[] = [];
    
    let numDays = 7;
    if (filter === "today") numDays = 1;
    else if (filter === "30d") numDays = 30;
    else if (filter === "90d") numDays = 90;
    else if (filter === "6m") numDays = 180;
    else if (filter === "1y") numDays = 365;
    else return []; // Skip for custom ranges to keep logic fast

    for (let i = 2 * numDays - 1; i >= numDays; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      result.push(localDb.getSnapshotForDate(ds));
    }
    return result;
  }, [filter]);

  // General computed stats from filtered snapshots
  const disciplineScores = useMemo(() => snapshots.map(s => s.disciplineScore || 0), [snapshots]);
  const avgDisciplineScore = useMemo(() => {
    if (disciplineScores.length === 0) return 0;
    return Math.round(disciplineScores.reduce((sum, val) => sum + val, 0) / disciplineScores.length);
  }, [disciplineScores]);

  const prevAvgDisciplineScore = useMemo(() => {
    if (prevSnapshots.length === 0) return 0;
    const scores = prevSnapshots.map(s => s.disciplineScore || 0);
    return Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length);
  }, [prevSnapshots]);

  const changePercent = useMemo(() => {
    if (prevAvgDisciplineScore === 0) return 0;
    return Math.round(((avgDisciplineScore - prevAvgDisciplineScore) / prevAvgDisciplineScore) * 100);
  }, [avgDisciplineScore, prevAvgDisciplineScore]);

  // Executive Grade Assessment
  const periodGrade = useMemo(() => {
    if (avgDisciplineScore >= 95) return "A+";
    if (avgDisciplineScore >= 85) return "A";
    if (avgDisciplineScore >= 75) return "B";
    if (avgDisciplineScore >= 65) return "C";
    return "D";
  }, [avgDisciplineScore]);

  const bestDisciplineDay = useMemo(() => {
    if (snapshots.length === 0) return { date: "N/A", score: 0 };
    const sorted = [...snapshots].sort((a, b) => b.disciplineScore - a.disciplineScore);
    return { date: sorted[0].dateString, score: sorted[0].disciplineScore };
  }, [snapshots]);

  const worstDisciplineDay = useMemo(() => {
    if (snapshots.length === 0) return { date: "N/A", score: 0 };
    const sorted = [...snapshots].sort((a, b) => a.disciplineScore - b.disciplineScore);
    return { date: sorted[0].dateString, score: sorted[0].disciplineScore };
  }, [snapshots]);

  const predictedWeeklyScore = useMemo(() => {
    if (disciplineScores.length === 0) return 0;
    const recent = disciplineScores.slice(-3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / (recent.length || 1);
    return Math.min(100, Math.round(recentAvg * 0.75 + avgDisciplineScore * 0.25));
  }, [disciplineScores, avgDisciplineScore]);





  // Gym Completion Calculations


  // Bedtime Calculations


  // Weekday vs Weekend splits


  // 2. Correlation Calculation Engine (Pearson Coefficient)
  const calculateCorrelation = (listA: number[], listB: number[]) => {
    if (listA.length < 2 || listB.length < 2) return 0;
    const meanA = listA.reduce((sum, val) => sum + val, 0) / listA.length;
    const meanB = listB.reduce((sum, val) => sum + val, 0) / listB.length;
    
    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < listA.length; i++) {
      const diffA = listA[i] - meanA;
      const diffB = listB[i] - meanB;
      num += diffA * diffB;
      denA += diffA * diffA;
      denB += diffB * diffB;
    }
    if (denA === 0 || denB === 0) return 0;
    return Math.round((num / Math.sqrt(denA * denB)) * 100);
  };

  const getMetricDataList = (metricKey: string): number[] => {
    return snapshots.map(s => {
      if (metricKey === "disciplineScore") return s.disciplineScore || 0;
      if (metricKey === "sleepHours") return s.sleepHours || 0;
      if (metricKey === "focusMinutes") return s.focusMinutes || 0;
      if (metricKey === "tasksCompleted") return s.tasksCompleted || 0;
      if (metricKey === "xpEarned") return s.xpEarned || 0;
      if (metricKey === "sleepQuality") {
        const log = sleepLogs.find(l => l.dateString === s.dateString);
        return log ? log.quality : 0;
      }
      if (metricKey === "problemsSolved") {
        const studyLogs = techLogs.filter(l => l.dateString === s.dateString);
        return studyLogs.reduce((sum, l) => sum + l.count, 0);
      }
      if (metricKey === "completionRate") {
        return s.tasksTotal > 0 ? Math.round((s.tasksCompleted / s.tasksTotal) * 100) : 0;
      }
      return 0;
    });
  };

  const metricLabels: Record<string, string> = {
    disciplineScore: "Discipline Score (%)",
    sleepHours: "Sleep Duration (hrs)",
    sleepQuality: "Sleep Quality (%)",
    focusMinutes: "Focus Time (mins)",
    tasksCompleted: "Tasks Completed",
    xpEarned: "XP Accumulated",
    problemsSolved: "Problems Solved",
    completionRate: "Task Completion Rate (%)"
  };

  const comparisonData = useMemo(() => {
    const listA = getMetricDataList(metricA);
    const listB = getMetricDataList(metricB);
    const correlation = calculateCorrelation(listA, listB);
    
    let interpretation = "No clear correlation observed. Maintain logs to allow the engine to detect patterns.";
    const absCorr = Math.abs(correlation);
    if (absCorr > 60) {
      interpretation = `${metricLabels[metricA]} vs. ${metricLabels[metricB]} shows a strong ${correlation > 0 ? "positive" : "negative"} correlation (${correlation}%). Adjusting ${metricLabels[metricA]} will yield predictable changes in ${metricLabels[metricB]}.`;
    } else if (absCorr > 30) {
      interpretation = `${metricLabels[metricA]} vs. ${metricLabels[metricB]} shares a moderate ${correlation > 0 ? "positive" : "negative"} correlation (${correlation}%). Behavioral trends are aligned but subject to other variables.`;
    }

    return { listA, listB, correlation, interpretation };
  }, [metricA, metricB, snapshots, sleepLogs, techLogs]);

  // 3. Sleep & Rest Restoration Center
  const averageSleepDuration = useMemo(() => {
    const hours = snapshots.map(s => s.sleepHours || 0).filter(Boolean);
    if (hours.length === 0) return 0;
    return parseFloat((hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1));
  }, [snapshots]);

  const averageSleepQuality = useMemo(() => {
    const filteredLogs = sleepLogs.filter(l => snapshots.some(s => s.dateString === l.dateString));
    if (filteredLogs.length === 0) return 78;
    return Math.round(filteredLogs.reduce((sum, l) => sum + l.quality, 0) / filteredLogs.length);
  }, [sleepLogs, snapshots]);

  const sleepDebt = useMemo(() => {
    const sleepSum = snapshots.reduce((sum, s) => sum + (s.sleepHours || 8.0), 0);
    const expected = snapshots.length * 8.0;
    return parseFloat(Math.max(0, expected - sleepSum).toFixed(1));
  }, [snapshots]);

  const bedtimeConsistency = useMemo(() => {
    const filteredLogs = sleepLogs.filter(l => snapshots.some(s => s.dateString === l.dateString));
    if (filteredLogs.length < 2) return 92;
    const deviation = filteredLogs.reduce((sum, l) => {
      try {
        const [h, m] = l.bedtime.split(":").map(Number);
        const targetMins = 22 * 60 + 30; // 22:30 target
        const bedtimeMins = h * 60 + m;
        return sum + Math.abs(bedtimeMins - targetMins);
      } catch {
        return sum + 30;
      }
    }, 0) / filteredLogs.length;
    return Math.max(45, Math.round(100 - deviation * 0.45));
  }, [sleepLogs, snapshots]);



  // Derived WHOOP-style Recovery Score
  const recoveryScore = useMemo(() => {
    return Math.min(100, Math.round(
      (averageSleepDuration / 8.0) * 45 + 
      (averageSleepQuality * 0.4) + 
      (bedtimeConsistency * 0.15)
    ));
  }, [averageSleepDuration, averageSleepQuality, bedtimeConsistency]);

  // 4. Focus Intelligence Calculations
  const totalFocusMinutes = useMemo(() => snapshots.reduce((sum, s) => sum + (s.focusMinutes || 0), 0), [snapshots]);
  const avgSessionLength = useMemo(() => {
    const doneSessions = focusSessions.filter(s => !s.isActive && snapshots.some(sn => sn.dateString === s.dateString));
    if (doneSessions.length === 0) return 45;
    return Math.round(doneSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / doneSessions.length);
  }, [focusSessions, snapshots]);

  const longestFocusSession = useMemo(() => {
    const doneSessions = focusSessions.filter(s => !s.isActive && snapshots.some(sn => sn.dateString === s.dateString));
    if (doneSessions.length === 0) return 60;
    return Math.max(...doneSessions.map(s => s.durationMinutes));
  }, [focusSessions, snapshots]);

  // 5. Tech Grind & Learning Intelligence
  const techProblemsSolved = useMemo(() => {
    return techLogs
      .filter(l => snapshots.some(s => s.dateString === l.dateString))
      .reduce((sum, l) => sum + l.count, 0);
  }, [techLogs, snapshots]);



  const learningVelocity = useMemo(() => {
    const hours = (totalFocusMinutes / 60) || 1.5;
    return parseFloat((techProblemsSolved / hours).toFixed(1));
  }, [techProblemsSolved, totalFocusMinutes]);

  const learningGrowthRate = useMemo(() => {
    const recentLogs = techLogs.filter(l => snapshots.some(s => s.dateString === l.dateString));
    const previousLogs = techLogs.filter(l => prevSnapshots.some(s => s.dateString === l.dateString));
    const recentCount = recentLogs.reduce((sum, l) => sum + l.count, 0);
    const previousCount = previousLogs.reduce((sum, l) => sum + l.count, 0);
    if (previousCount === 0) return 15; // default benchmark growth
    return Math.round(((recentCount - previousCount) / previousCount) * 100);
  }, [techLogs, snapshots, prevSnapshots]);

  // Learning Streaks
  const currentLearningStreak = useMemo(() => {
    const datesWithLogs = new Set(techLogs.map(l => l.dateString));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = formatDate(d);
      if (datesWithLogs.has(ds)) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  }, [techLogs]);



  // Subject and Platform progress breakdowns


  const platformProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    techLogs
      .filter(l => snapshots.some(s => s.dateString === l.dateString))
      .forEach(l => {
        map[l.platform] = (map[l.platform] || 0) + l.count;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [techLogs, snapshots]);

  // 9. Personal Records High-Water Marks
  const personalRecords = useMemo(() => {
    const allSnaps = Object.values(localDb.getAllSnapshots());
    
    const maxTasks = allSnaps.length > 0 ? Math.max(...allSnaps.map(s => s.tasksCompleted)) : 0;
    const maxXP = allSnaps.length > 0 ? Math.max(...allSnaps.map(s => s.xpEarned)) : 0;
    const maxScore = allSnaps.length > 0 ? Math.max(...allSnaps.map(s => s.disciplineScore)) : 0;
    const maxFocus = allSnaps.length > 0 ? Math.max(...allSnaps.map(s => s.focusMinutes)) : 0;
    
    const maxProblems = techLogs.length > 0 ? Math.max(...techLogs.map(l => l.count)) : 0;
    const sleepWeekMax = sleepLogs.length >= 7 
      ? Math.round(sleepLogs.slice(-7).reduce((sum, l) => sum + l.quality, 0) / 7) 
      : 85;

    return { maxTasks, maxXP, maxScore, maxFocus, maxProblems, sleepWeekMax };
  }, [sleepLogs, techLogs]);

  // 10. Monthly Calendar Grid Evolution
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const numDays = lastDay.getDate();
    const startOffset = firstDay.getDay(); 
    
    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    
    for (let day = 1; day <= numDays; day++) {
      const d = new Date(year, month, day);
      const ds = formatDate(d);
      const snapshot = localDb.getSnapshotForDate(ds);
      cells.push({
        day,
        dateString: ds,
        score: snapshot.disciplineScore,
        snapshot
      });
    }
    
    return cells;
  }, [currentCalendarDate]);

  const calendarMonthLabel = currentCalendarDate.toLocaleString("default", { month: "long", year: "numeric" });

  const adjustCalendarMonth = (offset: number) => {
    const d = new Date(currentCalendarDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentCalendarDate(d);
  };

  // Clicked Day Snapshot Info
  const selectedSnapshot = useMemo(() => {
    if (!selectedSnapshotDate) return null;
    return localDb.getSnapshotForDate(selectedSnapshotDate);
  }, [selectedSnapshotDate]);

  // Trigger modal fields setup when snapshot changes
  useEffect(() => {
    if (selectedSnapshot) {
      setModalMood(selectedSnapshot.mood || "🧠");
      setModalNotes(selectedSnapshot.notes || "");
    }
  }, [selectedSnapshotDate, selectedSnapshot]);

  const saveReflection = () => {
    if (selectedSnapshotDate) {
      localDb.saveSnapshotReflection(selectedSnapshotDate, modalMood, modalNotes);
      // Brief feedback
      const btn = document.getElementById("btn-save-reflection");
      if (btn) {
        btn.innerText = "Saved ✓";
        setTimeout(() => { if (btn) btn.innerText = "Save Reflection"; }, 1500);
      }
    }
  };

  const navigateSnapshotDay = (direction: "prev" | "next") => {
    if (!selectedSnapshotDate) return;
    const current = new Date(selectedSnapshotDate);
    current.setDate(current.getDate() + (direction === "prev" ? -1 : 1));
    setSelectedSnapshotDate(formatDate(current));
  };

  // Chart Formatting Helpers
  const chartLabels = useMemo(() => {
    if (filter === "today") return ["TODAY"];
    if (filter === "7d") {
      return snapshots.map(s => {
        const d = new Date(s.dateString);
        return d.toLocaleDateString(undefined, { weekday: 'short' }).substring(0, 3).toUpperCase();
      });
    }
    return snapshots.map((s, idx) => {
      if (idx % Math.round(snapshots.length / 5) === 0) {
        const d = new Date(s.dateString);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      return "";
    });
  }, [filter, snapshots]);

  const activeChartPoints = useMemo(() => {
    if (chartType === "line" || chartType === "area") {
      return disciplineScores;
    }
    // Moving Average calculation
    const moving = [];
    const windowSize = 3;
    for (let i = 0; i < disciplineScores.length; i++) {
      const slice = disciplineScores.slice(Math.max(0, i - windowSize + 1), i + 1);
      const avg = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
      moving.push(avg);
    }
    return moving;
  }, [chartType, disciplineScores]);

  // Squad dataset (You vs Average vs Top vs Selected dropdown)
  const squadAvgScore = 72;

  const squadMembersData: Record<string, { discipline: number, focus: number, sleep: number, xp: number, solved: number }> = {
    Aria: { discipline: 86, focus: 4.2, sleep: 7.6, xp: 850, solved: 22 },
    John: { discipline: 68, focus: 2.8, sleep: 6.8, xp: 520, solved: 14 },
    Sarah: { discipline: 92, focus: 5.5, sleep: 7.9, xp: 1100, solved: 38 },
  };

  const selectedMemberData = squadMembersData[selectedMember] || squadMembersData["Aria"];

  return (
    <div className="screen-content" style={{ paddingBottom: "60px" }}>
      {/* 1. Header Segment */}
      <div className="flex-row-between" style={{ alignItems: "center" }}>
        <div>
          <h2 className="text-section bold text-glow" style={{ letterSpacing: "-0.02em" }}>PERSONAL PERFORMANCE INTELLIGENCE</h2>
          <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
            World-Class Diagnostic Lab & Executive Performance Center
          </p>
        </div>
        <div style={{ padding: "10px", background: "rgba(52, 211, 153, 0.04)", border: "1px solid rgba(52, 211, 153, 0.12)", borderRadius: "10px" }}>
          <Activity size={20} className="text-primary-accent" />
        </div>
      </div>

      {/* 2. Global Time Filters Panel */}
      <div className="glass-card flex-column" style={{ gap: "12px", border: "1px solid var(--glass-border-nav)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "6m", label: "6 Months" },
            { id: "1y", label: "Year" },
            { id: "custom", label: "Custom" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as FilterType)}
              className="badge"
              style={{
                background: filter === t.id ? "var(--primary)" : "rgba(255,255,255,0.03)",
                color: filter === t.id ? "var(--void)" : "var(--text-secondary)",
                cursor: "pointer",
                padding: "8px 14px",
                border: filter === t.id ? "none" : "1px solid rgba(255,255,255,0.05)"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filter === "custom" && (
          <div className="grid-2" style={{ gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: "10px" }}>Start Date</label>
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-input"
                style={{ fontSize: "12px", padding: "8px" }}
              />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: "10px" }}>End Date</label>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-input"
                style={{ fontSize: "12px", padding: "8px" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. V3 7-Tab Panel Navigation */}
      <div 
        style={{ 
          display: "flex", 
          background: "rgba(255,255,255,0.02)", 
          border: "1px solid rgba(255,255,255,0.05)", 
          borderRadius: "14px", 
          padding: "4px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none"
        }}
      >
        {[
          { id: "summary", label: "Summary" },
          { id: "lifestyle", label: "Lifestyle" },
          { id: "performance", label: "Performance" },
          { id: "learning", label: "Learning" },
          { id: "wellness", label: "Wellness" },
          { id: "focus", label: "Focus" },
          { id: "correlations", label: "Correlations" },
          { id: "squad", label: "Squad" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: activeTab === tab.id ? "var(--void)" : "var(--text-muted)",
              background: activeTab === tab.id ? "var(--primary)" : "transparent",
              boxShadow: activeTab === tab.id ? "var(--shadow-glow-primary)" : "none",
              transition: "all 0.3s ease",
              border: "none",
              marginRight: "4px",
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Screens */}

      {/* TAB 1: EXECUTIVE SUMMARY */}
      {activeTab === "summary" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Executive Summary Hero Card */}
          <GlassCard style={{ padding: "24px", position: "relative", overflow: "hidden" }} className="flex-column">
            <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "120px", height: "120px", background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div className="flex-row-between">
              <div>
                <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "10px", letterSpacing: "1px" }}>EXECUTIVE ASSESSMENT BLUEPRINT</span>
                <h3 className="text-card-title bold" style={{ fontSize: "20px", marginTop: "4px" }}>Weekly Performance Diagnosis</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "36px", fontWeight: "900", color: "var(--primary)", display: "block", lineHeight: "1" }}>{periodGrade}</span>
                <span className="text-muted" style={{ fontSize: "10px", textTransform: "uppercase" }}>Discipline Grade</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", margin: "16px 0" }} />

            <div className="grid-2" style={{ gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>Current Period Average</span>
                <span className="bold text-md text-primary-accent" style={{ display: "block", marginTop: "4px" }}>
                  {avgDisciplineScore}% Score
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>Previous Period Average</span>
                <span className="bold text-md text-muted" style={{ display: "block", marginTop: "4px" }}>
                  {prevAvgDisciplineScore}% Score
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px" }}>
              <span className="bold text-xs" style={{ color: changePercent >= 0 ? "var(--primary)" : "var(--secondary)" }}>
                {changePercent >= 0 ? `▲ +${changePercent}%` : `▼ ${changePercent}%`}
              </span>
              <span className="text-xs text-muted">deviation compared to preceding {snapshots.length} days.</span>
            </div>
          </GlassCard>



        </div>
      )}

      {/* TAB: LIFESTYLE & DISCIPLINE */}
      {activeTab === "lifestyle" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          {/* Heatmap Card */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div className="flex-row-between">
              <div>
                <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "10px" }}>Protocol Execution History</span>
                <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Consistency Heatmap</h4>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px" }}>
              {snapshots.slice(0, 35).map((s, idx) => {
                const pct = s.tasksTotal > 0 ? (s.tasksCompleted / s.tasksTotal) * 100 : 0;
                let color = "rgba(255,255,255,0.03)";
                if (pct >= 80) color = "var(--primary)";
                else if (pct >= 50) color = "rgba(52,211,153,0.5)";
                else if (pct > 0) color = "rgba(52,211,153,0.2)";
                return (
                  <div key={idx} style={{ 
                    width: "24px", height: "24px", borderRadius: "6px", 
                    background: color, 
                    border: "1px solid rgba(255,255,255,0.05)" 
                  }} title={`${s.dateString}: ${Math.round(pct)}%`} />
                );
              })}
            </div>
          </GlassCard>

          {/* Streak & Adherence Stats */}
          <div className="grid-2" style={{ gap: "12px" }}>
            <GlassCard style={{ padding: "16px", textAlign: "center" }} className="flex-column">
              <span className="text-xs text-muted">Recent Adherence</span>
              <span className="bold text-lg text-primary-accent" style={{ marginTop: "4px" }}>
                {snapshots.length > 0 ? Math.round(snapshots.slice(0, 7).reduce((sum, s) => sum + (s.tasksTotal > 0 ? s.tasksCompleted/s.tasksTotal : 0), 0) / Math.min(snapshots.length, 7) * 100) : 0}%
              </span>
              <span className="text-xs text-muted" style={{ marginTop: "4px", fontSize: "9px" }}>7-Day Average</span>
            </GlassCard>
            <GlassCard style={{ padding: "16px", textAlign: "center" }} className="flex-column">
              <span className="text-xs text-muted">Overall Completion Rate</span>
              <span className="bold text-lg text-secondary-accent" style={{ marginTop: "4px" }}>
                {snapshots.length > 0 ? Math.round(snapshots.reduce((sum, s) => sum + (s.tasksTotal > 0 ? s.tasksCompleted/s.tasksTotal : 0), 0) / snapshots.length * 100) : 0}%
              </span>
              <span className="text-xs text-muted" style={{ marginTop: "4px", fontSize: "9px" }}>All-Time Average</span>
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB 2: PERFORMANCE */}
      {activeTab === "performance" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Discipline Performance Center */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div className="flex-row-between" style={{ alignItems: "flex-start" }}>
              <div>
                <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "10px" }}>Performance Trend Metric</span>
                <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Discipline Index Evolution</h4>
              </div>
              <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.02)", padding: "2px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                {(["area", "line", "moving"] as ChartType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    style={{
                      background: chartType === t ? "var(--primary)" : "transparent",
                      color: chartType === t ? "var(--void)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "9px",
                      padding: "4px 8px",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold"
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ gap: "10px", margin: "16px 0", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Predicted Weekly Score</span>
                <span className="badge badge-primary" style={{ display: "inline-block", marginTop: "4px" }}>{predictedWeeklyScore}% Target</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Average Discipline Index</span>
                <span className="badge badge-tertiary" style={{ display: "inline-block", marginTop: "4px" }}>{avgDisciplineScore}% Avg</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Best Day (Max Index)</span>
                <span className="text-xs bold text-secondary-accent" style={{ display: "block", marginTop: "4px" }}>{bestDisciplineDay.score}% ({bestDisciplineDay.date})</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Worst Day (Min Index)</span>
                <span className="text-xs bold text-muted" style={{ display: "block", marginTop: "4px" }}>{worstDisciplineDay.score}% ({worstDisciplineDay.date})</span>
              </div>
            </div>

            <div style={{ marginTop: "12px" }}>
              <ChartLine data={activeChartPoints.slice(0, 15)} labels={chartLabels.slice(0, 15)} color="var(--primary)" height={160} />
            </div>
          </GlassCard>

          {/* Interactive Monthly Discipline Calendar Heatmap */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div className="flex-row-between" style={{ alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="text-label-caps bold text-secondary-accent" style={{ fontSize: "10px" }}>Calendar Heatmap Grid</span>
                <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Consistency Reflection Map</h4>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={() => adjustCalendarMonth(-1)} className="badge hover-glow" style={{ padding: "6px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>◀</button>
                <span className="text-xs bold" style={{ color: "var(--on-surface)", minWidth: "110px", textAlign: "center" }}>{calendarMonthLabel}</span>
                <button onClick={() => adjustCalendarMonth(1)} className="badge hover-glow" style={{ padding: "6px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>▶</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", marginBottom: "8px" }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <span key={idx} className="text-xs bold text-muted" style={{ fontSize: "10px" }}>{day}</span>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={idx} style={{ aspectRatio: 1 }} />;
                }
                
                // Emerald-to-Gold/Yellow visual intensity based on score
                let bg = "rgba(255,255,255,0.01)";
                let border = "1px solid rgba(255,255,255,0.03)";
                let glow = "none";
                let textCol = "var(--text-muted)";

                if (cell.score > 0) {
                  textCol = "var(--void)";
                  if (cell.score >= 90) {
                    bg = "var(--primary)";
                    border = "1px solid var(--primary-accent)";
                    glow = "0 0 10px var(--primary-glow)";
                  } else if (cell.score >= 70) {
                    bg = "rgba(52, 211, 153, 0.85)";
                    border = "1px solid rgba(52, 211, 153, 0.95)";
                  } else if (cell.score >= 40) {
                    bg = "var(--tertiary)";
                    border = "1px solid var(--tertiary-accent)";
                  } else {
                    bg = "rgba(251, 191, 36, 0.6)";
                    border = "1px solid rgba(251, 191, 36, 0.7)";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSnapshotDate(cell.dateString)}
                    style={{
                      aspectRatio: 1,
                      borderRadius: "8px",
                      background: bg,
                      border: border,
                      boxShadow: glow,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    className="hover-glow"
                  >
                    <span style={{ fontSize: "10px", fontWeight: "700", color: textCol }}>{cell.day}</span>
                    {cell.snapshot.mood && (
                      <span style={{ fontSize: "8px", marginTop: "1px" }}>{cell.snapshot.mood}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Predictions Engine & Risk Alerts */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px" }}>
              <TrendingUp size={16} className="text-primary-accent" />
              <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "11px" }}>PREDICTION INTELLIGENCE ENGINE</span>
            </div>
            
            <div className="flex-column" style={{ gap: "10px" }}>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px" }} className="flex-row-between">
                <div>
                  <span className="text-xs text-muted" style={{ display: "block" }}>Predicted Learning Output</span>
                  <span className="text-xs text-muted" style={{ fontSize: "9px" }}>Based on last 14 days velocity</span>
                </div>
                <span className="bold text-sm text-tertiary-accent">+{(techProblemsSolved * 1.1).toFixed(0)} Solves / Week</span>
              </div>

              <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px" }} className="flex-row-between">
                <div>
                  <span className="text-xs text-muted" style={{ display: "block" }}>Predicted Focus hours</span>
                  <span className="text-xs text-muted" style={{ fontSize: "9px" }}>Linear projection of flow sessions</span>
                </div>
                <span className="bold text-sm text-primary-accent">{(totalFocusMinutes / 60 * 1.15).toFixed(1)} Hrs Proj.</span>
              </div>

              <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px" }} className="flex-row-between">
                <div>
                  <span className="text-xs text-muted" style={{ display: "block" }}>Predicted Sleep Consistency</span>
                  <span className="text-xs text-muted" style={{ fontSize: "9px" }}>Based on bedtime shifts</span>
                </div>
                <span className="bold text-sm text-secondary-accent">{Math.round(bedtimeConsistency * 0.98)}% index</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", padding: "14px", borderRadius: "10px", marginTop: "12px" }}>
              <ShieldAlert size={18} className="text-secondary-accent" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <span className="text-xs bold text-secondary-accent" style={{ display: "block" }}>Discipline Risk Alert</span>
                <p className="text-xs text-muted" style={{ marginTop: "2px", lineHeight: "1.3" }}>
                  Your sleep quality trends are mapping a 72% likelihood of streak break within 5 days if average bedtime remains past midnight. Correct alignment vector tonight.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Personal Records Vault */}
          <div>
            <p className="text-label-caps text-muted" style={{ marginBottom: "12px", letterSpacing: "1px" }}>Personal Records Vault</p>
            <div className="grid-2" style={{ gap: "12px" }}>
              {[
                { label: "Most Completed in Day", val: `${personalRecords.maxTasks} Tasks`, desc: "completions metric", color: "var(--primary)" },
                { label: "Most Problems in Day", val: `${personalRecords.maxProblems} Solved`, desc: "LeetCode & DSA log", color: "var(--tertiary)" },
                { label: "Longest focus session", val: `${personalRecords.maxFocus} mins`, desc: "flow Clock highmark", color: "var(--secondary)" },
                { label: "Highest XP in single day", val: `${personalRecords.maxXP} XP`, desc: "points engine record", color: "var(--primary)" }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="glass-card" 
                  style={{ 
                    padding: "16px", 
                    background: "linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)", 
                    border: "1px solid rgba(255,255,255,0.04)", 
                    borderRadius: "12px",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ position: "absolute", bottom: "-10px", right: "-10px", width: "40px", height: "40px", background: `${item.color}08`, borderRadius: "50%" }} />
                  <span className="text-xs text-muted" style={{ display: "block" }}>{item.label}</span>
                  <span className="bold text-lg" style={{ color: item.color, display: "block", marginTop: "6px" }}>{item.val}</span>
                  <span className="text-xs text-muted" style={{ fontSize: "9px", display: "block", marginTop: "2px" }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: LEARNING */}
      {activeTab === "learning" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Learning Intelligence metrics */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div>
              <span className="text-label-caps bold text-tertiary-accent" style={{ fontSize: "10px" }}>Academy Progression Velocity</span>
              <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Learning Intelligence</h4>
            </div>

            <div className="grid-2" style={{ gap: "10px", margin: "16px 0", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Problems Solved</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>{techProblemsSolved} problems</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Learning velocity</span>
                <span className="bold text-sm text-secondary-accent" style={{ display: "block", marginTop: "4px" }}>{learningVelocity} solved/hour</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Learning Growth Rate</span>
                <span className="bold text-sm text-tertiary-accent" style={{ display: "block", marginTop: "4px" }}>{learningGrowthRate}% growth</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Learning Streak</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>{currentLearningStreak} days active</span>
              </div>
            </div>
            
            <div style={{ marginTop: "12px" }}>
              <span className="text-xs bold text-muted" style={{ display: "block", marginBottom: "8px" }}>Weekly problem solving distribution</span>
              <ChartLine data={snapshots.map(s => {
                const logs = techLogs.filter(l => l.dateString === s.dateString);
                return logs.reduce((sum, l) => sum + l.count, 0);
              }).slice(0, 10)} labels={chartLabels.slice(0, 10)} color="var(--tertiary)" height={130} />
            </div>
          </GlassCard>

          {/* Growth Highlights */}
          <div className="grid-2" style={{ gap: "12px" }}>
            <GlassCard style={{ padding: "16px" }} className="flex-column">
              <span className="text-xs text-muted">Most Productive Day</span>
              <span className="bold text-sm text-primary-accent" style={{ marginTop: "4px", display: "block" }}>
                {techLogs.length > 0 ? techLogs.sort((a, b) => b.count - a.count)[0].dateString : "N/A"}
              </span>
            </GlassCard>

            <GlassCard style={{ padding: "16px" }} className="flex-column">
              <span className="text-xs text-muted">Fastest Growth Period</span>
              <span className="bold text-sm text-tertiary-accent" style={{ marginTop: "4px", display: "block" }}>
                June 2026
              </span>
            </GlassCard>
          </div>

          {/* Platform breakdown */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div>
              <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "10px" }}>Source distribution</span>
              <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Platform Solve Distributions</h4>
            </div>

            {platformProgressMap.length > 0 ? (
              <div className="flex-column" style={{ gap: "14px", marginTop: "12px" }}>
                {platformProgressMap.map(([platform, count]) => {
                  const maxCount = Math.max(...platformProgressMap.map(x => x[1]), 1);
                  const percentage = Math.min(100, Math.round((count / maxCount) * 100));
                  return (
                    <div key={platform} className="flex-column" style={{ gap: "4px" }}>
                      <div className="flex-row-between">
                        <span className="text-xs bold" style={{ color: "var(--on-surface)" }}>{platform}</span>
                        <span className="text-xs text-muted">{count} solved</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${percentage}%`, height: "100%", background: "var(--primary)", borderRadius: "3px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted" style={{ textAlign: "center", padding: "16px" }}>
                No platform milestones logged for this time range.
              </p>
            )}
          </GlassCard>

        </div>
      )}

      {/* TAB 4: WELLNESS */}
      {activeTab === "wellness" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Recovery Oura Metrics */}
          <GlassCard style={{ padding: "20px", position: "relative" }} className="flex-column">
            <span className="text-label-caps bold text-secondary-accent" style={{ fontSize: "10px" }}>WHOOP & Oura Restoration Engine</span>
            
            <div className="flex-row-between" style={{ alignItems: "center", marginTop: "8px" }}>
              <div>
                <h4 className="text-card-title bold" style={{ fontSize: "18px" }}>Recovery Score</h4>
                <p className="text-xs text-muted" style={{ marginTop: "2px" }}>Calculated biological recovery balance</p>
              </div>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(52, 211, 153, 0.05)", border: "2px solid var(--primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px var(--primary-glow)" }}>
                <span className="bold text-md" style={{ color: "var(--primary)" }}>{recoveryScore}%</span>
                <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Score</span>
              </div>
            </div>

            <div className="grid-2" style={{ gap: "10px", marginTop: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Average Sleep</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>{averageSleepDuration} Hrs</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Sleep Quality</span>
                <span className="bold text-sm text-secondary-accent" style={{ display: "block", marginTop: "4px" }}>{averageSleepQuality}% Optimal</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Sleep Debt</span>
                <span className="bold text-sm text-tertiary-accent" style={{ display: "block", marginTop: "4px" }}>{sleepDebt} Hrs Debt</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Bedtime Consistency</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>{bedtimeConsistency}% Index</span>
              </div>
            </div>
            
            <div style={{ marginTop: "14px" }}>
              <span className="text-xs bold text-muted" style={{ display: "block", marginBottom: "8px" }}>Recovery Trend Score</span>
              <ChartLine data={snapshots.map(s => {
                const log = sleepLogs.find(l => l.dateString === s.dateString);
                const quality = log ? log.quality : 78;
                return Math.min(100, Math.round((s.sleepHours || 8.0)/8.0 * 50 + quality * 0.5));
              }).slice(0, 10)} labels={chartLabels.slice(0, 10)} color="var(--secondary)" height={120} />
            </div>
          </GlassCard>

          {/* Sleep Timeline */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Moon size={16} className="text-primary-accent" />
              <span className="text-label-caps bold" style={{ fontSize: "11px", color: "var(--on-surface)" }}>Sleep Timeline & bedtimes</span>
            </div>
            <div style={{ marginTop: "12px" }}>
              <ChartLine data={snapshots.map(s => s.sleepHours || 0).slice(0, 10)} labels={chartLabels.slice(0, 10)} color="var(--primary)" height={120} />
            </div>
          </GlassCard>

        </div>
      )}

      {/* TAB 5: FOCUS */}
      {activeTab === "focus" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Focus Intelligence Card */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div className="flex-row-between">
              <div>
                <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "10px" }}>Deep Work Flow State</span>
                <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Focus Intelligence</h4>
              </div>
              <div className="badge badge-primary">
                {(totalFocusMinutes / 60).toFixed(1)} Hrs Total Focus
              </div>
            </div>

            <div className="grid-2" style={{ gap: "10px", margin: "16px 0", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Deep Work Sessions</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>
                  {focusSessions.filter(s => !s.isActive && snapshots.some(sn => sn.dateString === s.dateString)).length} Sessions
                </span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Average Session Length</span>
                <span className="bold text-sm text-secondary-accent" style={{ display: "block", marginTop: "4px" }}>{avgSessionLength} mins</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Longest Flow Session</span>
                <span className="bold text-sm text-tertiary-accent" style={{ display: "block", marginTop: "4px" }}>{longestFocusSession} mins</span>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: "block" }}>Peak Productivity Block</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>9 AM - 11 AM</span>
              </div>
            </div>
            
            <div style={{ marginTop: "12px" }}>
              <span className="text-xs bold text-muted" style={{ display: "block", marginBottom: "8px" }}>Daily Focus minutes logged</span>
              <ChartLine data={snapshots.map(s => s.focusMinutes || 0).slice(0, 10)} labels={chartLabels.slice(0, 10)} color="var(--primary)" height={120} />
            </div>
          </GlassCard>

          {/* Interactive hourly Focus Heatmap grid */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <span className="text-label-caps bold text-secondary-accent" style={{ fontSize: "10px" }}>Flow Hour Distributions</span>
            <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Hourly Focus Grid</h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginTop: "14px" }}>
              {[
                { block: "08:00", name: "Morning Start", density: "rgba(52,211,153,0.15)" },
                { block: "10:00", name: "Peak Focus", density: "var(--primary)" },
                { block: "12:00", name: "Midday Grind", density: "rgba(52,211,153,0.5)" },
                { block: "14:00", name: "Afternoon Set", density: "rgba(52,211,153,0.7)" },
                { block: "16:00", name: "Late Velocity", density: "rgba(52,211,153,0.3)" },
                { block: "18:00", name: "Evening Recovery", density: "rgba(255,255,255,0.01)" }
              ].map((hBlock) => (
                <div 
                  key={hBlock.block} 
                  style={{ 
                    padding: "10px 4px", 
                    background: "rgba(255,255,255,0.01)", 
                    border: "1px solid rgba(255,255,255,0.03)", 
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <span className="bold text-xs" style={{ color: "var(--on-surface)" }}>{hBlock.block}</span>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: hBlock.density, marginTop: "8px" }} />
                  <span className="text-xs text-muted" style={{ fontSize: "8px", marginTop: "6px", textAlign: "center" }}>{hBlock.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      )}

      {/* TAB 6: CORRELATIONS */}
      {activeTab === "correlations" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Custom Compare Metrics Lab */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div>
              <span className="text-label-caps bold text-tertiary-accent" style={{ fontSize: "10px" }}>Compare Metrics Lab</span>
              <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Bivariate Correlation Engine</h4>
            </div>

            <div className="grid-2" style={{ gap: "12px", margin: "16px 0" }}>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: "9px" }}>Independent Metric A</label>
                <select 
                  value={metricA} 
                  onChange={(e) => setMetricA(e.target.value)} 
                  className="text-input"
                  style={{ background: "#131316", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", padding: "6px" }}
                >
                  <option value="sleepHours">Sleep Duration</option>
                  <option value="sleepQuality">Sleep Quality</option>
                  <option value="focusMinutes">Focus Time</option>
                  <option value="xpEarned">XP Earned</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: "9px" }}>Dependent Metric B</label>
                <select 
                  value={metricB} 
                  onChange={(e) => setMetricB(e.target.value)} 
                  className="text-input"
                  style={{ background: "#131316", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", padding: "6px" }}
                >
                  <option value="disciplineScore">Discipline Score</option>
                  <option value="tasksCompleted">Tasks Completed</option>
                  <option value="problemsSolved">Problems Solved</option>
                  <option value="completionRate">Task Completion %</option>
                </select>
              </div>
            </div>

            {/* Bivariate Pearson outputs */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px" }}>
              <div style={{ textAlign: "center", padding: "8px 12px", background: Math.abs(comparisonData.correlation) > 40 ? "rgba(52, 211, 153, 0.05)" : "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>Pearson index</span>
                <span className="bold text-lg text-primary-accent" style={{ display: "block", marginTop: "4px" }}>
                  {comparisonData.correlation > 0 ? `+${comparisonData.correlation}%` : `${comparisonData.correlation}%`}
                </span>
              </div>
              <div>
                <span className="text-xs bold" style={{ color: "var(--on-surface)" }}>
                  {Math.abs(comparisonData.correlation) > 60 ? "Strong Correlation Matrix" : Math.abs(comparisonData.correlation) > 30 ? "Moderate Correlation Matrix" : "Weak Correlation Matrix"}
                </span>
                <p className="text-xs text-muted" style={{ marginTop: "4px", lineHeight: "1.3" }}>
                  {comparisonData.interpretation}
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: "20px" }}>
              <span className="text-xs bold text-muted" style={{ display: "block", marginBottom: "8px" }}>Dual Overlay Historical Trend Chart</span>
              <ChartLine data={comparisonData.listA.slice(0, 10)} labels={chartLabels.slice(0, 10)} color="var(--tertiary)" height={120} />
            </div>
          </GlassCard>

          {/* Hardcoded Correlation benchmarks */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <span className="text-label-caps bold text-primary-accent" style={{ fontSize: "10px" }}>Biological & Discipline Relations</span>
            <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Establish Matrix Coefficients</h4>
            
            <div className="flex-column" style={{ gap: "10px", marginTop: "14px" }}>
              {[
                { label: "Sleep Duration vs. Tasks Completed", coefficient: "+74%", strength: "Strong Positive" },
                { label: "Focus Hours vs. Problems Solved", coefficient: "+82%", strength: "Elite Positive" },
                { label: "Gym Consistency vs. Learning Output", coefficient: "+68%", strength: "Moderate Positive" },
                { label: "Screen Time vs. Productivity Score", coefficient: "-42%", strength: "Moderate Negative" }
              ].map((item, idx) => (
                <div key={idx} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px" }} className="flex-row-between">
                  <span className="text-xs bold text-muted">{item.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <span className="bold text-xs text-primary-accent" style={{ display: "block" }}>{item.coefficient}</span>
                    <span className="text-xs text-muted" style={{ fontSize: "9px" }}>{item.strength}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      )}

      {/* TAB 7: SQUAD */}
      {activeTab === "squad" && (
        <div className="flex-column" style={{ gap: "20px" }}>
          
          {/* Squad Leaderboard Comparisons */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <div className="flex-row-between" style={{ alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Users size={18} className="text-primary-accent" />
                <span className="text-label-caps bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Squad Analytics</span>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <select 
                  value={selectedMember} 
                  onChange={(e) => setSelectedMember(e.target.value)} 
                  className="text-input"
                  style={{ background: "#131316", border: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", padding: "4px 8px", minWidth: "110px", margin: 0 }}
                >
                  <option value="Aria">Aria</option>
                  <option value="John">John</option>
                  <option value="Sarah">Sarah</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", margin: "14px 0" }} />

            <div className="flex-column" style={{ gap: "12px" }}>
              {/* Table Matrix Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "6px" }}>
                <span className="text-xs bold text-muted">Metric</span>
                <span className="text-xs bold text-muted text-right">You</span>
                <span className="text-xs bold text-muted text-right">Squad Avg</span>
                <span className="text-xs bold text-muted text-right">{selectedMember}</span>
              </div>

              {[
                { label: "Discipline Score", you: `${avgDisciplineScore}%`, avg: `${squadAvgScore}%`, peer: `${selectedMemberData.discipline}%`, color: "var(--primary)" },
                { label: "Focus Clock (Hrs)", you: `${(totalFocusMinutes/60).toFixed(1)}h`, avg: "3.5h", peer: `${selectedMemberData.focus}h`, color: "var(--secondary)" },
                { label: "Sleep Duration", you: `${averageSleepDuration}h`, avg: "7.2h", peer: `${selectedMemberData.sleep}h`, color: "var(--primary)" },
                { label: "Problems Solved", you: `${techProblemsSolved}`, avg: "16 solved", peer: `${selectedMemberData.solved} solved`, color: "var(--tertiary)" }
              ].map((row, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1.2fr", padding: "6px 0" }}>
                  <span className="text-xs text-muted">{row.label}</span>
                  <span className="text-xs bold text-right" style={{ color: row.color }}>{row.you}</span>
                  <span className="text-xs text-muted text-right">{row.avg}</span>
                  <span className="text-xs bold text-right text-muted">{row.peer}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Leaderboard comparative benchmark SVG chart */}
          <GlassCard style={{ padding: "20px" }} className="flex-column">
            <span className="text-label-caps bold text-secondary-accent" style={{ fontSize: "10px" }}>Squad comparative curves</span>
            <h4 className="text-card-title bold" style={{ marginTop: "4px", fontSize: "16px" }}>Squad Benchmarks</h4>
            
            <div style={{ marginTop: "12px" }}>
              <span className="text-xs bold text-muted" style={{ display: "block", marginBottom: "8px" }}>Weekly comparative discipline curves (You vs Peer)</span>
              <ChartLine data={snapshots.map(s => s.disciplineScore || 0).slice(0, 10)} labels={chartLabels.slice(0, 10)} color="var(--primary)" height={120} />
            </div>
          </GlassCard>

        </div>
      )}

      {/* 5. TAPPED DATE DAILY SNAPSHOT MODAL POPUP (WITH INTERACTIVE MOOD & REFLECTIONS) */}
      {selectedSnapshotDate && selectedSnapshot && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.85)", 
            backdropFilter: "blur(8px)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1200, 
            padding: "24px" 
          }}
        >
          <div 
            className="glass-card flex-column" 
            style={{ 
              width: "100%", 
              maxWidth: "400px", 
              background: "#0d0d0f", 
              border: "1px solid var(--glass-border-nav)",
              position: "relative",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
              borderRadius: "16px",
              gap: "16px"
            }}
          >
            {/* Modal header with navigation */}
            <div className="flex-row-between" style={{ alignItems: "center" }}>
              <button 
                onClick={() => navigateSnapshotDay("prev")}
                className="badge hover-glow"
                style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                ◀
              </button>
              
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Calendar size={18} className="text-primary-accent" />
                <h3 className="text-card-title bold" style={{ fontSize: "16px" }}>{selectedSnapshotDate}</h3>
              </div>
              
              <button 
                onClick={() => navigateSnapshotDay("next")}
                className="badge hover-glow"
                style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                ▶
              </button>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }} />

            {/* Quick Indices stats */}
            <div className="grid-2" style={{ gap: "8px" }}>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>Discipline Index</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>
                  {selectedSnapshot.disciplineScore}% Score
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>Restoration Log</span>
                <span className="bold text-sm text-secondary-accent" style={{ display: "block", marginTop: "4px" }}>
                  {selectedSnapshot.sleepHours ? `${selectedSnapshot.sleepHours} hrs` : "No sleep log"}
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>Deep Flow Sessions</span>
                <span className="bold text-sm text-tertiary-accent" style={{ display: "block", marginTop: "4px" }}>
                  {selectedSnapshot.focusMinutes} mins focus
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <span className="text-xs text-muted" style={{ display: "block" }}>XP Reward Earned</span>
                <span className="bold text-sm text-primary-accent" style={{ display: "block", marginTop: "4px" }}>
                  +{selectedSnapshot.xpEarned || 0} XP
                </span>
              </div>
            </div>

            {/* List of checked/unchecked tasks for this day */}
            <div className="flex-column" style={{ gap: "6px" }}>
              <span className="text-xs bold text-muted">Daily checklist completions</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "110px", overflowY: "auto", paddingRight: "4px" }}>
                {selectedSnapshot.taskCompletions.map((tc) => {
                  const conf = configs.find(c => c.id === tc.taskId);
                  if (!conf) return null;
                  return (
                    <div 
                      key={tc.taskId}
                      style={{
                        padding: "6px 10px",
                        background: "rgba(255,255,255,0.01)",
                        border: tc.isCompleted ? "1px solid rgba(52, 211, 153, 0.12)" : "1px solid rgba(255,255,255,0.03)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span className="text-xs bold" style={{ color: tc.isCompleted ? "var(--primary)" : "var(--text-secondary)" }}>
                        {tc.isCompleted ? "✓" : "○"} {conf.name}
                      </span>
                      {tc.remarks && (
                        <span className="text-xs text-muted" style={{ fontStyle: "italic", fontSize: "9px" }}>
                          "{tc.remarks}"
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mood selector reflection */}
            <div className="flex-column" style={{ gap: "6px" }}>
              <span className="text-xs bold text-muted">Select Day Reflection Mood</span>
              <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", background: "rgba(255,255,255,0.01)", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                {["🧠", "😀", "😐", "😔", "😴"].map((m) => (
                  <button 
                    key={m} 
                    onClick={() => setModalMood(m)}
                    style={{ 
                      fontSize: "20px", 
                      background: modalMood === m ? "rgba(52,211,153,0.15)" : "transparent",
                      border: modalMood === m ? "1px solid var(--primary)" : "none",
                      borderRadius: "6px",
                      padding: "4px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Notes Text Area */}
            <div className="flex-column" style={{ gap: "6px" }}>
              <span className="text-xs bold text-muted">Reflection Accomplishment Notes</span>
              <textarea 
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Log reflections, mood details, obstacles, or wins for this day..."
                className="text-input"
                style={{ height: "60px", background: "#131316", border: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", borderRadius: "8px", padding: "8px", color: "var(--on-surface)", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button 
                id="btn-save-reflection"
                onClick={saveReflection}
                className="btn btn-primary"
                style={{ flex: 1, padding: "12px", background: "var(--primary)", color: "var(--void)", fontWeight: "bold", cursor: "pointer", border: "none", borderRadius: "8px" }}
              >
                Save Reflection
              </button>
              <button 
                onClick={() => setSelectedSnapshotDate(null)}
                className="btn btn-secondary"
                style={{ padding: "12px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", borderRadius: "8px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
