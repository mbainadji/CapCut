import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  TextInput, Modal, ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { AutoModeConfig } from '../types/editor.types';
import { colors } from '../../../context/ThemeContext';

interface ModeSelectorProps {
  config: AutoModeConfig;
  onConfigChange: (config: AutoModeConfig) => void;
  onLancerAuto: () => void;
  processing: boolean;
}

export default function ModeSelector({
  config, onConfigChange, onLancerAuto, processing,
}: ModeSelectorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateConfig = (key: keyof AutoModeConfig, value: any) => {
    onConfigChange({ ...config, [key]: { ...config[key], ...value } });
  };

  const modesActifs = Object.values(config).filter((m: any) => m.enabled).length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitre}>🤖 Découpage Automatique</Text>
        {modesActifs > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{modesActifs} mode{modesActifs > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Mode A — Détection de scènes */}
      <View style={s.modeCard}>
        <View style={s.modeHeader}>
          <TouchableOpacity style={s.modeInfo} onPress={() => setExpanded(expanded === 'scene' ? null : 'scene')}>
            <Text style={s.modeIcon}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.modeNom}>Détection de scènes</Text>
              <Text style={s.modeDesc}>Coupe aux changements visuels brusques</Text>
            </View>
            <Text style={s.modeChevron}>{expanded === 'scene' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <Switch
            value={config.scene.enabled}
            onValueChange={(v) => updateConfig('scene', { enabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {expanded === 'scene' && (
          <View style={s.modeParams}>
            <Text style={s.paramLabel}>
              Sensibilité : {config.scene.sensibilite.toFixed(2)}
            </Text>
            <Text style={s.paramHint}>0.1 = très sensible | 1.0 = peu sensible</Text>
            <Slider
              style={s.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              step={0.05}
              value={config.scene.sensibilite}
              onValueChange={(v) => updateConfig('scene', { sensibilite: v })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        )}
      </View>

      {/* Mode B — Suppression des silences */}
      <View style={s.modeCard}>
        <View style={s.modeHeader}>
          <TouchableOpacity style={s.modeInfo} onPress={() => setExpanded(expanded === 'silence' ? null : 'silence')}>
            <Text style={s.modeIcon}>🔇</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.modeNom}>Suppression des silences</Text>
              <Text style={s.modeDesc}>Supprime les passages silencieux</Text>
            </View>
            <Text style={s.modeChevron}>{expanded === 'silence' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <Switch
            value={config.silence.enabled}
            onValueChange={(v) => updateConfig('silence', { enabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {expanded === 'silence' && (
          <View style={s.modeParams}>
            <Text style={s.paramLabel}>Seuil dB : {config.silence.seuilDb} dB</Text>
            <Text style={s.paramHint}>-20 dB = peu sensible | -50 dB = très sensible</Text>
            <Slider
              style={s.slider}
              minimumValue={-50}
              maximumValue={-20}
              step={1}
              value={config.silence.seuilDb}
              onValueChange={(v) => updateConfig('silence', { seuilDb: Math.round(v) })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={s.paramLabel}>Durée min : {config.silence.dureeMin.toFixed(1)}s</Text>
            <Slider
              style={s.slider}
              minimumValue={0.3}
              maximumValue={2.0}
              step={0.1}
              value={config.silence.dureeMin}
              onValueChange={(v) => updateConfig('silence', { dureeMin: parseFloat(v.toFixed(1)) })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        )}
      </View>

      {/* Mode C — Découpage par parole */}
      <View style={s.modeCard}>
        <View style={s.modeHeader}>
          <TouchableOpacity style={s.modeInfo} onPress={() => setExpanded(expanded === 'parole' ? null : 'parole')}>
            <Text style={s.modeIcon}>🗣</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.modeNom}>Découpage par parole</Text>
              <Text style={s.modeDesc}>Transcription via OpenAI Whisper</Text>
            </View>
            <Text style={s.modeChevron}>{expanded === 'parole' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <Switch
            value={config.parole.enabled}
            onValueChange={(v) => updateConfig('parole', { enabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {expanded === 'parole' && (
          <View style={s.modeParams}>
            <Text style={s.paramLabel}>Clé API OpenAI</Text>
            <TextInput
              style={s.apiKeyInput}
              value={config.parole.apiKey}
              onChangeText={(v) => updateConfig('parole', { apiKey: v })}
              placeholder="sk-..."
              placeholderTextColor={colors.inactive}
              secureTextEntry
            />
            <Text style={s.paramHint}>
              Obtenir une clé sur platform.openai.com
            </Text>
          </View>
        )}
      </View>

      {/* Mode D — Beats musicaux */}
      <View style={s.modeCard}>
        <View style={s.modeHeader}>
          <TouchableOpacity style={s.modeInfo} onPress={() => setExpanded(expanded === 'beats' ? null : 'beats')}>
            <Text style={s.modeIcon}>🎵</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.modeNom}>Synchronisation musicale</Text>
              <Text style={s.modeDesc}>Coupe au rythme des beats (librosa)</Text>
            </View>
            <Text style={s.modeChevron}>{expanded === 'beats' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <Switch
            value={config.beats.enabled}
            onValueChange={(v) => updateConfig('beats', { enabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {expanded === 'beats' && (
          <View style={s.modeParams}>
            <Text style={s.paramLabel}>Sensibilité des beats</Text>
            {[
              { id: 'every', label: '🎵 Chaque beat', desc: 'Coupes très fréquentes' },
              { id: 'every2', label: '🎶 1 beat sur 2', desc: 'Coupes modérées' },
              { id: 'bar', label: '🎼 Chaque mesure', desc: 'Coupes espacées' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[s.beatOption, config.beats.sensibilite === opt.id && s.beatOptionActive]}
                onPress={() => updateConfig('beats', { sensibilite: opt.id })}
              >
                <View>
                  <Text style={[s.beatOptionLabel, config.beats.sensibilite === opt.id && { color: colors.primary }]}>
                    {opt.label}
                  </Text>
                  <Text style={s.beatOptionDesc}>{opt.desc}</Text>
                </View>
                {config.beats.sensibilite === opt.id && (
                  <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bouton lancer */}
      <TouchableOpacity
        style={[s.btnLancer, (modesActifs === 0 || processing) && s.btnDisabled]}
        onPress={onLancerAuto}
        disabled={modesActifs === 0 || processing}
      >
        <Text style={s.btnLancerText}>
          {processing ? '⏳ Traitement...' : `🚀 Lancer l'analyse (${modesActifs} mode${modesActifs > 1 ? 's' : ''})`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, padding: 12, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  headerTitre: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  badge: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  modeCard: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 8, overflow: 'hidden' },
  modeHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: colors.card, gap: 8 },
  modeInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeIcon: { fontSize: 22 },
  modeNom: { fontSize: 13, fontWeight: '700', color: colors.text },
  modeDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  modeChevron: { fontSize: 10, color: colors.textSecondary, marginRight: 8 },
  modeParams: { padding: 12, backgroundColor: colors.background },
  paramLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 2 },
  paramHint: { fontSize: 10, color: colors.textSecondary, marginBottom: 6 },
  slider: { height: 40 },
  apiKeyInput: { backgroundColor: colors.card, borderRadius: 8, padding: 10, color: colors.text, fontSize: 13, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  beatOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 6, backgroundColor: colors.white },
  beatOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  beatOptionLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  beatOptionDesc: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  btnLancer: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.4 },
  btnLancerText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
