import {describe,it,expect} from 'vitest';
import {solveTwoBone} from '../ik';
import {dist,v3} from '../vector';
import {GroundContacts} from '../contacts';
import {CombatMotionEngine} from '../engine';
describe('independent CME-3D core',()=>{
 it('solves reachable chains exactly and returns stable anatomy',()=>{
  const result=solveTwoBone({root:v3(0,0,0),target:v3(0.35,0,0),pole:v3(0,1,0),upperLength:0.25,lowerLength:0.25});
  expect(result.valid).toBe(true);
  expect(result.clamped).toBe(false);
  expect(dist(v3(0,0,0),result.joint)).toBeCloseTo(0.25,5);
  expect(dist(result.joint,result.end)).toBeCloseTo(0.25,5);
  expect(result.error).toBeLessThan(1e-5);
 });
 it('limits hyperextension and impossible targets',()=>{
  const s=solveTwoBone({root:v3(),target:v3(5,0,0),pole:v3(0,1,0),upperLength:0.3,lowerLength:0.3,maxBendDeg:165});
  expect(s.valid).toBe(true);expect(s.clamped).toBe(true);expect(s.bendDeg).toBeLessThanOrEqual(165.0001);
 });
 it('rejects degenerate limbs',()=>{
  expect(solveTwoBone({root:v3(),target:v3(1,0,0),pole:v3(0,1,0),upperLength:0,lowerLength:1}).valid).toBe(false);
 });
 it('locks planted contact and releases it when requested',()=>{
  const c=new GroundContacts();c.update('left',v3(1,0.1,2),true);
  expect(c.update('left',v3(2,0,3),true).position).toEqual(v3(1,0,2));
  expect(c.update('left',v3(2,0,3),false).state.planted).toBe(false);
 });
 it('samples both hooks without any Shadow dependencies',()=>{
  const e=new CombatMotionEngine();e.setTechnique('hook-left');
  const a=e.sampleNormalized(.6);e.setTechnique('hook-right');const b=e.sampleNormalized(.6);
  expect(a.hands.left.offset.x).toBeGreaterThan(0);
  expect(b.hands.right.offset.x).toBeLessThan(0);
  expect(a.phase).toBe('impact');expect(b.hipYaw).toBeLessThan(0);
 });
});
