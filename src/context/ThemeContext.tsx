import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { supabase } from '../services/supabase';

export const colors = {
  background: '#F0F8FF',
  surface: '#FFFFFF',
  card: '#F5FBFF',
  text: '#0A1A2A',
  textSecondary: '#5A7A9A',
  border: '#C8E6F0',
  primary: '#00BCD4',
  primaryLight: '#B2EBF2',
  primaryDark: '#0097A7',
  danger: '#FF4A4A',
  success: '#4CAF50',
  inactive: '#90CAD8',
  white: '#FFFFFF',
  black: '#000000',
};

interface ThemeContextType {
  colors: typeof colors;
  dimensions: { width: number; height: number };
  sauvegardeAuto: boolean;
  setSauvegardeAuto: (v: boolean) => void;
  notifPush: boolean;
  setNotifPush: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors,
  dimensions: Dimensions.get('window'),
  sauvegardeAuto: true,
  setSauvegardeAuto: () => {},
  notifPush: true,
  setNotifPush: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [sauvegardeAuto, setSauvegardeAutoState] = useState(true);
  const [notifPush, setNotifPushState] = useState(true);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    chargerPreferences();
    return () => sub?.remove();
  }, []);

  const chargerPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('settings').eq('id', user.id).single();
      if (data?.settings) {
        if (data.settings.sauvegarde_auto !== undefined) setSauvegardeAutoState(data.settings.sauvegarde_auto);
        if (data.settings.notif_push !== undefined) setNotifPushState(data.settings.notif_push);
      }
    } catch {}
  };

  const sauvegarderPref = async (prefs: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('settings').eq('id', user.id).single();
      await supabase.from('profiles').update({
        settings: { ...(data?.settings || {}), ...prefs },
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
    } catch {}
  };

  const setSauvegardeAuto = (v: boolean) => {
    setSauvegardeAutoState(v);
    sauvegarderPref({ sauvegarde_auto: v });
  };

  const setNotifPush = (v: boolean) => {
    setNotifPushState(v);
    sauvegarderPref({ notif_push: v });
  };

  return (
    <ThemeContext.Provider value={{ colors, dimensions, sauvegardeAuto, setSauvegardeAuto, notifPush, setNotifPush }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
