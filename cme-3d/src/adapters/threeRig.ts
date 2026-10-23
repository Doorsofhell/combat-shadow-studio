import { Bone, Object3D, Quaternion, Vector3 } from 'three';
import { solveTwoBone } from '../core/ik';
import { CombatMotionEngine } from '../core/engine';
import type { MotionFrame } from '../core/motion';
import { v3, type Vec3 } from '../core/vector';
type Side = 'left'|'right';
type Limb = { upper:Bone; lower:Bone; end:Bone; lengthA:number; lengthB:number; restEnd:Vector3; restPole:Vector3 };
export interface RigReport { bones:number; leftArm:boolean; rightArm:boolean; leftLeg:boolean; rightLeg:boolean; armClamps:number; footErrorMetres:number }
export class ThreeRigAdapter {
 private rest = new Map<Bone,Quaternion>();
 private arms: Partial<Record<Side,Limb>>={}; private legs: Partial<Record<Side,Limb>>={};
 private hips:Bone|null;private spine:Bone|null;private head:Bone|null;
 private contacts=new CombatMotionEngine().contacts;
 private report:RigReport={bones:0,leftArm:false,rightArm:false,leftLeg:false,rightLeg:false,armClamps:0,footErrorMetres:0};
 constructor(readonly scene:Object3D) {
  const bones:Bone[]=[];scene.traverse(o=>{if((o as Bone).isBone){const b=o as Bone;bones.push(b);this.rest.set(b,b.quaternion.clone());}});
  const find=(name:string):Bone|null=>bones.find(b=>b.name.replace(/^.*:/,'').replace(/^mixamorig/i,'').replace(/[^a-z]/gi,'').toLowerCase()===name.toLowerCase())??null;
  const limb=(a:string,b:string,c:string):Limb|undefined=>{
   const upper=find(a),lower=find(b),end=find(c);if(!upper||!lower||!end)return undefined;
   const p=upper.getWorldPosition(new Vector3()),q=lower.getWorldPosition(new Vector3()),r=end.getWorldPosition(new Vector3());
   const lengthA=p.distanceTo(q),lengthB=q.distanceTo(r);if(lengthA<.001||lengthB<.001)return undefined;
   return {upper,lower,end,lengthA,lengthB,restEnd:r.clone(),restPole:q.clone()};
  };
  this.scene.updateMatrixWorld(true);
  this.hips=find('Hips');this.spine=find('Spine2')??find('Spine1')??find('Spine');this.head=find('Head');
  for(const s of ['left','right'] as const){const id=s==='left'?'Left':'Right';this.arms[s]=limb(id+'Arm',id+'ForeArm',id+'Hand');this.legs[s]=limb(id+'UpLeg',id+'Leg',id+'Foot');}
  this.report={bones:bones.length,leftArm:!!this.arms.left,rightArm:!!this.arms.right,leftLeg:!!this.legs.left,rightLeg:!!this.legs.right,armClamps:0,footErrorMetres:0};
 }
 private vec(v:Vector3):Vec3{return v3(v.x,v.y,v.z);}
 private aim(b:Bone,child:Bone,goal:Vec3):void{
  this.scene.updateMatrixWorld(true);
  const p=b.getWorldPosition(new Vector3()),direction=child.getWorldPosition(new Vector3()).sub(p),toward=new Vector3(goal.x,goal.y,goal.z).sub(p);
  if(direction.length()<1e-6||toward.length()<1e-6)return;
  const q=new Quaternion().setFromUnitVectors(direction.normalize(),toward.normalize());
  const current=b.getWorldQuaternion(new Quaternion()),parent=b.parent?.getWorldQuaternion(new Quaternion())??new Quaternion();
  b.quaternion.copy(parent.invert().multiply(q.multiply(current))).normalize();this.scene.updateMatrixWorld(true);
 }
 private arm(l:Limb,frame:MotionFrame,side:Side):number{
  const shoulder=l.upper.getWorldPosition(new Vector3()),d=frame.hands[side],k=(l.lengthA+l.lengthB)/.5;
  const target=shoulder.clone().add(new Vector3(d.offset.x,d.offset.y,d.offset.z).multiplyScalar(k));
  const pole=shoulder.clone().add(new Vector3(d.pole.x,d.pole.y,d.pole.z).multiplyScalar(k));
  const r=solveTwoBone({root:this.vec(shoulder),target:this.vec(target),pole:this.vec(pole),upperLength:l.lengthA,lowerLength:l.lengthB,minBendDeg:30,maxBendDeg:170});
  if(!r.valid)return 1;this.aim(l.upper,l.lower,r.joint);this.aim(l.lower,l.end,r.end);return Number(r.clamped);
 }
 private leg(l:Limb,side:Side,frame:MotionFrame):number{
  const root=l.upper.getWorldPosition(new Vector3()),anchor=l.restEnd;
  const contact=this.contacts.update(side,v3(anchor.x,0,anchor.z),frame.plant[side]);
  const target=v3(contact.position.x,anchor.y,contact.position.z);
  const pole=v3(l.restPole.x,l.restPole.y,l.restPole.z+.24);
  const r=solveTwoBone({root:this.vec(root),target,pole,upperLength:l.lengthA,lowerLength:l.lengthB,minBendDeg:4,maxBendDeg:176});
  if(!r.valid)return 1;this.aim(l.upper,l.lower,r.joint);this.aim(l.lower,l.end,r.end);
  const p=l.end.getWorldPosition(new Vector3());return p.distanceTo(new Vector3(target.x,target.y,target.z));
 }
 apply(frame:MotionFrame):RigReport{
  this.rest.forEach((q,b)=>b.quaternion.copy(q));this.scene.updateMatrixWorld(true);
  const Y=new Vector3(0,1,0);
  this.hips?.quaternion.multiply(new Quaternion().setFromAxisAngle(Y,frame.hipYaw));
  this.spine?.quaternion.multiply(new Quaternion().setFromAxisAngle(Y,frame.chestYaw));
  this.head?.quaternion.multiply(new Quaternion().setFromAxisAngle(Y,frame.headCounterYaw));this.scene.updateMatrixWorld(true);
  let armClamps=0,footErrorMetres=0;
  for(const s of ['left','right'] as const){const a=this.arms[s],l=this.legs[s];if(a)armClamps+=this.arm(a,frame,s);if(l)footErrorMetres+=this.leg(l,s,frame);}
  this.report={...this.report,armClamps,footErrorMetres};return this.describe();
 }
 describe():RigReport{return {...this.report};}
}
