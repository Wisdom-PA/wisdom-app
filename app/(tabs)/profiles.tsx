import { StyleSheet, Text, View } from 'react-native';

export default function ProfilesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profiles</Text>
      <Text style={styles.subtitle}>Manage user profiles and permissions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
