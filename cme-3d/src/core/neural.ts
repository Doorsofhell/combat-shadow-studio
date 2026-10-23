import {clamp,length,type Vec3} from './vector';
import type {MotionFrame} from './motion';
/** Compact local neural correction: trained ONLY on synthetic physics-inspired teacher targets.
 * It executes synchronously each 3D render frame with 5 inputs, 12 tanh hidden units,
 * and 4 outputs. This is a genuine (but preliminary) trained NN, NOT a mocap-trained
 * expert model or proof of human biomechanics.
 */
export interface TinyNeural { w1:readonly (readonly number[])[]; b1:readonly number[]; w2:readonly (readonly number[])[]; b2:readonly number[] }
export const ANALYTIC_NEURAL_MODEL:TinyNeural = {
 w1:[[0.31414,0.11229,0.24288,0.09425,0.1562],[0.0002,-0.0746,-0.13465,0.06384,0.04693],[-0.06756,-0.09122,0.07323,0.11958,0.2026],[-0.12754,0.09126,0.21975,0.54938,0.153],[-0.24169,-0.03512,0.20589,-0.41312,-0.34928],[0.08422,0.08734,-0.21911,0.08199,0.03486],[-0.01138,0.00893,0.30574,0.27201,0.17756],[-0.29613,0.1939,-0.20851,0.23611,0.14545],[-0.00884,0.03119,0.25589,0.04992,-0.08508],[0.17011,0.19746,-0.02964,0.07058,-0.19097],[-0.13166,0.10934,-0.0778,-0.18429,0.17535],[-0.32969,0.02129,-0.00954,0.05146,0.08287]],
 b1:[-0.00309,-0.00313,-0.00053,-0.01103,0.00685,-0.00009,-0.00065,0.00252,-0.00076,-0.00038,0.0006,0.00008],
 w2:[[-0.21256,-0.16449,-0.27187,0.00798,-0.11534,-0.19108,0.14743,0.03704,-0.04881,-0.12792,0.03114,-0.01098],[-0.2217,-0.02274,0.23558,0.17784,-0.08273,-0.21253,-0.13867,-0.2654,-0.175,0.04059,0.02679,-0.10928],[-0.06127,0.05566,0.23431,-0.17851,-0.13282,-0.14401,-0.22654,0.25331,0.11259,0.09911,-0.10649,-0.04248],[0.16176,0.25403,0.03634,-0.07258,0.07109,0.00169,-0.01607,0.00402,0.02216,0.03306,0.02794,0.12282]],
 b2:[-0.00052,0.0021,-0.00144,-0.01372]
};
export function neuralInfer(model:TinyNeural, features:readonly number[]):number[]{
 if(features.length!==5||features.some(x=>!Number.isFinite(x)))throw Error('Invalid neural inputs');
 if(model.w1.length!==12||model.w2.length!==4)throw Error('Missing required real-time neural weights');
 const hidden=model.w1.map((row,j)=>Math.tanh(row.reduce((s,w,k)=>s+w*features[k],model.b1[j])));
 const out=model.w2.map((row,j)=>row.reduce((s,w,k)=>s+w*hidden[k],model.b2[j]));
 if(out.some(x=>!Number.isFinite(x)))throw Error('Neural inference failed');
 return out;
}
/** Mandatory inference occurs *inside every animation frame*, before the IK/foot-contact safety projection. */
export function correctMotionLive(model:TinyNeural, frame:MotionFrame):MotionFrame{
 const left=length(frame.hands.left.offset),right=length(frame.hands.right.offset);
 const features=[
  clamp(frame.hipYaw*3,-1,1),clamp(frame.chestYaw*3,-1,1),
  clamp(frame.leadFootYaw*3,-1,1),
  clamp((Math.max(left,right)-.3)/.5,-1,1),
  Math.sin(2*Math.PI*frame.progress)
 ];
 const [hip,chest,foot,hand]=neuralInfer(model,features);
 const delta=clamp(hand,-.035,.035);
 return {
  ...frame,hipYaw:frame.hipYaw+clamp(hip,-.12,.12),
  chestYaw:frame.chestYaw+clamp(chest,-.12,.12),
  leadFootYaw:frame.leadFootYaw+clamp(foot,-.12,.12),
  headCounterYaw:frame.headCounterYaw-clamp(chest,-.12,.12)*.4,
  hands:{
   left:{...frame.hands.left,offset:{...frame.hands.left.offset,y:frame.hands.left.offset.y+delta}},
   right:{...frame.hands.right,offset:{...frame.hands.right.offset,y:frame.hands.right.offset.y+delta}}
  }
 };
}
