import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import AuthInput from '../../components/auth/AuthInput';
import { register } from '../../services/authService';
import { colors } from '../../context/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) { setError('Remplissez tous les champs'); return; }
    if (password.length < 6) { setError('Mot de passe : min. 6 caractères'); return; }
    setLoading(true); setError('');
    try {
      await register(fullName, email, password);
      setSuccess(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (success) return (
    <SafeAreaView style={s.safe}>
      <View style={s.successContainer}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitre}>Compte créé !</Text>
        <Text style={s.successTexte}>Vérifiez votre email pour confirmer votre compte.</Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Login')}>
          <Text style={s.btnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container}>
          <TouchableOpacity style={s.retour} onPress={() => navigation.goBack()}>
            <Text style={s.retourText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={s.titre}>Créer un compte</Text>
          <Text style={s.sousTitre}>Rejoignez des milliers de créateurs.</Text>
          {!!error && <View style={s.erreurBox}><Text style={s.erreurText}>{error}</Text></View>}
          <AuthInput label="Nom complet" value={fullName} onChangeText={setFullName}
            placeholder="Votre nom" autoCapitalize="words" />
          <AuthInput label="Email" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" placeholder="votre@email.com" />
          <AuthInput label="Mot de passe" value={password} onChangeText={setPassword}
            isPassword placeholder="Min. 6 caractères" />
          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnText}>Créer mon compte</Text>}
          </TouchableOpacity>
          <View style={s.footer}>
            <Text style={s.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24 },
  retour: { marginBottom: 24 },
  retourText: { color: colors.primary, fontSize: 14 },
  titre: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  sousTitre: { fontSize: 14, color: colors.textSecondary, marginBottom: 32 },
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFD0D0' },
  erreurText: { color: colors.danger, fontSize: 13 },
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 2, marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textSecondary, fontSize: 13 },
  footerLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  successIcon: { fontSize: 64 },
  successTitre: { fontSize: 24, fontWeight: '800', color: colors.text },
  successTexte: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
