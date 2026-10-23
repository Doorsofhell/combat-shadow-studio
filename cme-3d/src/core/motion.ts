import {ease,lerp,mix,v3,type Vec3} from './vector';
export type Side='left'|'right';
export type Technique='hook-left'|'hook-right';
export type MartialDiscipline='boxing'|'kickboxing'|'mma'|'muaythai'|'bjj'|'judo';
export interface HandMotion{ offset:Vec3; pole:Vec3 }
export interface MotionFrame{
  progress:number;phase:'guard'|'load'|'strike'|'impact'|'recover';
  hipYaw:number;chestYaw:number;headCounterYaw:number;leadFootYaw:number;
  hands:Record<Side,HandMotion>;plant:{left:boolean;right:boolean};
  contactQuality:'planned-not-validated';
}
type Key={at:number; left:Vec3; right:Vec3; hip:number; chest:number; foot:number};
const L=v3(-0.10,-0.16,0.32),R=v3(0.10,-0.16,0.32);
/** A documented reference trajectory, not a medical/competitive validation.
 * Sequential phases: guard -> counter-rotation -> acceleration -> impact -> recovery.
 * Values are in a chest-local frame, calibrated by the adapter against real arm lengths.
 */
const keys:readonly Key[]=[
 {at:0,left:L,right:R,hip:0,chest:0,foot:0},
 {at:0.22,left:v3(-0.17,-0.17,0.25),right:R,hip:-0.12,chest:-0.22,foot:-0.06},
 {at:0.60,left:v3(0.25,-0.13,0.43),right:R,hip:0.19,chest:0.35,foot:0.18},
 {at:0.69,left:v3(0.28,-0.13,0.44),right:R,hip:0.20,chest:0.36,foot:0.20},
 {at:1,left:L,right:R,hip:0,chest:0,foot:0},
];
function interpolate(t:number):Key{
  let k=0;while(k<keys.length-2&&t>keys[k+1].at)k++;
  const a=keys[k],b=keys[k+1],f=ease((t-a.at)/(b.at-a.at));
  return {at:t,left:mix(a.left,b.left,f),right:mix(a.right,b.right,f),hip:lerp(a.hip,b.hip,f),chest:lerp(a.chest,b.chest,f),foot:lerp(a.foot,b.foot,f)};
}
export function sampleHook(technique:Technique,progress:number):MotionFrame{
  const t=Math.max(0,Math.min(1,progress));const k=interpolate(t);
  const mirror=technique==='hook-right'?-1:1;
  const left=mirror===1?k.left:v3(-k.right.x,k.right.y,k.right.z);
  const right=mirror===1?k.right:v3(-k.left.x,k.left.y,k.left.z);
  const poleLeft=v3(-0.35,-0.15,0.13),poleRight=v3(0.35,-0.15,0.13);
  return {
    progress:t,phase:t<0.02?'guard':t<0.22?'load':t<0.6?'strike':t<0.69?'impact':'recover',
    hipYaw:k.hip*mirror,chestYaw:k.chest*mirror,headCounterYaw:-k.chest*mirror*0.55,
    leadFootYaw:k.foot*mirror,
    hands:{left:{offset:left,pole:poleLeft},right:{offset:right,pole:poleRight}},
    plant:{left:true,right:true},contactQuality:'planned-not-validated',
  };
}
export const IMPLEMENTED_TECHNIQUES:readonly Technique[]=['hook-left','hook-right'];
