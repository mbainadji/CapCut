// src/screens/auth/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/auth/Avatar';
import AuthInput from '../../components/auth/AuthInput';
import { updateProfile, updatePassword, logout } from '../../services/authService';

type Tab = 'compte' | 'securite' | 'preferences';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('compte');
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

  const provider = user?.app_metadata?.provider || 'email';

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
    if (newPassword.length < 8) {
      setPwMessage('Min. 8 caractères.');
      return;
    }
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
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // useAuth dans RootNavigator redirigera automatiquement
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>

        {/* Header profil */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Avatar
              name={name || user?.email || '?'}
              size={60}
              onPress={() => Alert.alert('Photo', 'Modifier la photo de profil')}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.userName}>{name || 'Utilisateur'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
              <Text style={styles.userProvider}>via {provider}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Pro</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { n: '24', l: 'Projets' },
              { n: '138', l: 'Vidéos' },
              { n: '4.2k', l: 'Vues' },
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

          {/* ── Onglet Compte ── */}
          {activeTab === 'compte' && (
            <>
              <SectionLabel title="Mon profil" />
              <MenuItem icon="👤" label="Modifier le profil" onPress={() => setEditName(!editName)} />
              {editName && (
                <View style={styles.editBlock}>
                  <AuthInput
                    label="Nom complet"
                    value={name}
                    onChangeText={setName}
                    placeholder="Votre nom"
                    autoCapitalize="words"
                  />
                  <TouchableOpacity style={styles.btnSmall} onPress={handleUpdateName}>
                    <Text style={styles.btnSmallText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              )}
              <MenuItem icon="🖼" label="Photo de profil" onPress={() => {}} />
              <SectionLabel title="Paramètres" />
              <MenuItem icon="🔔" label="Notifications push" onPress={() => {}} />
              <MenuItem icon="🌐" label="Langue & région" onPress={() => {}} />
              <MenuItem icon="📱" label="Appareils connectés" onPress={() => {}} />
            </>
          )}

          {/* ── Onglet Sécurité ── */}
          {activeTab === 'securite' && (
            <>
              <SectionLabel title="Mot de passe" />
              {provider === 'email' ? (
                <>
                  <AuthInput
                    label="Nouveau mot de passe"
                    placeholder="Min. 8 caractères"
                    isPassword
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  {!!pwMessage && (
                    <Text style={pwMessage.includes('!') ? styles.successMsg : styles.errorMsg}>
                      {pwMessage}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.btnSmall, loading && { opacity: 0.6 }]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.btnSmallText}>Mettre à jour</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.providerNote}>
                  Compte connecté via {provider}. Gérez votre mot de passe depuis votre compte {provider}.
                </Text>
              )}
              <SectionLabel title="Sessions" />
              <MenuItem icon="📱" label="Révoquer les autres sessions" onPress={() => Alert.alert('Sessions', 'Fonctionnalité à venir')} />
              <MenuItem icon="🔐" label="Authentification 2FA" onPress={() => Alert.alert('2FA', 'Fonctionnalité à venir')} />
            </>
          )}

          {/* ── Onglet Préférences ── */}
          {activeTab === 'preferences' && (
            <>
              <SectionLabel title="Affichage" />
              <MenuItem icon="🌙" label="Thème sombre / clair" onPress={() => {}} />
              <MenuItem icon="🎨" label="Qualité d'export par défaut" onPress={() => {}} />
              <SectionLabel title="Données" />
              <MenuItem icon="☁️" label="Sauvegarde automatique" onPress={() => {}} />
              <MenuItem
                icon="🗑"
                label="Supprimer mon compte"
                danger
                onPress={() => Alert.alert('Attention', 'Cette action est irréversible.', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => {} },
                ])}
              />
            </>
          )}

        </View>

        {/* Bouton déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composants internes ──────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function MenuItem({ icon, label, onPress, danger = false }: {
  icon: string; label: string; onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },

  // Header
  header: { backgroundColor: '#0F0A1E', padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  headerInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  userEmail: { fontSize: 11, color: '#555', marginTop: 2 },
  userProvider: { fontSize: 10, color: '#444', marginTop: 1 },
  badge: {
    backgroundColor: '#7C3AFF22', borderWidth: 1, borderColor: '#7C3AFF44',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { color: '#A78BFA', fontSize: 11 },
  statsRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#1A1A2E',
    borderRadius: 12, overflow: 'hidden',
  },
  statItem: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#0F0F1A' },
  statBorder: { borderRightWidth: 1, borderRightColor: '#1A1A2E' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 10, color: '#555', marginTop: 2 },

  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A1A2E' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#7C3AFF' },
  tabText: { fontSize: 12, color: '#444' },
  tabTextActive: { color: '#7C3AFF', fontWeight: '500' },

  // Content
  content: { padding: 16 },
  sectionLabel: {
    fontSize: 10, fontWeight: '500', color: '#444',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 16, marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0F0F1A', borderRadius: 10,
    padding: 12, marginBottom: 5,
  },
  menuIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 13, color: '#ccc' },
  menuLabelDanger: { color: '#FF4A4A' },
  menuArrow: { color: '#333', fontSize: 16 },

  // Edit block
  editBlock: { backgroundColor: '#0F0F1A', borderRadius: 12, padding: 12, marginBottom: 8 },
  btnSmall: {
    backgroundColor: '#7C3AFF', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  btnSmallText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Messages
  successMsg: { color: '#3AFFE0', fontSize: 12, marginBottom: 10 },
  errorMsg: { color: '#FF6B6B', fontSize: 12, marginBottom: 10 },
  providerNote: { fontSize: 12, color: '#555', lineHeight: 20, marginBottom: 12 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#2A1010',
    borderRadius: 12, padding: 14, margin: 16,
  },
  logoutIcon: { fontSize: 16 },
  logoutText: { color: '#FF4A4A', fontSize: 14, fontWeight: '500' },
});