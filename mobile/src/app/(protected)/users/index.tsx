import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { canManageUsers } from '@/domain/policies/permittedActions';
import type { UserProfile } from '@/domain/model/types';
import { Body, Button, Card, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

const profiles: UserProfile[] = ['analyst', 'senior_analyst', 'administrator', 'auditor'];
export default function UsersScreen() {
  const { user } = useApp();
  const [, refresh] = useState(0);
  if (!user || !canManageUsers(user.profile))
    return (
      <Screen>
        <Heading>Acceso no autorizado</Heading>
      </Screen>
    );
  const update = (id: string, profile: UserProfile, enabled: boolean) => {
    fakeRepository.updateUser(id, profile, enabled);
    refresh((value) => value + 1);
  };
  return (
    <Screen>
      <Heading>Usuarios autorizados</Heading>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {fakeRepository.listUsers().map((item) => (
          <Card key={item.id}>
            <Text style={{ fontWeight: '700' }}>{item.displayName}</Text>
            <Body>{item.loginIdentifier}</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profiles.map((profile) => (
                <Button
                  key={profile}
                  title={profile}
                  onPress={() => update(item.id, profile, item.enabled)}
                  disabled={item.profile === profile}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text>Habilitado</Text>
              <Switch
                value={item.enabled}
                onValueChange={(enabled) => update(item.id, item.profile, enabled)}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
