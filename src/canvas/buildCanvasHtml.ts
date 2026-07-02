import type { Brush } from './types';

const defaultBrush: Brush = {
  color: '#162526',
  width: 5,
};

export function buildCanvasHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #fff3d7;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(circle at 18% 16%, rgba(212, 168, 78, 0.25), transparent 27%),
          radial-gradient(circle at 78% 78%, rgba(78, 224, 197, 0.12), transparent 31%),
          linear-gradient(180deg, #fff7e3 0%, #f7ddb0 100%);
        touch-action: none;
      }
    </style>
  </head>
  <body>
    <canvas id="drawing-canvas"></canvas>
    <script>
      (function () {
        const canvas = document.getElementById('drawing-canvas');
        const context = canvas.getContext('2d', { alpha: false });
        const minPointDistance = 1.5;
        const forceAcceptMs = 24;
        const maxHistory = 50;
        let brush = ${JSON.stringify(defaultBrush)};
        let strokes = [];
        let activeStroke = null;
        let renderedPointCount = 0;
        let lastDrawnPoint = null;
        let animationFrame = 0;
        let logicalWidth = 1;
        let logicalHeight = 1;

        function clamp(value, min, max) {
          return Math.min(max, Math.max(min, value));
        }

        function distance(a, b) {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          return Math.hypot(dx, dy);
        }

        function midpoint(a, b) {
          return {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            time: b.time,
            pressure: b.pressure,
          };
        }

        function setDrawingTransform() {
          const scale = window.devicePixelRatio || 1;
          context.setTransform(scale, 0, 0, scale, 0, 0);
        }

        function clearCanvas() {
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, canvas.width, canvas.height);
          setDrawingTransform();
        }

        function pointFromEvent(event) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            time: performance.now(),
            pressure: typeof event.pressure === 'number' && event.pressure > 0 ? event.pressure : 0.5,
          };
        }

        function shouldAcceptPoint(points, point) {
          const previous = points[points.length - 1];
          if (!previous) {
            return true;
          }

          // Point thinning removes noisy duplicates but keeps slow strokes responsive.
          const moved = distance(previous, point);
          const elapsed = point.time - previous.time;
          return moved >= minPointDistance || elapsed >= forceAcceptMs;
        }

        function smoothPoint(previous, rawPoint) {
          if (!previous) {
            return rawPoint;
          }

          // Fast movement gets a higher alpha so smoothing does not visibly trail the finger.
          const elapsed = Math.max(1, rawPoint.time - previous.time);
          const speed = distance(previous, rawPoint) / elapsed;
          const alpha = clamp(0.25 + speed * 0.18, 0.25, 0.65);

          return {
            x: previous.x + (rawPoint.x - previous.x) * alpha,
            y: previous.y + (rawPoint.y - previous.y) * alpha,
            time: rawPoint.time,
            pressure: rawPoint.pressure,
          };
        }

        function configureStroke(stroke) {
          context.strokeStyle = stroke.color;
          context.fillStyle = stroke.color;
          context.lineWidth = stroke.width;
          context.lineCap = 'round';
          context.lineJoin = 'round';
        }

        function drawDot(point, stroke) {
          configureStroke(stroke);
          context.beginPath();
          context.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2);
          context.fill();
        }

        function drawCurveSegment(stroke, p0, p1, p2) {
          configureStroke(stroke);
          const end = midpoint(p1, p2);
          context.beginPath();
          context.moveTo(p0.x, p0.y);
          context.quadraticCurveTo(p1.x, p1.y, end.x, end.y);
          context.stroke();
          return end;
        }

        function drawSmoothedStroke(stroke) {
          const points = stroke.smoothedPoints;
          if (points.length === 0) {
            return;
          }

          if (points.length === 1) {
            drawDot(points[0], stroke);
            return;
          }

          configureStroke(stroke);
          context.beginPath();
          context.moveTo(points[0].x, points[0].y);
          context.lineTo(points[1].x, points[1].y);
          context.stroke();

          let previousMidpoint = points[1];
          for (let index = 2; index < points.length; index += 1) {
            previousMidpoint = drawCurveSegment(
              stroke,
              previousMidpoint,
              points[index - 1],
              points[index],
            );
          }
        }

        function redrawAllStrokes() {
          clearCanvas();
          strokes.forEach(drawSmoothedStroke);
        }

        function resizeCanvas() {
          const rect = canvas.getBoundingClientRect();
          const scale = window.devicePixelRatio || 1;
          logicalWidth = Math.max(1, rect.width);
          logicalHeight = Math.max(1, rect.height);
          const nextWidth = Math.max(1, Math.floor(logicalWidth * scale));
          const nextHeight = Math.max(1, Math.floor(logicalHeight * scale));

          if (canvas.width === nextWidth && canvas.height === nextHeight) {
            setDrawingTransform();
            return;
          }

          canvas.width = nextWidth;
          canvas.height = nextHeight;
          redrawAllStrokes();
        }

        function postStatus() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'status',
                strokeCount: strokes.length,
              }),
            );
          }
        }

        function flushActiveStroke() {
          if (!activeStroke) {
            return;
          }

          const points = activeStroke.smoothedPoints;
          while (renderedPointCount < points.length) {
            if (renderedPointCount === 0) {
              renderedPointCount = 1;
              lastDrawnPoint = points[0];
              continue;
            }

            if (renderedPointCount === 1) {
              configureStroke(activeStroke);
              context.beginPath();
              context.moveTo(points[0].x, points[0].y);
              context.lineTo(points[1].x, points[1].y);
              context.stroke();
              lastDrawnPoint = points[1];
              renderedPointCount = 2;
              continue;
            }

            lastDrawnPoint = drawCurveSegment(
              activeStroke,
              lastDrawnPoint,
              points[renderedPointCount - 1],
              points[renderedPointCount],
            );
            renderedPointCount += 1;
          }
        }

        function scheduleDraw() {
          if (animationFrame) {
            return;
          }

          // rAF batches high-frequency pointer events into one paint per screen frame.
          animationFrame = requestAnimationFrame(function () {
            animationFrame = 0;
            flushActiveStroke();
          });
        }

        function startStroke(event) {
          event.preventDefault();
          resizeCanvas();
          canvas.setPointerCapture(event.pointerId);

          const point = pointFromEvent(event);
          activeStroke = {
            color: brush.color,
            width: brush.width,
            rawPoints: [point],
            smoothedPoints: [point],
          };
          renderedPointCount = 0;
          lastDrawnPoint = null;
          scheduleDraw();
        }

        function acceptPoint(rawPoint) {
          if (!activeStroke || !shouldAcceptPoint(activeStroke.rawPoints, rawPoint)) {
            return;
          }

          const previousSmooth = activeStroke.smoothedPoints[activeStroke.smoothedPoints.length - 1];
          const smooth = smoothPoint(previousSmooth, rawPoint);
          activeStroke.rawPoints.push(rawPoint);
          activeStroke.smoothedPoints.push(smooth);
          scheduleDraw();
        }

        function extendStroke(event) {
          if (!activeStroke) {
            return;
          }

          event.preventDefault();
          const inputEvents =
            typeof event.getCoalescedEvents === 'function'
              ? event.getCoalescedEvents()
              : [event];
          inputEvents.forEach(function (inputEvent) {
            acceptPoint(pointFromEvent(inputEvent));
          });
        }

        function finishStroke(event) {
          if (!activeStroke) {
            return;
          }

          event.preventDefault();
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }

          flushActiveStroke();
          if (activeStroke.smoothedPoints.length === 1) {
            drawDot(activeStroke.smoothedPoints[0], activeStroke);
          }

          strokes.push(activeStroke);
          if (strokes.length > maxHistory) {
            strokes = strokes.slice(strokes.length - maxHistory);
            redrawAllStrokes();
          }

          activeStroke = null;
          renderedPointCount = 0;
          lastDrawnPoint = null;
          postStatus();
        }

        function handleCommand(message) {
          if (!message || typeof message.type !== 'string') {
            return;
          }

          if (message.type === 'setBrush' && message.brush) {
            brush = {
              color: String(message.brush.color || brush.color),
              width: clamp(Number(message.brush.width) || brush.width, 1, 40),
            };
            return;
          }

          if (message.type === 'clear') {
            strokes = [];
            activeStroke = null;
            clearCanvas();
            postStatus();
            return;
          }

          if (message.type === 'undo') {
            // Undo replays stored smoothed points, so it stays deterministic and cheap.
            strokes.pop();
            activeStroke = null;
            redrawAllStrokes();
            postStatus();
          }
        }

        function handleMessage(event) {
          try {
            handleCommand(JSON.parse(event.data));
          } catch (error) {
            // Ignore malformed host messages; drawing should never stop because of a control payload.
          }
        }

        canvas.addEventListener('pointerdown', startStroke);
        canvas.addEventListener('pointermove', extendStroke);
        canvas.addEventListener('pointerup', finishStroke);
        canvas.addEventListener('pointercancel', finishStroke);
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('message', handleMessage);
        document.addEventListener('message', handleMessage);

        resizeCanvas();
        postStatus();
      })();
    </script>
  </body>
</html>`;
}
