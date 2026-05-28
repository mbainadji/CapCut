// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import AuthInput from '../../components/auth/AuthInput';
import SocialButton from '../../components/auth/SocialButton';
import { login, loginWithGoogle, loginWithFacebook } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError('Remplissez tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // La navigation vers Home est gérée automatiquement par useAuth dans RootNavigator
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Bouton retour */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Bon retour 👋</Text>
          <Text style={styles.sub}>Connectez-vous pour continuer à créer.</Text>

          {/* Message d'erreur */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Formulaire */}
          <AuthInput
            label="Email"
            placeholder="vous@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <AuthInput
            label="Mot de passe"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          {/* Mot de passe oublié */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Boutons sociaux */}
          <View style={styles.socialRow}>
            <SocialButton provider="google" onPress={loginWithGoogle} />
            <View style={{ width: 10 }} />
            <SocialButton provider="facebook" onPress={loginWithFacebook} />
          </View>

          {/* Lien inscription */}
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  container: { flexGrow: 1, padding: 24, paddingTop: 20 },
  backBtn: {
    width: 38, height: 38,
    backgroundColor: '#111',
    borderWidth: 1, borderColor: '#222',
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  backIcon: { color: '#888', fontSize: 18 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 13, color: '#555', marginBottom: 28, lineHeight: 20 },
  errorBox: {
    backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#3A1010',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotLink: { color: '#7C3AFF', fontSize: 13 },
  btnPrimary: {
    backgroundColor: '#7C3AFF', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1A1A2E' },
  dividerText: { color: '#444', fontSize: 12, marginHorizontal: 10 },
  socialRow: { flexDirection: 'row', marginBottom: 24 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { color: '#555', fontSize: 13 },
  link: { color: '#7C3AFF', fontSize: 13, fontWeight: '500' },
});