import * as Clipboard from 'expo-clipboard';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, space } from '@/presentation/design-system';

type CopyableValueProps = {
  value?: string;
  placeholder?: string;
  copyLabel: string;
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

function CopyIcon() {
  return (
    <View style={styles.iconCanvas}>
      <View testID="copy-icon-back" style={[styles.iconRectangle, styles.iconBack]} />
      <View testID="copy-icon-front" style={[styles.iconRectangle, styles.iconFront]} />
    </View>
  );
}

export function CopyableValue({
  value,
  placeholder = '',
  copyLabel,
  outlined = true,
  style,
  textStyle,
}: CopyableValueProps) {
  return (
    <View style={[styles.container, outlined && styles.outlined, style]}>
      <Text numberOfLines={1} selectable style={[styles.value, textStyle]}>
        {value ?? placeholder}
      </Text>
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copyLabel}
          hitSlop={4}
          onPress={() => Clipboard.setStringAsync(value)}
          style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
        >
          <CopyIcon />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
  },
  value: {
    flex: 1,
    color: colors.ink,
    fontFamily: 'monospace',
    fontSize: 15,
  },
  copyButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55 },
  iconCanvas: { width: 22, height: 22 },
  iconRectangle: {
    position: 'absolute',
    width: 12,
    height: 15,
    borderWidth: 1.5,
    borderColor: colors.slate,
    borderRadius: 2,
  },
  iconBack: { left: 3, top: 2 },
  iconFront: { left: 7, top: 6 },
});
