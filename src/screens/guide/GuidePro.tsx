import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { colors } from '../../context/ThemeContext';

const RESEAUX = [
  {
    id: 'tiktok',
    nom: 'TikTok',
    emoji: '🎵',
    duree: '7-15 secondes',
    dureeMax: 15,
    couleur: '#010101',
    tips: [
      'Zoom sur la 1ère seconde pour accrocher',
      '1 coupe toutes les 2-3 secondes',
      'Sous-titres obligatoires (85% sans son)',
      'Filtre cohérent sur toutes vos vidéos',
      'Glitch sur le point culminant',
    ],
  },
  {
    id: 'reels',
    nom: 'Instagram Reels',
    emoji: '📸',
    duree: '15-30 secondes',
    dureeMax: 30,
    couleur: '#E1306C',
    tips: [
      'Fondu en intro et outro',
      'Filtre Chaud ou Vivid pour lifestyle',
      'Texte en bas (évite le UI Instagram)',
      'Rampe de vitesse sur la danse',
      'Volume musique à 25% si voix',
    ],
  },
  {
    id: 'shorts',
    nom: 'YouTube Shorts',
    emoji: '▶️',
    duree: '30-60 secondes',
    dureeMax: 60,
    couleur: '#FF0000',
    tips: [
      'Introduction en moins de 3 secondes',
      'Sous-titres sur chaque point clé',
      'Vitesse 1.5x sur les parties lentes',
      'Filtre Drama pour le contenu sérieux',
      'Zoom sur les détails importants',
    ],
  },
];

const WORKFLOW = [
  { num: '1', titre: 'Importez', desc: 'Nouvelle vidéo → choisissez votre meilleure prise', icon: '📥' },
  { num: '2', titre: 'Découpez', desc: 'Trim → gardez uniquement l\'essentiel', icon: '✂️' },
  { num: '3', titre: 'Rythme', desc: 'Vitesse → 1.5x sur les parties lentes', icon: '⚡' },
  { num: '4', titre: 'Filtre', desc: 'Filtres → choisissez votre filtre signature', icon: '🎨' },
  { num: '5', titre: 'Effets', desc: 'Zoom en intro, Glitch sur le climax', icon: '✨' },
  { num: '6', titre: 'Audio', desc: 'Volume → 75% musique, 100% voix', icon: '🔊' },
  { num: '7', titre: 'Texte', desc: 'Sous-titres → max 6 mots par ligne', icon: '💬' },
  { num: '8', titre: 'Vérifiez', desc: 'Regardez sans son → test sous-titres', icon: '👁' },
  { num: '9', titre: 'Exportez', desc: 'Export + Enregistrer sur téléphone', icon: '📱' },
  { num: '10', titre: 'Publiez', desc: 'Régularité : 3 vidéos/semaine minimum', icon: '🚀' },
];

const ERREURS = [
  { erreur: 'Vidéo trop longue', solution: 'Coupez impitoyablement — moins c\'est plus' },
  { erreur: 'Pas de sous-titres', solution: '85% regardent sans son — toujours sous-titrer' },
  { erreur: 'Filtre différent à chaque vidéo', solution: 'Gardez le même filtre = identité visuelle' },
  { erreur: 'Glitch sur toute la durée', solution: 'Max 0.5 seconde sur le point culminant' },
  { erreur: 'Volume 100% sur bruit de fond', solution: 'Baissez à 50% si environnement bruyant' },
  { erreur: 'Pas de zoom en début', solution: 'Les 3 premières secondes sont cruciales' },
  { erreur: 'Couper au milieu d\'une phrase', solution: 'Attendez la fin de la phrase pour couper' },
  { erreur: 'Texte trop long', solution: 'Maximum 6 mots par sous-titre' },
];

