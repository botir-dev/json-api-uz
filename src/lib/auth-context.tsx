"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, type Me } from "./api";

interface AuthContextType {
  user: Me | null;
  tenantSlug: string;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setTenantSlug: (slug: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [tenantSlug, setTenantSlugState] = useState("");
  const [loading, setLoading] = useState(true);

  const setTenantSlug = useCallback((slug: string) => {
    localStorage.setItem("tenantSlug", slug);
    setTenantSlugState(slug);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await auth.me();
      setUser(me);
    } catch {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const slug  = localStorage.getItem("tenantSlug") || "";
    setTenantSlugState(slug);
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      const rt = localStorage.getItem("refreshToken") ?? undefined;
      await auth.logout(rt);
    } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tenantSlug");
    setUser(null);
    setTenantSlugState("");
    window.location.href = "/auth/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenantSlug, loading, refreshUser, setTenantSlug, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
