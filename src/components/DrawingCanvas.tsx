import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview/lib/WebView.ios';
import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { buildCanvasHtml } from '../canvas/buildCanvasHtml';
import type { Brush, CanvasCommand, CanvasStatusMessage } from '../canvas/types';
import { palette } from '../theme';

type DrawingCanvasProps = {
  brush: Brush;
  commandNonce: number;
  command: CanvasCommand | null;
  onStatusChange: (message: CanvasStatusMessage) => void;
};

export function DrawingCanvas({
  brush,
  commandNonce,
  command,
  onStatusChange,
}: DrawingCanvasProps) {
  const webViewRef = useRef<unknown>(null);
  const html = useMemo(() => buildCanvasHtml(), []);

  const postToCanvas = useCallback((nextCommand: CanvasCommand) => {
    const webView = webViewRef.current as
      | { postMessage?: (message: string) => void }
      | null;
    webView?.postMessage?.(JSON.stringify(nextCommand));
  }, []);

  React.useEffect(() => {
    const nextCommand: CanvasCommand = { type: 'setBrush', brush };
    postToCanvas(nextCommand);
  }, [brush, postToCanvas]);

  React.useEffect(() => {
    if (!command) {
      return;
    }

    postToCanvas(command);
  }, [command, commandNonce, postToCanvas]);

  const handleLoadEnd = useCallback(() => {
    postToCanvas({ type: 'setBrush', brush });
  }, [brush, postToCanvas]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed = JSON.parse(event.nativeEvent.data) as CanvasStatusMessage;
        if (parsed.type === 'status') {
          onStatusChange(parsed);
        }
      } catch {
        // Ignore malformed WebView messages; the canvas is the source of truth.
      }
    },
    [onStatusChange],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onLoadEnd={handleLoadEnd}
        onMessage={handleMessage}
        javaScriptEnabled
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    backgroundColor: palette.canvas,
    borderRadius: 18,
  },
  webView: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
});
