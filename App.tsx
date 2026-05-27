import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Importation de votre écran de gestion des projets
import DashboardProjectsScreen from './src/services/screen/DashboardProjectsScreen';

function App() {
  return (
    <SafeAreaProvider>
      {/* Thème sombre CapCut pour la barre de statut système */}
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Affichage de votre Dashboard de projets */}
      <DashboardProjectsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Fond noir profond officiel de CapCut
  },
});

export default App;
