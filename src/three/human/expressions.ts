/** 2.10.6 (taken out of face.ts, unchanged) */
/** the expressions used, by ARKit name (the model's targets are named AK_nn_<name>) */
export const FACE_EXPRESSIONS = [
  'BrowDownLeft', 'BrowDownRight', 'BrowInnerUp', 'CheekPuff', 'CheekSquintLeft', 'CheekSquintRight', 'EyeBlinkLeft',
  'EyeBlinkRight', 'EyeSquintLeft', 'EyeSquintRight', 'EyeWideLeft', 'EyeWideRight', 'JawOpen', 'MouthClose',
  'MouthFrownLeft', 'MouthFrownRight', 'MouthFunnel', 'MouthPressLeft', 'MouthPressRight', 'MouthSmileLeft',
  'MouthSmileRight', 'MouthStretchLeft', 'MouthStretchRight', 'NoseSneerLeft', 'NoseSneerRight',
] as const;
export type FaceExpression = (typeof FACE_EXPRESSIONS)[number];
