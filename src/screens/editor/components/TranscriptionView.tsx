import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { TranscriptionSegment } from '../types/editor.types';
import { colors } from '../../../context/ThemeContext';

interface TranscriptionViewProps {
  transcription: TranscriptionSegment[];
  currentTime: number;
  onSegmentPress: (start: number) => void;
}

export default function TranscriptionView({
  transcription, currentTime, onSegmentPress,
}: TranscriptionViewProps) {

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (transcription.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.titre}>📝 Transcription Whisper</Text>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {transcription.map((seg, i) => {
          const actif = currentTime >= seg.start && currentTime <= seg.end;
          return (
            <TouchableOpacity
              key={i}
              style={[s.segItem, actif && s.segItemActif]}
              onPress={() => onSegmentPress(seg.start)}
            >
              <Text style={[s.segTemps, actif && s.segTempsActif]}>
                {formatTime(seg.start)} → {formatTime(seg.end)}
              </Text>
              <Text style={[s.segTexte, actif && s.segTexteActif]}>
                {seg.texte}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, padding: 12, borderWidth: 1, borderColor: colors.border, maxHeight: 200 },
  titre: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  scroll: { flex: 1 },
  segItem: { padding: 8, borderRadius: 8, marginBottom: 4, backgroundColor: colors.card },
  segItemActif: { backgroundColor: colors.primaryLight, borderLeftWidth: 3, borderLeftColor: colors.primary },
  segTemps: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
  segTempsActif: { color: colors.primary },
  segTexte: { fontSize: 13, color: colors.text, lineHeight: 18 },
  segTexteActif: { fontWeight: '600', color: colors.primaryDark },
});
