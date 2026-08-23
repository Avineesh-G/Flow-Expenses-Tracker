import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  error: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

const SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

async function fetchUserProfile(token: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check if Google redirected back with a token in the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        setIsLoading(true);
        // Clean up the URL so the token doesn't stay visible
        window.history.replaceState(null, "", window.location.pathname);
        fetchUserProfile(token)
          .then((profile) => {
            setUser({ name: profile.name, email: profile.email, picture: profile.picture });
            setAccessToken(token);
          })
          .catch(() => setError("Failed to fetch user profile. Please try again."))
          .finally(() => setIsLoading(false));
      }
    }
  }, []);

  const signIn = useGoogleLogin({
    scope: SCOPES,
    // Use redirect mode — works reliably on ALL mobile browsers
    // Popup mode is blocked by COOP policy on mobile
    ux_mode: "redirect",
    redirect_uri: window.location.origin,
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await fetchUserProfile(tokenResponse.access_token);
        setUser({
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        });
        setAccessToken(tokenResponse.access_token);
      } catch {
        setError("Failed to fetch user profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Sign-in was cancelled or failed. Please try again.");
      setIsLoading(false);
    },
  });

  const signOut = useCallback(() => {
    googleLogout();
    setUser(null);
    setAccessToken(null);
    setError(null);
  }, []);

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
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
