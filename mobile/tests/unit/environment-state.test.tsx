import { useEffect, useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Button, Text } from 'react-native';
import { EnvironmentProvider, useEnvironment } from '@/presentation/state/EnvironmentProvider';

function EnvironmentProbe() {
  const {
    environment,
    beginRequest,
    changeEnvironment,
    isCurrentRequest,
    registerReset,
    resetToTest,
  } = useEnvironment();
  const [screenData, setScreenData] = useState('datos de pruebas');
  const [requestSequence, setRequestSequence] = useState<number>();

  useEffect(() => registerReset(() => setScreenData('sin datos')), [registerReset]);

  return (
    <>
      <Text>{environment}</Text>
      <Text>{screenData}</Text>
      <Text>
        {requestSequence === undefined
          ? 'sin solicitud'
          : String(isCurrentRequest(requestSequence))}
      </Text>
      <Button
        title="Iniciar solicitud"
        onPress={() => setRequestSequence(beginRequest().sequence)}
      />
      <Button title="Producción" onPress={() => changeEnvironment('production')} />
      <Button title="Restablecer" onPress={resetToTest} />
    </>
  );
}

describe('estado central de ambiente', () => {
  it('descarta datos y respuestas del ambiente anterior sin mutar consumidores', () => {
    const screen = render(
      <EnvironmentProvider>
        <EnvironmentProbe />
      </EnvironmentProvider>,
    );

    fireEvent.press(screen.getByText('Iniciar solicitud'));
    expect(screen.getByText('true')).toBeTruthy();
    fireEvent.press(screen.getByText('Producción'));

    expect(screen.getByText('production')).toBeTruthy();
    expect(screen.getByText('sin datos')).toBeTruthy();
    expect(screen.getByText('false')).toBeTruthy();

    fireEvent.press(screen.getByText('Restablecer'));
    expect(screen.getByText('test')).toBeTruthy();
  });
});
