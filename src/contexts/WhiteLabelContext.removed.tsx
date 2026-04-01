import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WhiteLabelSettings {
  clinicName: string;
  clinicSubtitle: string;
  logoUrl: string | null;
  primaryColor: string; // HSL string like "24 95% 53%"
  faviconUrl: string | null;
}

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  clinicName: "Loja",
  clinicSubtitle: "CRM",
  logoUrl: null,
  primaryColor: "195 100% 50%",
  faviconUrl: null,
};

interface WhiteLabelContextType {
  settings: WhiteLabelSettings;
  updateSettings: (updates: Partial<WhiteLabelSettings>) => void;
  resetSettings: () => void;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

function applyPrimaryColor(hsl: string) {
  document.documentElement.style.setProperty("--primary", hsl);
  document.documentElement.style.setProperty("--ring", hsl);
  document.documentElement.style.setProperty("--sidebar-primary", hsl);
  document.documentElement.style.setProperty("--sidebar-ring", hsl);
}

function applyFavicon(url: string | null) {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url || "/favicon.ico";
}

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WhiteLabelSettings>(DEFAULT_SETTINGS);
  const { clinicId, isPlatformAdmin } = useAuth();

  useEffect(() => {
    if (!clinicId) {
      if (isPlatformAdmin) {
        setSettings(DEFAULT_SETTINGS);
      }
      return;
    }

    const fetchClinic = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("name, clinic_subtitle, primary_color, logo_url, favicon_url")
        .eq("id", clinicId)
        .single();

      if (data) {
        setSettings({
          clinicName: data.name,
          clinicSubtitle: data.clinic_subtitle || DEFAULT_SETTINGS.clinicSubtitle,
          primaryColor: data.primary_color || DEFAULT_SETTINGS.primaryColor,
          logoUrl: data.logo_url || null,
          faviconUrl: data.favicon_url || null,
        });
      }
    };

    fetchClinic();
  }, [clinicId, isPlatformAdmin]);

  useEffect(() => {
    applyPrimaryColor(settings.primaryColor);
    applyFavicon(settings.faviconUrl);
    document.title = `${settings.clinicName} ${settings.clinicSubtitle}`.trim();
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<WhiteLabelSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <WhiteLabelContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const ctx = useContext(WhiteLabelContext);
  if (!ctx) throw new Error("useWhiteLabel must be used within WhiteLabelProvider");
  return ctx;
}
