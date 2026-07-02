/* eslint-env jest */

jest.mock('react-native-bootsplash', () => {
  const mockedModule = {
    hide: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn(),
    useHideAnimation: jest.fn().mockReturnValue({
      container: {},
      logo: { source: 0 },
      brand: { source: 0 },
    }),
  };

  return {
    __esModule: true,
    default: mockedModule,
    ...mockedModule,
  };
});
