import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

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

async function fetchUserProfile(token: string): Promise<GoogleUser> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profile = await res.json();
  return { name: profile.name, email: profile.email, picture: profile.picture };
}

// Manually redirect to Google OAuth — works on ALL browsers including mobile
function redirectToGoogle() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!clientId || clientId === "undefined") {
    alert("ERROR: The Google Client ID is missing in Vercel!\n\nPlease go to your Vercel Dashboard -> Settings -> Environment Variables.\nMake sure VITE_GOOGLE_CLIENT_ID is fully saved, then click 'Deployments' and 'Redeploy' the latest build.");
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin,
    response_type: "token",
    scope: SCOPES,
    include_granted_scopes: "true",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check if Google returned an access token in the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        setIsLoading(true);
        // Clean the token out of the URL immediately for security
        window.history.replaceState(null, "", window.location.pathname);
        fetchUserProfile(token)
          .then((profile) => {
            setUser(profile);
            setAccessToken(token);
          })
          .catch(() => setError("Failed to fetch user profile. Please try again."))
          .finally(() => setIsLoading(false));
      }
    }
  }, []);

  const signIn = useCallback(() => {
    redirectToGoogle();
  }, []);

  const signOut = useCallback(() => {
    // Revoke the token with Google so it's fully invalidated
    if (accessToken) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" });
    }
    setUser(null);
    setAccessToken(null);
    setError(null);
  }, [accessToken]);

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
