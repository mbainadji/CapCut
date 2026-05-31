import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { clearOfflineProjects } from './offlineProjectService';

export const OFFLINE_SESSION_KEY = 'clipx.offline.session';
export const LOCAL_AUTH_EVENT = 'clipx.local-auth-change';

export type OfflineUser = {
  id: string;
  email: string;
  user_metadata: { full_name: string };
  app_metadata: { provider: string };
};

export async function getOfflineUser(): Promise<OfflineUser | null> {
  const raw = await AsyncStorage.getItem(OFFLINE_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function isOfflineMode() {
  return !!(await getOfflineUser());
}

export async function enterOfflineMode() {
  const user: OfflineUser = {
    id: 'offline-user',
    email: 'mode.hors.connexion@local',
    user_metadata: { full_name: 'Utilisateur hors connexion' },
    app_metadata: { provider: 'hors connexion' },
  };
  await AsyncStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(user));
  DeviceEventEmitter.emit(LOCAL_AUTH_EVENT);
}

// ── Inscription ──────────────────────────────────────────────────────────────
export async function register(fullName: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw error;

  // Créer le profil dans la table profiles
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      username: email.split('@')[0],
      avatar_url: null,
      updated_at: new Date().toISOString(),
    });
  }

  return data;
}

// ── Connexion email/mot de passe ─────────────────────────────────────────────
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ── Connexion Google ─────────────────────────────────────────────────────────
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'capcut://auth/callback' },
  });
  if (error) throw error;
  return data;
}

// ── Connexion Facebook ───────────────────────────────────────────────────────
export async function loginWithFacebook() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: 'capcut://auth/callback' },
  });
  if (error) throw error;
  return data;
}

// ── Mot de passe oublié ──────────────────────────────────────────────────────
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'capcut://auth/reset-password',
  });
  if (error) throw error;
}

// ── Modifier le profil ───────────────────────────────────────────────────────
export async function updateProfile(fullName: string) {
  const offlineUser = await getOfflineUser();
  if (offlineUser) {
    await AsyncStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
      ...offlineUser,
      user_metadata: { ...offlineUser.user_metadata, full_name: fullName },
    }));
    DeviceEventEmitter.emit(LOCAL_AUTH_EVENT);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });
  if (error) throw error;

  await supabase.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    updated_at: new Date().toISOString(),
  });
}

// ── Modifier le mot de passe ─────────────────────────────────────────────────
export async function updatePassword(newPassword: string) {
  if (await isOfflineMode()) throw new Error('Mot de passe indisponible en mode hors connexion');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── Déconnexion ──────────────────────────────────────────────────────────────
export async function logout() {
  const offline = await isOfflineMode();
  if (offline) {
    await AsyncStorage.removeItem(OFFLINE_SESSION_KEY);
    DeviceEventEmitter.emit(LOCAL_AUTH_EVENT);
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Session courante ─────────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ── Récupérer le profil ──────────────────────────────────────────────────────
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

// ── Supprimer le compte ───────────────────────────────────────────────────────
export async function deleteAccount() {
  if (await isOfflineMode()) {
    await clearOfflineProjects();
    await AsyncStorage.removeItem(OFFLINE_SESSION_KEY);
    DeviceEventEmitter.emit(LOCAL_AUTH_EVENT);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');

  // Supprimer les données utilisateur
  await supabase.from('projets').delete().eq('user_id', user.id);
  await supabase.from('medias_secondaires').delete().eq('user_id', user.id);
  await supabase.from('exportations').delete().eq('user_id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);

  // Déconnexion
  await supabase.auth.signOut();
}
