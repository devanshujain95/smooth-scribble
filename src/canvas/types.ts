export type Brush = {
  color: string;
  width: number;
};

export type CanvasCommand =
  | { type: 'setBrush'; brush: Brush }
  | { type: 'clear' }
  | { type: 'undo' };

export type CanvasStatusMessage = {
  type: 'status';
  strokeCount: number;
};