export default function GuidePro({ navigation }: any) {
  const [onglet, setOnglet] = useState<'workflow' | 'reseaux' | 'erreurs' | 'effets'>('workflow');
  const [reseauActif, setReseauActif] = useState(RESEAUX[0]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.headerBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerTitre}>🎬 Guide Pro</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
        {[
          { id: 'workflow', label: '📋 Workflow' },
          { id: 'reseaux', label: '📱 Réseaux' },
          { id: 'effets', label: '✨ Effets' },
          { id: 'erreurs', label: '⚠️ Erreurs' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, onglet === t.id && s.tabActive]}
            onPress={() => setOnglet(t.id as any)}>
            <Text style={[s.tabText, onglet === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>

        {/* Workflow */}
        {onglet === 'workflow' && (
          <View style={s.section}>
            <Text style={s.sectionTitre}>🚀 Workflow Professionnel</Text>
            <Text style={s.sectionSousTitre}>10 étapes pour une vidéo virale</Text>
            {WORKFLOW.map((step, i) => (
              <View key={i} style={s.workflowItem}>
                <View style={s.workflowNum}>
                  <Text style={s.workflowNumText}>{step.num}</Text>
                </View>
                <View style={s.workflowConnector} />
                <View style={s.workflowCard}>
                  <Text style={s.workflowIcon}>{step.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.workflowTitre}>{step.titre}</Text>
                    <Text style={s.workflowDesc}>{step.desc}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Réseaux sociaux */}
        {onglet === 'reseaux' && (
          <View style={s.section}>
            <Text style={s.sectionTitre}>📱 Optimisation par réseau</Text>

            {/* Sélecteur réseau */}
            <View style={s.reseauxSelector}>
              {RESEAUX.map(r => (
                <TouchableOpacity key={r.id}
                  style={[s.reseauBtn, reseauActif.id === r.id && { backgroundColor: colors.primary }]}
                  onPress={() => setReseauActif(r)}>
                  <Text style={s.reseauBtnEmoji}>{r.emoji}</Text>
                  <Text style={[s.reseauBtnNom, reseauActif.id === r.id && { color: colors.white }]}>
                    {r.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info réseau actif */}
            <View style={s.reseauCard}>
              <View style={s.reseauHeader}>
                <Text style={s.reseauEmoji}>{reseauActif.emoji}</Text>
                <View>
                  <Text style={s.reseauNom}>{reseauActif.nom}</Text>
                  <Text style={s.reseauDuree}>⏱ Durée idéale : {reseauActif.duree}</Text>
                </View>
              </View>

              {/* Indicateur de durée */}
              <View style={s.dureeIndicateur}>
                <Text style={s.dureeLabel}>Durée optimale</Text>
                <View style={s.dureeBar}>
                  <View style={[s.dureeFill, {
                    width: `${(reseauActif.dureeMax / 60) * 100}%`,
                    backgroundColor: colors.primary,
                  }]} />
                </View>
                <Text style={s.dureeTexte}>0s ←→ 60s</Text>
              </View>

              <Text style={s.tipsTitre}>✅ Tips professionnels :</Text>
              {reseauActif.tips.map((tip, i) => (
                <View key={i} style={s.tipItem}>
                  <Text style={s.tipBullet}>•</Text>
                  <Text style={s.tipTexte}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Métriques cibles */}
            <View style={s.metriquesCard}>
              <Text style={s.metriquesTitre}>📊 Métriques à viser</Text>
              {[
                { label: 'Taux de completion', valeur: '> 70%', couleur: colors.success },
                { label: 'Partages', valeur: '> 1% des vues', couleur: colors.primary },
                { label: 'Commentaires', valeur: '> 0.5% des vues', couleur: '#FF9800' },
                { label: 'Watch time moyen', valeur: '> 60% durée', couleur: '#9C27B0' },
              ].map((m, i) => (
                <View key={i} style={s.metriqueItem}>
                  <Text style={s.metriqueLabel}>{m.label}</Text>
                  <Text style={[s.metriqueValeur, { color: m.couleur }]}>{m.valeur}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Guide effets */}
        {onglet === 'effets' && (
          <View style={s.section}>
            <Text style={s.sectionTitre}>✨ Guide des effets</Text>
            {[
              {
                nom: '📼 VHS Rétro', quand: 'Nostalgie, throwback, années 90',
                comment: 'Combinez avec filtre Vintage + vitesse 0.5x',
                eviter: 'Ne pas utiliser sur du contenu moderne/tech',
                duree: 'Toute la vidéo ou transitions',
              },
              {
                nom: '⚡ Glitch', quand: 'Gaming, intro punchy, climax de vidéo',
                comment: 'Synchronisez avec un beat fort. Max 0.5 seconde.',
                eviter: 'Ne jamais utiliser sur toute la durée',
                duree: 'Moins de 0.5 seconde',
              },
              {
                nom: '🔍 Zoom', quand: 'Révélation produit, réaction surprise, début de vidéo',
                comment: 'Activez sur la 1ère seconde pour accrocher le spectateur',
                eviter: 'Ne pas zoomer sur fond flou',
                duree: '1-2 secondes max',
              },
              {
                nom: '🌊 Fondu', quand: 'Intro et outro de toutes les vidéos',
                comment: 'Combo parfait : Fondu entrée + musique qui monte',
                eviter: 'Pas de fondu au milieu de l\'action',
                duree: '0.5 seconde',
              },
              {
                nom: '💬 Sous-titres', quand: 'Toujours — 85% regardent sans son',
                comment: 'Max 6 mots par ligne. Position bas d\'écran.',
                eviter: 'Texte trop long ou trop petit',
                duree: 'Toute la durée de la voix',
              },
              {
                nom: '🎨 Filtre Chaud', quand: 'Lifestyle, food, voyage, couchers de soleil',
                comment: 'Gardez ce filtre sur TOUTES vos vidéos = identité visuelle',
                eviter: 'Ne pas mélanger avec filtre Froid',
                duree: 'Toute la vidéo',
              },
              {
                nom: '🎭 Filtre Drama', quand: 'Sport, motivation, cinématique',
                comment: 'Parfait pour YouTube Shorts sérieux',
                eviter: 'Trop sombre sur les visages',
                duree: 'Toute la vidéo',
              },
            ].map((effet, i) => (
              <View key={i} style={s.effetCard}>
                <Text style={s.effetNom}>{effet.nom}</Text>
                <View style={s.effetRow}>
                  <Text style={s.effetLabel}>✅ Quand l'utiliser</Text>
                  <Text style={s.effetValeur}>{effet.quand}</Text>
                </View>
                <View style={s.effetRow}>
                  <Text style={s.effetLabel}>🎯 Comment</Text>
                  <Text style={s.effetValeur}>{effet.comment}</Text>
                </View>
                <View style={s.effetRow}>
                  <Text style={s.effetLabel}>⏱ Durée</Text>
                  <Text style={[s.effetValeur, { color: colors.primary }]}>{effet.duree}</Text>
                </View>
                <View style={s.effetRow}>
                  <Text style={s.effetLabel}>❌ À éviter</Text>
                  <Text style={[s.effetValeur, { color: colors.danger }]}>{effet.eviter}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Erreurs */}
        {onglet === 'erreurs' && (
          <View style={s.section}>
            <Text style={s.sectionTitre}>⚠️ Erreurs à ne jamais faire</Text>
            <Text style={s.sectionSousTitre}>Les 8 erreurs qui tuent l'engagement</Text>
            {ERREURS.map((e, i) => (
              <View key={i} style={s.erreurCard}>
                <View style={s.erreurHeader}>
                  <Text style={s.erreurNum}>{i + 1}</Text>
                  <Text style={s.erreurTitre}>❌ {e.erreur}</Text>
                </View>
                <View style={s.erreurSolution}>
                  <Text style={s.erreurSolutionLabel}>✅ Solution :</Text>
                  <Text style={s.erreurSolutionTexte}>{e.solution}</Text>
                </View>
              </View>
            ))}

            {/* Conseil final */}
            <View style={s.conseilFinal}>
              <Text style={s.conseilFinalIcon}>🏆</Text>
              <Text style={s.conseilFinalTitre}>Conseil final</Text>
              <Text style={s.conseilFinalTexte}>
                Publiez <Text style={{ fontWeight: 'bold', color: colors.primary }}>3 vidéos par semaine minimum</Text> avec des réglages cohérents.{'\n\n'}
                La régularité bat toujours la perfection ponctuelle sur les algorithmes de TikTok et Instagram.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerBtn: { color: colors.primary, fontSize: 14 },
  headerTitre: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  tabsScroll: { backgroundColor: colors.white, maxHeight: 50, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.inactive, fontSize: 13 },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitre: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sectionSousTitre: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },

  // Workflow
  workflowItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  workflowNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  workflowNumText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  workflowConnector: { width: 2, height: '100%', backgroundColor: colors.primaryLight, position: 'absolute', left: 15, top: 32 },
  workflowCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginLeft: 12, borderWidth: 1, borderColor: colors.border, gap: 10 },
  workflowIcon: { fontSize: 24 },
  workflowTitre: { fontSize: 14, fontWeight: '700', color: colors.text },
  workflowDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Réseaux
  reseauxSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reseauBtn: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  reseauBtnEmoji: { fontSize: 20, marginBottom: 4 },
  reseauBtnNom: { fontSize: 10, color: colors.text, fontWeight: '600', textAlign: 'center' },
  reseauCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  reseauHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  reseauEmoji: { fontSize: 36 },
  reseauNom: { fontSize: 18, fontWeight: '800', color: colors.text },
  reseauDuree: { fontSize: 13, color: colors.primary, marginTop: 2 },
  dureeIndicateur: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 16 },
  dureeLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  dureeBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 4 },
  dureeFill: { height: 8, borderRadius: 4 },
  dureeTexte: { fontSize: 10, color: colors.inactive },
  tipsTitre: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  tipItem: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tipBullet: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  tipTexte: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  metriquesCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  metriquesTitre: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  metriqueItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  metriqueLabel: { fontSize: 13, color: colors.text },
  metriqueValeur: { fontSize: 13, fontWeight: '700' },

  // Effets
  effetCard: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  effetNom: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  effetRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  effetLabel: { fontSize: 11, color: colors.primary, fontWeight: '600', width: 100 },
  effetValeur: { flex: 1, fontSize: 12, color: colors.text, lineHeight: 16 },

  // Erreurs
  erreurCard: { backgroundColor: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  erreurHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#FFF5F5' },
  erreurNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.danger, color: colors.white, fontSize: 11, fontWeight: 'bold', textAlign: 'center', lineHeight: 24 },
  erreurTitre: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.danger },
  erreurSolution: { padding: 12, flexDirection: 'row', gap: 8 },
  erreurSolutionLabel: { fontSize: 12, color: colors.success, fontWeight: '700' },
  erreurSolutionTexte: { flex: 1, fontSize: 12, color: colors.text },
  conseilFinal: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 20, marginTop: 16, alignItems: 'center' },
  conseilFinalIcon: { fontSize: 40, marginBottom: 8 },
  conseilFinalTitre: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginBottom: 12 },
  conseilFinalTexte: { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 22 },
});
