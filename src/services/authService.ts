// src/services/authService.ts
import { supabase } from './supabase';

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
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });
  if (error) throw error;
}

// ── Modifier le mot de passe ─────────────────────────────────────────────────
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── Déconnexion ──────────────────────────────────────────────────────────────
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Session courante ─────────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
