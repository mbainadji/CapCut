import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Alert, ActivityIndicator, ScrollView, Dimensions, StatusBar,
  PermissionsAndroid, Platform, Animated, TextInput, Modal,
} from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { supabase } from '../../services/supabase';
import { colors } from '../../context/ThemeContext';
import { useTheme } from '../../context/ThemeContext';

const RESEAUX_DUREE = [
  { nom: 'TikTok 🎵', max: 15, couleur: '#010101' },
  { nom: 'Reels 📸', max: 30, couleur: '#E1306C' },
  { nom: 'Shorts ▶️', max: 60, couleur: '#FF0000' },
];

const FILTRES = [
  { id: 'normal', nom: 'Normal', overlay: 'transparent', opacity: 0 },
  { id: 'nb', nom: 'N&B', overlay: '#000', opacity: 0.5, desaturate: true },
  { id: 'vintage', nom: 'Vintage', overlay: '#D4A574', opacity: 0.3 },
  { id: 'chaud', nom: 'Chaud', overlay: '#FF8C00', opacity: 0.2 },
  { id: 'froid', nom: 'Froid', overlay: '#4169E1', opacity: 0.2 },
  { id: 'drama', nom: 'Drama', overlay: '#000', opacity: 0.35 },
  { id: 'fade', nom: 'Fade', overlay: '#FFF', opacity: 0.25 },
  { id: 'vivid', nom: 'Vivid', overlay: '#FF6B35', opacity: 0.15 },
];

const EFFETS_SPECIAUX = [
  { id: 'vhs', nom: '📼 VHS Rétro', description: 'Effet cassette vintage', type: 'overlay' },
  { id: 'glitch', nom: '⚡ Glitch', description: 'Distorsion numérique', type: 'animation' },
  { id: 'zoom', nom: '🔍 Zoom', description: 'Zoom progressif', type: 'animation' },
  { id: 'fondu', nom: '🌊 Fondu', description: 'Entrée en fondu', type: 'animation' },
  { id: 'sous_titres', nom: '💬 Sous-titres', description: 'Texte superposé', type: 'texte' },
];

const VHS_SCANLINES = Array.from({ length: 18 }, (_, index) => index);

