import {GroundContacts} from './contacts';
import {sampleHook,type MotionFrame,type Technique} from './motion';
/** Reusable headless motion engine. No DOM, WebGL, Three.js, React or app store imports. */
export class CombatMotionEngine {
  readonly contacts=new GroundContacts();
  private technique:Technique='hook-left';
  private duration=0.85;
  setTechnique(next:Technique):void{this.technique=next;this.contacts.reset();}
  setDuration(seconds:number):void{if(!(Number.isFinite(seconds)&&seconds>0))throw Error('Duration must be positive');this.duration=seconds;}
  sampleAt(seconds:number):MotionFrame{return sampleHook(this.technique,Math.max(0,seconds)/this.duration);}
  sampleNormalized(progress:number):MotionFrame{return sampleHook(this.technique,progress);}
  reset():void{this.contacts.reset();}
  getTechnique():Technique{return this.technique;}
}
export * from './ik';
export * from './contacts';
export * from './motion';
export * from './vector';
