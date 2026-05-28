// src/screens/auth/WelcomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import SocialButton from '../../components/auth/SocialButton';
import { loginWithGoogle, loginWithFacebook } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>
            Clip<Text style={styles.logoAccent}>X</Text>
          </Text>
          <Text style={styles.tagline}>Montez. Créez. Partagez.</Text>
        </View>

        {/* Boutons principaux */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Créer un compte</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Boutons sociaux */}
          <View style={styles.socialRow}>
            <SocialButton provider="google" onPress={loginWithGoogle} />
            <View style={styles.socialGap} />
            <SocialButton provider="facebook" onPress={loginWithFacebook} />
          </View>

          {/* Lien inscription */}
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  logoAccent: {
    color: '#7C3AFF',
  },
  tagline: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  actions: {
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: '#7C3AFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnSecondaryText: {
    color: '#ccc',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1A1A2E',
  },
  dividerText: {
    color: '#444',
    fontSize: 12,
    marginHorizontal: 10,
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  socialGap: {
    width: 10,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#555',
    fontSize: 13,
  },
  link: {
    color: '#7C3AFF',
    fontSize: 13,
    fontWeight: '500',
  },
});