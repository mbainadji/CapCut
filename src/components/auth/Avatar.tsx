// src/components/auth/Avatar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
  onPress?: () => void;
}

export default function Avatar({ name, size = 56, onPress }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const fontSize = size * 0.3;

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      {onPress && (
        <View style={styles.editBadge}>
          <Text style={styles.editIcon}>✏</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7C3AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2A1A4A',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    backgroundColor: '#7C3AFF',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 9,
    color: '#fff',
  },
});