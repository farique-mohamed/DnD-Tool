import { useState, useEffect } from "react";
import type { UserRoleType } from "../lib/constants";

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRoleType;
  exp: number;
}

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!)) as AuthUser;
    if (payload.exp * 1000 > Date.now()) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("dnd_token");
    return token ? decodeToken(token) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("dnd_token");
    setUser(null);
  };

  return { user, isAuthenticated: user !== null, isLoading, logout };
}
