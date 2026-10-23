import {describe,it,expect} from 'vitest';
import {ANALYTIC_NEURAL_MODEL,correctMotionLive,neuralInfer} from '../neural';
import {sampleHook} from '../motion';
describe('mandatory synchronous neural frame correction',()=>{
 it('runs without WebGL, network or async inference',()=>{
  const src=sampleHook('hook-left',.6);
  const out=correctMotionLive(ANALYTIC_NEURAL_MODEL,src);
  expect(out.chestYaw).not.toEqual(src.chestYaw);
  expect(out.hands.left.offset.y).not.toEqual(src.hands.left.offset.y);
  expect(out.progress).toEqual(src.progress);
 });
 it('is deterministic for identical input and works on both sides',()=>{
  for(const id of ['hook-left','hook-right'] as const) {
   const frame=sampleHook(id,.62);
   expect(correctMotionLive(ANALYTIC_NEURAL_MODEL,frame)).toEqual(correctMotionLive(ANALYTIC_NEURAL_MODEL,frame));
  }
 });
 it('stops on invalid neural input rather than silently disabling the required model',()=>{
  expect(()=>neuralInfer(ANALYTIC_NEURAL_MODEL,[NaN,0,0,0,0])).toThrow();
 });
});
