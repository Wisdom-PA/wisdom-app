import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { InternetPolicy, Profile, ProfileRole } from '../../src/api/types.ts';
import { demoCubeClient } from '../../src/demo/demo-services.ts';
import { allowedInternetPolicies, defaultInternetPolicy } from '../../src/profiles/policy.ts';
import { colors, ui } from '../ui.ts';

const ROLES: ProfileRole[] = ['adult', 'guest', 'child'];

export default function ProfilesScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<ProfileRole>('guest');
  const [policy, setPolicy] = useState<InternetPolicy>(defaultInternetPolicy('guest'));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProfiles(await demoCubeClient.listProfiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const selected = profiles.find((p) => p.profileId === selectedId) ?? null;
  const createPolicies = useMemo(() => allowedInternetPolicies(role), [role]);
  const editPolicies = useMemo(() => (selected ? allowedInternetPolicies(selected.role) : []), [selected]);

  function chooseRole(next: ProfileRole) {
    setRole(next);
    setPolicy(defaultInternetPolicy(next));
  }

  async function createProfile() {
    setError(null);
    setMessage(null);
    try {
      const created = await demoCubeClient.createProfile({
        preferredName: name.trim() || 'New profile',
        role,
        internetPolicy: role === 'child' ? 'never' : policy,
        linkedAdults: role === 'child' ? ['profile-adult'] : [],
      });
      setCreating(false);
      setName('');
      setSelectedId(created.profileId);
      setMessage(`Created ${created.role} profile “${created.preferredName}”`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function updatePolicy(next: InternetPolicy) {
    if (!selected) return;
    setError(null);
    setMessage(null);
    try {
      await demoCubeClient.patchProfile(selected.profileId, { internetPolicy: next });
      setMessage(`Updated internet policy to ${next}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Profiles
      </Text>
      <Text style={ui.subtitle}>List, detail, internet policy, guest/child create</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {message ? <Text style={ui.success}>{message}</Text> : null}

      <Pressable
        style={ui.button}
        onPress={() => setCreating((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Toggle create profile form"
      >
        <Text style={ui.buttonText}>{creating ? 'Cancel create' : 'Create guest/child'}</Text>
      </Pressable>

      {creating ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>New profile</Text>
          <TextInput
            style={ui.input}
            value={name}
            onChangeText={setName}
            placeholder="Preferred name"
            accessibilityLabel="Preferred name"
          />
          <Text style={ui.muted}>Role</Text>
          <View style={ui.chipRow}>
            {ROLES.filter((r) => r !== 'adult').map((r) => (
              <Pressable
                key={r}
                style={[ui.chip, role === r ? ui.chipActive : null]}
                onPress={() => chooseRole(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: role === r }}
              >
                <Text style={[ui.chipText, role === r ? ui.chipTextActive : null]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={ui.muted}>Internet policy</Text>
          <View style={ui.chipRow}>
            {createPolicies.map((p) => (
              <Pressable
                key={p}
                style={[ui.chip, policy === p ? ui.chipActive : null]}
                onPress={() => setPolicy(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: policy === p }}
              >
                <Text style={[ui.chipText, policy === p ? ui.chipTextActive : null]}>{p}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={ui.button} onPress={() => void createProfile()} accessibilityRole="button">
            <Text style={ui.buttonText}>Save</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Household</Text>
        {profiles.map((profile) => (
          <Pressable
            key={profile.profileId}
            style={ui.row}
            onPress={() => setSelectedId(profile.profileId)}
            accessibilityRole="button"
            accessibilityLabel={`${profile.preferredName}, ${profile.role}`}
          >
            <Text style={ui.rowTitle}>{profile.preferredName}</Text>
            <Text style={ui.rowMeta}>
              {profile.role} · {profile.internetPolicy}
            </Text>
          </Pressable>
        ))}
      </View>

      {selected ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>Detail: {selected.preferredName}</Text>
          <View style={ui.row}>
            <Text style={ui.rowMeta}>Role: {selected.role}</Text>
            <Text style={ui.rowMeta}>Language: {selected.language}</Text>
            <Text style={ui.rowMeta}>Verbosity: {selected.voiceVerbosity}</Text>
            <Text style={ui.rowMeta}>
              Linked adults: {selected.linkedAdults.length ? selected.linkedAdults.join(', ') : 'none'}
            </Text>
          </View>
          <Text style={ui.muted}>Internet policy</Text>
          <View style={ui.chipRow}>
            {editPolicies.map((p) => (
              <Pressable
                key={p}
                style={[ui.chip, selected.internetPolicy === p ? ui.chipActive : null]}
                onPress={() => void updatePolicy(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: selected.internetPolicy === p }}
              >
                <Text style={[ui.chipText, selected.internetPolicy === p ? ui.chipTextActive : null]}>{p}</Text>
              </Pressable>
            ))}
          </View>
          {selected.role === 'child' ? (
            <Text style={ui.muted}>Child profiles are locked to internet policy “never”.</Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
