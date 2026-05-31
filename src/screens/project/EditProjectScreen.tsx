import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { isOfflineMode } from '../../services/authService';
import { getOfflineProject, updateOfflineProject } from '../../services/offlineProjectService';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'EditProject'>;
  route: RouteProp<HomeStackParamList, 'EditProject'>;
};

export default function EditProjectScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [miniatureUrl, setMiniatureUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const chargerProjet = useCallback(async () => {
    try {
      if (await isOfflineMode()) {
        const data = await getOfflineProject(projectId);
        if (!data) throw new Error('Projet local introuvable');
        setNom(data.nom || '');
        setMiniatureUrl(data.miniature_url || '');
        setVideoUrl(data.video_source_url || '');
        return;
      }
      const { data, error } = await supabase
        .from('projets')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      setNom(data.nom || '');
      setMiniatureUrl(data.miniature_url || '');
      setVideoUrl(data.video_source_url || '');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    chargerProjet();
  }, [chargerProjet]);

  const sauvegarder = async () => {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du projet est requis');
      return;
    }
    setSaving(true);
    try {
      if (await isOfflineMode()) {
        await updateOfflineProject(projectId, { nom: nom.trim() });
        Alert.alert('Succès', 'Projet sauvegardé hors connexion');
        navigation.goBack();
        return;
      }
      const { error } = await supabase
        .from('projets')
        .update({
          nom: nom.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
      if (error) throw error;
      Alert.alert('Succès', 'Projet sauvegardé');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  const choisirMiniature = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets && result.assets[0]) {
      try {
      const asset = result.assets[0];
      if (await isOfflineMode()) {
        await updateOfflineProject(projectId, { miniature_url: asset.uri });
        setMiniatureUrl(asset.uri || '');
        Alert.alert('Succès', 'Miniature locale mise à jour');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = asset.uri?.split('.').pop();
      const filePath = `${user.id}/${projectId}/miniature.${fileExt}`;

      const response = await fetch(asset.uri!);
      const blob = await response.blob();
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      const { error } = await supabase.storage
        .from('medias')
        .upload(filePath, arrayBuffer, {
          contentType: asset.type || 'image/jpeg',
          upsert: true,
        });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('medias')
        .getPublicUrl(filePath);

      await supabase.from('projets').update({
        miniature_url: urlData.publicUrl,
      }).eq('id', projectId);

      setMiniatureUrl(urlData.publicUrl);
      Alert.alert('Succès', 'Miniature mise à jour');
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7C3AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Éditer le projet</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.contenu}>
        <Text style={styles.label}>Nom du projet</Text>
        <TextInput
          style={styles.input}
          value={nom}
          onChangeText={setNom}
          placeholder="Nom du projet"
          placeholderTextColor="#444"
        />

        <TouchableOpacity style={styles.boutonMedia} onPress={choisirMiniature}>
          <Text style={styles.boutonMediaTexte}>🖼 Changer la miniature</Text>
        </TouchableOpacity>

        {miniatureUrl ? (
          <Text style={styles.urlTexte}>✅ Miniature : {miniatureUrl.slice(0, 40)}...</Text>
        ) : null}
        {videoUrl ? (
          <Text style={styles.urlTexte}>✅ Vidéo : {videoUrl.slice(0, 40)}...</Text>
        ) : (
          <Text style={styles.urlTexte}>Aucune vidéo attachée à ce projet.</Text>
        )}

        <TouchableOpacity
          style={[styles.boutonSauvegarder, saving && styles.boutonDisabled]}
          onPress={sauvegarder}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.boutonTexte}>💾 Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  retour: { color: '#7C3AFF', fontSize: 14 },
  titre: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  contenu: { padding: 16 },
  label: { color: '#666', fontSize: 11, textTransform: 'uppercase', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#222',
    borderRadius: 12, padding: 14, color: '#FFF', fontSize: 14,
  },
  boutonMedia: {
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#2A2A2A',
  },
  boutonMediaTexte: { color: '#FFF', fontSize: 14 },
  urlTexte: { color: '#444', fontSize: 11, marginTop: 8 },
  boutonSauvegarder: {
    backgroundColor: '#7C3AFF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 30,
  },
  boutonDisabled: { opacity: 0.6 },
  boutonTexte: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
