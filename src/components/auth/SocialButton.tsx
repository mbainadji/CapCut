// src/components/auth/SocialButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

interface SocialButtonProps {
  provider: 'google' | 'facebook';
  onPress: () => void;
  loading?: boolean;
}

export default function SocialButton({ provider, onPress, loading = false }: SocialButtonProps) {
  const isGoogle = provider === 'google';

  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} disabled={loading} activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator size="small" color="#888" />
      ) : (
        <View style={styles.inner}>
          <Text style={styles.icon}>{isGoogle ? '🇬' : '🇫'}</Text>
          <Text style={styles.label}>{isGoogle ? 'Google' : 'Facebook'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    color: '#bbb',
    fontSize: 13,
  },
});