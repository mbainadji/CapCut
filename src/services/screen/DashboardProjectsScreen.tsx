import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  Image, Dimensions, Alert, ActivityIndicator, TextInput,
  Modal, ScrollView, SafeAreaView, StatusBar, Linking,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../supabase';
import { colors } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const OUTILS = [
  { id: 'decoupage', nom: 'Découpage\nautomatique', icon: '⚡', badge: null },
  { id: 'retouche', nom: 'Retouche', icon: '🎨', badge: null },
  { id: 'ia', nom: 'Générateur IA', icon: '✨', badge: null },
  { id: 'legendes', nom: 'Légendes\nautomatiques', icon: '💬', badge: null },
  { id: 'editeur_pc', nom: 'Éditeur sur\nordinateur', icon: '🖥', badge: 'es gratuits' },
  { id: 'suppression_bg', nom: 'Supprimer\nl\'arrière-plan', icon: '✂️', badge: null },
  { id: 'qualite', nom: 'Améliorer la\nqualité', icon: '📺', badge: null },
  { id: 'tous', nom: 'Tous les outils', icon: '⚙️', badge: '●' },
];

const EFFETS = [
  { id: 'zoom3d', nom: '🔍 Zoom 3D', categorie: 'IA', description: 'Anime vos photos avec un zoom 3D' },
  { id: 'suivi_cam', nom: '🎥 Suivi caméra', categorie: 'IA', description: 'Suit un objet dynamiquement' },
  { id: 'suppression_bg', nom: '✂️ Suppr. arrière-plan', categorie: 'Découpage', description: 'Supprime automatiquement le fond' },
  { id: 'vhs', nom: '📼 VHS Rétro', categorie: 'Vidéo', description: 'Effet cassette vidéo vintage' },
  { id: 'glitch', nom: '⚡ Glitch', categorie: 'Vidéo', description: 'Distorsion numérique' },
  { id: 'flou', nom: '🌫 Flou cinéma', categorie: 'Vidéo', description: 'Flou artistique' },
  { id: 'lueur', nom: '✨ Lueur', categorie: 'Lumière', description: 'Effet de lumière douce' },
  { id: 'halo', nom: '💫 Halo corporel', categorie: 'Corps', description: 'Halo lumineux autour du corps' },
  { id: 'voix', nom: '🎙 Amélioration voix', categorie: 'Audio', description: 'Réduit les bruits et échos' },
  { id: 'isolation_vocale', nom: '🎵 Isolation vocale', categorie: 'Audio', description: 'Sépare voix et musique' },
  { id: 'sous_titres', nom: '💬 Sous-titres auto', categorie: 'Texte', description: 'Génère les sous-titres automatiquement' },
  { id: 'fondu', nom: '🌊 Fondu', categorie: 'Transition', description: 'Transition douce entre clips' },
  { id: 'zoom_trans', nom: '🔄 Zoom transition', categorie: 'Transition', description: 'Transition avec zoom' },
];

const CATEGORIES = ['Tous', 'IA', 'Découpage', 'Vidéo', 'Lumière', 'Corps', 'Audio', 'Texte', 'Transition'];

