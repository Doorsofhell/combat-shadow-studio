import {dist,scale,v3,type Vec3} from './vector';
/** Explicit grounded-foot anchors. This module is pure geometry and independent of three.js or Rapier.
 * A planted foot remains fixed in world space while the body translates or turns.
 * Caller decides contact phases; motion/contact inference will be a separate adapter.
 */
export type Foot='left'|'right';
export interface ContactState { planted:boolean; anchor:Vec3|null; foot:Foot }
export class GroundContacts {
  private anchors:Record<Foot,Vec3|null>={left:null,right:null};
  update(foot:Foot,position:Vec3,shouldPlant:boolean):{position:Vec3;state:ContactState;slip:number} {
    if(!shouldPlant){this.anchors[foot]=null;return {position,state:{foot,planted:false,anchor:null},slip:0};}
    if(!this.anchors[foot])this.anchors[foot]=v3(position.x,0,position.z);
    const anchor=this.anchors[foot]!;
    return {position:anchor,state:{foot,planted:true,anchor},slip:dist(v3(position.x,0,position.z),anchor)};
  }
  get(foot:Foot):ContactState{return {foot,planted:!!this.anchors[foot],anchor:this.anchors[foot]};}
  reset():void{this.anchors={left:null,right:null};}
}
