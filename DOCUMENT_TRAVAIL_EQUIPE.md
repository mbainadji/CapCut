# Document de repartition du travail - Application ClipX

## Presentation du projet

ClipX est une application mobile de montage video inspiree des outils comme CapCut. Elle permet a un utilisateur de creer un compte, se connecter, gerer ses projets, importer une video, appliquer des effets, personnaliser le rendu, exporter le resultat et gerer son profil.

Le projet est developpe avec React Native, TypeScript, React Navigation et Supabase pour l'authentification, la base de donnees et le stockage.

## Developpeur 1 - Gestion Authentification et Compte Utilisateur

### Travail realise

Le developpeur 1 s'occupe de toute la partie connexion et compte utilisateur. Il met en place les ecrans d'accueil, connexion, inscription et mot de passe oublie. Il gere aussi les fonctions liees a Supabase Auth.

Il a egalement mis en place la base de donnees Supabase du projet. Cela comprend la configuration de Supabase, la connexion de l'application a la base de donnees, ainsi que les tables necessaires pour stocker les utilisateurs, les profils, les projets, les medias et les exportations.

### Fichiers concernes

- `src/screens/auth/WelcomeScreen.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/RegisterScreen.tsx`
- `src/screens/auth/ForgotPasswordScreen.tsx`
- `src/services/authService.ts`
- `src/hooks/useAuth.ts`
- `src/navigation/AuthNavigator.tsx`
- `src/services/supabase.ts`

### Fonctionnalites

- Creation de compte avec nom, email et mot de passe.
- Connexion avec email et mot de passe.
- Recuperation de mot de passe.
- Gestion de la session utilisateur.
- Deconnexion.
- Mise a jour du nom et du mot de passe.
- Configuration de Supabase.
- Creation et organisation de la base de donnees Supabase.
- Mise en place des tables principales : `profiles`, `projets`, `medias_secondaires`, `exportations`.
- Liaison entre l'utilisateur connecte et ses donnees dans la base.

### Composants React Native utilises

- `SafeAreaView`
- `View`
- `Text`
- `TouchableOpacity`
- `TextInput`
- `ScrollView`
- `ActivityIndicator`
- `KeyboardAvoidingView`
- `StatusBar`

### Composants personnalises utilises

- `AuthInput`
- `Avatar`

## Developpeur 2 - Gestion des Projets

### Travail realise

Le developpeur 2 gere le tableau de bord des projets. Il permet de creer un nouveau projet, afficher la liste des projets, rechercher un projet, renommer un projet, supprimer un projet et ouvrir un projet dans l'editeur.

### Fichiers concernes

- `src/services/screen/DashboardProjectsScreen.tsx`
- `src/screens/project/EditProjectScreen.tsx`
- `src/navigation/HomeNavigator.tsx`

### Fonctionnalites

- Affichage des projets de l'utilisateur connecte.
- Creation d'un projet a partir d'une video choisie dans la galerie.
- Recherche de projets.
- Renommage d'un projet.
- Suppression d'un projet.
- Changement de miniature du projet.
- Navigation vers l'editeur video.

### Composants React Native utilises

- `SafeAreaView`
- `View`
- `Text`
- `FlatList`
- `TouchableOpacity`
- `Image`
- `TextInput`
- `Modal`
- `ScrollView`
- `ActivityIndicator`
- `Alert`
- `StatusBar`

### Bibliotheques utilisees

- `react-native-image-picker` pour choisir une video ou une image.
- `Supabase` pour enregistrer et charger les projets.

## Developpeur 3 - Montage Video

### Travail realise

Le developpeur 3 travaille sur l'editeur video principal. Il gere la lecture de la video, la pause, la progression, le decoupage, le volume, la vitesse et l'exportation.

### Fichiers concernes

- `src/screens/editor/VideoEditorScreen.tsx`

### Fonctionnalites

- Lecture d'une video importee.
- Pause et reprise de la lecture.
- Affichage du temps courant et de la duree totale.
- Decoupage avec point de debut et point de fin.
- Modification du volume.
- Modification de la vitesse.
- Suppression de la video du projet.
- Sauvegarde automatique des reglages.
- Exportation du projet.
- Enregistrement de la video sur le telephone.

### Composants React Native utilises

- `SafeAreaView`
- `View`
- `Text`
- `TouchableOpacity`
- `ScrollView`
- `ActivityIndicator`
- `Modal`
- `TextInput`
- `Alert`
- `Animated`
- `StatusBar`

### Bibliotheques utilisees

- `react-native-video` pour lire la video.
- `react-native-fs` pour enregistrer le fichier sur le telephone.
- `PermissionsAndroid` pour demander les permissions Android.

## Developpeur 4 - Effets et Personnalisation

### Travail realise

Le developpeur 4 s'occupe des effets visuels et de la personnalisation du montage. Il ajoute les filtres, les effets speciaux, les sous-titres et les badges d'effets actifs.

### Fichiers concernes

- `src/screens/editor/VideoEditorScreen.tsx`
- `src/services/screen/DashboardProjectsScreen.tsx`

### Fonctionnalites

- Application de filtres : Normal, Noir et Blanc, Vintage, Chaud, Froid, Drama, Fade, Vivid.
- Effets speciaux : VHS, Glitch, Zoom, Fondu.
- Ajout de sous-titres ou de texte sur la video.
- Affichage des effets actifs.
- Sauvegarde des effets dans `timeline_data`.
- Selection d'effets depuis le tableau de bord.

### Composants React Native utilises

- `Animated.View`
- `View`
- `Text`
- `TouchableOpacity`
- `ScrollView`
- `FlatList`
- `Modal`
- `TextInput`

