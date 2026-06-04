import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert,
} from 'react-native';
import { Segment } from '../types/editor.types';
import { colors } from '../../../context/ThemeContext';

interface SegmentListProps {
  segments: Segment[];
  activeSegmentId: string | null;
  onSegmentPress: (id: string) => void;
  onSegmentDelete: (id: string) => void;
  onSegmentMove: (fromIndex: number, toIndex: number) => void;
  onCouperTout: () => void;
}

export default function SegmentList({
  segments, activeSegmentId,
  onSegmentPress, onSegmentDelete,
  onSegmentMove, onCouperTout,
}: SegmentListProps) {

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const couleurSegment = (index: number, selected: boolean) => {
    if (selected) return colors.primary;
    const couleurs = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return couleurs[index % couleurs.length];
  };

  if (segments.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>✂️</Text>
        <Text style={s.emptyTitre}>Aucun segment</Text>
        <Text style={s.emptyDesc}>
          Utilisez "Couper ici" sur la timeline{'\n'}ou lancez le découpage automatique
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitre}>{segments.length} segments</Text>
        <TouchableOpacity style={s.btnCouperTout} onPress={onCouperTout}>
          <Text style={s.btnCouperToutText}>✂️ Traiter tout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={segments}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.liste}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              s.segmentCard,
              { borderColor: couleurSegment(index, activeSegmentId === item.id) },
              activeSegmentId === item.id && s.segmentCardActive,
            ]}
            onPress={() => onSegmentPress(item.id)}
            onLongPress={() => Alert.alert(
              `Segment ${index + 1}`,
              `De ${formatTime(item.startTime)} à ${formatTime(item.endTime)}\nDurée : ${(item.endTime - item.startTime).toFixed(1)}s`,
              [
                { text: 'Fermer', style: 'cancel' },
                { text: '⬅️ Déplacer avant', onPress: () => index > 0 && onSegmentMove(index, index - 1) },
                { text: '➡️ Déplacer après', onPress: () => index < segments.length - 1 && onSegmentMove(index, index + 1) },
                { text: '🗑 Supprimer', style: 'destructive', onPress: () => onSegmentDelete(item.id) },
              ]
            )}
          >
            {/* Numéro */}
            <View style={[s.segmentNum, { backgroundColor: couleurSegment(index, activeSegmentId === item.id) }]}>
              <Text style={s.segmentNumText}>{index + 1}</Text>
            </View>

            {/* Infos */}
            <Text style={s.segmentDuree}>
              {(item.endTime - item.startTime).toFixed(1)}s
            </Text>
            <Text style={s.segmentTemps}>
              {formatTime(item.startTime)}
            </Text>
            <Text style={s.segmentTemps}>→ {formatTime(item.endTime)}</Text>

            {/* Transcription */}
            {item.texte && (
              <Text style={s.segmentTexte} numberOfLines={2}>{item.texte}</Text>
            )}

            {/* Status */}
            <View style={[s.segmentStatus, { backgroundColor: item.outputPath ? '#E8F5E9' : '#FFF3E0' }]}>
              <Text style={{ fontSize: 9, color: item.outputPath ? colors.success : '#FF9800' }}>
                {item.outputPath ? '✅ Traité' : '⏳ En attente'}
              </Text>
            </View>

            {/* Sélectionné */}
            {activeSegmentId === item.id && (
              <View style={s.segmentSelected}>
                <Text style={{ color: colors.white, fontSize: 9, fontWeight: 'bold' }}>▶ ACTIF</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitre: { fontSize: 13, fontWeight: '700', color: colors.text },
  btnCouperTout: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  btnCouperToutText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  liste: { padding: 10, gap: 8 },
  segmentCard: { width: 110, borderRadius: 10, padding: 10, borderWidth: 2, backgroundColor: colors.card, position: 'relative' },
  segmentCardActive: { backgroundColor: colors.primaryLight },
  segmentNum: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  segmentNumText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  segmentDuree: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  segmentTemps: { fontSize: 9, color: colors.textSecondary },
  segmentTexte: { fontSize: 9, color: colors.text, marginTop: 4, lineHeight: 12, fontStyle: 'italic' },
  segmentStatus: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginTop: 6, alignSelf: 'flex-start' },
  segmentSelected: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.primary, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  empty: { padding: 30, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitre: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});
