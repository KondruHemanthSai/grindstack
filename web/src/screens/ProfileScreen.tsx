import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { TaskConfig, GroupMember } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Trash,
  Plus
} from "lucide-react";

const AVATARS = [
  { id: "avatar_1", emoji: "🧑‍💻", label: "Developer" },
  { id: "avatar_2", emoji: "🦁", label: "Lion" },
  { id: "avatar_3", emoji: "🥋", label: "Fighter" },
  { id: "avatar_4", emoji: "🚀", label: "Astronaut" },
  { id: "avatar_5", emoji: "🧠", label: "Mastermind" }
];

export const ProfileScreen: React.FC = () => {
  const { user, profile, setProfile, logout } = useAuth();
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [editingName, setEditingName] = useState(false);

  // Custom Task Creator state
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("tech");
  const [newTaskXP, setNewTaskXP] = useState(15);
  const [newTaskType, setNewTaskType] = useState<"simple" | "problems">("simple");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [taskConfigs, setTaskConfigs] = useState<TaskConfig[]>([]);

  // Inline editing states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("tech");
  const [editXP, setEditXP] = useState(15);
  const [editType, setEditType] = useState<"simple" | "problems">("simple");
  const [editStreakEnabled, setEditStreakEnabled] = useState(true);
  const [editDescription, setEditDescription] = useState("");



  // Squad Tribe state
  const [squadId, setSquadId] = useState("");
  const [squadName, setSquadName] = useState("");
  const [leaderboard, setLeaderboard] = useState<GroupMember[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = () => {
    setUsernameInput(profile.username);
    setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));

    // Setup Squads leaderboard
    if (profile.currentGroupId) {
      if (user) {
        localDb.syncSquadMembers(profile.currentGroupId, profile).then(setLeaderboard);
      } else {
        // Offline / Guest user squad leaderboard
        setLeaderboard([
          { userId: "me", username: profile.username, dailyCompletionPercentage: profile.disciplineScore, currentStreak: profile.currentStreak, totalTasksAllTime: profile.totalTasksCompletedAllTime, xp: profile.xp, profilePic: profile.profilePic, activeBreakdown: "", isMe: true }
        ]);
      }
    } else {
      setLeaderboard([]);
    }
  };

  const handleSaveProfile = () => {
    if (!usernameInput.trim()) return;
    const updated = localDb.updateProfileInfo(usernameInput.trim(), profile.profilePic);
    setProfile(updated);
    setEditingName(false);
  };

  const handleAvatarSelect = (avatarId: string) => {
    const updated = localDb.updateProfileInfo(profile.username, avatarId);
    setProfile(updated);
  };

  // Custom tasks management
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    localDb.createTask(newTaskName.trim(), newTaskCategory, newTaskDescription.trim(), newTaskXP, newTaskType);
    setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));
    setNewTaskName("");
    setNewTaskDescription("");
    alert("New master task configured successfully!");
  };

  const handleEditTask = (config: TaskConfig) => {
    setEditingTaskId(config.id);
    setEditName(config.name);
    setEditCategory(config.category);
    setEditXP(config.xpReward);
    setEditType(config.taskType);
    setEditStreakEnabled(config.streakEnabled);
    setEditDescription(config.description || "");
  };

  const handleSaveTaskEdit = (id: string) => {
    if (!editName.trim()) return;
    localDb.updateTask(id, {
      name: editName.trim(),
      category: editCategory,
      description: editDescription.trim(),
      xpReward: editXP,
      taskType: editType,
      streakEnabled: editStreakEnabled
    });
    setEditingTaskId(null);
    setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));
  };

  const handleToggleTaskStatus = (id: string, currentEnabled: boolean) => {
    localDb.updateTask(id, { enabled: !currentEnabled });
    setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));
  };

  const handleDuplicateTask = (id: string) => {
    localDb.duplicateTask(id);
    setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));
    alert("Task duplicated successfully!");
  };

  const handleMoveTask = (id: string, direction: "up" | "down") => {
    const activeIds = taskConfigs.map(t => t.id);
    const idx = activeIds.indexOf(id);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const temp = activeIds[idx];
      activeIds[idx] = activeIds[idx - 1];
      activeIds[idx - 1] = temp;
    } else if (direction === "down" && idx < activeIds.length - 1) {
      const temp = activeIds[idx];
      activeIds[idx] = activeIds[idx + 1];
      activeIds[idx + 1] = temp;
    }

    localDb.reorderTasks(activeIds);
    setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Archive this task from your checklists?")) {
      localDb.archiveTask(id);
      setTaskConfigs(localDb.getTaskConfigs().filter(t => !t.archived));
    }
  };

  // Squad Tribe actions
  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadId.trim()) return;
    const sName = squadName.trim() || "Elite Alpha Tribe";
    const updated = await localDb.joinSquad(squadId, sName);
    setProfile(updated);
    alert(`Joined squad "${updated.currentGroupName}" successfully!`);
  };

  const handleLeaveSquad = async () => {
    if (window.confirm("Are you sure you want to leave your squad tribe?")) {
      const updated = await localDb.leaveSquad();
      setProfile(updated);
      alert("Squad left.");
    }
  };

  // Calculate XP values
  const currentXP = profile.xp;
  const level = profile.level;
  const xpNeededForCurrentLevel = (level - 1) * 100;
  const xpIntoLevel = currentXP - xpNeededForCurrentLevel;
  const progressPercent = Math.min(100, Math.max(0, xpIntoLevel));

  // Sort leaderboard by percentage completed, then XP
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (b.dailyCompletionPercentage !== a.dailyCompletionPercentage) {
      return b.dailyCompletionPercentage - a.dailyCompletionPercentage;
    }
    return b.xp - a.xp;
  });

  return (
    <div className="screen-content">
      {/* Title */}
      <div>
        <h2 className="text-section bold">PROFILE & PROTOCOLS</h2>
        <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
          Identity management, discipline rewards, tribes, and customization configurations.
        </p>
      </div>

      {/* Profile HUD */}
      <GlassCard className="flex-column" style={{ padding: "24px", gap: "20px" }}>
        <div className="flex-row-between" style={{ alignItems: "center" }}>
          <div className="flex-row-between" style={{ gap: "16px", alignItems: "center" }}>
            <div className="avatar-circle" style={{ width: "64px", height: "64px", fontSize: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {AVATARS.find(a => a.id === profile.profilePic)?.emoji || "🧑‍💻"}
            </div>
            <div>
              {editingName ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text" 
                    value={usernameInput} 
                    onChange={e => setUsernameInput(e.target.value)} 
                    className="text-input" 
                    maxLength={14}
                    style={{ padding: "6px 10px", width: "130px" }}
                  />
                  <button className="btn btn-primary" onClick={handleSaveProfile} style={{ padding: "6px 12px" }}>Save</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 className="text-card-title bold">{profile.username}</h3>
                  <span className="material-symbols-outlined text-muted" style={{ cursor: "pointer", fontSize: "18px" }} onClick={() => setEditingName(true)}>edit</span>
                </div>
              )}
              <p className="text-xs text-muted" style={{ marginTop: "2px" }}>Level {level} Discipline Specialist</p>
            </div>
          </div>
          <span className="badge badge-primary">LEVEL {level}</span>
        </div>

        {/* Level Progress */}
        <div className="flex-column" style={{ gap: "6px" }}>
          <div className="flex-row-between text-xs label-caps">
            <span className="text-muted">Discipline Experience Points</span>
            <span className="text-primary-accent">{currentXP} Total XP ({xpIntoLevel}/100)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Avatar Selectors */}
        <div className="flex-column" style={{ gap: "8px" }}>
          <span className="text-label-caps text-muted">Change Avatar Shell</span>
          <div className="flex-row-between" style={{ justifyContent: "flex-start", gap: "8px" }}>
            {AVATARS.map(avatar => (
              <div 
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                className={`date-chip ${profile.profilePic === avatar.id ? "selected" : ""}`}
                style={{ fontSize: "20px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px" }}
              >
                {avatar.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Account Info Stats */}
        <div className="grid-2 milled-inset" style={{ padding: "16px", borderRadius: "12px" }}>
          <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-label-caps text-muted">All-Time Tasks</span>
            <div className="text-section bold text-glow" style={{ marginTop: "4px" }}>{profile.totalTasksCompletedAllTime}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <span className="text-label-caps text-muted">Current Streak</span>
            <div className="text-section bold text-secondary-accent" style={{ marginTop: "4px" }}>{profile.currentStreak}d</div>
          </div>
        </div>

        {user && (
          <button className="btn btn-secondary btn-ghost" onClick={logout} style={{ color: "var(--error-text)", borderColor: "var(--error-border)", width: "100%" }}>
            Disconnect Account Shell
          </button>
        )}
      </GlassCard>

      {/* Squad Tribe 2.0 Section */}
      <GlassCard className="flex-column" style={{ gap: "20px" }}>
        <div>
          <h4 className="text-card-title bold">Squad Tribe Hub 2.0</h4>
          <p className="text-xs text-muted">Synchronize accountability protocols with squad leaders.</p>
        </div>

        {profile.currentGroupId ? (
          <div className="flex-column" style={{ gap: "16px" }}>
            <div className="flex-row-between" style={{ alignItems: "center" }}>
              <div>
                <span className="badge badge-primary">{profile.currentGroupName}</span>
                <p className="text-xs text-muted" style={{ marginTop: "4px" }}>Squad Invite ID: <code className="text-primary-accent">{profile.currentGroupId}</code></p>
              </div>
              <button className="btn btn-ghost btn-danger" onClick={handleLeaveSquad} style={{ padding: "6px 12px" }}>Leave Squad</button>
            </div>

            {/* Tribe Leaderboard */}
            <div className="flex-column" style={{ gap: "8px" }}>
              <span className="text-label-caps text-muted">Live Squad Leaderboard</span>
              <div className="flex-column" style={{ gap: "8px" }}>
                {sortedLeaderboard.map((member, index) => {
                  const avatarEmoji = AVATARS.find(a => a.id === member.profilePic)?.emoji || "🧑‍💻";
                  const rankNum = index + 1;
                  const isTop3Class = rankNum === 1 ? "rank-1" : rankNum === 2 ? "rank-2" : rankNum === 3 ? "rank-3" : "";

                  return (
                    <div 
                      key={member.userId} 
                      className={`leaderboard-item ${member.isMe ? "is-me" : ""}`}
                      style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "12px", border: member.isMe ? "1px solid var(--primary)" : "1px solid var(--glass-border)", background: member.isMe ? "rgba(208, 188, 255, 0.05)" : "var(--glass-fill)" }}
                    >
                      <div className="flex-row-between" style={{ gap: "12px", justifyContent: "flex-start", alignItems: "center" }}>
                        <span className={`leaderboard-rank bold ${isTop3Class}`} style={{ width: "24px" }}>#{rankNum}</span>
                        <div style={{ fontSize: "20px" }}>{avatarEmoji}</div>
                        <div>
                          <span className="text-sm bold" style={{ color: "var(--text-primary)" }}>{member.username}</span>
                          {member.activeBreakdown && (
                            <p className="text-xs text-muted" style={{ fontSize: "10px" }}>Active: {member.activeBreakdown.split(',').join(' | ')}</p>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="text-sm bold text-primary-accent">{member.dailyCompletionPercentage}%</div>
                        <p className="text-xs text-muted" style={{ fontSize: "10px" }}>{member.currentStreak}d Streak | {member.xp} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleJoinSquad} className="flex-column" style={{ gap: "12px" }}>
            <p className="text-xs text-muted">Join an existing squad using their Invite ID, or create a new squad tribe.</p>
            <div className="grid-2">
              <div className="input-group">
                <label className="text-label-caps text-muted" style={{ display: "block", marginBottom: "4px" }}>Squad Invite ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. hub-alpha" 
                  value={squadId} 
                  onChange={e => setSquadId(e.target.value)} 
                  className="text-input"
                  required
                />
              </div>
              <div className="input-group">
                <label className="text-label-caps text-muted" style={{ display: "block", marginBottom: "4px" }}>Squad Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Grind Syndicate" 
                  value={squadName} 
                  onChange={e => setSquadName(e.target.value)} 
                  className="text-input"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "6px" }}>
              Join / Establish Squad Tribe
            </button>
          </form>
        )}
      </GlassCard>

      {/* Custom Task Configurator */}
      <GlassCard className="flex-column" style={{ gap: "18px" }}>
        <div>
          <h4 className="text-card-title bold text-glow" style={{ color: "var(--on-surface)" }}>Mission Task Management Center</h4>
          <p className="text-xs text-muted">Configure and control all master daily checklist tasks that dynamically compile throughout the OS.</p>
        </div>

        <form onSubmit={handleCreateTask} className="flex-column" style={{ gap: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px" }}>
          <span className="text-xs bold text-primary-accent" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>Create New Master Task</span>
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Task Name</label>
              <input 
                type="text" 
                placeholder="e.g. System Design Practice" 
                value={newTaskName} 
                onChange={e => setNewTaskName(e.target.value)} 
                className="text-input"
                style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select 
                value={newTaskCategory} 
                onChange={e => setNewTaskCategory(e.target.value)} 
                className="text-input"
                style={{ padding: "8px 12px", borderRadius: "8px", background: "#0F1115", fontSize: "13px" }}
              >
                <option value="tech">Tech & Learning</option>
                <option value="health">Health & Wellness</option>
                <option value="discipline">Lifestyle & Discipline</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Task Description</label>
            <input 
              type="text" 
              placeholder="e.g. Solve daily algorithms and study answers" 
              value={newTaskDescription} 
              onChange={e => setNewTaskDescription(e.target.value)} 
              className="text-input"
              style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}
            />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Task Type</label>
              <select 
                value={newTaskType} 
                onChange={e => setNewTaskType(e.target.value as any)} 
                className="text-input"
                style={{ padding: "8px 12px", borderRadius: "8px", background: "#0F1115", fontSize: "13px" }}
              >
                <option value="simple">Simple Completion (Checkbox)</option>
                <option value="problems">Problem Solving Log (Modal Form)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">XP Reward ({newTaskXP} XP)</label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5" 
                value={newTaskXP} 
                onChange={e => setNewTaskXP(Number(e.target.value))} 
                style={{ width: "100%", accentColor: "var(--primary)", marginTop: "6px" }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px", fontSize: "13px" }}>
            <Plus size={16} /> Create Task Protocol
          </button>
        </form>

        {/* Master Tasks List */}
        {taskConfigs.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", marginTop: "4px" }}>
            <span className="text-label-caps text-muted" style={{ display: "block", marginBottom: "12px", letterSpacing: "1px" }}>MASTER TASK REGISTRY ({taskConfigs.length})</span>
            
            <div className="flex-column" style={{ gap: "10px" }}>
              {taskConfigs.map(config => {
                const isEditing = editingTaskId === config.id;

                if (isEditing) {
                  return (
                    <div 
                      key={config.id} 
                      className="flex-column" 
                      style={{ 
                        padding: "16px", 
                        borderRadius: "12px", 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid var(--primary)",
                        gap: "12px"
                      }}
                    >
                      <div className="flex-row-between">
                        <span className="text-xs bold text-primary-accent">Edit task details</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleSaveTaskEdit(config.id)} className="btn-icon-only" style={{ background: "var(--success-bg)", borderColor: "rgba(52,211,153,0.3)", color: "var(--success)", padding: "4px" }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingTaskId(null)} className="btn-icon-only" style={{ background: "rgba(255,255,255,0.03)", padding: "4px" }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="input-group">
                          <label className="text-xs text-muted">Name</label>
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)} 
                            className="text-input"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                          />
                        </div>
                        <div className="input-group">
                          <label className="text-xs text-muted">Category</label>
                          <select 
                            value={editCategory} 
                            onChange={e => setEditCategory(e.target.value)} 
                            className="text-input"
                            style={{ padding: "6px 10px", background: "#0F1115", fontSize: "12px" }}
                          >
                            <option value="tech">Tech & Learning</option>
                            <option value="health">Health & Wellness</option>
                            <option value="discipline">Lifestyle & Discipline</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="text-xs text-muted">Description</label>
                        <input 
                          type="text" 
                          value={editDescription} 
                          onChange={e => setEditDescription(e.target.value)} 
                          className="text-input"
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                        />
                      </div>

                      <div className="grid-2">
                        <div className="input-group">
                          <label className="text-xs text-muted">Type</label>
                          <select 
                            value={editType} 
                            onChange={e => setEditType(e.target.value as any)} 
                            className="text-input"
                            style={{ padding: "6px 10px", background: "#0F1115", fontSize: "12px" }}
                          >
                            <option value="simple">Simple Checkbox</option>
                            <option value="problems">Problems Log Modal</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="text-xs text-muted">XP Reward ({editXP} XP)</label>
                          <input 
                            type="range" 
                            min="5" 
                            max="50" 
                            step="5" 
                            value={editXP} 
                            onChange={e => setEditXP(Number(e.target.value))} 
                            style={{ width: "100%", accentColor: "var(--primary)", marginTop: "4px" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                        <input 
                          type="checkbox" 
                          id={`editStreak-${config.id}`} 
                          checked={editStreakEnabled} 
                          onChange={e => setEditStreakEnabled(e.target.checked)}
                          style={{ accentColor: "var(--primary)" }}
                        />
                        <label htmlFor={`editStreak-${config.id}`} className="text-xs text-muted" style={{ cursor: "pointer" }}>Enable Streak Tracking</label>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={config.id} 
                    className="flex-row-between" 
                    style={{ 
                      padding: "12px 14px", 
                      borderRadius: "12px", 
                      background: config.enabled ? "var(--glass-fill)" : "rgba(255,255,255,0.01)", 
                      border: config.enabled ? "1px solid var(--glass-border)" : "1px solid rgba(255,255,255,0.02)",
                      opacity: config.enabled ? 1 : 0.5,
                      alignItems: "center"
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "60%" }}>
                      {/* Active Status Switcher button */}
                      <button 
                        onClick={() => handleToggleTaskStatus(config.id, config.enabled)}
                        title={config.enabled ? "Disable task" : "Enable task"}
                        style={{ color: config.enabled ? "var(--primary)" : "var(--text-muted)", cursor: "pointer" }}
                      >
                        {config.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="text-sm bold" style={{ color: "var(--on-surface)" }}>{config.name}</span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                          <span className="text-xs text-muted" style={{ textTransform: "uppercase", fontSize: "9px" }}>{config.category}</span>
                          <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                          <span className="text-xs" style={{ fontSize: "9px", color: config.taskType === "problems" ? "var(--tertiary)" : "var(--text-muted)" }}>
                            {config.taskType === "problems" ? "Problems Form" : "Checkbox"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end" }}>
                      <span className="text-xs bold text-primary-accent">+{config.xpReward} XP</span>
                      
                      {/* Control toolbox */}
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => handleEditTask(config)} title="Edit task" className="btn-icon-only" style={{ padding: "4px" }}>
                          <Edit2 size={12} className="text-muted" />
                        </button>
                        <button onClick={() => handleDuplicateTask(config.id)} title="Duplicate task" className="btn-icon-only" style={{ padding: "4px" }}>
                          <Copy size={12} className="text-muted" />
                        </button>
                        <button onClick={() => handleMoveTask(config.id, "up")} title="Move Up" className="btn-icon-only" style={{ padding: "4px" }}>
                          <ArrowUp size={12} className="text-muted" />
                        </button>
                        <button onClick={() => handleMoveTask(config.id, "down")} title="Move Down" className="btn-icon-only" style={{ padding: "4px" }}>
                          <ArrowDown size={12} className="text-muted" />
                        </button>
                        <button onClick={() => handleDeleteTask(config.id)} title="Archive task" className="btn-icon-only" style={{ padding: "4px" }}>
                          <Trash size={12} className="text-muted" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>


    </div>
  );
};
