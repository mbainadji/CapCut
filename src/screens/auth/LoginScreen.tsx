import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import AuthInput from '../../components/auth/AuthInput';
import { login } from '../../services/authService';
import { colors } from '../../context/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Remplissez tous les champs'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container}>
          <TouchableOpacity style={s.retour} onPress={() => navigation.goBack()}>
            <Text style={s.retourText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={s.titre}>Bon retour 👋</Text>
          <Text style={s.sousTitre}>Connectez-vous pour continuer à créer.</Text>

          {!!error && <View style={s.erreurBox}><Text style={s.erreurText}>{error}</Text></View>}

          <AuthInput label="Email" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" placeholder="votre@email.com" />
          <AuthInput label="Mot de passe" value={password} onChangeText={setPassword}
            isPassword placeholder="Votre mot de passe" />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={s.forgotBtn}>
            <Text style={s.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnText}>Se connecter</Text>}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.footerLink}>S'inscrire</Text>
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
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: colors.primary, fontSize: 13 },
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 2 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textSecondary, fontSize: 13 },
  footerLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
