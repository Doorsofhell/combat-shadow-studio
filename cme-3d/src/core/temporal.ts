import {clamp,lerp,type Vec3,v3} from './vector';
/** A velocity-aware temporal smoother suitable for BVH/pose-stream adapters.
 * Adaptive cut-off mitigates jitter while preserving fast strikes.
 * Operates independently of Three.js. One instance per tracked joint.
 */
export class MotionSmoother {
  private value:Vec3|null=null;
  private velocity=0;
  constructor(private minHz=2.5,private adaptiveGain=0.09){}
  sample(next:Vec3,seconds:number):Vec3{
    if(!this.value){this.value={...next};return next;}
    const dt=clamp(seconds,1/240,1/15);
    const dx=next.x-this.value.x,dy=next.y-this.value.y,dz=next.z-this.value.z;
    const instantaneous=Math.hypot(dx,dy,dz)/dt;
    this.velocity=lerp(this.velocity,instantaneous,clamp(dt*12,0,1));
    const fc=this.minHz+this.adaptiveGain*this.velocity;
    const alpha=1-Math.exp(-2*Math.PI*fc*dt);
    this.value=v3(lerp(this.value.x,next.x,alpha),lerp(this.value.y,next.y,alpha),lerp(this.value.z,next.z,alpha));
    return this.value;
  }
  reset():void{this.value=null;this.velocity=0;}
}
