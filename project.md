# Smooth Scribble Assignment

## Showcase Website

- A static GitHub Pages showcase has been added under `docs/`.
- The showcase follows the same visual pattern as the earlier Flip the Track page but is now scoped only to the client-requested exercise deliverables: screen recording stage, source-code link, brief smoothing implementation note, drawing/smoothing logic, real-device performance tradeoff, and the requested application answers.
- The page is tailored to the Smooth Scribble drawing-canvas exercise with Midnight Teal styling, warm paper sections, teal primary actions, gold accents, and the app's abstract canvas logo.
- `docs/assets/brand-logo.png` uses the existing Abstract Canvas master icon, and `docs/assets/favicon.png` uses the existing BootSplash logo for the browser tab icon.
- The navigation now contains only `Demo`, `Note`, and `Answers`; broader proposal sections such as technical-fit mapping, roadmap, portfolio/source-proof grid, and contact were removed because they were not part of the requested exercise response.
- The demo theater is prepared for two recordings:
  - `docs/assets/showcase/product-demo.mp4` for the live app demo.
  - `docs/assets/showcase/technical-walkthrough.mp4` for the spoken implementation walkthrough.
- The implementation note explicitly answers how smoothing works: point thinning, velocity-aware low-pass filtering, quadratic midpoint curves, coalesced pointer events, `requestAnimationFrame` batching, incremental active-stroke drawing, and capped stroke history for replay/undo.
- The tradeoff answer calls out the WebView canvas choice versus a native renderer and the real-device concerns to watch: WebView rendering cost, memory growth, touch latency on older iPhones, and renderer escalation if profiling proves it necessary.
- The client-answer section now uses a polished LovelyCouple example for touch-heavy work, including a shared drawing canvas, WebSocket-connected users, iOS widget surfacing, and why React Native Skia was appropriate there while this exercise intentionally uses custom WebView Canvas smoothing.
- The project-enjoyment answer now emphasizes aesthetic, scalable mobile app work and explains the importance of 60 FPS, frame pacing, JS-thread work, rendering cost, and memory usage for fluid user experiences.
- Until both MP4 files exist, `docs/showcase.js` keeps polished placeholders visible and disables the shared playback controls. Once both files are present, it replaces the placeholders with synchronized videos using the same paired-playback pattern as the Flip the Track showcase.
- The target GitHub Pages URL after enabling Pages from `main` and `/docs` is `https://devanshujain95.github.io/smooth-scribble/`.

## Current Implementation

- The drawing app uses a Midnight Teal visual direction: deep teal app background, luminous teal controls, warm paper canvas, gold accents, and high-contrast text.
- Typography uses iOS-safe fonts: `Georgia` for title/brand text, `Helvetica Neue` for labels/body copy, and `Menlo` for the stroke counter.
- `DrawingScreen` supports full-screen canvas mode from the expand/collapse button. The existing `DrawingCanvas` stays mounted while its shell switches to an absolute full-screen layout, preserving WebView stroke history across enter/exit.
- Full-screen mode keeps stroke count, undo, clear, brush color, brush width, and status controls available while respecting safe-area insets.
- `DrawingCanvas` remains a WebView-backed custom pointer canvas with smoothing, undo, clear, brush changes, and a 50-stroke history cap.
- The WebView canvas HTML uses a warm paper background aligned with the native Midnight Teal shell.

## Splash and Icon

- `react-native-bootsplash` `7.3.2` is installed and autolinked for iOS.
- iOS now launches from `BootSplash.storyboard` with a midnight teal background and centered abstract canvas mark.
- `AppDelegate.swift` initializes BootSplash with `RNBootSplash.initWithStoryboard("BootSplash", rootView:)`.
- `App.tsx` renders a matching React Native BootSplash overlay using `assets/bootsplash/manifest.json` and fades it after the first app layout is ready.
- Jest registers a `react-native-bootsplash` mock in `jest/setup.js`.
- The Abstract Canvas master icon is saved at `assets/icons/abstract-canvas-master.png`, with the original generated source retained at `assets/icons/abstract-canvas-master-source.png`.
- All iPhone and iOS marketing slots in `Images.xcassets/AppIcon.appiconset` are populated with no-alpha PNGs.

## iOS Signing

