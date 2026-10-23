/** Pure math, no renderer dependencies. Distances are metres, y is up. */
export type Vec3 = Readonly<{ x: number; y: number; z: number }>;
export const v3 = (x=0,y=0,z=0):Vec3 => ({x,y,z});
export const add = (a:Vec3,b:Vec3):Vec3 => v3(a.x+b.x,a.y+b.y,a.z+b.z);
export const sub = (a:Vec3,b:Vec3):Vec3 => v3(a.x-b.x,a.y-b.y,a.z-b.z);
export const scale = (a:Vec3,k:number):Vec3 => v3(a.x*k,a.y*k,a.z*k);
export const dot = (a:Vec3,b:Vec3):number => a.x*b.x+a.y*b.y+a.z*b.z;
export const cross = (a:Vec3,b:Vec3):Vec3 => v3(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
export const length = (a:Vec3):number => Math.hypot(a.x,a.y,a.z);
export const dist = (a:Vec3,b:Vec3):number => length(sub(a,b));
export const unit = (a:Vec3,fallback:Vec3=v3(1,0,0)):Vec3 => {const n=length(a);return n>1e-9?scale(a,1/n):fallback;};
export const clamp = (v:number,min:number,max:number):number => Math.min(max,Math.max(min,v));
export const lerp = (a:number,b:number,t:number):number => a+(b-a)*t;
export const mix = (a:Vec3,b:Vec3,t:number):Vec3 => add(scale(a,1-t),scale(b,t));
export const ease = (t:number):number => {const x=clamp(t,0,1);return x*x*(3-2*x);};
export const finite = (v:Vec3):boolean => Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);
