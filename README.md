# Smooth Scribble

React Native CLI iOS assignment project for a custom smooth drawing canvas. The app is intentionally small but finished: one premium-feeling screen, a branded native splash screen, a large responsive canvas, icon controls, brush controls, undo, and clear.

## Requirements Covered

- React Native CLI, not Expo.
- iOS-focused project.
- TypeScript/TSX app source.
- No Skia and no drawing or graphics libraries.
- Custom stroke smoothing implementation.
- Smooth fast scribbling without sending every touch point over the React Native bridge.
- Branded iOS launch screen and Feather icon controls.
- System iOS typography constants for consistent title, label, body, and numeric text.

The only drawing surface is an HTML5 canvas hosted in `react-native-webview`, which the exercise explicitly allows. Babel and Metro keep their generated React Native JavaScript config files because the React Native toolchain expects them, but the assignment app implementation lives in TypeScript/TSX.

## Run

```sh
npm install
npm start
```

For iOS, install pods and run the app from the project root when you are ready to build locally:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

## Smoothing Approach

The drawing logic lives in `src/canvas/buildCanvasHtml.ts` and runs inside the WebView canvas. React Native only sends low-frequency control messages such as brush changes, undo, and clear.

The custom smoothing has three parts:

1. Point thinning removes noisy duplicate points that are closer than `1.5px`, while still accepting a point after `24ms` so slow strokes do not feel stuck.
2. A velocity-aware low-pass filter smooths slow movement more and fast movement less. This keeps slow lines stable without making fast scribbles lag behind the finger.
3. Quadratic midpoint curves turn the smoothed points into rounded Bezier segments instead of sharp polylines.

The active stroke is drawn incrementally, so the canvas does not redraw all strokes during every move event. Completed strokes are stored for undo and replay.

Fast pointer moves are batched through `requestAnimationFrame`, so multiple accepted points can be processed in one paint on the screen frame. This keeps the drawing loop closer to 60fps behavior while still preserving the full custom smoothing logic.

## Polish Notes

- `react-native-vector-icons/Feather` is used for generic UI controls only. The canvas itself is still custom HTML5 Canvas drawing logic.
- `ios/SmoothScribbleAssignment/LaunchScreen.storyboard` is branded to match the first app screen.
- `ios/SmoothScribbleAssignment/Info.plist` sets the display name to `Smooth Scribble`, bundles `Feather.ttf`, and keeps the assignment portrait-focused.
- `src/typography.ts` centralizes iOS system font choices so the UI does not rely on default inconsistent text styling.

## Production Notes

For a production drawing feature, I would profile this on older iPhones, tune smoothing constants against real touch latency, cap memory more carefully for long sessions, and consider a native renderer if stroke volume or export quality became a bottleneck. The current WebView canvas approach is deliberately chosen for the exercise because it keeps the implementation compact, custom, and easy to evaluate.
