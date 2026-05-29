import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  Image, Dimensions, Alert, ActivityIndicator, TextInput,
  Platform, Modal, ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../supabase';

const { width } = Dimensions.get('window');

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
        .from('projets')
        .select('*')
        .eq('user_id', user.id)
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
        const { data, error } = await supabase
          .from('projets')
          .insert([{
            user_id: user.id,
            nom: `Projet du ${new Date().toLocaleDateString('fr-FR')}`,
            video_source_url: video.uri,
          }])
          .select().single();
        if (error) throw error;
        chargerProjets();
        // Ouvrir les effets pour ce nouveau projet
        setProjetActif(data.id);
        setEffetsSelectionnes([]);
        setModalEffets(true);
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      }
    });
  };

  const ouvrirEffets = (projetId: string, effetsExistants: string[] = []) => {
    setProjetActif(projetId);
    setEffetsSelectionnes(effetsExistants);
    setModalEffets(true);
  };

  const toggleEffet = (id: string) => {
    setEffetsSelectionnes(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const sauvegarderEffets = async () => {
    if (!projetActif) return;
    try {
      await supabase.from('projets').update({
        timeline_data: { effets: effetsSelectionnes },
        updated_at: new Date().toISOString(),
      }).eq('id', projetActif);
      setModalEffets(false);
      chargerProjets();
      Alert.alert('✅', `${effetsSelectionnes.length} effet(s) appliqué(s)`);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const ouvrirRenommer = (projet: any) => {
    setProjetARenommer(projet);
    setNouveauNom(projet.nom);
    setModalRenommer(true);
  };

  const sauvegarderNom = async () => {
    if (!nouveauNom.trim() || !projetARenommer) return;
    try {
      await supabase.from('projets').update({
        nom: nouveauNom.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', projetARenommer.id);
      setModalRenommer(false);
      chargerProjets();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
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
    <View style={styles.container}>
      <Text style={styles.headerTitle}>CapCut Studio</Text>

      <TouchableOpacity style={styles.boutonNouveauProjet} onPress={initialiserNouveauProjet}>
        <Text style={styles.texteBoutonPlus}>＋</Text>
        <Text style={styles.texteBouton}>Nouveau projet</Text>
      </TouchableOpacity>

      <View style={styles.conteneurRecherche}>
        <TextInput
          style={styles.inputRecherche}
          placeholder="Rechercher un projet..."
          placeholderTextColor="#666"
          value={recherche}
          onChangeText={gererRecherche}
        />
      </View>

      <Text style={styles.sectionTitle}>Projets récents ({projets.length})</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#7C3AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={projetsFiltres}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshing={loading}
          onRefresh={chargerProjets}
          renderItem={({ item }) => {
            const effets = item.timeline_data?.effets || [];
            return (
              <TouchableOpacity
                style={styles.carteProjet}
                onPress={() => ouvrirEffets(item.id, effets)}
                onLongPress={() => Alert.alert(item.nom, 'Que voulez-vous faire ?', [
                  { text: 'Renommer', onPress: () => ouvrirRenommer(item) },
                  { text: 'Effets', onPress: () => ouvrirEffets(item.id, effets) },
                  { text: 'Supprimer', style: 'destructive', onPress: () => supprimerProjet(item.id) },
                  { text: 'Annuler', style: 'cancel' },
                ])}
              >
                <Image
                  source={{ uri: item.miniature_url || 'https://via.placeholder.com/200x110/1A1A1A/444?text=🎬' }}
                  style={styles.miniature}
                />
                <View style={styles.infosProjet}>
                  <Text style={styles.nomProjet} numberOfLines={1}>{item.nom}</Text>
                  <Text style={styles.dateProjet}>{new Date(item.updated_at).toLocaleDateString('fr-FR')}</Text>
                  {effets.length > 0 && (
                    <Text style={styles.effetsCount}>✨ {effets.length} effet(s)</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.texteVide}>Aucun projet. Créez-en un !</Text>
          }
        />
      )}

      {/* ── Modal Effets ── */}
      <Modal visible={modalEffets} animationType="slide" onRequestClose={() => setModalEffets(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalEffets(false)}>
              <Text style={styles.modalRetour}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitre}>Effets ({effetsSelectionnes.length} sélectionné{effetsSelectionnes.length > 1 ? 's' : ''})</Text>
            <TouchableOpacity onPress={sauvegarderEffets}>
              <Text style={styles.modalAppliquer}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          {/* Catégories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoriePill, categorieActive === cat && styles.categoriePillActive]}
                onPress={() => setCategorieActive(cat)}
              >
                <Text style={[styles.categoriePillText, categorieActive === cat && styles.categoriePillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Liste des effets */}
          <FlatList
            data={effetsFiltres}
            keyExtractor={e => e.id}
            numColumns={2}
            contentContainerStyle={styles.effetsGrid}
            renderItem={({ item }) => {
              const selectionne = effetsSelectionnes.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.carteEffet, selectionne && styles.carteEffetActive]}
                  onPress={() => toggleEffet(item.id)}
                >
                  <Text style={styles.effetNom}>{item.nom}</Text>
                  <Text style={styles.effetDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.effetBadge}>
                    <Text style={styles.effetBadgeText}>{item.categorie}</Text>
                  </View>
                  {selectionne && <Text style={styles.effetCheck}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* ── Modal Renommer ── */}
      <Modal visible={modalRenommer} transparent animationType="fade" onRequestClose={() => setModalRenommer(false)}>
        <View style={styles.renommerOverlay}>
          <View style={styles.renommerModal}>
            <Text style={styles.renommerTitre}>Renommer le projet</Text>
            <TextInput
              style={styles.renommerInput}
              value={nouveauNom}
              onChangeText={setNouveauNom}
              placeholder="Nom du projet"
              placeholderTextColor="#444"
              autoFocus
            />
            <View style={styles.renommerBtns}>
              <TouchableOpacity style={styles.renommerBtnAnnuler} onPress={() => setModalRenommer(false)}>
                <Text style={{ color: '#888' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.renommerBtnOk} onPress={sauvegarderNom}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 16, paddingTop: 50 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 25, textAlign: 'center' },
  boutonNouveauProjet: { backgroundColor: '#1F1F1F', height: 120, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2F2F2F', marginBottom: 20 },
  texteBoutonPlus: { fontSize: 36, color: '#7C3AFF', fontWeight: '300' },
  texteBouton: { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 5 },
  conteneurRecherche: { backgroundColor: '#1A1A1A', borderRadius: 10, height: 45, paddingHorizontal: 15, justifyContent: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#252525' },
  inputRecherche: { color: '#FFF', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  carteProjet: { backgroundColor: '#1A1A1A', width: (width - 48) / 2, borderRadius: 12, marginRight: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#252525' },
  miniature: { width: '100%', height: 110, backgroundColor: '#262626' },
  infosProjet: { padding: 12 },
  nomProjet: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  dateProjet: { color: '#666', fontSize: 12, marginTop: 4 },
  effetsCount: { color: '#7C3AFF', fontSize: 11, marginTop: 4 },
  texteVide: { color: '#444', textAlign: 'center', marginTop: 40 },
  // Modal effets
  modalContainer: { flex: 1, backgroundColor: '#0A0A0A' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', paddingTop: 50 },
  modalRetour: { color: '#fff', fontSize: 18 },
  modalTitre: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalAppliquer: { color: '#7C3AFF', fontSize: 14, fontWeight: 'bold' },
  categoriesScroll: { paddingHorizontal: 16, paddingVertical: 12, maxHeight: 55 },
  categoriePill: { backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#252525' },
  categoriePillActive: { backgroundColor: '#7C3AFF', borderColor: '#7C3AFF' },
  categoriePillText: { color: '#666', fontSize: 13 },
  categoriePillTextActive: { color: '#fff' },
  effetsGrid: { padding: 16 },
  carteEffet: { backgroundColor: '#1A1A1A', width: (width - 48) / 2, borderRadius: 12, padding: 14, marginRight: 16, marginBottom: 16, borderWidth: 1, borderColor: '#252525', position: 'relative' },
  carteEffetActive: { borderColor: '#7C3AFF', backgroundColor: '#1A0A3A' },
  effetNom: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  effetDesc: { color: '#666', fontSize: 11, lineHeight: 16 },
  effetBadge: { backgroundColor: '#252525', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 8 },
  effetBadgeText: { color: '#888', fontSize: 10 },
  effetCheck: { position: 'absolute', top: 8, right: 8, color: '#7C3AFF', fontSize: 16, fontWeight: 'bold' },
  // Modal renommer
  renommerOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center' },
  renommerModal: { backgroundColor: '#0F0F1A', borderRadius: 16, padding: 20, width: width - 60 },
  renommerTitre: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  renommerInput: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#252525', marginBottom: 16 },
  renommerBtns: { flexDirection: 'row', gap: 10 },
  renommerBtnAnnuler: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 10 },
  renommerBtnOk: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#7C3AFF', borderRadius: 10 },
});
