import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  View,
  type ImageRequireSource,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash, { type Manifest } from 'react-native-bootsplash';
import { DrawingScreen } from './src/screens/DrawingScreen';
import { palette } from './src/theme';

const bootSplashManifest = require('./assets/bootsplash/manifest.json') as Manifest;
const bootSplashLogo = require('./assets/bootsplash/logo.png') as ImageRequireSource;

function App() {
  const [appReady, setAppReady] = useState(false);
  const [bootSplashVisible, setBootSplashVisible] = useState(true);

  const handleLayout = useCallback(() => {
    setAppReady(true);
  }, []);

  const handleBootSplashAnimationEnd = useCallback(() => {
    setBootSplashVisible(false);
  }, []);

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={palette.background}
        />
        <DrawingScreen />
      </SafeAreaProvider>

      {bootSplashVisible ? (
        <AnimatedBootSplash
          onAnimationEnd={handleBootSplashAnimationEnd}
          ready={appReady}
        />
      ) : null}
    </View>
  );
}

type AnimatedBootSplashProps = {
  onAnimationEnd: () => void;
  ready: boolean;
};

function AnimatedBootSplash({
  onAnimationEnd,
  ready,
}: AnimatedBootSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  const { container, logo } = BootSplash.useHideAnimation({
    manifest: bootSplashManifest,
    logo: bootSplashLogo,
    ready,
    animate: () => {
      Animated.timing(opacity, {
        duration: 260,
        toValue: 0,
        useNativeDriver: true,
      }).start(onAnimationEnd);
    },
  });

  return (
    <Animated.View {...container} style={[container.style, { opacity }]}>
      <Image {...logo} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
});

export default App;