- The iOS app target `SmoothScribbleAssignment` uses automatic signing.
- The configured development team is `KA93HYPBB3` (`devanshujain95@gmail.com`, Devanshu Jain Personal Team).
- The bundle identifier is `com.devanshujain.smoothscribbleassignment`.
- A Debug device build was signed and installed on `Devanshu's iPhone` on 2026-07-02.

## Native Dependency Root Cause

- The apparent iOS failure was not caused by the drawing, splash, or icon code. The root cause was the Homebrew CocoaPods installation: `pod install` failed because the Homebrew-isolated CocoaPods runtime could not find its required `minitest` gem.
- Reinstalling Homebrew CocoaPods did not fix the missing runtime dependency, so the stable fix was to run CocoaPods through the already-working parent Bundler environment while keeping the assignment `ios/` directory as the working project context.
- The successful command path was `BUNDLE_GEMFILE=/Users/devanshujain/Documents/FocusTimer/Gemfile BUNDLE_APP_CONFIG=/Users/devanshujain/Documents/FocusTimer/.bundle /usr/bin/bundle exec pod install` from `SmoothScribbleAssignment/ios`.
- Running Bundler from the parent directory directly was not valid for this app because React Native autolinking resolved the wrong project context. Keeping `ios/` as the working directory is the important part.

## Verification

- `npm run typecheck` passes.
- `npm test -- --runInBand` passes.
- `npm run lint` passes.
- `plutil -lint` passes for `Info.plist` and `project.pbxproj`.
- `xmllint --noout` passes for `BootSplash.storyboard` and `LaunchScreen.storyboard`.
- Asset JSON files parse successfully, and generated app icon PNGs have the expected dimensions with no alpha channel.
- `xcodebuild` for a Debug generic iOS device build passes from `ios/SmoothScribbleAssignment.xcworkspace`.
- No simulator run or device install was performed after this refresh.

## Latest Device Build Attempt

- On 2026-07-02 12:27 IST, a fresh Debug iOS device build succeeded with `xcodebuild` from `ios/SmoothScribbleAssignment.xcworkspace`.
- The built app is at `ios/build/XcodeDerivedData/Build/Products/Debug-iphoneos/SmoothScribbleAssignment.app`.
- The first installation attempt did not complete because Xcode reported the real iPhone as unavailable/offline. `devicectl` could list the device record, but could not locate it for installation, and `ios-deploy` waited for an iOS device connection without detecting one.
- After the iPhone became available and paired, `devicectl device install app` installed the Debug build on `Devanshu’s iPhone` on 2026-07-02 12:33 IST.
- Installed bundle identifier: `com.devanshujain.smoothscribbleassignment`.

## Splash Corner Fix

- The splash-screen corner artifact was caused by black pixels baked into the generated BootSplash logo image corners. The logo PNGs had no alpha channel, so those black corners rendered visibly over the midnight teal splash background.
- The fix updates only the BootSplash logo PNGs in `assets/bootsplash` and `ios/SmoothScribbleAssignment/Images.xcassets/BootSplashLogo-2a31f7.imageset`, replacing edge-connected black corner pixels with the matching splash background color `#062B2F`.
- The app icon assets were not changed.
- A fresh Debug iOS device build succeeded and was installed on `Devanshu’s iPhone` on 2026-07-02 12:41 IST.

## Native Launch Snapshot Fix

- After the image-corner fix, the React Native splash overlay was correct but the first native launch frame could still show the old corners. That indicated an iOS native launch-screen snapshot/cache issue, not an RN overlay issue.
- The native launch screen now uses a new storyboard identity, `BootSplashNative.storyboard`, and `UILaunchStoryboardName` points to `BootSplashNative`.
- `AppDelegate.swift` initializes `RNBootSplash` with `BootSplashNative`, so the native launch screen and BootSplash handoff still use the same storyboard.
- A new native image asset, `BootSplashLogoNative`, was added with corrected corner pixels matching `#062B2F`. This avoids relying on the old native asset name that iOS may have cached.
- `plutil`, `xmllint`, and JSON parsing checks passed for the changed native files.
- A fresh Debug iOS device build succeeded and was installed on `Devanshu’s iPhone` on 2026-07-02 12:51 IST.
