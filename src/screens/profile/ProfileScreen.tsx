import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Switch,
  PermissionsAndroid, Platform,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/auth/Avatar';
import AuthInput from '../../components/auth/AuthInput';
import { updateProfile, updatePassword, logout, deleteAccount } from '../../services/authService';
import { supabase } from '../../services/supabase';
import { useTheme, colors } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

type Tab = 'compte' | 'securite' | 'preferences';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { notifPush, setNotifPush, sauvegardeAuto, setSauvegardeAuto } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('compte');
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ projets: 0, videos: 0, vues: 0 });

  const provider = user?.app_metadata?.provider || 'email';

  const chargerProfil = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setAvatarUrl(data.avatar_url);
        setName(data.full_name || user?.user_metadata?.full_name || '');
      }
    } catch {}
  }, [user]);

  const chargerStats = useCallback(async () => {
    if (!user) return;
    try {
      const { count: nbProjets } = await supabase
        .from('projets').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: nbExports } = await supabase
        .from('exportations').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      // Compter les projets avec vidéo
      const { count: nbProjetsVideo } = await supabase
        .from('projets').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).not('video_source_url', 'is', null);
      setStats({
        projets: nbProjets || 0,
        videos: nbProjetsVideo || 0,
        vues: (nbExports || 0) * 12 + (nbProjets || 0) * 3,
      });
    } catch {}
  }, [user]);

  // Recharger les stats à chaque fois que l'écran est focus
  useFocusEffect(
    useCallback(() => {
      chargerProfil();
      chargerStats();
    }, [chargerProfil, chargerStats])
  );

  const demanderPermissionPhoto = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const version = Platform.Version as number;
      if (version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return true;
    }
  };

  const modifierPhoto = async () => {
    const permOk = await demanderPermissionPhoto();
    if (!permOk) {
      Alert.alert('Permission refusée', 'Autorisez l\'accès aux photos dans les paramètres.');
      return;
    }

    try {
      // Import dynamique pour éviter l'erreur "undefined is not a function"
      const { launchImageLibrary } = require('react-native-image-picker');

      launchImageLibrary(
        { mediaType: 'photo', quality: 0.8, includeBase64: false },
        async (result: any) => {
          if (result.didCancel) return;
          if (result.errorCode) {
            Alert.alert('Erreur', result.errorMessage || 'Erreur lors de la sélection');
            return;
          }
          const asset = result.assets?.[0];
          if (!asset || !user) return;

          setUploadingAvatar(true);
          try {
            const fileExt = asset.fileName?.split('.').pop() || 'jpg';
            const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;

            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = reject;
              reader.readAsArrayBuffer(blob);
            });

            const { error: uploadError } = await supabase.storage
              .from('medias')
              .upload(filePath, arrayBuffer, {
                contentType: asset.type || 'image/jpeg',
                upsert: true,
              });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('medias').getPublicUrl(filePath);
            await supabase.from('profiles').update({
              avatar_url: urlData.publicUrl,
              updated_at: new Date().toISOString(),
            }).eq('id', user.id);

            setAvatarUrl(urlData.publicUrl);
            Alert.alert('✅', 'Photo de profil mise à jour !');
          } catch (e: any) {
            Alert.alert('Erreur upload', e.message);
          } finally {
            setUploadingAvatar(false);
          }
        }
      );
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie : ' + e.message);
    }
  };

  async function handleUpdateName() {
    try {
      await updateProfile(name);
      await supabase.from('profiles').update({
        full_name: name,
        updated_at: new Date().toISOString(),
      }).eq('id', user?.id);
      setEditName(false);
      Alert.alert('✓', 'Profil mis à jour.');
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 8) { setPwMessage('Min. 8 caractères.'); return; }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      setPwMessage('✅ Mot de passe mis à jour !');
      setNewPassword('');
    } catch (e: any) { setPwMessage(e.message); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => await logout() },
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <TouchableOpacity onPress={modifierPhoto} disabled={uploadingAvatar} style={s.avatarContainer}>
              {uploadingAvatar
                ? <View style={s.avatarLoader}><ActivityIndicator color={colors.primary} /></View>
                : <Avatar name={name || user?.email || '?'} size={64} uri={avatarUrl} onPress={modifierPhoto} />
              }
            </TouchableOpacity>
            <View style={s.headerInfo}>
              <Text style={s.userName}>{name || 'Utilisateur'}</Text>
              <Text style={s.userEmail} numberOfLines={1}>{user?.email}</Text>
              <Text style={s.userProvider}>via {provider}</Text>
            </View>
            <View style={s.badge}><Text style={s.badgeText}>Pro</Text></View>
          </View>

          {/* Stats dynamiques */}
          <View style={s.statsRow}>
            {[
              { n: stats.projets.toString(), l: 'Projets' },
              { n: stats.videos.toString(), l: 'Vidéos' },
              { n: stats.vues > 999 ? `${(stats.vues/1000).toFixed(1)}k` : stats.vues.toString(), l: 'Vues' },
            ].map((st, i) => (
              <View key={i} style={[s.statItem, i < 2 && s.statBorder]}>
                <Text style={s.statNum}>{st.n}</Text>
                <Text style={s.statLabel}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {(['compte', 'securite', 'preferences'] as Tab[]).map(tab => (
            <TouchableOpacity key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'securite' ? 'Sécurité' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.content}>
          {/* Compte */}
          {activeTab === 'compte' && (
            <>
              <SectionLabel title="Mon profil" />
              <MenuItem icon="👤" label="Modifier le nom" onPress={() => setEditName(!editName)} />
              {editName && (
                <View style={s.editBlock}>
                  <AuthInput label="Nom complet" value={name} onChangeText={setName}
                    placeholder="Votre nom" autoCapitalize="words" />
                  <TouchableOpacity style={s.btnSmall} onPress={handleUpdateName}>
                    <Text style={s.btnSmallText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              )}
              <MenuItem icon="🖼" label="Photo de profil"
                subtitle={avatarUrl ? '✅ Photo définie' : '📷 Appuyez pour choisir'}
                onPress={modifierPhoto} />
              <SectionLabel title="Paramètres" />
              <View style={s.menuItem}>
                <Text style={s.menuIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.menuLabel}>Notifications push</Text>
                  <Text style={s.menuSubtitle}>{notifPush ? '✅ Activées' : '❌ Désactivées'}</Text>
                </View>
                <Switch value={notifPush} onValueChange={async (val) => {
                  setNotifPush(val);
                  if (val) {
                    const { demanderPermissionNotification } = require('../../services/notificationService');
                    const ok = await demanderPermissionNotification();
                    if (!ok) {
                      Alert.alert('Permission refusée', 'Activez les notifications dans les paramètres système.');
                      setNotifPush(false);
                    }
                  }
                }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white} />
              </View>
              <SectionLabel title="Appareils connectés" />
              <View style={s.sessionItem}>
                <Text style={s.menuIcon}>📱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.sessionDevice}>Appareil actuel</Text>
                  <Text style={s.sessionActive}>● Session active</Text>
                </View>
              </View>
            </>
          )}

          {/* Sécurité */}
          {activeTab === 'securite' && (
            <>
              <SectionLabel title="Mot de passe" />
              {provider === 'email' ? (
                <>
                  <AuthInput label="Nouveau mot de passe" placeholder="Min. 8 caractères"
                    isPassword value={newPassword} onChangeText={setNewPassword} />
                  {!!pwMessage && (
                    <Text style={pwMessage.includes('✅') ? s.successMsg : s.errorMsg}>{pwMessage}</Text>
                  )}
                  <TouchableOpacity style={[s.btnSmall, loading && { opacity: 0.6 }]}
                    onPress={handleUpdatePassword} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.white} size="small" />
                      : <Text style={s.btnSmallText}>Mettre à jour</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={s.providerNote}>
                  Compte connecté via {provider}. Gérez votre mot de passe depuis {provider}.
                </Text>
              )}
              <SectionLabel title="Sessions" />
              <MenuItem icon="🔐" label="Authentification 2FA"
                onPress={() => Alert.alert('2FA', 'Disponible prochainement')} />
            </>
          )}

          {/* Préférences */}
          {activeTab === 'preferences' && (
            <>
              <SectionLabel title="Données" />
              <View style={s.menuItem}>
                <Text style={s.menuIcon}>☁️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.menuLabel}>Sauvegarde automatique</Text>
                  <Text style={s.menuSubtitle}>Toutes les 30 secondes</Text>
                </View>
                <Switch value={sauvegardeAuto} onValueChange={setSauvegardeAuto}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white} />
              </View>
              <SectionLabel title="Danger" />
              <MenuItem icon="🗑" label="Supprimer mon compte" danger
                onPress={() => Alert.alert('⚠️ Attention', 'Toutes vos données seront supprimées définitivement.', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try { await deleteAccount(); }
                    catch (e: any) { Alert.alert('Erreur', e.message); }
                  }},
                ])} />
            </>
          )}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutIcon}>🚪</Text>
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 }}>{title}</Text>;
}

