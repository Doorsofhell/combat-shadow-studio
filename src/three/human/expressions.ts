/** Kept apart from face.ts so that capabilities.ts does not import face.ts back (2.10.2). */
/** the expressions used, by ARKit name (the model's targets are named AK_nn_<name>) */
export const FACE_EXPRESSIONS = [
  'BrowDownLeft', 'BrowDownRight', 'BrowInnerUp', 'CheekPuff', 'CheekSquintLeft', 'CheekSquintRight', 'EyeBlinkLeft',
  'EyeBlinkRight', 'EyeSquintLeft', 'EyeSquintRight', 'EyeWideLeft', 'EyeWideRight', 'JawOpen', 'MouthClose',
  'MouthFrownLeft', 'MouthFrownRight', 'MouthFunnel', 'MouthPressLeft', 'MouthPressRight', 'MouthSmileLeft',
  'MouthSmileRight', 'MouthStretchLeft', 'MouthStretchRight', 'NoseSneerLeft', 'NoseSneerRight',
] as const;
