import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { FIGHTER_PILOT_150, photoMaterial, skinLookFor } from '../photoMaterials';

describe('1.51.0 pilot for Kadir Naël and Inaya', () => {
  for (const id of ['mma-kadir', 'nael', 'inaya'] as const) {
    test(id + ' high quality gains controlled optical finish', () => {
      const look=skinLookFor('/coaches/'+id+'/photo.glb');
      const pilot=FIGHTER_PILOT_150[id]!;
      expect(pilot).toBeDefined();
      const head=new MeshStandardMaterial(); head.name='m021_head';
      const body=new MeshStandardMaterial(); body.name='m021_body';
      const eye=new MeshStandardMaterial(); eye.name='Eyes_opacity';
      const hair=new MeshStandardMaterial({roughness:0.7}); hair.name='Hair_opacity';
      const h=photoMaterial(head,'peau','haute',look) as MeshPhysicalMaterial;
      const b=photoMaterial(body,'peau','haute',look) as MeshPhysicalMaterial;
      const e=photoMaterial(eye,'yeux','haute',look) as MeshPhysicalMaterial;
      const t=photoMaterial(hair,'cheveux','haute',look);
      expect(h.sheen).toBe(pilot.faceSheen);
      expect(b.sheen).toBe(pilot.bodySheen);
      expect(h.specularIntensity).toBe(pilot.faceSpecular);
      expect(b.specularIntensity).toBe(pilot.bodySpecular);
      expect(e.roughness).toBe(pilot.eyeRoughness);
      expect(t.roughness).toBeCloseTo(Math.max(0.48,0.7*pilot.hairScale));
      expect(h.userData.cssFighterPilot150).toBe(true);
      expect(b.userData.cssFighterPilot150).toBe(true);
      expect(h.userData.cssNeckToneApplied).toBeUndefined();
      const low=photoMaterial(head,'peau','basse',look);
      expect(low.userData.cssFighterPilot150).toBeUndefined();
      for (const m of [head,body,eye,hair,h,b,e,t,low])m.dispose();
    });
  }
  test('Amara and Victor retain the previous established pilot profiles',()=>{
    expect(FIGHTER_PILOT_150['mma-amara']?.faceSpecular).toBe(0.33);
    expect(FIGHTER_PILOT_150.victor?.faceSpecular).toBe(0.31);
  });
});
