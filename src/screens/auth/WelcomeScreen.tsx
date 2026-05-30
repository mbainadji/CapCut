import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../context/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'> };

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={s.container}>
        {/* Logo */}
        <View style={s.logoSection}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>C</Text>
          </View>
          <Text style={s.appName}>Clip<Text style={s.appNameAccent}>X</Text></Text>
          <Text style={s.tagline}>Créez. Éditez. Partagez.</Text>
        </View>

        {/* Boutons principaux */}
        <View style={s.btnsSection}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Register')}>
            <Text style={s.btnPrimaryText}>Créer un compte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('Login')}>
            <Text style={s.btnSecondaryText}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>En continuant, vous acceptez nos conditions d'utilisation</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingVertical: 60 },
  logoSection: { alignItems: 'center', gap: 12 },
  logoCircle: { width: 90, height: 90, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  logoText: { color: colors.white, fontSize: 48, fontWeight: '900' },
  appName: { fontSize: 36, fontWeight: '900', color: colors.text },
  appNameAccent: { color: colors.primary },
  tagline: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  btnsSection: { gap: 12 },
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnSecondary: { backgroundColor: colors.white, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: colors.primary },
  btnSecondaryText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  footer: { color: colors.inactive, fontSize: 11, textAlign: 'center' },
});
