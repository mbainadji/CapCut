// src/screens/auth/RegisterScreen.tsx
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
import { register, loginWithGoogle, loginWithFacebook } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      setError('Remplissez tous les champs.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(fullName, email, password);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Compte créé !</Text>
          <Text style={styles.successSub}>
            Vérifiez votre boîte email pour confirmer votre compte.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnPrimaryText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.sub}>Rejoignez des milliers de créateurs.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <AuthInput
            label="Nom complet"
            placeholder="Jean Dupont"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />
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
            placeholder="Min. 8 caractères"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton provider="google" onPress={loginWithGoogle} />
            <View style={{ width: 10 }} />
            <SocialButton provider="facebook" onPress={loginWithFacebook} />
          </View>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Se connecter</Text>
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
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successEmoji: { fontSize: 52, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 10 },
  successSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backBtn: {
    width: 38, height: 38, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#222', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  backIcon: { color: '#888', fontSize: 18 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 13, color: '#555', marginBottom: 28 },
  errorBox: {
    backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#3A1010',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  btnPrimary: {
    backgroundColor: '#7C3AFF', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16, marginTop: 8,
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