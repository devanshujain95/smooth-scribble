/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-webview/lib/WebView.ios', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ReactRuntime.forwardRef(
      (props: Record<string, unknown>, ref: unknown) =>
        ReactRuntime.createElement(View, { ...props, ref }),
    ),
  };
});

jest.mock('react-native-vector-icons/Feather', () => {
  const ReactRuntime = require('react');
  const { Text } = require('react-native');

  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      ReactRuntime.createElement(Text, null, name),
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
