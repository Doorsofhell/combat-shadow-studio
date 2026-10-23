import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {SkeletonHelper,type Object3D} from 'three';
import {ThreeRigAdapter,type RigReport} from '../adapters/threeRig';
import {attachOutfit,enhanceHumanMaterial} from '../adapters/outfits';
import {sampleHook,type Technique} from '../core/motion';
import {correctMotionLive,ANALYTIC_NEURAL_MODEL} from '../core/neural';
export function Fighter({actor,outfit,technique,progress,skeleton,onReport}:{
 actor:'mma-kadir'|'mma-amara';outfit:string;technique:Technique;progress:number;skeleton:boolean;onReport:(r:RigReport)=>void;
}){
 const gltf=useGLTF('/fighters/'+actor+'/photo.glb','/draco/');
 const clothes=useGLTF('/fighters/'+actor+'/tenues/'+outfit+'.glb','/draco/');
 const scene=useMemo(()=>{const s=clone(gltf.scene) as Object3D;enhanceHumanMaterial(s);attachOutfit(s,clothes.scene);return s;},[gltf.scene,clothes.scene]);
 const adapter=useMemo(()=>new ThreeRigAdapter(scene),[scene]);
 const helper=useMemo(()=>new SkeletonHelper(scene),[scene]);
 const elapsed=useRef(0);
 useEffect(()=>{onReport(adapter.describe());},[adapter,onReport]);
 useFrame((_,dt)=>{
  const raw=sampleHook(technique,progress);
  // Dedicated local neural inference runs synchronously DURING every animation frame.
  const corrected=correctMotionLive(ANALYTIC_NEURAL_MODEL,raw);
  const report=adapter.apply(corrected);
  elapsed.current+=dt;if(elapsed.current>.35){onReport(report);elapsed.current=0;}
  helper.updateMatrixWorld(true);
 });
 return <group><primitive object={scene}/>{skeleton&&<primitive object={helper}/>}</group>;
}