### Elements techniques

- `Animated.Value` pour les animations de glitch, zoom et fondu.
- Overlays React Native pour les filtres couleur.
- Lignes React Native pour simuler l'effet VHS.

## Developpeur 5 - Interface, Guide Pro et Experience Utilisateur

### Travail realise

Le developpeur 5 s'occupe de l'organisation visuelle de l'application, du guide pro et de l'experience utilisateur generale. Il rend l'application plus facile a utiliser avec des onglets, boutons, cartes, messages et indications.

### Fichiers concernes

- `src/screens/guide/GuidePro.tsx`
- `src/context/ThemeContext.tsx`
- `src/navigation/HomeNavigator.tsx`
- `src/components/auth/AuthInput.tsx`
- `src/components/auth/SocialButton.tsx`
- `src/components/auth/Avatar.tsx`

### Fonctionnalites

- Guide professionnel avec workflow de montage.
- Conseils pour TikTok, Instagram Reels et YouTube Shorts.
- Conseils sur les effets.
- Liste des erreurs a eviter.
- Gestion du theme et des couleurs.
- Composants reutilisables pour les formulaires et le profil.
- Amelioration de l'affichage de l'avatar avec image de profil.

### Composants React Native utilises

- `SafeAreaView`
- `ScrollView`
- `View`
- `Text`
- `TouchableOpacity`
- `Image`
- `StyleSheet`
- `StatusBar`

### Composants personnalises utilises

- `AuthInput`
- `SocialButton`
- `Avatar`

## Developpeur 6 - Administration, Notifications et Securite

### Travail realise

Le developpeur 6 gere les parties sensibles de l'application : profil, preferences, notifications, securite du compte et suppression des donnees.

### Fichiers concernes

- `src/screens/profile/ProfileScreen.tsx`
- `src/services/notificationService.ts`
- `src/services/authService.ts`
- `src/context/ThemeContext.tsx`
- `src/services/supabase.ts`

### Fonctionnalites

- Modification du nom de l'utilisateur.
- Modification du mot de passe.
- Upload de photo de profil.
- Activation ou desactivation des notifications push.
- Activation ou desactivation de la sauvegarde automatique.
- Affichage des statistiques utilisateur.
- Suppression du compte.
- Suppression des donnees utilisateur dans Supabase.
- Gestion des permissions Android.

### Composants React Native utilises

- `SafeAreaView`
- `ScrollView`
- `View`
- `Text`
- `TouchableOpacity`
- `Switch`
- `ActivityIndicator`
- `Alert`
- `PermissionsAndroid`

### Elements de securite

- Verification de l'utilisateur connecte avant les actions sensibles.
- Suppression des donnees liees a l'utilisateur.
- Deconnexion apres suppression du compte.
- Permissions Android pour acceder aux images, videos et notifications.

## Composants React Native principaux du projet

Voici les composants React Native les plus utilises dans l'application :

- `View` : structurer les blocs d'interface.
- `Text` : afficher les textes.
- `TouchableOpacity` : creer des boutons cliquables.
- `TextInput` : saisir des informations.
- `ScrollView` : afficher un contenu defilable.
- `FlatList` : afficher une liste de projets ou d'effets.
- `Image` : afficher les miniatures et avatars.
- `Modal` : afficher des fenetres secondaires.
- `SafeAreaView` : adapter l'affichage aux zones sures du telephone.
- `ActivityIndicator` : afficher un chargement.
- `StatusBar` : personnaliser la barre de statut.
- `Switch` : activer ou desactiver une preference.
- `Animated.View` : creer des animations.
- `Alert` : afficher des messages systeme.

## Bibliotheques principales utilisees

- `react-native` : base de l'application mobile.
- `react-navigation` : navigation entre les ecrans.
- `@supabase/supabase-js` : authentification, base de donnees et stockage.
- `@react-native-async-storage/async-storage` : stockage local pour utiliser l'application sans connexion internet.
- `react-native-image-picker` : selection de videos et images.
- `react-native-video` : lecture video.
- `react-native-fs` : gestion des fichiers locaux.
- `react-i18next` et `i18next` : gestion des langues.

## Fonctionnement avec et sans connexion internet

L'application peut fonctionner de deux manieres :

- Avec connexion internet : l'utilisateur se connecte avec Supabase. Les profils, projets, medias et exportations sont enregistres dans la base de donnees Supabase.
- Sans connexion internet : l'utilisateur peut choisir `Continuer sans internet`. Dans ce mode, les projets sont enregistres localement sur le telephone avec `AsyncStorage`.

### Fonctionnalites disponibles hors connexion

- Entrer dans l'application sans compte en ligne.
- Creer un projet local.
- Importer une video depuis le telephone.
- Ouvrir un projet local.
- Renommer ou supprimer un projet local.
- Changer une miniature locale.
- Lire la video dans l'editeur.
- Modifier le decoupage, le volume et la vitesse.
- Ajouter des filtres, effets et sous-titres.
- Sauvegarder automatiquement les reglages localement.
- Exporter et enregistrer la video sur le telephone.

### Difference entre mode en ligne et mode hors connexion

En mode en ligne, les donnees sont synchronisees avec Supabase et peuvent etre retrouvees apres connexion. En mode hors connexion, les donnees restent sur le telephone. Elles permettent de travailler sans internet, mais elles ne sont pas envoyees automatiquement dans Supabase.

## Conclusion

Le travail est reparti en 6 parties pour faciliter le developpement. Chaque developpeur a une responsabilite claire : authentification, projets, montage video, effets, interface utilisateur et securite. Cette organisation permet de travailler en equipe sans melanger les roles, tout en gardant une application coherente.