export default function VideoEditorScreen({ navigation, route }: any) {
  const { projetId, videoUri, nomProjet } = route.params;
  const { sauvegardeAuto } = useTheme();
  const videoRef = useRef<any>(null);
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width } = Dimensions.get('window');
  const playerHeight = width * (9 / 16);

  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeOutil, setActiveOutil] = useState<string | null>(null);
  const [volume, setVolume] = useState(1.0);
  const [vitesse, setVitesse] = useState(1.0);
  const [derniereSauvegarde, setDerniereSauvegarde] = useState<Date | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [filtreActif, setFiltreActif] = useState(FILTRES[0]);
  const [effetsActifs, setEffetsActifs] = useState<string[]>([]);
  const [sousTitre, setSousTitre] = useState('');
  const [modalSousTitre, setModalSousTitre] = useState(false);

  const normaliserUri = (uri: string) => {
    if (!uri) return '';
    if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
    if (uri.startsWith('/')) return `file://${uri}`;
    return uri;
  };

  const videoUriNormalise = normaliserUri(videoUri);

  const chargerEffetsSauvegardes = useCallback(async () => {
    try {
      const { data } = await supabase.from('projets').select('timeline_data').eq('id', projetId).single();
      if (data?.timeline_data) {
        const td = data.timeline_data;
        if (td.trimStart !== undefined) setTrimStart(td.trimStart);
        if (td.trimEnd !== undefined) setTrimEnd(td.trimEnd);
        if (td.volume !== undefined) setVolume(td.volume);
        if (td.vitesse !== undefined) setVitesse(td.vitesse);
        if (td.effets) setEffetsActifs(td.effets);
        if (td.filtre) {
          const f = FILTRES.find(f => f.id === td.filtre);
          if (f) setFiltreActif(f);
        }
        if (td.sousTitre) setSousTitre(td.sousTitre);
      }
    } catch {}
  }, [projetId]);

  const sauvegarderAuto = useCallback(async () => {
    try {
      await supabase.from('projets').update({
        timeline_data: {
          trimStart, trimEnd, volume, vitesse,
          filtre: filtreActif.id,
          effets: effetsActifs,
          sousTitre,
        },
        updated_at: new Date().toISOString(),
      }).eq('id', projetId);
      setDerniereSauvegarde(new Date());
    } catch {}
  }, [effetsActifs, filtreActif.id, projetId, sousTitre, trimEnd, trimStart, vitesse, volume]);

  useEffect(() => {
    chargerEffetsSauvegardes();
  }, [chargerEffetsSauvegardes]);

  useEffect(() => {
    if (!sauvegardeAuto) return;
    const interval = setInterval(sauvegarderAuto, 30000);
    return () => clearInterval(interval);
  }, [sauvegardeAuto, sauvegarderAuto]);

  // Effets visuels
  const lancerGlitch = () => {
    Animated.sequence([
      Animated.timing(glitchAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(glitchAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(glitchAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(glitchAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const lancerZoom = () => {
    Animated.sequence([
      Animated.timing(zoomAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
      Animated.timing(zoomAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  };

  const lancerFondu = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const toggleEffet = (id: string) => {
    setEffetsActifs(prev => {
      const newEffets = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      // Prévisualiser l'effet
      if (!prev.includes(id)) {
        if (id === 'glitch') lancerGlitch();
        if (id === 'zoom') lancerZoom();
        if (id === 'fondu') lancerFondu();
        if (id === 'sous_titres') setModalSousTitre(true);
      }
      return newEffets;
    });
  };

  const getVHSOverlay = () => effetsActifs.includes('vhs');

  const onLoad = (data: any) => {
    setDuration(data.duration);
    if (trimEnd === 0) setTrimEnd(data.duration);
    setVideoError(false);
    setVideoReady(true);
  };

  const onProgress = (data: any) => {
    setCurrentTime(data.currentTime);
    if (effetsActifs.includes('glitch') && Math.random() < 0.02) lancerGlitch();
    if (data.currentTime >= trimEnd && trimEnd > 0) {
      videoRef.current?.seek(trimStart);
      setPaused(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;

  const supprimerVideo = () => {
    Alert.alert(
      '🗑 Supprimer la vidéo',
      'Supprimer la vidéo de ce projet ? Le projet sera conservé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('projets').update({
                video_source_url: null,
                timeline_data: null,
                updated_at: new Date().toISOString(),
              }).eq('id', projetId);
              Alert.alert('✅', 'Vidéo supprimée du projet.');
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  };

  const demanderPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const version = Platform.Version as number;
      if (version >= 33) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]);
        return Object.values(result).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch { return true; }
  };

  const enregistrerSurTelephone = async () => {
    const permOk = await demanderPermission();
    if (!permOk) {
      Alert.alert('Permission refusée', 'Autorisez l\'accès au stockage dans les paramètres.');
      return;
    }
    setLoading(true);
    try {
      const fileName = `capcut_${Date.now()}.mp4`;
      const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      const srcPath = videoUriNormalise.replace('file://', '');
      if (videoUriNormalise.startsWith('content://')) {
        await RNFS.copyFile(videoUriNormalise, destPath);
      } else {
        const exists = await RNFS.exists(srcPath);
        if (exists) {
          await RNFS.copyFile(srcPath, destPath);
        } else {
          throw new Error('Fichier source introuvable');
        }
      }
      Alert.alert('✅ Enregistré !', `Sauvegardé dans Téléchargements/${fileName}`);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifierSansSon = () => {
    Alert.alert(
      '👁 Test sans son',
      'Regardez maintenant votre vidéo SANS son.\n\nVérifiez :\n• Les sous-titres sont lisibles\n• L\'action est compréhensible sans audio\n• Le texte n\'est pas masqué par le UI',
      [
        { text: 'Regarder', onPress: () => { setVolume(0); setPaused(false); } },
        { text: 'Remettre le son', onPress: () => setVolume(1) },
        { text: 'Exporter quand même', onPress: exporter },
      ]
    );
  };

  const exporter = async () => {
    await sauvegarderAuto();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('exportations').insert([{
        projet_id: projetId,
        user_id: user.id,
        statut: 'termine',
        video_finale_url: videoUri,
        taille_octets: 0,
      }]);
      Alert.alert('✅ Exporté !', `Effets appliqués : ${effetsActifs.length}\nFiltre : ${filtreActif.nom}`, [
        { text: '📱 Enregistrer sur téléphone', onPress: enregistrerSurTelephone },
        { text: 'Retour', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  const OUTILS_EDITOR = [
    { id: 'trim', label: '✂️ Couper' },
    { id: 'effets', label: '✨ Effets' },
    { id: 'filtres', label: '🎨 Filtres' },
    { id: 'vitesse', label: '⚡ Vitesse' },
    { id: 'volume', label: '🔊 Volume' },
    { id: 'texte', label: '💬 Texte' },
    { id: 'musique', label: '🎵 Musique' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.headerBtn}>← Retour</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitre} numberOfLines={1}>{nomProjet}</Text>
          {derniereSauvegarde && (
            <Text style={s.headerSauvegarde}>💾 {derniereSauvegarde.toLocaleTimeString()}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={supprimerVideo}>
            <Text style={s.headerDelete}>🗑</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={verifierSansSon} style={s.btnVerifier}>
            <Text style={s.btnVerifierText}>👁</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exporter} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primary} size="small" />
              : <Text style={s.headerExport}>Exporter</Text>}
          </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Lecteur vidéo avec effets */}
        <Animated.View style={[
          s.playerContainer,
          { height: playerHeight },
          { transform: [{ translateX: glitchAnim }, { scale: zoomAnim }] },
          { opacity: effetsActifs.includes('fondu') ? fadeAnim : 1 },
        ]}>
          {videoError ? (
            <View style={s.videoErreur}>
              <Text style={s.videoErreurIcon}>⚠️</Text>
              <Text style={s.videoErreurTexte}>Format non supporté</Text>
            </View>
          ) : (
            <>
              <Video
                ref={videoRef}
                source={{ uri: videoUriNormalise }}
                style={[s.video, { height: playerHeight }]}
                paused={paused}
                onLoad={onLoad}
                onProgress={onProgress}
                onError={() => setVideoError(true)}
                resizeMode="contain"
                volume={volume}
                rate={vitesse}
              />

              {/* Overlay filtre couleur */}
              {filtreActif.id !== 'normal' && (
                <View style={[s.filtreOverlay, {
                  backgroundColor: filtreActif.overlay,
                  opacity: filtreActif.opacity,
                }]} />
              )}

              {/* Overlay VHS */}
              {getVHSOverlay() && (
                <View style={s.vhsOverlay}>
                  <Text style={s.vhsTexte}>◉ REC</Text>
                  <View style={s.vhsScanlines}>
                    {VHS_SCANLINES.map(line => (
                      <View key={line} style={s.vhsScanline} />
                    ))}
                  </View>
                </View>
              )}

              {/* Sous-titres */}
              {sousTitre.length > 0 && effetsActifs.includes('sous_titres') && (
                <View style={s.sousTitreContainer}>
                  <Text style={s.sousTitreTexte}>{sousTitre}</Text>
                </View>
              )}

              {!videoReady && (
                <View style={s.videoLoading}>
                  <ActivityIndicator color={colors.white} size="large" />
                </View>
              )}
            </>
          )}

          {videoReady && !videoError && (
            <TouchableOpacity style={s.playBtn} onPress={() => setPaused(!paused)}>
              <Text style={s.playBtnText}>{paused ? '▶' : '⏸'}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Effets actifs badges */}
        {effetsActifs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.effetsActifsScroll}>
            {effetsActifs.map(id => {
              const effet = EFFETS_SPECIAUX.find(e => e.id === id);
              return effet ? (
                <TouchableOpacity key={id} style={s.effetActifBadge} onPress={() => toggleEffet(id)}>
                  <Text style={s.effetActifText}>{effet.nom} ✕</Text>
                </TouchableOpacity>
              ) : null;
            })}
          </ScrollView>
        )}

        {/* Temps */}
        <View style={s.tempsRow}>
          <Text style={s.temps}>{formatTime(currentTime)}</Text>
          <Text style={s.filtreActifLabel}>🎨 {filtreActif.nom}</Text>
          <Text style={s.tempsTotal}>{formatTime(duration)}</Text>
        </View>

        {/* Indicateur durée optimale */}
        {duration > 0 && (
          <View style={s.dureeOptimale}>
            {RESEAUX_DUREE.map(r => {
              const dureeSelectionnee = trimEnd - trimStart;
              const ok = dureeSelectionnee <= r.max;
              return (
                <View key={r.nom} style={[s.dureeItem, ok && s.dureeItemOk]}>
                  <Text style={[s.dureeItemTexte, ok && s.dureeItemTexteOk]}>
                    {ok ? '✅' : '⚠️'} {r.nom} ({r.max}s max)
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Barre de progression */}
        <View style={s.progressContainer}>
          <View style={s.progressBg} />
          <View style={[s.trimZone, { left: `${trimStartPercent}%`, width: `${trimEndPercent - trimStartPercent}%` }]} />
          <View style={[s.progressFill, { width: `${progressPercent}%` }]} />
          <TouchableOpacity style={[s.trimHandle, { left: `${trimStartPercent}%` }]}
            onPress={() => setTrimStart(Math.max(0, trimStart - 1))}>
            <Text style={s.trimHandleText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.trimHandle, { left: `${trimEndPercent}%` }]}
            onPress={() => setTrimEnd(Math.min(duration, trimEnd + 1))}>
            <Text style={s.trimHandleText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Outils */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.outilsScroll}>
          {OUTILS_EDITOR.map(outil => (
            <TouchableOpacity key={outil.id}
              style={[s.outilBtn, activeOutil === outil.id && s.outilBtnActive]}
              onPress={() => setActiveOutil(activeOutil === outil.id ? null : outil.id)}>
              <Text style={[s.outilBtnText, activeOutil === outil.id && s.outilBtnTextActive]}>
                {outil.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Panel Trim */}
        {activeOutil === 'trim' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>✂️ Découper la vidéo</Text>
            <View style={s.trimControls}>
              <View style={s.trimControl}>
                <Text style={s.trimLabel}>Début</Text>
                <View style={s.trimBtns}>
                  <TouchableOpacity style={s.trimBtnSmall} onPress={() => setTrimStart(Math.max(0, trimStart - 1))}>
                    <Text style={s.trimBtnText}>-1s</Text>
                  </TouchableOpacity>
                  <Text style={s.trimValeur}>{formatTime(trimStart)}</Text>
                  <TouchableOpacity style={s.trimBtnSmall} onPress={() => setTrimStart(Math.min(trimEnd - 1, trimStart + 1))}>
                    <Text style={s.trimBtnText}>+1s</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.trimControl}>
                <Text style={s.trimLabel}>Fin</Text>
                <View style={s.trimBtns}>
                  <TouchableOpacity style={s.trimBtnSmall} onPress={() => setTrimEnd(Math.max(trimStart + 1, trimEnd - 1))}>
                    <Text style={s.trimBtnText}>-1s</Text>
                  </TouchableOpacity>
                  <Text style={s.trimValeur}>{formatTime(trimEnd)}</Text>
                  <TouchableOpacity style={s.trimBtnSmall} onPress={() => setTrimEnd(Math.min(duration, trimEnd + 1))}>
                    <Text style={s.trimBtnText}>+1s</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={s.trimDuree}>Durée : {formatTime(trimEnd - trimStart)}</Text>
            <TouchableOpacity style={s.btnDanger} onPress={supprimerVideo}>
              <Text style={s.btnDangerText}>🗑 Supprimer la vidéo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Panel Effets spéciaux */}
        {activeOutil === 'effets' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>✨ Effets spéciaux</Text>
            {EFFETS_SPECIAUX.map(effet => {
              const actif = effetsActifs.includes(effet.id);
              return (
                <TouchableOpacity key={effet.id}
                  style={[s.effetItem, actif && s.effetItemActif]}
                  onPress={() => toggleEffet(effet.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.effetNom}>{effet.nom}</Text>
                    <Text style={s.effetDesc}>{effet.description}</Text>
                  </View>
                  <View style={[s.effetToggle, actif && s.effetToggleActif]}>
                    <Text style={{ color: actif ? colors.white : colors.textSecondary, fontSize: 11 }}>
                      {actif ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Panel Filtres */}
        {activeOutil === 'filtres' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>🎨 Filtres — Actif : {filtreActif.nom}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTRES.map(f => (
                <TouchableOpacity key={f.id}
                  style={[s.filtreItem, filtreActif.id === f.id && s.filtreItemActif]}
                  onPress={() => setFiltreActif(f)}>
                  <View style={[s.filtrePreview, {
                    backgroundColor: f.id === 'normal' ? '#E0E0E0' : f.overlay as string,
                    opacity: f.id === 'normal' ? 1 : 0.8,
                  }]}>
                    {filtreActif.id === f.id && <Text style={{ fontSize: 16 }}>✓</Text>}
                  </View>
                  <Text style={[s.filtreNom, filtreActif.id === f.id && { color: colors.primary }]}>{f.nom}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Panel Volume */}
        {activeOutil === 'volume' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>🔊 Volume : {Math.round(volume * 100)}%</Text>
            <View style={s.sliderRow}>
              {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
                <TouchableOpacity key={v} style={[s.sliderBtn, volume === v && s.sliderBtnActive]}
                  onPress={() => setVolume(v)}>
                  <Text style={[s.sliderBtnText, volume === v && s.sliderBtnTextActive]}>{Math.round(v * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Panel Vitesse */}
        {activeOutil === 'vitesse' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>⚡ Vitesse : {vitesse}x</Text>
            <View style={s.sliderRow}>
              {[0.25, 0.5, 1.0, 1.5, 2.0].map(v => (
                <TouchableOpacity key={v} style={[s.sliderBtn, vitesse === v && s.sliderBtnActive]}
                  onPress={() => setVitesse(v)}>
                  <Text style={[s.sliderBtnText, vitesse === v && s.sliderBtnTextActive]}>{v}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Panel Texte */}
        {activeOutil === 'texte' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>💬 Sous-titres & Texte</Text>
            <TouchableOpacity style={s.panelBtn} onPress={() => setModalSousTitre(true)}>
              <Text style={s.panelBtnText}>
                {sousTitre ? `💬 "${sousTitre.slice(0, 20)}..."` : '+ Ajouter du texte/sous-titre'}
              </Text>
            </TouchableOpacity>
            {sousTitre.length > 0 && (
              <TouchableOpacity style={[s.panelBtn, { borderColor: colors.danger }]}
                onPress={() => { setSousTitre(''); setEffetsActifs(prev => prev.filter(e => e !== 'sous_titres')); }}>
                <Text style={[s.panelBtnText, { color: colors.danger }]}>🗑 Supprimer le texte</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Panel Musique */}
        {activeOutil === 'musique' && (
          <View style={s.panel}>
            <Text style={s.panelTitre}>🎵 Audio</Text>
            <TouchableOpacity style={s.panelBtn}
              onPress={() => Alert.alert('Musique', 'Bibliothèque musicale nécessite un abonnement Pro.')}>
              <Text style={s.panelBtnText}>🎵 Ajouter de la musique</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.panelBtn}
              onPress={() => Alert.alert('Voix', 'Amélioration vocale nécessite un traitement serveur.')}>
              <Text style={s.panelBtnText}>🎙 Améliorer la voix</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={s.btnTelephone} onPress={enregistrerSurTelephone} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} />
            : <Text style={s.btnTelephoneText}>📱 Enregistrer sur téléphone</Text>}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal Sous-titres */}
      <Modal visible={modalSousTitre} transparent animationType="slide" onRequestClose={() => setModalSousTitre(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitre}>💬 Ajouter du texte</Text>
            <TextInput
              style={s.modalInput}
              value={sousTitre}
              onChangeText={setSousTitre}
              placeholder="Entrez votre texte..."
              placeholderTextColor={colors.inactive}
              multiline
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnAnnuler} onPress={() => setModalSousTitre(false)}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnOk} onPress={() => {
                if (sousTitre.trim()) {
                  setEffetsActifs(prev => prev.includes('sous_titres') ? prev : [...prev, 'sous_titres']);
                }
                setModalSousTitre(false);
              }}>
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  headerBtn: { color: colors.primary, fontSize: 14 },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitre: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  headerSauvegarde: { color: colors.textSecondary, fontSize: 9 },
  headerExport: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  btnVerifier: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  btnVerifierText: { fontSize: 16 },
  headerDelete: { fontSize: 18, marginRight: 4 },
  playerContainer: { width: '100%', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  video: { width: '100%' },
  filtreOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  vhsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  vhsTexte: { position: 'absolute', top: 8, right: 12, color: 'red', fontSize: 12, fontWeight: 'bold' },
  vhsScanlines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-evenly', opacity: 0.18 },
  vhsScanline: { height: 1, backgroundColor: colors.black },
  sousTitreContainer: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#000000AA', borderRadius: 6, padding: 8 },
  sousTitreTexte: { color: '#fff', fontSize: 14, textAlign: 'center' },
  videoLoading: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  videoErreur: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 20 },
  videoErreurIcon: { fontSize: 40 },
  videoErreurTexte: { color: '#fff', fontSize: 14 },
  playBtn: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' },
  playBtnText: { color: '#fff', fontSize: 24 },
  effetsActifsScroll: { maxHeight: 40, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.primaryLight },
  effetActifBadge: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  effetActifText: { color: colors.white, fontSize: 11 },
  tempsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.white },
  temps: { color: colors.textSecondary, fontSize: 12 },
  filtreActifLabel: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  tempsTotal: { color: colors.textSecondary, fontSize: 12 },
  progressContainer: { height: 40, marginHorizontal: 16, position: 'relative', justifyContent: 'center' },
  progressBg: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  trimZone: { position: 'absolute', height: 4, backgroundColor: `${colors.primary}44`, borderRadius: 2 },
  progressFill: { position: 'absolute', left: 0, height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  trimHandle: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', top: 10, marginLeft: -10 },
  trimHandleText: { color: '#fff', fontSize: 8 },
  outilsScroll: { paddingVertical: 12, paddingHorizontal: 16, maxHeight: 60, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  outilBtn: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  outilBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  outilBtnText: { color: colors.textSecondary, fontSize: 13 },
  outilBtnTextActive: { color: colors.primary, fontWeight: '600' },
  panel: { backgroundColor: colors.white, margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, elevation: 1 },
  panelTitre: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  trimControls: { flexDirection: 'row', gap: 16 },
  trimControl: { flex: 1 },
  trimLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' },
  trimBtns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trimBtnSmall: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  trimBtnText: { color: colors.primary, fontSize: 12 },
  trimValeur: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  trimDuree: { color: colors.textSecondary, fontSize: 12, marginTop: 12, textAlign: 'center' },
  btnDanger: { backgroundColor: '#FFF0F0', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#FFD0D0' },
  btnDangerText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  effetItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  effetItemActif: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  effetNom: { color: colors.text, fontSize: 13, fontWeight: '600' },
  effetDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  effetToggle: { backgroundColor: colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  effetToggleActif: { backgroundColor: colors.primary },
  filtreItem: { alignItems: 'center', marginRight: 12 },
  filtreItemActif: { opacity: 1 },
  filtrePreview: { width: 60, height: 60, borderRadius: 8, marginBottom: 4, justifyContent: 'center', alignItems: 'center' },
  filtreNom: { color: colors.textSecondary, fontSize: 11 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderBtn: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  sliderBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  sliderBtnText: { color: colors.textSecondary, fontSize: 13 },
  sliderBtnTextActive: { color: colors.primary, fontWeight: 'bold' },
  panelBtn: { backgroundColor: colors.card, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  panelBtnText: { color: colors.text, fontSize: 14 },
  dureeOptimale: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 6, backgroundColor: colors.card, flexWrap: 'wrap' },
  dureeItem: { backgroundColor: '#FFF0F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#FFD0D0' },
  dureeItemOk: { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5' },
  dureeItemTexte: { fontSize: 10, color: colors.danger },
  dureeItemTexteOk: { color: colors.success },
  btnTelephone: { backgroundColor: colors.primary, margin: 16, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  btnTelephoneText: { color: colors.white, fontSize: 15, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitre: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { backgroundColor: colors.card, borderRadius: 10, padding: 12, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnAnnuler: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: 10 },
  modalBtnOk: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10 },
});
