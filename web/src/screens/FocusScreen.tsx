import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { FocusSession } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { useToast } from "../components/Toast";

export const FocusScreen: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionNameInput, setSessionNameInput] = useState("Deep Work");
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [weekFocusMinutes, setWeekFocusMinutes] = useState(0);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);

  // Ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intervalRef = useRef<any | null>(null);

  // Load stats
  const loadStats = useCallback(() => {
    setTodayFocusMinutes(localDb.getTodayFocusMinutes());
    setWeekFocusMinutes(localDb.getWeekFocusMinutes());
    
    // Sort recent sessions, filter out active and show last 10
    const all = localDb.getFocusSessions();
    const inactive = all
      .filter(s => !s.isActive)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
    setRecentSessions(inactive);
  }, []);

  // Update timer ticks
  useEffect(() => {
    const currentActive = localDb.getActiveFocusSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSession(currentActive);
    loadStats();

    if (currentActive) {
      setSessionNameInput(currentActive.taskName);
      const startMs = new Date(currentActive.startTime).getTime();
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSecs);

      // Start ticker
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Correction interval: re-sync elapsed time from startTime every 10 seconds
      // This fixes timer drift when the app is backgrounded on mobile
      const correctionRef = setInterval(() => {
        const activeNow = localDb.getActiveFocusSession();
        if (activeNow) {
          const corrected = Math.max(0, Math.floor((Date.now() - new Date(activeNow.startTime).getTime()) / 1000));
          setElapsedSeconds(corrected);
        }
      }, 10000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clearInterval(correctionRef);
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadStats]);

  const handleStartSession = async () => {
    const name = sessionNameInput.trim() || "Deep Work";
    const session = localDb.startFocusSession(name);
    setActiveSession(session);
    setElapsedSeconds(0);
    await refreshProfile();

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    localDb.endFocusSession(activeSession.id);
    setActiveSession(null);
    setElapsedSeconds(0);
    loadStats();
    await refreshProfile();
    showToast("Focus session complete! XP synchronized.", "success");
  };

  // Timer format (MM:SS)
  const formatTimer = () => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Helper format focus minutes
  const formatFocusTime = (mins: number) => {
    if (mins === 0) return "0m";
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="screen-content">
      {/* Header Info */}
      <div className="flex-row-between" style={{ alignItems: "center" }}>
        <div>
          <h2 className="text-section bold">DEEP WORK FOCUS MODE</h2>
          <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
            Trigger atomic flow sessions. Maintain undistracted workspace protocols.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            background: activeSession ? "var(--success)" : "var(--text-muted)",
            display: "inline-block",
            boxShadow: activeSession ? "0 0 8px var(--success)" : "none"
          }} />
          <span className="text-label-caps bold" style={{ fontSize: "11px", color: activeSession ? "var(--success)" : "var(--text-muted)" }}>
            {activeSession ? "ACTIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Focus Timer Ring */}
      <GlassCard className="flex-column" style={{ alignItems: "center", padding: "36px 24px", gap: "28px" }}>
        <div className="focus-timer-ring" style={{ position: "relative", width: "240px", height: "240px", borderRadius: "50%", background: "var(--milled-surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span className="focus-timer-value text-glow bold" style={{ fontSize: "42px", color: "var(--text-primary)", letterSpacing: "1px" }}>
            {formatTimer()}
          </span>
          <span className="text-label-caps text-muted" style={{ fontSize: "10px", marginTop: "4px" }}>
            {activeSession ? "TIME ELAPSED" : "READY PROTOCOL"}
          </span>
        </div>

        {/* Form controls */}
        <div className="flex-column" style={{ width: "100%", gap: "12px" }}>
          {!activeSession && (
            <div className="input-group">
              <label className="text-label-caps text-muted" style={{ display: "block", marginBottom: "6px" }}>Flow Session Tag / Objective</label>
              <input 
                type="text" 
                value={sessionNameInput} 
                onChange={e => setSessionNameInput(e.target.value)} 
                className="text-input"
                placeholder="e.g. System Design, Code review"
                style={{ textAlign: "center" }}
              />
            </div>
          )}
          
          {activeSession ? (
            <button className="btn btn-primary btn-danger" onClick={handleEndSession} style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--error-border)", color: "var(--error-text)" }}>
              Terminate Session & Log XP
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleStartSession} style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "12px" }}>
              Initiate Flow Protocols
            </button>
          )}
        </div>
      </GlassCard>

      {/* Today's Focus Stats */}
      <div className="grid-2">
        <MetricCard 
          icon="schedule" 
          label="Today's Flow" 
          value={formatFocusTime(todayFocusMinutes)} 
          trend="Total Logs" 
          trendPositive={todayFocusMinutes > 0}
        />
        <MetricCard 
          icon="event_note" 
          label="Weekly Flow" 
          value={formatFocusTime(weekFocusMinutes)} 
          trend="7-Day Sum" 
          trendPositive={weekFocusMinutes > 0}
        />
      </div>

      {/* Recent Sessions List */}
      <div className="flex-column" style={{ gap: "12px" }}>
        <p className="text-label-caps text-muted">COMPLETED FOCUS SESSION JOURNAL</p>
        
        <div className="flex-column" style={{ gap: "8px" }}>
          {recentSessions.length === 0 ? (
            <p className="text-xs text-muted" style={{ textAlign: "center", padding: "16px" }}>No documented focus sessions completed yet.</p>
          ) : (
            recentSessions.map(session => (
              <div 
                key={session.id} 
                className="flex-row-between" 
                style={{ 
                  padding: "12px 16px", 
                  borderRadius: "12px", 
                  background: "var(--glass-fill)", 
                  border: "1px solid var(--glass-border)",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="material-symbols-outlined text-primary-accent" style={{ fontSize: "20px" }}>workspace_premium</span>
                  <div>
                    <span className="text-sm bold" style={{ color: "var(--text-primary)" }}>{session.taskName}</span>
                    <p className="text-xs text-muted" style={{ fontSize: "10px", marginTop: "2px" }}>
                      {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="text-sm bold text-success">{formatFocusTime(session.durationMinutes)}</span>
                  <p className="text-xs text-primary-accent" style={{ fontSize: "9px", fontWeight: "600", marginTop: "2px" }}>+{session.xpEarned} XP</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
