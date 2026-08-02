import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { localDb } from "../db/localDb";
import type { UserProfile } from "../db/localDb";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isFirebaseConfigured: boolean;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(() => localDb.getProfile());

  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY && 
                               import.meta.env.VITE_FIREBASE_API_KEY !== "your_firebase_api_key";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      if (currentUser) {
        // Load ALL user data from Firestore into memory cache.
        // 15-second timeout for reliable mobile/slow connections.
        try {
          const synced = await Promise.race([
            localDb.initializeFromFirestore(currentUser.uid),
            new Promise<UserProfile>((resolve) =>
              setTimeout(() => {
                console.warn("[Grindstack] Firestore sync timed out after 15s. Using cached data.");
                resolve(localDb.getProfile());
              }, 15000)
            )
          ]);
          setProfile(synced);
        } catch (err) {
          console.error("Profile sync exception:", err);
          setProfile(localDb.getProfile());
        }
      } else {
        setProfile(localDb.getProfile());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up midnight reset check timer or triggers
  useEffect(() => {
    const runResetCheck = async () => {
      const { resetDone, profile: updatedProfile } = await localDb.checkAndPerformMidnightReset();
      if (resetDone) {
        setProfile(updatedProfile);
      }
    };
    runResetCheck();
    // Run reset check every 1 minute
    const interval = setInterval(runResetCheck, 60000);
    return () => clearInterval(interval);
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: "guest_user",
      displayName: "Guest Grinder",
      email: "guest@grindstack.com",
    } as User;
    setUser(guestUser);
    setProfile(localDb.getProfile());
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
      localDb.clearAllData();
      setUser(null);
      setProfile(localDb.getProfile());
    } catch (error) {
      console.error("Logout Error:", error);
      setUser(null);
      setProfile(localDb.getProfile());
    }
  };

  const refreshProfile = async () => {
    // Update UI with the current in-memory cache immediately
    const local = localDb.getProfile();
    setProfile(local);

    // Push latest local state to Firestore + leaderboard asynchronously
    if (auth.currentUser && auth.currentUser.uid !== "guest_user") {
      try {
        localDb.pushUserProfileToFirestore(local);
        localDb.syncLocalToLeaderboard(local);
      } catch (err) {
        console.error("Background Firestore sync failed:", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, profile, setProfile, loginWithGoogle, logout, refreshProfile, isFirebaseConfigured, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
