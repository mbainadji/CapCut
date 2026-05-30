import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import AuthInput from '../../components/auth/AuthInput';
import { resetPassword } from '../../services/authService';
import { colors } from '../../context/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!email) { setError('Entrez votre email'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={s.container}>
        <TouchableOpacity style={s.retour} onPress={() => navigation.goBack()}>
          <Text style={s.retourText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.titre}>Mot de passe oublié ?</Text>
        <Text style={s.sousTitre}>Entrez votre email pour recevoir un lien de réinitialisation.</Text>
        {sent ? (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Email envoyé ! Vérifiez votre boîte mail.</Text>
          </View>
        ) : (
          <>
            {!!error && <View style={s.erreurBox}><Text style={s.erreurText}>{error}</Text></View>}
            <AuthInput label="Email" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" placeholder="votre@email.com" />
            <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnText}>Envoyer le lien</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24 },
  retour: { marginBottom: 24 },
  retourText: { color: colors.primary, fontSize: 14 },
  titre: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  sousTitre: { fontSize: 14, color: colors.textSecondary, marginBottom: 32 },
  erreurBox: { backgroundColor: '#FFF0F0', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFD0D0' },
  erreurText: { color: colors.danger, fontSize: 13 },
  successBox: { backgroundColor: '#F0FFF4', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#C6F6D5' },
  successText: { color: colors.success, fontSize: 14 },
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 2 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
