import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { DrawingCanvas } from '../components/DrawingCanvas';
import type { Brush, CanvasCommand, CanvasStatusMessage } from '../canvas/types';
import { brushColors, brushWidths, palette } from '../theme';
import { typography } from '../typography';

export function DrawingScreen() {
  const insets = useSafeAreaInsets();
  const [brush, setBrush] = useState<Brush>({ color: brushColors[0], width: 5 });
  const [strokeCount, setStrokeCount] = useState(0);
  const [commandNonce, setCommandNonce] = useState(0);
  const [command, setCommand] = useState<CanvasCommand | null>(null);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const statusLabel = useMemo(() => {
    if (strokeCount === 0) {
      return 'Draw fast or slow. Strokes smooth in real time.';
    }

    return `${strokeCount} stroke${strokeCount === 1 ? '' : 's'} captured`;
  }, [strokeCount]);

  const sendCommand = useCallback((nextCommand: CanvasCommand) => {
    setCommand(nextCommand);
    setCommandNonce(value => value + 1);
  }, []);

  const handleStatusChange = useCallback((message: CanvasStatusMessage) => {
    setStrokeCount(message.strokeCount);
  }, []);

  return (
    <View style={styles.safeArea}>
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom, 10) + 12,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Icon name="pen-tool" size={22} color={palette.backgroundDeep} />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>Smooth Scribble</Text>
            <Text style={styles.subtitle}>Fast custom strokes, no Skia.</Text>
          </View>

          <IconButton
            accessibilityLabel="Undo last stroke"
            iconName="rotate-ccw"
            onPress={() => sendCommand({ type: 'undo' })}
          />
          <IconButton
            accessibilityLabel="Clear canvas"
            destructive
            iconName="trash-2"
            onPress={() => sendCommand({ type: 'clear' })}
          />
        </View>

        <View
          style={[
            styles.canvasShell,
            isCanvasFullscreen && styles.fullscreenCanvasShell,
            isCanvasFullscreen && {
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.canvasHeader}>
            <View>
              <Text style={styles.canvasEyebrow}>LIVE CANVAS</Text>
              <Text style={styles.canvasTitle}>
                {isCanvasFullscreen ? 'Full-screen canvas' : 'Draw naturally'}
              </Text>
            </View>

            <View style={styles.canvasActions}>
              <StrokeBadge strokeCount={strokeCount} />

              {isCanvasFullscreen ? (
                <>
                  <IconButton
                    accessibilityLabel="Undo last stroke"
                    iconName="rotate-ccw"
                    onPress={() => sendCommand({ type: 'undo' })}
                  />
                  <IconButton
                    accessibilityLabel="Clear canvas"
                    destructive
                    iconName="trash-2"
                    onPress={() => sendCommand({ type: 'clear' })}
                  />
                </>
              ) : null}

              <IconButton
                accessibilityLabel={
                  isCanvasFullscreen
                    ? 'Exit full-screen canvas'
                    : 'Open full-screen canvas'
                }
                iconName={isCanvasFullscreen ? 'minimize-2' : 'maximize-2'}
                onPress={() => setIsCanvasFullscreen(value => !value)}
              />
            </View>
          </View>

          <DrawingCanvas
            brush={brush}
            command={command}
            commandNonce={commandNonce}
            onStatusChange={handleStatusChange}
          />

          {isCanvasFullscreen ? (
            <>
              <ToolRail brush={brush} compact setBrush={setBrush} />
              <StatusRow label={statusLabel} />
            </>
          ) : null}
        </View>

        <ToolRail brush={brush} setBrush={setBrush} />

        <StatusRow label={statusLabel} />
      </View>
    </View>
  );
}

type IconButtonProps = {
  accessibilityLabel: string;
  destructive?: boolean;
  iconName: string;
  onPress: () => void;
};

function IconButton({
  accessibilityLabel,
  destructive = false,
  iconName,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        destructive && styles.destructiveButton,
        pressed && styles.iconButtonPressed,
      ]}
    >
      <Icon
        name={iconName}
        size={19}
        color={destructive ? palette.rose : palette.primary}
      />
    </Pressable>
  );
}

type StrokeBadgeProps = {
  strokeCount: number;
};

