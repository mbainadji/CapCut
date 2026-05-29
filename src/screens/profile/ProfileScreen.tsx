import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Switch, Modal, FlatList,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/auth/Avatar';
import AuthInput from '../../components/auth/AuthInput';
import { updateProfile, updatePassword, logout } from '../../services/authService';
import { supabase } from '../../services/supabase';
import { launchImageLibrary } from 'react-native-image-picker';

type Tab = 'compte' | 'securite' | 'preferences';

const LANGUES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'ar', label: '🇸🇦 العربية' },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('compte');
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Stats dynamiques
  const [stats, setStats] = useState({ projets: 0, videos: 0, vues: 0 });

  // Préférences
  const [notifPush, setNotifPush] = useState(true);
  const [langue, setLangue] = useState('fr');
  const [modalLangue, setModalLangue] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  const provider = user?.app_metadata?.provider || 'email';

  useEffect(() => {
    chargerProfil();
    chargerStats();
    chargerSessions();
  }, []);

  // ── Charger profil depuis Supabase ────────────────────────────────────────
  const chargerProfil = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setAvatarUrl(data.avatar_url);
      setName(data.full_name || user?.user_metadata?.full_name || '');
      if (data.settings) {
        setNotifPush(data.settings.notif_push ?? true);
        setLangue(data.settings.langue ?? 'fr');
      }
    }
  };

  // ── Stats dynamiques ──────────────────────────────────────────────────────
  const chargerStats = async () => {
    if (!user) return;
    const { count: nbProjets } = await supabase
      .from('projets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: nbVideos } = await supabase
      .from('medias_secondaires')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: projetsData } = await supabase
      .from('projets')
      .select('id')
      .eq('user_id', user.id);

    setStats({
      projets: nbProjets || 0,
      videos: nbVideos || 0,
      vues: (projetsData?.length || 0) * 42, // simulé
    });
  };

  // ── Sessions ──────────────────────────────────────────────────────────────
  const chargerSessions = async () => {
    // Supabase ne liste pas directement les sessions, on affiche la session courante
    setSessions([
      { id: '1', device: '📱 Appareil actuel', location: 'Yaoundé, CM', active: true },
    ]);
  };

  // ── Upload photo de profil ────────────────────────────────────────────────
  const modifierPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets && result.assets[0] && user) {
      setUploadingAvatar(true);
      try {
        const asset = result.assets[0];
        const fileExt = asset.uri?.split('.').pop() || 'jpg';
        const filePath = `avatars/${user.id}.${fileExt}`;

        const response = await fetch(asset.uri!);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('medias')
          .upload(filePath, arrayBuffer, {
            contentType: asset.type || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('medias')
          .getPublicUrl(filePath);

        await supabase.from('profiles').update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);

        setAvatarUrl(urlData.publicUrl);
        Alert.alert('✅', 'Photo de profil mise à jour');
      } catch (e: any) {
        Alert.alert('Erreur', e.message);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  // ── Sauvegarder préférences ───────────────────────────────────────────────
  const sauvegarderPreferences = async (nouvPrefs: any) => {
    if (!user) return;
    await supabase.from('profiles').update({
      settings: nouvPrefs,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  };

  const toggleNotif = (val: boolean) => {
    setNotifPush(val);
    sauvegarderPreferences({ notif_push: val, langue });
  };

  const changerLangue = (code: string) => {
    setLangue(code);
    setModalLangue(false);
    sauvegarderPreferences({ notif_push: notifPush, langue: code });
  };

  async function handleUpdateName() {
    try {
      await updateProfile(name);
      setEditName(false);
      Alert.alert('✓', 'Profil mis à jour.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 8) { setPwMessage('Min. 8 caractères.'); return; }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      setPwMessage('Mot de passe mis à jour !');
      setNewPassword('');
    } catch (e: any) {
      setPwMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => await logout() },
    ]);
  }

  const langueLabel = LANGUES.find(l => l.code === langue)?.label || '🇫🇷 Français';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={modifierPhoto} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator color="#7C3AFF" size="large" />
              ) : (
                <Avatar name={name || user?.email || '?'} size={60} onPress={modifierPhoto} />
              )}
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.userName}>{name || 'Utilisateur'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
              <Text style={styles.userProvider}>via {provider}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Pro</Text>
            </View>
          </View>

          {/* Stats dynamiques */}
          <View style={styles.statsRow}>
            {[
              { n: stats.projets.toString(), l: 'Projets' },
              { n: stats.videos.toString(), l: 'Vidéos' },
              { n: stats.vues > 999 ? `${(stats.vues/1000).toFixed(1)}k` : stats.vues.toString(), l: 'Vues' },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
                <Text style={styles.statNum}>{s.n}</Text>
                <Text style={styles.statLabel}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['compte', 'securite', 'preferences'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'securite' ? 'Sécurité' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>

          {/* ── Compte ── */}
          {activeTab === 'compte' && (
            <>
              <SectionLabel title="Mon profil" />
              <MenuItem icon="👤" label="Modifier le nom" onPress={() => setEditName(!editName)} />
              {editName && (
                <View style={styles.editBlock}>
                  <AuthInput label="Nom complet" value={name} onChangeText={setName}
                    placeholder="Votre nom" autoCapitalize="words" />
                  <TouchableOpacity style={styles.btnSmall} onPress={handleUpdateName}>
                    <Text style={styles.btnSmallText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              )}
              <MenuItem icon="🖼" label="Photo de profil" onPress={modifierPhoto}
                subtitle={avatarUrl ? '✅ Photo définie' : 'Aucune photo'} />

              <SectionLabel title="Paramètres" />

              {/* Notifications avec toggle */}
              <View style={styles.menuItem}>
                <Text style={styles.menuIcon}>🔔</Text>
                <Text style={styles.menuLabel}>Notifications push</Text>
                <Switch
                  value={notifPush}
                  onValueChange={toggleNotif}
                  trackColor={{ false: '#222', true: '#7C3AFF' }}
                  thumbColor={notifPush ? '#fff' : '#555'}
                />
              </View>

              {/* Langue */}
              <MenuItem icon="🌐" label="Langue & région"
                subtitle={langueLabel}
                onPress={() => setModalLangue(true)} />

              {/* Appareils connectés */}
              <SectionLabel title="Appareils connectés" />
              {sessions.map(s => (
                <View key={s.id} style={styles.sessionItem}>
                  <Text style={styles.menuIcon}>{s.device}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionDevice}>{s.location}</Text>
                    {s.active && <Text style={styles.sessionActive}>● Session active</Text>}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── Sécurité ── */}
          {activeTab === 'securite' && (
            <>
              <SectionLabel title="Mot de passe" />
              {provider === 'email' ? (
                <>
                  <AuthInput label="Nouveau mot de passe" placeholder="Min. 8 caractères"
                    isPassword value={newPassword} onChangeText={setNewPassword} />
                  {!!pwMessage && (
                    <Text style={pwMessage.includes('!') ? styles.successMsg : styles.errorMsg}>
                      {pwMessage}
                    </Text>
                  )}
                  <TouchableOpacity style={[styles.btnSmall, loading && { opacity: 0.6 }]}
                    onPress={handleUpdatePassword} disabled={loading}>
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.btnSmallText}>Mettre à jour</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.providerNote}>
                  Compte connecté via {provider}. Gérez votre mot de passe depuis votre compte {provider}.
                </Text>
              )}
              <SectionLabel title="Sessions" />
              <MenuItem icon="🔐" label="Authentification 2FA"
                onPress={() => Alert.alert('2FA', 'Fonctionnalité à venir')} />
            </>
          )}

          {/* ── Préférences ── */}
          {activeTab === 'preferences' && (
            <>
              <SectionLabel title="Affichage" />
              <MenuItem icon="🌙" label="Thème sombre / clair" onPress={() => Alert.alert('Thème', 'Fonctionnalité à venir')} />
              <MenuItem icon="🎨" label="Qualité d'export par défaut" onPress={() => Alert.alert('Qualité', 'Fonctionnalité à venir')} />
              <SectionLabel title="Données" />
              <MenuItem icon="☁️" label="Sauvegarde automatique" onPress={() => Alert.alert('Sauvegarde', 'Fonctionnalité à venir')} />
              <MenuItem icon="🗑" label="Supprimer mon compte" danger
                onPress={() => Alert.alert('Attention', 'Cette action est irréversible.', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => {} },
                ])} />
            </>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal Langue */}
      <Modal visible={modalLangue} transparent animationType="slide" onRequestClose={() => setModalLangue(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir la langue</Text>
            <FlatList
              data={LANGUES}
              keyExtractor={i => i.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.langueItem, langue === item.code && styles.langueActive]}
                  onPress={() => changerLangue(item.code)}>
                  <Text style={styles.langueLabel}>{item.label}</Text>
                  {langue === item.code && <Text style={{ color: '#7C3AFF' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalFermer} onPress={() => setModalLangue(false)}>
              <Text style={{ color: '#fff' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function MenuItem({ icon, label, onPress, danger = false, subtitle }: {
  icon: string; label: string; onPress: () => void; danger?: boolean; subtitle?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { backgroundColor: '#0F0A1E', padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  headerInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  userEmail: { fontSize: 11, color: '#555', marginTop: 2 },
  userProvider: { fontSize: 10, color: '#444', marginTop: 1 },
  badge: { backgroundColor: '#7C3AFF22', borderWidth: 1, borderColor: '#7C3AFF44', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#A78BFA', fontSize: 11 },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#1A1A2E', borderRadius: 12, overflow: 'hidden' },
  statItem: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#0F0F1A' },
  statBorder: { borderRightWidth: 1, borderRightColor: '#1A1A2E' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 10, color: '#555', marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A1A2E' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#7C3AFF' },
  tabText: { fontSize: 12, color: '#444' },
  tabTextActive: { color: '#7C3AFF', fontWeight: '500' },
  content: { padding: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '500', color: '#444', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F0F1A', borderRadius: 10, padding: 12, marginBottom: 5 },
  menuIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  menuLabel: { fontSize: 13, color: '#ccc' },
  menuLabelDanger: { color: '#FF4A4A' },
  menuSubtitle: { fontSize: 10, color: '#444', marginTop: 2 },
  menuArrow: { color: '#333', fontSize: 16 },
  editBlock: { backgroundColor: '#0F0F1A', borderRadius: 12, padding: 12, marginBottom: 8 },
  btnSmall: { backgroundColor: '#7C3AFF', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnSmallText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  successMsg: { color: '#3AFFE0', fontSize: 12, marginBottom: 10 },
  errorMsg: { color: '#FF6B6B', fontSize: 12, marginBottom: 10 },
  providerNote: { fontSize: 12, color: '#555', lineHeight: 20, marginBottom: 12 },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F0F1A', borderRadius: 10, padding: 12, marginBottom: 5 },
  sessionDevice: { fontSize: 13, color: '#ccc' },
  sessionActive: { fontSize: 10, color: '#3AFFE0', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#2A1010', borderRadius: 12, padding: 14, margin: 16 },
  logoutIcon: { fontSize: 16 },
  logoutText: { color: '#FF4A4A', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F0F1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  langueItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 10, marginBottom: 4 },
  langueActive: { backgroundColor: '#1A1A2E' },
  langueLabel: { color: '#ccc', fontSize: 14 },
  modalFermer: { backgroundColor: '#7C3AFF', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 10 },
});
