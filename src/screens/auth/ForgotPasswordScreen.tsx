// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import AuthInput from '../../components/auth/AuthInput';
import { resetPassword } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!email) {
      setError('Entrez votre adresse email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'envoi.');
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
        <View style={styles.container}>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Mot de passe{'\n'}oublié ?</Text>
          <Text style={styles.sub}>
            Entrez votre email, on vous envoie{'\n'}un lien de réinitialisation.
          </Text>

          {/* Succès */}
          {sent && (
            <View style={styles.successBox}>
              <Text style={styles.successDot}>●</Text>
              <Text style={styles.successText}>Email envoyé ! Vérifiez votre boîte.</Text>
            </View>
          )}

          {/* Erreur */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <AuthInput
            label="Email"
            placeholder="vous@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!sent}
          />

          {!sent && (
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>Envoyer le lien</Text>
              }
            </TouchableOpacity>
          )}

          {sent && (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Retour à la connexion</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
            <Text style={styles.link}>← Retour à la connexion</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  container: { flex: 1, padding: 24, paddingTop: 20 },
  backBtn: {
    width: 38, height: 38, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#222', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  backIcon: { color: '#888', fontSize: 18 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.8, marginBottom: 6, lineHeight: 36 },
  sub: { fontSize: 13, color: '#555', marginBottom: 28, lineHeight: 20 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0A2218', borderWidth: 1, borderColor: '#1A4A30',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  successDot: { color: '#3AFFE0', fontSize: 8 },
  successText: { color: '#3AFFE0', fontSize: 13 },
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
  linkRow: { alignItems: 'center', marginTop: 8 },
  link: { color: '#7C3AFF', fontSize: 13 },
});