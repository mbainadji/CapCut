// src/components/auth/AuthInput.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
  error?: string;
}

export default function AuthInput({
  label,
  isPassword = false,
  error,
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputFocused, !!error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#444"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: '#7C3AFF',
  },
  inputError: {
    borderColor: '#FF4A4A',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});