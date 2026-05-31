module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-async-storage|@supabase|react-native-url-polyfill|react-native-safe-area-context|react-native-screens|react-native-gesture-handler)/)',
  ],
};