export default function DashboardProjectsScreen({ navigation }: any) {
  const [projets, setProjets] = useState<any[]>([]);
  const [projetsFiltres, setProjetsFiltres] = useState<any[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalEffets, setModalEffets] = useState(false);
  const [categorieActive, setCategorieActive] = useState('Tous');
  const [effetsSelectionnes, setEffetsSelectionnes] = useState<string[]>([]);
  const [projetActif, setProjetActif] = useState<string | null>(null);
  const [modalRenommer, setModalRenommer] = useState(false);
  const [projetARenommer, setProjetARenommer] = useState<any>(null);
  const [nouveauNom, setNouveauNom] = useState('');

  const chargerProjets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('projets').select('*').eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProjets(data || []);
      setProjetsFiltres(data || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerProjets(); }, []);

  const gererRecherche = (texte: string) => {
    setRecherche(texte);
    setProjetsFiltres(texte.trim() === '' ? projets :
      projets.filter(p => p.nom.toLowerCase().includes(texte.toLowerCase())));
  };

  const initialiserNouveauProjet = () => {
    launchImageLibrary({ mediaType: 'video', quality: 1 }, async (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) { Alert.alert('Erreur', response.errorMessage); return; }
      const video = response.assets?.[0];
      if (!video) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const nom = `Projet du ${new Date().toLocaleDateString('fr-FR')}`;
        const { data, error } = await supabase.from('projets')
          .insert([{ user_id: user.id, nom, video_source_url: video.uri }])
          .select().single();
        if (error) throw error;
        chargerProjets();
        // Naviguer vers l'éditeur
        navigation.navigate('VideoEditor', {
          projetId: data.id,
          videoUri: video.uri,
          nomProjet: nom,
        });
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      }
    });
  };

  const ouvrirProjetDansEditeur = (projet: any) => {
    if (!projet.video_source_url) {
      Alert.alert('Aucune vidéo', 'Ce projet n\'a pas de vidéo source.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ajouter une vidéo', onPress: () => ajouterVideoAuProjet(projet) },
      ]);
      return;
    }
    navigation.navigate('VideoEditor', {
      projetId: projet.id,
      videoUri: projet.video_source_url,
      nomProjet: projet.nom,
    });
  };

  const ajouterVideoAuProjet = (projet: any) => {
    launchImageLibrary({ mediaType: 'video', quality: 1 }, async (response) => {
      if (response.didCancel) return;
      const video = response.assets?.[0];
      if (!video) return;
      try {
        await supabase.from('projets').update({
          video_source_url: video.uri,
          updated_at: new Date().toISOString(),
        }).eq('id', projet.id);
        chargerProjets();
        navigation.navigate('VideoEditor', {
          projetId: projet.id,
          videoUri: video.uri,
          nomProjet: projet.nom,
        });
      } catch (e: any) {
        Alert.alert('Erreur', e.message);
      }
    });
  };

  const ouvrirOutil = (id: string) => {
    switch (id) {
      case 'decoupage':
        Alert.alert('✂️ Découpage automatique',
          'Sélectionnez une vidéo pour démarrer le découpage automatique.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir une vidéo', onPress: initialiserNouveauProjet },
        ]);
        break;
      case 'retouche':
        launchImageLibrary({ mediaType: 'mixed' }, (r) => {
          if (!r.didCancel && r.assets?.[0]) {
            Alert.alert('🎨 Retouche', 'Retouche disponible dans l\'éditeur de projet.');
          }
        });
        break;
      case 'ia':
        Alert.alert('✨ Générateur IA',
          'Créez du contenu avec l\'IA. Sélectionnez une vidéo source.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir une vidéo', onPress: initialiserNouveauProjet },
        ]);
        break;
      case 'legendes':
        Alert.alert('💬 Légendes automatiques',
          'Générez des sous-titres automatiquement pour votre vidéo.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir une vidéo', onPress: initialiserNouveauProjet },
        ]);
        break;
      case 'editeur_pc':
        Alert.alert('🖥 Éditeur sur ordinateur',
          'Accédez à l\'éditeur complet sur votre ordinateur.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir le lien', onPress: () => Linking.openURL('https://capcut.com') },
        ]);
        break;
      case 'suppression_bg':
        Alert.alert('✂️ Supprimer l\'arrière-plan',
          'Supprimez automatiquement l\'arrière-plan de votre vidéo.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir une vidéo', onPress: initialiserNouveauProjet },
        ]);
        break;
      case 'qualite':
        Alert.alert('📺 Améliorer la qualité',
          'Améliorez la qualité de votre vidéo jusqu\'en 4K.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir une vidéo', onPress: initialiserNouveauProjet },
        ]);
        break;
      case 'tous':
        setModalEffets(true);
        setProjetActif(null);
        break;
    }
  };

  const ouvrirEffets = (projetId: string, effetsExistants: string[] = []) => {
    setProjetActif(projetId);
    setEffetsSelectionnes(effetsExistants);
    setModalEffets(true);
  };

  const toggleEffet = (id: string) => {
    setEffetsSelectionnes(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const sauvegarderEffets = async () => {
    if (!projetActif) { setModalEffets(false); return; }
    try {
      await supabase.from('projets').update({
        timeline_data: { effets: effetsSelectionnes },
        updated_at: new Date().toISOString(),
      }).eq('id', projetActif);
      setModalEffets(false);
      chargerProjets();
      Alert.alert('✅', `${effetsSelectionnes.length} effet(s) appliqué(s)`);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const supprimerProjet = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer définitivement ce projet ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await supabase.from('projets').delete().eq('id', id);
        chargerProjets();
      }},
    ]);
  };

  const effetsFiltres = categorieActive === 'Tous' ? EFFETS :
    EFFETS.filter(e => e.categorie === categorieActive);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.getParent()?.navigate('ProfileTab')}>
          <Text style={s.headerIcon}>👤</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => Alert.alert('🔔 Notifications', 'Aucune nouvelle notification.')}>
            <Text style={s.headerIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.getParent()?.navigate('ProfileTab')}>
            <Text style={s.headerIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Boutons principaux */}
        <View style={s.mainBtns}>
          <TouchableOpacity style={s.mainBtn} onPress={initialiserNouveauProjet}>
            <View style={s.mainBtnIcon}>
              <Text style={s.mainBtnIconText}>＋</Text>
            </View>
            <Text style={s.mainBtnText}>Nouvelle vidéo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mainBtn} onPress={() =>
            launchImageLibrary({ mediaType: 'photo' }, (r) => {
              if (!r.didCancel && r.assets?.[0]) {
                Alert.alert('🖼 Photo', 'Édition photo disponible dans l\'éditeur.');
              }
            })
          }>
            <View style={s.mainBtnIcon}>
              <Text style={s.mainBtnIconText}>🖼</Text>
            </View>
            <Text style={s.mainBtnText}>Éditer la photo</Text>
          </TouchableOpacity>
        </View>

        {/* Grille outils */}
        <View style={s.outilsGrid}>
          {OUTILS.map((outil) => (
            <TouchableOpacity key={outil.id} style={s.outilCard} onPress={() => ouvrirOutil(outil.id)}>
              {outil.badge && outil.badge !== '●' && (
                <View style={s.outilBadge}>
                  <Text style={s.outilBadgeText}>{outil.badge}</Text>
                </View>
              )}
              {outil.badge === '●' && <View style={s.outilDot} />}
              <Text style={s.outilIcon}>{outil.icon}</Text>
              <Text style={s.outilNom}>{outil.nom}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Projets */}
        <View style={s.projetsSection}>
          <View style={s.projetsSectionHeader}>
            <Text style={s.projetsSectionTitre}>Projets</Text>
            <View style={s.rechercheMini}>
              <TextInput
                style={s.rechercheInput}
                placeholder="🔍 Rechercher..."
                placeholderTextColor={colors.inactive}
                value={recherche}
                onChangeText={gererRecherche}
              />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : projets.length === 0 ? (
            <View style={s.projetsVide}>
              <Text style={s.projetsVideIcon}>🎬</Text>
              <Text style={s.projetsVideTexte}>
                Tes projets apparaîtront ici.{'\n'}Commence à créer dès maintenant.
              </Text>
            </View>
          ) : (
            <FlatList
              data={projetsFiltres}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const effets = item.timeline_data?.effets || [];
                const aVideo = !!item.video_source_url;
                return (
                  <TouchableOpacity
                    style={s.carteProjet}
                    onPress={() => ouvrirProjetDansEditeur(item)}
                    onLongPress={() => Alert.alert(item.nom, 'Que voulez-vous faire ?', [
                      { text: '▶️ Ouvrir l\'éditeur', onPress: () => ouvrirProjetDansEditeur(item) },
                      { text: '✨ Effets', onPress: () => ouvrirEffets(item.id, effets) },
                      { text: '✏️ Renommer', onPress: () => {
                        setProjetARenommer(item);
                        setNouveauNom(item.nom);
                        setModalRenommer(true);
                      }},
                      { text: '🗑 Supprimer', style: 'destructive', onPress: () => supprimerProjet(item.id) },
                      { text: 'Annuler', style: 'cancel' },
                    ])}
                  >
                    {item.miniature_url ? (
                      <Image source={{ uri: item.miniature_url }} style={s.miniature} />
                    ) : (
                      <View style={[s.miniature, s.miniaturePlaceholder]}>
                        <Text style={s.miniaturePlaceholderIcon}>{aVideo ? '🎬' : '📁'}</Text>
                        <Text style={s.miniaturePlaceholderText}>{aVideo ? 'Vidéo prête' : 'Sans vidéo'}</Text>
                      </View>
                    )}
                    <View style={s.infosProjet}>
                      <Text style={s.nomProjet} numberOfLines={1}>{item.nom}</Text>
                      <Text style={s.dateProjet}>
                        {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                      </Text>
                      <View style={s.projetBadges}>
                        {aVideo && <Text style={s.badgeVideo}>▶ Vidéo</Text>}
                        {effets.length > 0 && (
                          <Text style={s.effetsCount}>✨ {effets.length}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal Effets */}
      <Modal visible={modalEffets} animationType="slide" onRequestClose={() => setModalEffets(false)}>
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setModalEffets(false)}>
              <Text style={s.modalRetour}>✕</Text>
            </TouchableOpacity>
            <Text style={s.modalTitre}>
              Effets ({effetsSelectionnes.length} sélectionné{effetsSelectionnes.length > 1 ? 's' : ''})
            </Text>
            <TouchableOpacity onPress={sauvegarderEffets}>
              <Text style={s.modalAppliquer}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoriesScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat}
                style={[s.categoriePill, categorieActive === cat && s.categoriePillActive]}
                onPress={() => setCategorieActive(cat)}>
                <Text style={[s.categoriePillText, categorieActive === cat && s.categoriePillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={effetsFiltres}
            keyExtractor={e => e.id}
            numColumns={2}
            contentContainerStyle={s.effetsGrid}
            renderItem={({ item }) => {
              const selectionne = effetsSelectionnes.includes(item.id);
              return (
                <TouchableOpacity
                  style={[s.carteEffet, selectionne && s.carteEffetActive]}
                  onPress={() => toggleEffet(item.id)}
                >
                  <Text style={s.effetNom}>{item.nom}</Text>
                  <Text style={s.effetDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={s.effetBadge}>
                    <Text style={s.effetBadgeText}>{item.categorie}</Text>
                  </View>
                  {selectionne && <Text style={s.effetCheck}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal Renommer */}
      <Modal visible={modalRenommer} transparent animationType="fade" onRequestClose={() => setModalRenommer(false)}>
        <View style={s.renommerOverlay}>
          <View style={s.renommerModal}>
            <Text style={s.renommerTitre}>Renommer le projet</Text>
            <TextInput
              style={s.renommerInput}
              value={nouveauNom}
              onChangeText={setNouveauNom}
              placeholder="Nom du projet"
              placeholderTextColor={colors.inactive}
              autoFocus
            />
            <View style={s.renommerBtns}>
              <TouchableOpacity style={s.renommerBtnAnnuler} onPress={() => setModalRenommer(false)}>
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.renommerBtnOk} onPress={async () => {
                if (!nouveauNom.trim() || !projetARenommer) return;
                await supabase.from('projets').update({
                  nom: nouveauNom.trim(),
                  updated_at: new Date().toISOString(),
                }).eq('id', projetARenommer.id);
                setModalRenommer(false);
                chargerProjets();
              }}>
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  headerIcon: { fontSize: 18 },
  mainBtns: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 12, marginBottom: 16 },
  mainBtn: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mainBtnIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  mainBtnIconText: { color: colors.white, fontSize: 22, fontWeight: '300' },
  mainBtnText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  outilsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  outilCard: { width: (width - 62) / 4, backgroundColor: colors.white, borderRadius: 14, padding: 10, alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 80, borderWidth: 1, borderColor: colors.border, elevation: 1 },
  outilBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2 },
  outilBadgeText: { color: colors.white, fontSize: 7, fontWeight: 'bold' },
  outilDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },
  outilIcon: { fontSize: 24, marginBottom: 6 },
  outilNom: { color: colors.text, fontSize: 10, textAlign: 'center', fontWeight: '500' },
  projetsSection: { paddingHorizontal: 16, paddingBottom: 30 },
  projetsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  projetsSectionTitre: { fontSize: 22, fontWeight: '800', color: colors.text },
  rechercheMini: { flex: 1, marginLeft: 12 },
  rechercheInput: { backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, color: colors.text, borderWidth: 1, borderColor: colors.border },
  projetsVide: { alignItems: 'center', paddingVertical: 50 },
  projetsVideIcon: { fontSize: 48, marginBottom: 16 },
  projetsVideTexte: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  carteProjet: { backgroundColor: colors.white, width: (width - 48) / 2, borderRadius: 12, marginRight: 16, marginBottom: 16, overflow: 'hidden', elevation: 2, borderWidth: 1, borderColor: colors.border },
  miniature: { width: '100%', height: 110 },
  miniaturePlaceholder: { backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  miniaturePlaceholderIcon: { fontSize: 28, marginBottom: 4 },
  miniaturePlaceholderText: { color: colors.primaryDark, fontSize: 10, fontWeight: '500' },
  infosProjet: { padding: 10 },
  nomProjet: { color: colors.text, fontSize: 13, fontWeight: '600' },
  dateProjet: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  projetBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badgeVideo: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  effetsCount: { color: colors.primaryDark, fontSize: 10 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  modalRetour: { color: colors.text, fontSize: 18 },
  modalTitre: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  modalAppliquer: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  categoriesScroll: { paddingHorizontal: 16, paddingVertical: 12, maxHeight: 55, backgroundColor: colors.white },
  categoriePill: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  categoriePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoriePillText: { color: colors.textSecondary, fontSize: 13 },
  categoriePillTextActive: { color: colors.white },
  effetsGrid: { padding: 16 },
  carteEffet: { backgroundColor: colors.white, width: (width - 48) / 2, borderRadius: 12, padding: 14, marginRight: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, position: 'relative', elevation: 1 },
  carteEffetActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  effetNom: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  effetDesc: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  effetBadge: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 8 },
  effetBadgeText: { color: colors.textSecondary, fontSize: 10 },
  effetCheck: { position: 'absolute', top: 8, right: 8, color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  renommerOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  renommerModal: { backgroundColor: colors.white, borderRadius: 16, padding: 20, width: width - 60 },
  renommerTitre: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  renommerInput: { backgroundColor: colors.card, borderRadius: 10, padding: 12, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  renommerBtns: { flexDirection: 'row', gap: 10 },
  renommerBtnAnnuler: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: 10 },
  renommerBtnOk: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10 },
});
