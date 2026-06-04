import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, Alert, TouchableOpacity, ActivityIndicator,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { supabase } from '../../services/supabase';
import { colors } from '../../context/ThemeContext';
import {
  EditorState, Segment, AutoModeConfig,
  TranscriptionSegment, Beat,
} from './types/editor.types';
import Timeline from './components/Timeline';
import Controls from './components/Controls';
import ModeSelector from './components/ModeSelector';
import SegmentList from './components/SegmentList';
import TranscriptionView from './components/TranscriptionView';
import {
  couperSegment, detecterScenes, detecterSilences,
  extraireAudio, concatenerSegments, nettoyerCache,
} from './services/ffmpegService';
import { transcrireAudio } from './services/whisperService';
import { analyserBeats } from './services/beatService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_CONFIG: AutoModeConfig = {
  scene: { enabled: false, sensibilite: 0.3 },
  silence: { enabled: false, seuilDb: -30, dureeMin: 0.5 },
  parole: { enabled: false, apiKey: '' },
  beats: { enabled: false, sensibilite: 'every2' },
};

export default function AdvancedEditorScreen({ navigation, route }: any) {
  const { videoUri, nomProjet, projetId } = route.params;
  const videoRef = useRef<any>(null);
  const [mode, setMode] = useState<'manuel' | 'auto'>('manuel');

  const [state, setState] = useState<EditorState>({
    videoUri,
    duration: 0,
    currentTime: 0,
    paused: true,
    segments: [],
    activeSegmentId: null,
    playheadPosition: 0,
    autoConfig: DEFAULT_CONFIG,
    processing: false,
    processingMessage: '',
    transcription: [],
    beats: [],
  });

  const updateState = (updates: Partial<EditorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    return () => { nettoyerCache(); };
  }, []);

  const onLoad = (data: any) => {
    updateState({ duration: data.duration });
  };

  const onProgress = (data: any) => {
    updateState({
      currentTime: data.currentTime,
      playheadPosition: data.currentTime,
    });

    // Prévisualisation du segment actif
    if (state.activeSegmentId) {
      const seg = state.segments.find(s => s.id === state.activeSegmentId);
      if (seg && data.currentTime >= seg.endTime) {
        videoRef.current?.seek(seg.startTime);
        updateState({ paused: true });
      }
    }
  };

  const handleSeek = (time: number) => {
    videoRef.current?.seek(time);
    updateState({ currentTime: time, playheadPosition: time });
  };

  // Couper ici manuellement
  const couperIci = useCallback(() => {
    const cutTime = state.currentTime;
    if (cutTime <= 0.1 || cutTime >= state.duration - 0.1) {
      Alert.alert('Position invalide', 'Le curseur doit être entre le début et la fin de la vidéo.');
      return;
    }

    const segmentsExistants = state.segments;
    let newSegments: Segment[];

    if (segmentsExistants.length === 0) {
      // Première coupe — créer 2 segments
      newSegments = [
        {
          id: `seg_${Date.now()}_1`,
          startTime: 0,
          endTime: cutTime,
          duration: cutTime,
          selected: false,
        },
        {
          id: `seg_${Date.now()}_2`,
          startTime: cutTime,
          endTime: state.duration,
          duration: state.duration - cutTime,
          selected: false,
        },
      ];
    } else {
      // Trouver le segment à couper
      const segIndex = segmentsExistants.findIndex(
        s => cutTime > s.startTime && cutTime < s.endTime
      );

      if (segIndex === -1) {
        Alert.alert('Impossible de couper', 'Le curseur n\'est pas dans un segment valide.');
        return;
      }

      const segACouper = segmentsExistants[segIndex];
      const timestamp = Date.now();

      const nouveauxSegs: Segment[] = [
        {
          id: `seg_${timestamp}_a`,
          startTime: segACouper.startTime,
          endTime: cutTime,
          duration: cutTime - segACouper.startTime,
          selected: false,
        },
        {
          id: `seg_${timestamp}_b`,
          startTime: cutTime,
          endTime: segACouper.endTime,
          duration: segACouper.endTime - cutTime,
          selected: false,
        },
      ];

      newSegments = [
        ...segmentsExistants.slice(0, segIndex),
        ...nouveauxSegs,
        ...segmentsExistants.slice(segIndex + 1),
      ];
    }

    updateState({ segments: newSegments });
  }, [state.currentTime, state.duration, state.segments]);

  // Sélectionner un segment pour prévisualisation
  const selectionnerSegment = useCallback((id: string) => {
    const seg = state.segments.find(s => s.id === id);
    if (!seg) return;

    updateState({ activeSegmentId: id });
    videoRef.current?.seek(seg.startTime);
    updateState({ paused: false });
  }, [state.segments]);

  // Supprimer un segment
  const supprimerSegment = useCallback((id: string) => {
    Alert.alert('Supprimer ce segment ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          updateState({
            segments: state.segments.filter(s => s.id !== id),
            activeSegmentId: state.activeSegmentId === id ? null : state.activeSegmentId,
          });
        },
      },
    ]);
  }, [state.segments, state.activeSegmentId]);

  // Déplacer un segment
  const deplacerSegment = useCallback((fromIndex: number, toIndex: number) => {
    const newSegments = [...state.segments];
    const [removed] = newSegments.splice(fromIndex, 1);
    newSegments.splice(toIndex, 0, removed);
    updateState({ segments: newSegments });
  }, [state.segments]);

  // Lancer le découpage automatique
  const lancerDecoupageAuto = async () => {
    const { autoConfig } = state;
    const modesActifs = Object.values(autoConfig).filter((m: any) => m.enabled);

    if (modesActifs.length === 0) {
      Alert.alert('Aucun mode sélectionné', 'Activez au moins un mode de découpage automatique.');
      return;
    }

    updateState({ processing: true, segments: [] });

    try {
      let timestamps: number[] = [];

      // Mode A — Détection de scènes
      if (autoConfig.scene.enabled) {
        updateState({ processingMessage: '🎬 Analyse des changements de scènes...' });
        const sceneTimestamps = await detecterScenes(videoUri, autoConfig.scene.sensibilite);
        timestamps = [...timestamps, ...sceneTimestamps];
      }

      // Mode B — Suppression des silences
      if (autoConfig.silence.enabled) {
        updateState({ processingMessage: '🔇 Détection des silences...' });
        const silences = await detecterSilences(
          videoUri,
          autoConfig.silence.seuilDb,
          autoConfig.silence.dureeMin
        );
        // Ajouter les timestamps des fins de silence
        silences.forEach(s => timestamps.push(s.end));
      }

      // Mode C — Découpage par parole
      let transcriptionData: TranscriptionSegment[] = [];
      if (autoConfig.parole.enabled) {
        if (!autoConfig.parole.apiKey) {
          Alert.alert('Clé API manquante', 'Entrez votre clé API OpenAI dans les paramètres du mode Parole.');
        } else {
          updateState({ processingMessage: '🗣 Extraction audio pour Whisper...' });
          const audioPath = await extraireAudio(videoUri);
          updateState({ processingMessage: '🗣 Transcription en cours (Whisper)...' });
          transcriptionData = await transcrireAudio(audioPath, autoConfig.parole.apiKey);
          transcriptionData.forEach(seg => {
            timestamps.push(seg.start);
            timestamps.push(seg.end);
          });
          updateState({ transcription: transcriptionData });
        }
      }

      // Mode D — Beats musicaux
      let beatsData: Beat[] = [];
      if (autoConfig.beats.enabled) {
        updateState({ processingMessage: '🎵 Extraction audio pour analyse beats...' });
        const audioPath = await extraireAudio(videoUri);
        updateState({ processingMessage: '🎵 Analyse des beats (librosa)...' });
        beatsData = await analyserBeats(audioPath, autoConfig.beats.sensibilite);
        beatsData.forEach(b => timestamps.push(b.time));
        updateState({ beats: beatsData });
      }

      // Dédupliquer et trier les timestamps
      const timestampsUniques = [0, ...new Set(timestamps.filter(t => t > 0 && t < state.duration))]
        .sort((a, b) => a - b);
      timestampsUniques.push(state.duration);

      // Créer les segments
      const newSegments: Segment[] = [];
      for (let i = 0; i < timestampsUniques.length - 1; i++) {
        const start = timestampsUniques[i];
        const end = timestampsUniques[i + 1];
        if (end - start > 0.2) { // Ignorer les segments trop courts
          const transcSeg = transcriptionData.find(
            t => Math.abs(t.start - start) < 0.5
          );
          newSegments.push({
            id: `auto_${Date.now()}_${i}`,
            startTime: start,
            endTime: end,
            duration: end - start,
            texte: transcSeg?.texte,
            selected: false,
          });
        }
      }

      updateState({
        segments: newSegments,
        processing: false,
        processingMessage: '',
      });

      Alert.alert(
        '✅ Analyse terminée',
        `${newSegments.length} segments créés automatiquement.`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      updateState({ processing: false, processingMessage: '' });
      Alert.alert('Erreur d\'analyse', error.message);
    }
  };

  // Traiter tous les segments avec FFmpeg
  const traiterTousSegments = async () => {
    if (state.segments.length === 0) return;

    updateState({ processing: true });
    const segmentsTraites = [...state.segments];

    for (let i = 0; i < segmentsTraites.length; i++) {
      const seg = segmentsTraites[i];
      updateState({
        processingMessage: `✂️ Traitement segment ${i + 1}/${segmentsTraites.length}...`,
      });
      try {
        const outputPath = await couperSegment(
          videoUri,
          seg.startTime,
          seg.endTime,
          seg.id
        );
        segmentsTraites[i] = { ...seg, outputPath };
        updateState({ segments: [...segmentsTraites] });
      } catch (e: any) {
        console.warn(`Erreur segment ${i + 1}:`, e.message);
      }
    }

    updateState({ processing: false, processingMessage: '' });
    Alert.alert('✅ Traitement terminé', `${segmentsTraites.filter(s => s.outputPath).length} segments prêts à l\'export.`);
  };

  // Exporter la vidéo finale
  const exporterVideo = async () => {
    const segmentsTraites = state.segments.filter(s => s.outputPath);

    if (segmentsTraites.length === 0) {
      Alert.alert('Aucun segment traité', 'Traitez d\'abord vos segments avec le bouton "✂️ Traiter tout".');
      return;
    }

    updateState({ processing: true, processingMessage: '🎬 Création de la vidéo finale...' });

    try {
      const finalPath = await concatenerSegments(segmentsTraites);

      // Sauvegarder dans Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('exportations').insert([{
          projet_id: projetId,
          user_id: user.id,
          statut: 'termine',
          video_finale_url: finalPath,
          taille_octets: 0,
        }]);

        await supabase.from('projets').update({
          video_source_url: finalPath,
          updated_at: new Date().toISOString(),
        }).eq('id', projetId);
      }

      updateState({ processing: false, processingMessage: '' });

      Alert.alert('🎉 Export réussi !', `Vidéo créée avec ${segmentsTraites.length} segments.`, [
        { text: 'Retour', onPress: () => navigation.goBack() },
        {
          text: '📱 Enregistrer', onPress: async () => {
            try {
              const fileName = `capcut_${Date.now()}.mp4`;
              const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
              await RNFS.copyFile(finalPath.replace('file://', ''), destPath);
              Alert.alert('✅', `Enregistré dans Téléchargements/${fileName}`);
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]);

    } catch (error: any) {
      updateState({ processing: false, processingMessage: '' });
      Alert.alert('Erreur export', error.message);
    }
  };

  const playerHeight = SCREEN_WIDTH * (9 / 16);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.headerBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerTitre} numberOfLines={1}>{nomProjet}</Text>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={[s.modeToggle, mode === 'manuel' && s.modeToggleActive]}
            onPress={() => setMode('manuel')}
          >
            <Text style={[s.modeToggleText, mode === 'manuel' && s.modeToggleTextActive]}>
              Manuel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeToggle, mode === 'auto' && s.modeToggleActive]}
            onPress={() => setMode('auto')}
          >
            <Text style={[s.modeToggleText, mode === 'auto' && s.modeToggleTextActive]}>
              Auto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lecteur vidéo */}
      <View style={[s.player, { height: playerHeight }]}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={[s.video, { height: playerHeight }]}
          paused={state.paused}
          onLoad={onLoad}
          onProgress={onProgress}
          onError={() => Alert.alert('Erreur', 'Impossible de lire cette vidéo')}
          resizeMode="contain"
        />
        {state.processing && (
          <View style={s.processingOverlay}>
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={s.processingOverlayText}>{state.processingMessage}</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Contrôles */}
        <Controls
          paused={state.paused}
          onPlayPause={() => updateState({ paused: !state.paused })}
          onRewind={() => handleSeek(Math.max(0, state.currentTime - 5))}
          onForward={() => handleSeek(Math.min(state.duration, state.currentTime + 5))}
          segments={state.segments}
          onExport={exporterVideo}
          onClear={() => Alert.alert('Effacer tout ?', '', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Effacer', style: 'destructive', onPress: () => updateState({ segments: [], transcription: [], beats: [] }) },
          ])}
          processing={state.processing}
          processingMessage={state.processingMessage}
          currentTime={state.currentTime}
          duration={state.duration}
        />

        {/* Mode Manuel */}
        {mode === 'manuel' && (
          <>
            <Timeline
              duration={state.duration}
              currentTime={state.currentTime}
              segments={state.segments}
              beats={state.beats}
              onSeek={handleSeek}
              onCutHere={couperIci}
              onSegmentPress={selectionnerSegment}
              onSegmentDelete={supprimerSegment}
              activeSegmentId={state.activeSegmentId}
            />
          </>
        )}

        {/* Mode Automatique */}
        {mode === 'auto' && (
          <ModeSelector
            config={state.autoConfig}
            onConfigChange={(config) => updateState({ autoConfig: config })}
            onLancerAuto={lancerDecoupageAuto}
            processing={state.processing}
          />
        )}

        {/* Liste des segments (toujours visible) */}
        <SegmentList
          segments={state.segments}
          activeSegmentId={state.activeSegmentId}
          onSegmentPress={selectionnerSegment}
          onSegmentDelete={supprimerSegment}
          onSegmentMove={deplacerSegment}
          onCouperTout={traiterTousSegments}
        />

        {/* Transcription Whisper */}
        <TranscriptionView
          transcription={state.transcription}
          currentTime={state.currentTime}
          onSegmentPress={handleSeek}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerBtn: { color: colors.primary, fontSize: 14 },
  headerTitre: { flex: 1, fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginHorizontal: 8 },
  headerRight: { flexDirection: 'row', gap: 4 },
  modeToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  modeToggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeToggleText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  modeToggleTextActive: { color: colors.white },
  player: { width: '100%', backgroundColor: '#000' },
  video: { width: '100%' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', gap: 12 },
  processingOverlayText: { color: colors.white, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
});
