import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Alert, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');

export default function DashboardProjectsScreen({ navigation }: any) {
  const [projets, setProjets] = useState<any[]>([]);
  const [projetsFiltres, setProjetsFiltres] = useState<any[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);

  // 📥 1. CHARGER LES PROJETS (Historique & Récents)
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
      Alert.alert('Erreur de chargement', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerProjets();
  }, []);

  // 🔍 2. RECHERCHE DE PROJETS (Filtrage en temps réel)
  const gererRecherche = (texte: string) => {
    setRecherche(texte);
    if (texte.trim() === '') {
      setProjetsFiltres(projets);
    } else {
      const filtres = projets.filter(p => 
        p.nom.toLowerCase().includes(texte.toLowerCase())
      );
      setProjetsFiltres(filtres);
    }
  };

  // ➕ 3. CRÉATION DE PROJET VIDÉO
  const initialiserNouveauProjet = () => {
    launchImageLibrary({ mediaType: 'video', quality: 1 }, async (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Erreur Galerie', response.errorMessage);
        return;
      }

      const videoSelectionnee = response.assets?.[0];
      if (!videoSelectionnee) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('projets')
          .insert([
            {
              user_id: user.id,
              nom: `Projet du ${new Date().toLocaleDateString()}`,
              video_source_url: videoSelectionnee.uri,
            }
          ])
          .select()
          .single();

        if (error) throw error;

        Alert.alert('Studio', 'Projet initialisé !');
        if (navigation) {
          navigation.navigate('StudioEdit', { projetId: data.id, videoUri: data.video_source_url });
        }
        chargerProjets();
      } catch (error: any) {
        Alert.alert('Erreur de création', error.message);
      }
    });
  };

  // ✏️ 4. MODIFICATION / RENOMMAGE (Fonctionnalité Développeur 2)
  const renommerProjet = (id: string, nomActuel: string) => {
    Alert.prompt(
      "Renommer le projet",
      "Entrez le nouveau nom de votre montage :",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Enregistrer",
          onPress: async (nouveauNom) => {
            if (!nouveauNom || nouveauNom.trim() === '') return;
            try {
              const { error } = await supabase
                .from('projets')
                .update({ nom: nouveauNom, updated_at: new Date() })
                .eq('id', id);
              if (error) throw error;
              chargerProjets();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ],
      "plain-text",
      nomActuel
    );
  };

  // 🗑️ 5. SUPPRESSION DE PROJET
  const supprimerProjet = (id: string) => {
    Alert.alert(
      "Supprimer le projet",
      "Êtes-vous sûr de vouloir supprimer définitivement ce projet ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('projets')
                .delete()
                .eq('id', id);
              if (error) throw error;
              chargerProjets();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>CapCut Studio</Text>

      {/* ➕ Bouton de création principal */}
      <TouchableOpacity style={styles.boutonNouveauProjet} onPress={initialiserNouveauProjet}>
        <Text style={styles.texteBoutonPlus}>＋</Text>
        <Text style={styles.texteBouton}>Nouveau projet</Text>
      </TouchableOpacity>

      {/* 🔍 Barre de Recherche */}
      <View style={styles.conteneurRecherche}>
        <TextInput
          style={styles.inputRecherche}
          placeholder="Rechercher un projet..."
          placeholderTextColor="#666"
          value={recherche}
          onChangeText={gererRecherche}
        />
      </View>

      <Text style={styles.sectionTitle}>Projets récents</Text>

      {loading && projetsFiltres.length === 0 ? (
        <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={projetsFiltres}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshing={loading}
          onRefresh={chargerProjets}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.carteProjet}
              onPress={() => renommerProjet(item.id, item.nom)} // Un clic pour modifier le nom
              onLongPress={() => supprimerProjet(item.id)} // Appui long pour supprimer
            >
              <Image 
                source={{ uri: item.miniature_url || 'https://placeholder.com' }} 
                style={styles.miniature} 
              />
              <View style={styles.infosProjet}>
                <Text style={styles.nomProjet} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.dateProjet}>{new Date(item.updated_at).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.texteVide}>Aucun projet trouvé.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  boutonNouveauProjet: {
    backgroundColor: '#1F1F1F',
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F2F2F',
    marginBottom: 20,
  },
  texteBoutonPlus: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: '300',
  },
  texteBouton: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  conteneurRecherche: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    height: 45,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#252525',
  },
  inputRecherche: {
    color: '#FFF',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  carteProjet: {
    backgroundColor: '#1A1A1A',
    width: (width - 48) / 2,
    borderRadius: 12,
    marginRight: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#252525',
  },
  miniature: {
    width: '100%',
    height: 110,
    backgroundColor: '#262626',
  },
  infosProjet: {
    padding: 12,
  },
  nomProjet: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateProjet: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  texteVide: {
    color: '#444',
    textAlign: 'center',
    marginTop: 40,
  },
});
