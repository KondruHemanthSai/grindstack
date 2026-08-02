import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import { Navigation, type ScreenType } from "./components/Navigation";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MissionScreen } from "./screens/MissionScreen";
import { FocusScreen } from "./screens/FocusScreen";
import { InsightsScreen } from "./screens/InsightsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("home");

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="app-container loading-screen">
          <div className="loading-content">
            <h1 className="login-logo">GRINDSTACK</h1>
            <p className="text-body text-muted">Syncing your data from cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <LoginScreen />
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":     return <HomeScreen />;
      case "mission":  return <MissionScreen />;
      case "focus":    return <FocusScreen />;
      case "insights": return <InsightsScreen />;
      case "profile":  return <ProfileScreen />;
      default:         return <HomeScreen />;
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <div className="ambient-glow" />
        <main className="app-main">
          {renderScreen()}
        </main>
        <Navigation activeScreen={currentScreen} onNavigate={setCurrentScreen} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
