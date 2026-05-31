// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { DeviceEventEmitter } from 'react-native';
import { supabase } from '../services/supabase';
import { getOfflineUser, LOCAL_AUTH_EVENT } from '../services/authService';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  offlineMode: boolean;
}

function createOfflineSession(user: any): Session {
  return {
    access_token: 'offline',
    refresh_token: 'offline',
    expires_in: 0,
    token_type: 'bearer',
    user,
  } as Session;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    const loadOfflineSession = async () => {
      const offlineUser = await getOfflineUser();
      setOfflineMode(!!offlineUser);
      setSession(offlineUser ? createOfflineSession(offlineUser) : null);
      setLoading(false);
      return !!offlineUser;
    };

    // Récupère la session existante au démarrage
    loadOfflineSession().then((offlineActive) => {
      if (offlineActive) return;
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });
    });

    const localSub = DeviceEventEmitter.addListener(LOCAL_AUTH_EVENT, () => {
      loadOfflineSession();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      setOfflineMode(false);
      setSession(data.session);
      setLoading(false);
    });

    // Écoute les changements de session (login, logout, OAuth)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (await getOfflineUser()) return;
      setOfflineMode(false);
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      localSub.remove();
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    offlineMode,
  };
}
