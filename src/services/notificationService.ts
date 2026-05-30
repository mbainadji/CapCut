import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { supabase } from './supabase';

export async function demanderPermissionNotification(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const version = Platform.Version as number;
    if (version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch {
    return false;
  }
}

export async function sauvegarderTokenNotif(userId: string, token: string) {
  try {
    await supabase.from('profiles').update({
      settings: { fcm_token: token },
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
  } catch {}
}

export function afficherNotificationLocale(titre: string, message: string) {
  Alert.alert(titre, message);
}
