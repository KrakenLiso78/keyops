import { Switch, Text, View } from 'react-native';
import type { User, UserProfile } from '@/domain/model/types';
import { Body, Button, Card } from '@/presentation/components/base';

const profiles: UserProfile[] = ['analyst', 'senior_analyst', 'administrator', 'auditor'];

export function UserCard({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (profile: UserProfile, enabled: boolean) => void;
}) {
  return (
    <Card>
      <Text style={{ fontWeight: '700' }}>{user.displayName}</Text>
      <Body>{user.loginIdentifier}</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {profiles.map((profile) => (
          <Button
            key={profile}
            title={profile}
            onPress={() => onUpdate(profile, user.enabled)}
            disabled={user.profile === profile}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text>Habilitado</Text>
        <Switch value={user.enabled} onValueChange={(enabled) => onUpdate(user.profile, enabled)} />
      </View>
    </Card>
  );
}
