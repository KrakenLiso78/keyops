import { StyleSheet, View } from 'react-native';
import { Heading } from '@/presentation/components/base';
import { space } from '@/presentation/design-system';

export function ApplicationDetailTitle() {
  return (
    <View testID="application-detail-title-block" style={styles.titleBlock}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="application-detail-decoration-strip"
        style={styles.decorationStrip}
      >
        <View style={[styles.decorativeSquare, styles.squareMint]} />
        <View style={[styles.decorativeSquare, styles.squareYellow]} />
        <View style={[styles.decorativeSquare, styles.squareRed]} />
      </View>
      <Heading level={1}>Detalle de aplicación</Heading>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: space.xs },
  decorationStrip: {
    pointerEvents: 'none',
    position: 'relative',
    alignSelf: 'flex-end',
    width: 104,
    minHeight: 44,
    overflow: 'hidden',
  },
  decorativeSquare: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 3,
    transform: [{ rotate: '9deg' }],
  },
  squareMint: { left: 0, top: 0, backgroundColor: '#ccefd8' },
  squareYellow: { right: 0, top: 6, backgroundColor: '#ffe29a' },
  squareRed: { right: 34, top: 20, backgroundColor: '#f45a67' },
});