function StrokeBadge({ strokeCount }: StrokeBadgeProps) {
  return (
    <View style={styles.strokeBadge}>
      <Icon name="activity" size={14} color={palette.primary} />
      <Text style={styles.strokeBadgeText}>{strokeCount}</Text>
    </View>
  );
}

type ToolRailProps = {
  brush: Brush;
  compact?: boolean;
  setBrush: React.Dispatch<React.SetStateAction<Brush>>;
};

function ToolRail({ brush, compact = false, setBrush }: ToolRailProps) {
  return (
    <View style={[styles.toolRail, compact && styles.fullscreenToolRail]}>
      <View style={styles.toolGroup}>
        <Text style={styles.toolLabel}>Ink</Text>
        <View style={styles.swatchRow}>
          {brushColors.map(color => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Use ${color} brush`}
              hitSlop={4}
              key={color}
              onPress={() => setBrush(current => ({ ...current, color }))}
              style={[
                styles.swatch,
                { backgroundColor: color },
                brush.color === color && styles.selectedSwatch,
              ]}
            >
              {brush.color === color ? (
                <Icon name="check" size={14} color={palette.ink} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.toolDivider} />

      <View style={styles.toolGroup}>
        <Text style={styles.toolLabel}>Weight</Text>
        <View style={styles.widthRow}>
          {brushWidths.map(width => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Use ${width} point stroke width`}
              hitSlop={4}
              key={width}
              onPress={() => setBrush(current => ({ ...current, width }))}
              style={[
                styles.widthButton,
                brush.width === width && styles.selectedWidthButton,
              ]}
            >
              <View
                style={[
                  styles.widthPreview,
                  {
                    width: width + 8,
                    height: width + 8,
                    borderRadius: (width + 8) / 2,
                    backgroundColor: brush.color,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

type StatusRowProps = {
  label: string;
};

function StatusRow({ label }: StatusRowProps) {
  return (
    <View style={styles.statusRow}>
      <Icon name="zap" size={15} color={palette.gold} />
      <Text style={styles.status}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    gap: 14,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: palette.ink,
    fontFamily: typography.title.fontFamily,
    fontSize: 27,
    fontWeight: typography.title.fontWeight,
  },
  subtitle: {
    marginTop: 2,
    color: palette.muted,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: typography.body.fontWeight,
  },
  iconButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  destructiveButton: {
    borderColor: 'rgba(255, 140, 140, 0.34)',
    backgroundColor: 'rgba(255, 140, 140, 0.1)',
  },
  iconButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: 'rgba(78, 224, 197, 0.14)',
  },
  canvasShell: {
    flex: 1,
    minHeight: 360,
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
  },
  fullscreenCanvasShell: {
    position: 'absolute',
    zIndex: 30,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 0,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: palette.background,
    paddingHorizontal: 14,
    shadowOpacity: 0,
  },
  canvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  canvasActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canvasEyebrow: {
    color: palette.gold,
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: typography.label.fontWeight,
    letterSpacing: 0,
  },
  canvasTitle: {
    marginTop: 2,
    color: palette.ink,
    fontFamily: typography.title.fontFamily,
    fontSize: 18,
    fontWeight: typography.title.fontWeight,
  },
  strokeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(78, 224, 197, 0.11)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  strokeBadgeText: {
    color: palette.ink,
    fontFamily: typography.mono.fontFamily,
    fontSize: 13,
    fontWeight: typography.mono.fontWeight,
  },
  toolRail: {
    alignItems: 'stretch',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  fullscreenToolRail: {
    backgroundColor: 'rgba(14, 60, 64, 0.94)',
    shadowOpacity: 0,
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
  toolLabel: {
    color: palette.faint,
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: typography.label.fontWeight,
    letterSpacing: 0,
  },
  toolDivider: {
    height: 1,
    backgroundColor: palette.border,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  selectedSwatch: {
    borderColor: palette.primary,
  },
  widthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  widthButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedWidthButton: {
    borderColor: palette.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(78, 224, 197, 0.14)',
  },
  widthPreview: {
    opacity: 0.92,
  },
  statusRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  status: {
    color: palette.muted,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    fontWeight: typography.body.fontWeight,
    textAlign: 'center',
  },
});
