import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isFirebaseConfigured, loginAsGuest } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      const code = error?.code || "";
      if (code === "auth/configuration-not-found") {
        setErrorMsg("Firebase Authentication has not been activated yet. Please open the Firebase Console for your project 'grindstack-3b4fe', navigate to Build > Authentication, and click 'Get Started' to activate it.");
      } else if (code === "auth/operation-not-allowed") {
        setErrorMsg("Google Sign-in is not enabled for this project. Please go to the Firebase Console for 'grindstack-3b4fe' > Authentication > Sign-in method, click 'Add new provider', and enable 'Google'.");
      } else if (code === "auth/popup-blocked") {
        setErrorMsg("The login popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in popup was closed before completion. Please try again.");
      } else {
        setErrorMsg(`Firebase error (${code}): ${error?.message || "Sign-in failed. Please check your console."}`);
      }
    }
  };

  return (
    <div className="screen-content" style={{ padding: "24px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 className="login-logo">GRINDSTACK</h1>
        <p className="text-md" style={{ color: "var(--text-secondary)", marginTop: "6px" }}>
          Reclaim your focus. Track, study, recover, and grow.
        </p>
      </div>

      <div className="flex-column" style={{ gap: "12px", marginBottom: "24px" }}>
        <GlassCard>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "24px" }}>🎯</span>
            <div style={{ textAlign: "left" }}>
              <h3 className="semibold text-md">Daily Checklists & Heatmaps</h3>
              <p className="text-sm">Track your tasks and watch your streak grow. Consistency is key.</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "24px" }}>📚</span>
            <div style={{ textAlign: "left" }}>
              <h3 className="semibold text-md">Academy Study Mode</h3>
              <p className="text-sm">Log your study hours, trace topics, and earn skill XP points.</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "24px" }}>🛡️</span>
            <div style={{ textAlign: "left" }}>
              <h3 className="semibold text-md">Squad Tribes</h3>
              <p className="text-sm">Join squads with clean invite codes and compete on the live leaderboard.</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {errorMsg && (
        <div className="flex-column" style={{ 
          padding: "16px", 
          background: "rgba(239, 68, 68, 0.08)", 
          border: "1px solid rgba(239, 68, 68, 0.2)", 
          borderRadius: "12px", 
          marginBottom: "16px",
          textAlign: "left",
          gap: "6px"
        }}>
          <span className="semibold text-sm" style={{ color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
            ⚠️ Action Required in Firebase Console
          </span>
          <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>
            {errorMsg}
          </p>
        </div>
      )}

      <div className="flex-column" style={{ gap: "12px", width: "100%" }}>
        {isFirebaseConfigured ? (
          <>
            <button 
              className="btn btn-accent" 
              onClick={handleGoogleLogin}
              style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "12px", gap: "12px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={loginAsGuest}
              style={{ width: "100%", padding: "14px", fontSize: "14px", borderRadius: "12px" }}
            >
              Continue Offline (Local Storage)
            </button>
          </>
        ) : (
          <>
            <div className="flex-column" style={{ 
              padding: "16px", 
              background: "rgba(251, 146, 60, 0.08)", 
              border: "1px solid rgba(251, 146, 60, 0.2)", 
              borderRadius: "12px", 
              marginBottom: "8px",
              textAlign: "left",
              gap: "6px"
            }}>
              <span className="semibold text-sm orange-accent">⚠️ Firebase Keys Not Configured</span>
              <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Add your Firebase environment variables in Vercel to enable Cloud features.
              </p>
            </div>
            <button 
              className="btn btn-accent" 
              onClick={loginAsGuest}
              style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "12px" }}
            >
              Continue as Guest (Offline Mode)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
