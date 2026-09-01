import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  uid: string;
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const mappedUser: GoogleUser = {
          name: fbUser.displayName || "",
          email: fbUser.email || "",
          picture: fbUser.photoURL || "",
          uid: fbUser.uid,
        };
        setFirebaseUser(fbUser);
        setUser(mappedUser);
        // Flag fresh login for welcome/setup screens
        if (sessionStorage.getItem("flow_signing_in") === "true") {
          sessionStorage.removeItem("flow_signing_in");
          sessionStorage.setItem("flow_just_logged_in", "true");
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    setError(null);
    setIsLoading(true);
    sessionStorage.setItem("flow_signing_in", "true");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: unknown) {
      sessionStorage.removeItem("flow_signing_in");
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      if (!msg.includes("popup-closed-by-user") && !msg.includes("cancelled")) {
        setError("Could not sign in. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error("useGoogleAuth must be used inside GoogleAuthProvider");
  return ctx;
}
