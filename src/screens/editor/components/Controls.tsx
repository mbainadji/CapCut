import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Segment } from '../types/editor.types';
import { colors } from '../../../context/ThemeContext';

interface ControlsProps {
  paused: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onForward: () => void;
  segments: Segment[];
  onExport: () => void;
  onClear: () => void;
  processing: boolean;
  processingMessage: string;
  currentTime: number;
  duration: number;
}

export default function Controls({
  paused, onPlayPause, onRewind, onForward,
  segments, onExport, onClear,
  processing, processingMessage,
  currentTime, duration,
}: ControlsProps) {

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={s.container}>
      {/* Barre de progression */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={s.tempsRow}>
        <Text style={s.tempsTexte}>{formatTime(currentTime)}</Text>
        <Text style={s.tempsTexte}>{formatTime(duration)}</Text>
      </View>

      {/* Contrôles de lecture */}
      <View style={s.playControls}>
        <TouchableOpacity style={s.ctrlBtn} onPress={onRewind}>
          <Text style={s.ctrlBtnText}>⏮ -5s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.playBtn} onPress={onPlayPause}>
          <Text style={s.playBtnText}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ctrlBtn} onPress={onForward}>
          <Text style={s.ctrlBtnText}>+5s ⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Processing indicator */}
      {processing && (
        <View style={s.processingBar}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={s.processingText}>{processingMessage}</Text>
        </View>
      )}

      {/* Stats segments */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statNum}>{segments.length}</Text>
          <Text style={s.statLabel}>Segments</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statNum}>
            {segments.reduce((acc, s) => acc + (s.endTime - s.startTime), 0).toFixed(1)}s
          </Text>
          <Text style={s.statLabel}>Durée totale</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statNum}>{segments.filter(s => s.outputPath).length}</Text>
          <Text style={s.statLabel}>Traités</Text>
        </View>
      </View>

      {/* Boutons d'action */}
      {segments.length > 0 && (
        <View style={s.actionBtns}>
          <TouchableOpacity style={s.btnClear} onPress={onClear}>
            <Text style={s.btnClearText}>🗑 Effacer tout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btnExport, processing && s.btnDisabled]}
            onPress={onExport}
            disabled={processing}
          >
            {processing
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={s.btnExportText}>💾 Exporter ({segments.length})</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, padding: 12, borderWidth: 1, borderColor: colors.border },
  progressBar: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  tempsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tempsTexte: { fontSize: 11, color: colors.textSecondary },
  playControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 12 },
  ctrlBtn: { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  ctrlBtnText: { color: colors.text, fontSize: 13 },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  playBtnText: { color: colors.white, fontSize: 22 },
  processingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryLight, borderRadius: 8, padding: 8, marginBottom: 8 },
  processingText: { flex: 1, color: colors.primaryDark, fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 8 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  actionBtns: { flexDirection: 'row', gap: 10 },
  btnClear: { flex: 1, backgroundColor: '#FFF0F0', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFD0D0' },
  btnClearText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  btnExport: { flex: 2, backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnExportText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
