import {describe,it,expect} from 'vitest';
import {MotionSmoother} from '../temporal';
import {v3} from '../vector';
describe('noise filter',()=>{it('smooths pose jumps and converges without overshoot',()=>{const s=new MotionSmoother();expect(s.sample(v3(0,0,0),.016).x).toBe(0);const a=s.sample(v3(1,0,0),.016);expect(a.x).toBeGreaterThan(0);expect(a.x).toBeLessThan(1);let p=a;for(let i=0;i<60;i++)p=s.sample(v3(1,0,0),.016);expect(p.x).toBeCloseTo(1,2);});});
