import {add,clamp,cross,dist,dot,finite,length,scale,sub,unit,v3,type Vec3} from './vector';
/** Analytic 3D 2-bone IK. The elbow/knee is selected by a pole vector and constrained by a bend range.
 * Unlike a per-bone pose tweak, this computes an attainable chain geometry for any anthropometry.
 * Interior joint angle: 180 degrees is straight, 0 degrees is fully folded.
 */
export interface Chain { root:Vec3; target:Vec3; pole:Vec3; upperLength:number; lowerLength:number; minBendDeg?:number; maxBendDeg?:number }
export interface ChainSolution { joint:Vec3; end:Vec3; error:number; clamped:boolean; bendDeg:number; valid:boolean }
const RAD=Math.PI/180;
export function solveTwoBone(c:Chain):ChainSolution {
  const {root,target,pole}=c;const a=c.upperLength,b=c.lowerLength;
  const bad={joint:root,end:root,error:dist(root,target),clamped:true,bendDeg:0,valid:false};
  if(!(a>0&&b>0&&finite(root)&&finite(target)&&finite(pole)))return bad;
  const requested=dist(root,target);
  const minBend=clamp(c.minBendDeg??12,0.01,179.9),maxBend=clamp(c.maxBendDeg??174,minBend,179.99);
  const reach=(angle:number)=>Math.sqrt(Math.max(0,a*a+b*b-2*a*b*Math.cos(angle*RAD)));
  const d=clamp(requested,Math.max(1e-6,reach(minBend)),reach(maxBend));
  const axis=unit(sub(target,root),v3(0,0,1));
  let perpendicular=sub(sub(pole,root),scale(axis,dot(sub(pole,root),axis)));
  if(length(perpendicular)<1e-7)perpendicular=cross(axis,Math.abs(axis.y)<0.95?v3(0,1,0):v3(1,0,0));
  const bend=unit(perpendicular);
  const along=(a*a-b*b+d*d)/(2*d);
  const radius=Math.sqrt(Math.max(0,a*a-along*along));
  const joint=add(add(root,scale(axis,along)),scale(bend,radius));
  const end=add(root,scale(axis,d));
  const cosine=clamp((a*a+b*b-d*d)/(2*a*b),-1,1);
  return {joint,end,error:dist(end,target),clamped:Math.abs(d-requested)>1e-5,bendDeg:Math.acos(cosine)/RAD,valid:finite(joint)&&finite(end)};
}
