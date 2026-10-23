import {Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {ACESFilmicToneMapping,PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {Fighter} from './Fighter';
import type {RigReport} from '../adapters/threeRig';
import type {Technique} from '../core/motion';
import './style.css';
function Lighting(){const {scene,gl}=useThree();useEffect(()=>{const pmrem=new PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room).texture;scene.environment=env;scene.environmentIntensity=.7;gl.toneMapping=ACESFilmicToneMapping;return()=>{scene.environment=null;env.dispose();pmrem.dispose();room.dispose();};},[scene,gl]);return <><ambientLight intensity={.7}/><hemisphereLight args={['#e1f4ff','#1a2633',1.3]}/><directionalLight position={[2,4,3]} intensity={2.5} castShadow/><directionalLight position={[-2,2,-3]} intensity={1.5} color="#bbd2e9"/><mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.03,0]}><planeGeometry args={[12,12]}/><meshStandardMaterial color="#182332" roughness={.85}/></mesh></>;}
function Viewer({actor,outfit,technique,progress,skeleton,onReport}:{actor:'mma-kadir'|'mma-amara';outfit:string;technique:Technique;progress:number;skeleton:boolean;onReport:(r:RigReport)=>void}){
 return <div className="viewer"><Canvas shadows camera={{position:[0,1.55,3.2],fov:35}} dpr={[1,1.7]}><color attach="background" args={['#0d1522']}/><Lighting/><gridHelper args={[6,12,'#283c51','#1c2c3d']}/><Suspense fallback={null}><Fighter actor={actor} outfit={outfit} technique={technique} progress={progress} skeleton={skeleton} onReport={onReport}/></Suspense><OrbitControls target={[0,1.0,0]} minDistance={1.25} maxDistance={7}/></Canvas><span className="viewHint">Glisser pour tourner · Pincer pour zoomer</span></div>;
}
const actors=[{id:'mma-kadir',name:'Kadir — Homme'},{id:'mma-amara',name:'Amara — Femme'}] as const;
const disciplines=[['boxe','Boxe anglaise'],['kickboxing','Kick-boxing'],['mma','MMA'],['muaythai','Muay-thaï'],['bjj','BJJ'],['judo','Judo']] as const;
export function App(){
 const [actor,setActor]=useState<'mma-kadir'|'mma-amara'>('mma-kadir'),[discipline,setDiscipline]=useState('boxe'),[technique,setTechnique]=useState<Technique>('hook-left'),[progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.5),[skeleton,setSkeleton]=useState(false),[report,setReport]=useState<RigReport|null>(null);
 const onReport=useCallback((r:RigReport)=>setReport(r),[]);
 const last=useRef<number|null>(null);
 useEffect(()=>{if(!playing){last.current=null;return;}let id=0;const tick=(now:number)=>{if(last.current!==null){const dt=Math.min((now-last.current)/1000,.05);setProgress(p=>(p+dt*speed/.85)%1);}last.current=now;id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(id);last.current=null;};},[playing,speed]);
 return <main className="app">
  <header><span className="eyebrow">COMBAT MOTION ENGINE · 0.1</span><h1>CME-3D <span>Motion Lab</span></h1><p>Première expérimentation indépendante · Modèles originaux de Kadir et Amara</p></header>
  <section className="layout"><aside className="panel">
   <h2>Combattant</h2>
   <label>Personnage<select value={actor} onChange={e=>{setActor(e.target.value as typeof actor);setReport(null);}}>{actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
   <label>Discipline et tenue<select value={discipline} onChange={e=>setDiscipline(e.target.value)}>{disciplines.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <h2>Mouvement</h2>
   <label>Technique<select value={technique} onChange={e=>{setTechnique(e.target.value as Technique);setProgress(0);}}><option value="hook-left">Crochet gauche</option><option value="hook-right">Crochet droit</option></select></label>
   <div className="notice">{discipline==='boxe'?'Premières trajectoires expérimentales. Validation martiale à réaliser.':'Tenue disponible, mais cette discipline ne dispose pas encore de ses animations dédiées : démonstration du crochet de boxe.'}</div>
   <label className="check"><input type="checkbox" checked={skeleton} onChange={e=>setSkeleton(e.target.checked)}/>Afficher le squelette</label>
   <h2>Lecture</h2><div className="buttons"><button onClick={()=>setPlaying(v=>!v)}>{playing?'⏸ Pause':'▶ Lecture'}</button><button onClick={()=>{setPlaying(false);setProgress(0);}}>↺ Début</button></div>
   <input aria-label="Position de lecture" type="range" min="0" max="1000" value={Math.round(progress*1000)} onChange={e=>{setPlaying(false);setProgress(Number(e.target.value)/1000);}}/>
   <p>{Math.round(progress*100)} %</p><label>Vitesse<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.25}>0,25 ×</option><option value={.5}>0,5 ×</option><option value={1}>1 ×</option></select></label>
   <div className="notice">IA locale : correcteur neuronal intégré à chaque image, entraîné sur données synthétiques uniquement. <strong>Non validé biomécaniquement.</strong> Pas de modèle distant ni de cloud.</div>
  </aside>
  <div className="stage"><div className="stageTop"><strong>{actor==='mma-kadir'?'Kadir':'Amara'}</strong><span>{technique==='hook-left'?'Crochet gauche':'Crochet droit'}</span></div><Viewer actor={actor} outfit={discipline} technique={technique} progress={progress} skeleton={skeleton} onReport={onReport}/><p className="note">Rendu original photo-texturé amélioré par éclairage physique. Les shaders avancés et les nouveaux visages réalistes restent à développer.</p></div></section>
  <section className="panel diagnostics"><h2>Contrôle des articulations</h2><div className="stats"><div>Os reconnus<strong>{report?.bones??'—'}</strong></div><div>Bras IK<strong>{report?(report.leftArm&&report.rightArm?'2/2':'Incomplet'):'—'}</strong></div><div>Jambes IK<strong>{report?(report.leftLeg&&report.rightLeg?'2/2':'Incomplet'):'—'}</strong></div><div>Erreurs bras<strong>{report?.armClamps??'—'}</strong></div><div>Erreur appuis<strong>{report?(report.footErrorMetres*100).toFixed(1)+' cm':'—'}</strong></div></div></section>
  <footer>Prototype de recherche, indépendant de Shadow. Ni simulation physique complète ni résultat artistique final.</footer>
 </main>;
}