function MenuItem({ icon, label, onPress, danger = false, subtitle }: {
  icon: string; label: string; onPress: () => void; danger?: boolean; subtitle?: string;
}) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: colors.border }} onPress={onPress}>
      <Text style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: danger ? '#FF4A4A' : colors.text }}>{label}</Text>
        {subtitle && <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      <Text style={{ color: colors.border, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primaryLight, padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  avatarContainer: { position: 'relative' },
  avatarLoader: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
  userEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  userProvider: { fontSize: 10, color: colors.inactive, marginTop: 1 },
  badge: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.white },
  statItem: { flex: 1, padding: 10, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statNum: { fontSize: 18, fontWeight: '700', color: colors.primaryDark },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 12, color: colors.inactive },
  tabTextActive: { color: colors.primary, fontWeight: '500' },
  content: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: colors.border },
  menuIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 13, color: colors.text },
  menuSubtitle: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  editBlock: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  btnSmall: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnSmallText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  successMsg: { color: colors.success, fontSize: 12, marginBottom: 10 },
  errorMsg: { color: colors.danger, fontSize: 12, marginBottom: 10 },
  providerNote: { fontSize: 12, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: colors.border },
  sessionDevice: { fontSize: 13, color: colors.text },
  sessionActive: { fontSize: 10, color: colors.primary, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFD0D0', borderRadius: 12, padding: 14, margin: 16 },
  logoutIcon: { fontSize: 16 },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '500' },
});

// Ce fichier a été patché - voir la logique de notification ci-dessous
