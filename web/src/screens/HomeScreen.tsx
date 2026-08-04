import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb, getTodayDateString } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { CircularProgress } from "../components/CircularProgress";
import { MomentumCapsules } from "../components/MomentumCapsules";


export const HomeScreen: React.FC = () => {
  const { profile } = useAuth();
  const [disciplineScore, setDisciplineScore] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);

  const [heatmapDays, setHeatmapDays] = useState<any[]>([]);

  const loadData = () => {
    const todayStr = getTodayDateString();
    const snapshot = localDb.getSnapshotForDate(todayStr);

    setDisciplineScore(snapshot.disciplineScore);
    setTasksCompleted(snapshot.tasksCompleted);
    setTasksTotal(snapshot.tasksTotal);
    


    // Heatmap data - map number labels to string as expected by component
    const rawHeatmap = localDb.getHeatmapDays(21);
    const mappedHeatmap = rawHeatmap.map(d => ({
      ...d,
      label: String(d.label)
    }));
    setHeatmapDays(mappedHeatmap);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [profile]);


  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };



  return (
    <div className="screen-content">
      {/* Header Info */}
      <div className="flex-row-between" style={{ alignItems: "center" }}>
        <div>
          <h2 className="text-hero bold text-glow" style={{ fontSize: "28px" }}>
            {getGreeting()}, {profile.username}
          </h2>
          <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
            Protocol: Active & Prime. Reclaim your focus today.
          </p>
        </div>
        <div 
          className="avatar-circle" 
          style={{ 
            width: "48px", 
            height: "48px", 
            borderRadius: "50%", 
            background: "var(--glass-fill)", 
            border: "1px solid var(--glass-border)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "24px"
          }}
        >
          {profile.profilePic === "avatar_1" ? "🧑‍💻" : 
           profile.profilePic === "avatar_2" ? "🦁" : 
           profile.profilePic === "avatar_3" ? "🥋" : 
           profile.profilePic === "avatar_4" ? "🚀" : "🧠"}
        </div>
      </div>

      {/* Hero Discipline Score Circular Ring */}
      <GlassCard className="flex-column" style={{ alignItems: "center", padding: "32px 24px", gap: "24px" }}>
        <span className="text-label-caps text-muted">Daily Discipline Coefficient</span>
        
        <CircularProgress 
          percentage={disciplineScore} 
          size={180} 
          strokeWidth={10} 
          accentColor="var(--primary)" 
          centerValue={`${disciplineScore}%`} 
          centerLabel="PRIMED"
        />

        {/* Milled Inset Stat Pills */}
        <div className="grid-2 milled-inset" style={{ width: "100%", padding: "12px", borderRadius: "12px" }}>
          <div style={{ textAlign: "center", borderRight: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <span className="text-label-caps text-muted" style={{ fontSize: "10px" }}>Active Streak</span>
            <div className="text-sm bold text-secondary-accent" style={{ marginTop: "4px" }}>{profile.currentStreak} DAYS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <span className="text-label-caps text-muted" style={{ fontSize: "10px" }}>Tasks Done</span>
            <div className="text-sm bold text-primary-accent" style={{ marginTop: "4px" }}>{tasksCompleted} / {tasksTotal}</div>
          </div>
        </div>
      </GlassCard>

      {/* Momentum Capsules Heatmap */}
      <GlassCard className="flex-column" style={{ gap: "16px" }}>
        <div>
          <h4 className="text-card-title bold">Consistency Momentum</h4>
          <p className="text-xs text-muted">A 21-day rolling blueprint of your execution history.</p>
        </div>
        
        <MomentumCapsules days={heatmapDays} />
      </GlassCard>


    </div>
  );
};
