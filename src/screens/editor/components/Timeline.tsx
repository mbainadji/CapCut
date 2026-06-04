import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, PanResponder, Animated,
} from 'react-native';
import { Segment, Beat } from '../types/editor.types';
import { colors } from '../../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_HEIGHT = 80;
const PIXELS_PER_SECOND = 60;

interface TimelineProps {
  duration: number;
  currentTime: number;
  segments: Segment[];
  beats: Beat[];
  onSeek: (time: number) => void;
  onCutHere: () => void;
  onSegmentPress: (id: string) => void;
  onSegmentDelete: (id: string) => void;
  activeSegmentId: string | null;
}

export default function Timeline({
  duration,
  currentTime,
  segments,
  beats,
  onSeek,
  onCutHere,
  onSegmentPress,
  onSegmentDelete,
  activeSegmentId,
}: TimelineProps) {
  const scrollRef = useRef<ScrollView>(null);
  const playheadAnim = useRef(new Animated.Value(0)).current;
  const timelineWidth = Math.max(duration * PIXELS_PER_SECOND, SCREEN_WIDTH);
  const playheadX = (currentTime / duration) * timelineWidth;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimelinePress = useCallback((event: any) => {
    const x = event.nativeEvent.locationX;
    const scrollX = event.nativeEvent.pageX - x;
    const time = (x / timelineWidth) * duration;
    onSeek(Math.max(0, Math.min(time, duration)));
  }, [duration, timelineWidth, onSeek]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt) => {
      const x = evt.nativeEvent.locationX;
      const time = (x / timelineWidth) * duration;
      onSeek(Math.max(0, Math.min(time, duration)));
    },
  });

  // Marqueurs de temps
  const marqueursTemps = [];
  const interval = duration > 60 ? 10 : duration > 30 ? 5 : 2;
  for (let t = 0; t <= duration; t += interval) {
    marqueursTemps.push(t);
  }

  return (
    <View style={s.container}>
      {/* Bouton Couper ici */}
      <View style={s.headerTimeline}>
        <Text style={s.timelineLabel}>Timeline — {formatTime(currentTime)}</Text>
        <TouchableOpacity style={s.btnCouper} onPress={onCutHere}>
          <Text style={s.btnCouperText}>✂️ Couper ici</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline scrollable */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={s.scrollView}
      >
        <View style={[s.timelineContainer, { width: timelineWidth }]}
          {...panResponder.panHandlers}>

          {/* Fond de la timeline */}
          <View style={[s.timelineBg, { width: timelineWidth }]} />

          {/* Marqueurs de temps */}
          {marqueursTemps.map(t => (
            <View key={t} style={[s.marqueur, { left: (t / duration) * timelineWidth }]}>
              <View style={s.marqueurLine} />
              <Text style={s.marqueurTexte}>{formatTime(t)}</Text>
            </View>
          ))}

          {/* Segments colorés */}
          {segments.map((seg, i) => (
            <TouchableOpacity
              key={seg.id}
              style={[
                s.segment,
                {
                  left: (seg.startTime / duration) * timelineWidth,
                  width: ((seg.endTime - seg.startTime) / duration) * timelineWidth - 2,
                  backgroundColor: seg.selected || activeSegmentId === seg.id
                    ? colors.primary
                    : `hsl(${(i * 40) % 360}, 70%, 60%)`,
                },
              ]}
              onPress={() => onSegmentPress(seg.id)}
              onLongPress={() => onSegmentDelete(seg.id)}
            >
              <Text style={s.segmentLabel} numberOfLines={1}>
                {formatTime(seg.startTime)} → {formatTime(seg.endTime)}
              </Text>
              {seg.texte && (
                <Text style={s.segmentTexte} numberOfLines={1}>{seg.texte}</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Beats markers */}
          {beats.map((beat, i) => (
            <View
              key={i}
              style={[
                s.beatMarker,
                { left: (beat.time / duration) * timelineWidth },
              ]}
            />
          ))}

          {/* Playhead */}
          <View style={[s.playhead, { left: playheadX }]}>
            <View style={s.playheadHead} />
            <View style={s.playheadLine} />
          </View>

        </View>
      </ScrollView>

      {/* Légende */}
      <View style={s.legende}>
        <View style={s.legendeItem}>
          <View style={[s.legendeColor, { backgroundColor: colors.primary }]} />
          <Text style={s.legendeTexte}>Segment sélectionné</Text>
        </View>
        <View style={s.legendeItem}>
          <View style={[s.legendeColor, { backgroundColor: '#FF9800' }]} />
          <Text style={s.legendeTexte}>Beat musical</Text>
        </View>
        <Text style={s.legendeTip}>Appui long → supprimer</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  headerTimeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  timelineLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  btnCouper: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnCouperText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  scrollView: { height: TIMELINE_HEIGHT + 20 },
  timelineContainer: { height: TIMELINE_HEIGHT + 20, position: 'relative' },
  timelineBg: { position: 'absolute', top: 20, height: TIMELINE_HEIGHT, backgroundColor: '#F0F8FF', borderRadius: 4 },
  marqueur: { position: 'absolute', top: 0, alignItems: 'center' },
  marqueurLine: { width: 1, height: TIMELINE_HEIGHT + 20, backgroundColor: colors.border, opacity: 0.5 },
  marqueurTexte: { position: 'absolute', top: 2, fontSize: 9, color: colors.textSecondary, transform: [{ translateX: -12 }] },
  segment: { position: 'absolute', top: 24, height: TIMELINE_HEIGHT - 8, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 6, opacity: 0.85 },
  segmentLabel: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  segmentTexte: { color: '#fff', fontSize: 8, marginTop: 2, opacity: 0.8 },
  beatMarker: { position: 'absolute', top: 20, width: 2, height: TIMELINE_HEIGHT, backgroundColor: '#FF9800', opacity: 0.7 },
  playhead: { position: 'absolute', top: 0, alignItems: 'center', zIndex: 10 },
  playheadHead: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger },
  playheadLine: { width: 2, height: TIMELINE_HEIGHT + 8, backgroundColor: colors.danger },
  legende: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 12, backgroundColor: colors.card },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendeColor: { width: 10, height: 10, borderRadius: 2 },
  legendeTexte: { fontSize: 9, color: colors.textSecondary },
  legendeTip: { fontSize: 9, color: colors.inactive, marginLeft: 'auto' },
});
