# usage: blender-python look.py -- photo.glb mode(export|render) workdir [headtex bodytex tenue]
import bpy,sys,math,numpy as np
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:]; glb,mode,W=a[0],a[1],a[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
if mode=='render' and len(a)>5 and a[5]!='-': bpy.ops.import_scene.gltf(filepath=a[5])
ob=[o for o in bpy.context.scene.objects if o.type=='MESH' and 'hipoly' in o.name][0]
me=ob.data; mw=ob.matrix_world
assert mw==mw.__class__.Identity(4) or True
N=len(me.vertices)
P=np.array([tuple(mw@v.co) for v in me.vertices])
gi={g.name:g.index for g in ob.vertex_groups}
hw=np.zeros(N)
for v in me.vertices:
  for g in v.groups:
    n=ob.vertex_groups[g.group].name
    if n=='Head' or n.startswith('Face_') or n in('LeftEye','RightEye'): hw[v.index]+=g.weight
hw=np.clip(hw,0,1)
EZ=1.686; S=1364.0
# Kadir front silhouette (front half of the head)
front=(hw>0.5)&(P[:,1]<-0.02)
midc=(np.abs(P[:,0])<0.006)&(hw>0.5)&(P[:,1]<-0.08)
zc=P[midc][:,2].min(); zm=1.6134
def sil(z):
  s=front&(np.abs(P[:,2]-z)<0.004); return P[s,0].max() if s.any() else 0.0
zc2=EZ-0.1298; zm2=EZ-0.0696
ph=[(0,.0652),(.30,.0623),(.61,.0543),(.85,.0315)]
src=[];dst=[]
for t,hx in ph:
  zk=zm+t*(zc-zm); kx=sil(zk); zt=zm2+t*(zc2-zm2)
  for sg in(1,-1): src.append((sg*kx,zk)); dst.append((sg*hx,zt))
src.append((0,zc)); dst.append((0,zc2))
for sg in(1,-1):
  src.append((sg*.0254,zm)); dst.append((sg*.0275,zm2))
  src.append((sg*.0319,EZ)); dst.append((sg*.0319,EZ))
  src.append((sg*.080,1.74)); dst.append((sg*.080,1.74))
  src.append((sg*.090,1.68)); dst.append((sg*.090,1.68))
  src.append((sg*.055,1.52)); dst.append((sg*.055,1.52))
src+= [(0,1.80),(0,1.648),(0,1.50)]; dst+=[(0,1.80),(0,1.648),(0,1.50)]
src=np.array(src);dst=np.array(dst)
print('chin kadir',round(zc,4),'target',round(zc2,4))
def U(r): return np.where(r>0,r*r*np.log(r+1e-12),0)
n=len(src); K=U(np.linalg.norm(src[:,None]-src[None],axis=-1)); Pm=np.hstack([np.ones((n,1)),src])
L=np.zeros((n+3,n+3)); L[:n,:n]=K+1e-6*np.eye(n); L[:n,n:]=Pm; L[n:,:n]=Pm.T
Y=np.zeros((n+3,2)); Y[:n]=dst-src; coef=np.linalg.solve(L,Y)
q=P[:,[0,2]]; Kq=U(np.linalg.norm(q[:,None]-src[None],axis=-1))
disp=Kq@coef[:n]+np.hstack([np.ones((N,1)),q])@coef[n:]
fade=np.clip((P[:,2]-1.50)/0.05,0,1)*hw
d3=np.zeros((N,3)); d3[:,0]=disp[:,0]*fade; d3[:,2]=disp[:,1]*fade
# hair volume: scalp outward a little (top/sides above the brow, back of head)
nrm=np.array([tuple((mw.to_3x3()@v.normal).normalized()) for v in me.vertices])
scalp=np.clip((P[:,2]-1.725)/0.03,0,1)*hw*(P[:,1]>-0.11)
d3+=nrm*(0.007*scalp)[:,None]
# hair volume like the photos: thickness where the head texture is hair (grey, low saturation), more on top and at the front (side-part quiff)
import os
if os.environ.get('HAIRVOL','1')=='1' and len(a)>3 and a[3]!='-':
  _im=bpy.data.images.load(a[3]); tw_,th=_im.size; _px=np.zeros(tw_*th*4,np.float32); _im.pixels.foreach_get(_px)
  ht=_px.reshape(th,tw_,4)[::-1,:,:3]   # blender pixels start bottom-left; flip to top-left rows
  ht=np.where(ht<=0.0031308,ht*12.92,1.055*np.power(np.clip(ht,0,1),1/2.4)-0.055) if _im.colorspace_settings.name!='sRGB' else ht
  uvl=me.uv_layers.active.data; vuv=np.zeros((N,2)); cnt=np.zeros(N)
  for poly in me.polygons:
    if poly.material_index!=1: continue
    for li in poly.loop_indices:
      vi=me.loops[li].vertex_index; vuv[vi]+=uvl[li].uv; cnt[vi]+=1
  hasuv=cnt>0; vuv[hasuv]/=cnt[hasuv,None]
  px=np.clip((vuv[:,0]*tw_).astype(int),0,tw_-1); py=np.clip(((1-vuv[:,1])*th).astype(int),0,th-1)
  c=ht[py,px]; sat=c.max(-1)-c.min(-1); warm=c[:,0]-c[:,2]
  hair=(np.clip((0.10-sat)/0.05,0,1)*np.clip((0.07-warm)/0.05,0,1)*hasuv*(P[:,2]>1.66)).astype(float)
  # smooth over mesh neighbours
  E=np.array([tuple(e.vertices) for e in me.edges])
  for _ in range(6):
    acc=np.zeros(N); n_=np.zeros(N); np.add.at(acc,E[:,0],hair[E[:,1]]); np.add.at(acc,E[:,1],hair[E[:,0]]); np.add.at(n_,E[:,0],1); np.add.at(n_,E[:,1],1)
    hair=(hair+acc)/(1+n_)
  Pz=P[:,2]; Py=P[:,1]
  thick=0.005+0.008*np.clip((Pz-1.70)/0.07,0,1)+0.007*np.clip((-Py-0.04)/0.05,0,1)*np.clip((Pz-1.755)/0.02,0,1)
  thick*=1-0.2*np.clip((np.abs(P[:,0])-0.06)/0.02,0,1)*np.clip((1.74-Pz)/0.04,0,1)   # thinner on the sides above the ears
  d3+=nrm*(thick*np.clip(hair*1.6,0,1)*hw)[:,None]
  print('hair volume max mm',round(float((thick*hair).max()*1000),1))
# profile warp (y,z) from the hi-res left profile: forehead, brow, lips and chin a little more forward
P1=P+d3
def midy(z):
  s_=(np.abs(P1[:,0])<0.008)&(hw>0.5)&(np.abs(P1[:,2]-z)<0.003)&(P1[:,1]<-0.05); return P1[s_,1].min()
tg=[(1.728,-0.134),(1.697,-0.131),(1.610,-0.139),(1.572,-0.134)]
src2=[(midy(z),z) for z,_ in tg]; dst2=[(y,z) for z,y in tg]
for q in [(-0.1529,1.648),(0.10,1.70),(0.0,1.81),(0.05,1.55),(-0.06,1.53),(0.0,1.62)]:
  src2.append(q); dst2.append(q)
src2=np.array(src2);dst2=np.array(dst2); print('profile src',src2[:4].round(4))
n2=len(src2); K2=U(np.linalg.norm(src2[:,None]-src2[None],axis=-1)); Pm2=np.hstack([np.ones((n2,1)),src2])
L2=np.zeros((n2+3,n2+3)); L2[:n2,:n2]=K2+1e-6*np.eye(n2); L2[:n2,n2:]=Pm2; L2[n2:,:n2]=Pm2.T
Y2=np.zeros((n2+3,2)); Y2[:n2]=dst2-src2; c2=np.linalg.solve(L2,Y2)
q2=P1[:,[1,2]]; d2=U(np.linalg.norm(q2[:,None]-src2[None],axis=-1))@c2[:n2]+np.hstack([np.ones((N,1)),q2])@c2[n2:]
wx=np.clip(1-np.abs(P1[:,0])/0.075,0,1)*fade
d3[:,1]+=d2[:,0]*wx; d3[:,2]+=d2[:,1]*wx
# ---- carrure like the photo sheet (rest pose, radial scale around bone segments)
import os
if os.environ.get('CARRURE','1')=='1':
  _arm=[o for o in bpy.context.scene.objects if o.type=='ARMATURE'][0]
  BW={}
  for v in me.vertices:
    for g in v.groups:
      BW.setdefault(ob.vertex_groups[g.group].name,np.zeros(N))[v.index]=g.weight
  def seg(b):
    bb=_arm.data.bones[b]; return np.array(_arm.matrix_world@bb.head_local),np.array(_arm.matrix_world@bb.tail_local)
  def radial(b,fn):
    if b not in BW: return
    h,t=seg(b); ax=t-h; L2=(ax@ax); tt=np.clip(((P-h)@ax)/L2,0,1); c=h+tt[:,None]*ax; r=P-c
    d3[:]+=BW[b][:,None]*(fn(tt)-1)[:,None]*r*(1-hw)[:,None]
  sm=lambda x0,x1,x:np.clip((x-x0)/(x1-x0),0,1)
  for sd in('Left','Right'):
    radial(sd+'ForeArm',lambda t:1.08+0.06*t)
    radial(sd+'Hand',lambda t:1.05+0*t)
    radial(sd+'Leg',lambda t:1+0.07*(1-sm(0,.12,t))+0.16*np.exp(-((t-.32)/.17)**2))
    radial(sd+'Arm',lambda t:0.94+0*t)
  # lower trunk a bit wider (waist, hips) - x only
  wt=sum(BW.get(b,np.zeros(N)) for b in('Hips','Spine'))*(1-hw)
  d3[:,0]+=np.clip(wt,0,1)*P[:,0]*0.05
  # heavier trapezius: lift the neck-shoulder slope
  ax_=np.abs(P[:,0]); bump=np.exp(-((P[:,2]-1.50)/0.045)**2)*sm(0.035,0.07,ax_)*(1-sm(0.14,0.19,ax_))*(1-hw)*(P[:,1]>-0.02)
  d3[:,2]+=bump*0.014
  hs=float(os.environ.get('HEADSCALE','0.95')); piv=np.array([0,-0.02,1.555])
  hwh=np.clip((P[:,2]-1.50)/0.06,0,1)
  d3[:]+=(hs-1)*(P+d3-piv)*hwh[:,None]
  print('carrure applied')
print('max disp mm',np.abs(d3).max()*1000)
inv=np.array(mw.inverted().to_3x3())
dl=d3@inv.T
if me.shape_keys:
  for kb in me.shape_keys.key_blocks:
    co=np.zeros(N*3); kb.data.foreach_get('co',co); co=co.reshape(-1,3)+dl; kb.data.foreach_set('co',co.ravel())
else:
  co=np.zeros(N*3); me.vertices.foreach_get('co',co); me.vertices.foreach_set('co',(co.reshape(-1,3)+dl).ravel())
me.update()
P2=P+d3
if mode=='glbexport':
  # Victor trial model: rest pose, deformed mesh + shape keys, eye bones moved with the head, new textures
  arm0=[o for o in bpy.context.scene.objects if o.type=='ARMATURE'][0]
  out_glb=a[5]
  me.update(); _nn=np.array([tuple((mw.to_3x3()@v.normal).normalized()) for v in me.vertices])
  np.savez(out_glb+'.disp.npz',P=P,d3=d3,N=_nn)
  def swap0(prefix,path):
    new=bpy.data.images.load(path); new.pack()
    for m in bpy.data.materials:
      if m.node_tree:
        for nd in m.node_tree.nodes:
          if nd.type=='TEX_IMAGE' and nd.image and nd.image.name.startswith(prefix): nd.image=new
  swap0('m021_head_color',a[3]); swap0('m021_body_color',a[4])
  # move eye bones like the eye vertices (mean displacement of the vertices weighted to each eye)
  shifts={}
  for b in ('LeftEye','RightEye'):
    if b in gi:
      w=np.zeros(N)
      for v in me.vertices:
        for g in v.groups:
          if g.group==gi[b]: w[v.index]=g.weight
      if w.sum()>0: shifts[b]=(d3*w[:,None]).sum(0)/w.sum()
  bpy.context.view_layer.objects.active=arm0; bpy.ops.object.mode_set(mode='EDIT')
  inv0=arm0.matrix_world.inverted().to_3x3()
  for b,sv in shifts.items():
    eb=arm0.data.edit_bones[b]; dv=inv0@Vector(tuple(sv)); eb.head+=dv; eb.tail+=dv
    print('eye bone',b,'moved mm',np.round(np.array(sv)*1000,1))
  bpy.ops.object.mode_set(mode='OBJECT')
  bpy.ops.export_scene.gltf(filepath=out_glb,export_format='GLB',export_skins=True,export_morph=True,export_yup=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=90)
  print('wrote',out_glb); sys.exit(0)
# ---- pose the arms like the photo (front view: shoulder -> wrist direction)
arm=[o for o in bpy.context.scene.objects if o.type=='ARMATURE'][0]
bpy.context.view_layer.objects.active=arm
print([b.name for b in arm.data.bones][:60])
from mathutils import Matrix
def aim(upper,hand,target_dir):
  pb=arm.pose.bones[upper]; bpy.context.view_layer.update()
  h=arm.matrix_world@pb.head; w=arm.matrix_world@arm.pose.bones[hand].head
  cur=(w-h).normalized(); R=cur.rotation_difference(Vector(target_dir).normalized()).to_matrix().to_4x4()
  M=arm.matrix_world.inverted()@Matrix.Translation(h)@R@Matrix.Translation(-h)@arm.matrix_world
  pb.matrix=M@pb.matrix; bpy.context.view_layer.update()
aim('LeftArm','LeftHand',(88/780,0.0,-435/780))
aim('RightArm','RightHand',(-90/780,0.0,-435/780))
if os.environ.get('STANCE','1')=='1':
  aim('RightUpLeg','RightFoot',(-75/575,0.0,-1)); aim('LeftUpLeg','LeftFoot',(65/575,0.0,-1))
dg=bpy.context.evaluated_depsgraph_get(); ev=ob.evaluated_get(dg); em=ev.to_mesh()
PP=np.array([tuple(ev.matrix_world@v.co) for v in em.vertices]); NN=np.array([tuple((ev.matrix_world.to_3x3()@v.normal).normalized()) for v in em.vertices])
J={b.name:tuple(arm.matrix_world@arm.pose.bones[b.name].head) for b in arm.data.bones}
if mode=='bodyexport':
  em.calc_loop_triangles(); uv=em.uv_layers.active.data
  tris=[];uvs=[];mat=[]
  for lt in em.loop_triangles:
    tris.append(lt.vertices[:]); uvs.append([tuple(uv[l].uv) for l in lt.loops]); mat.append(lt.material_index)
  import json
  np.savez(W+'/bgeo.npz',P=PP,N=NN,tris=np.array(tris),uvs=np.array(uvs),mat=np.array(mat))
  json.dump(J,open(W+'/joints.json','w')); print('body exported',len(tris)); sys.exit(0)
ev.to_mesh_clear()

if mode=='export':
  me.calc_loop_triangles() if hasattr(me,'calc_loop_triangles') else None
  uv=me.uv_layers.active.data
  tris=[];uvs=[];mat=[]
  for lt in me.loop_triangles:
    tris.append(lt.vertices[:]); uvs.append([tuple(uv[l].uv) for l in lt.loops]); mat.append(lt.material_index)
  nr=np.array([tuple((mw.to_3x3()@v.normal).normalized()) for v in me.vertices])
  np.savez(W+'/geo.npz',P=P2,N=nr,tris=np.array(tris),uvs=np.array(uvs),mat=np.array(mat),hw=hw)
  print('exported',len(tris)); sys.exit(0)
# render
headimg,bodyimg=a[3],a[4]
if me.shape_keys and 'AK_27_MouthClose' in me.shape_keys.key_blocks: me.shape_keys.key_blocks['AK_27_MouthClose'].value=float(os.environ.get('MOUTHCLOSE','0.22'))
def swap(prefix,path):
  if path=='-': return
  new=bpy.data.images.load(path)
  for m in bpy.data.materials:
    if m.node_tree:
      for nd in m.node_tree.nodes:
        if nd.type=='TEX_IMAGE' and nd.image and nd.image.name.startswith(prefix): nd.image=new
swap('m021_head_color',headimg); swap('m021_body_color',bodyimg)
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=48;sc.cycles.device='CPU'
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;bg=w.node_tree.nodes['Background'];bg.inputs[0].default_value=(.45,.45,.47,1);bg.inputs[1].default_value=.6
for loc,en in [((2.5,-3.5,3.2),700),((-3,-2,2.4),250),((0,4,3),400)]:
  Lg=bpy.data.lights.new('l','AREA');Lg.energy=en;Lg.size=2.5;lo=bpy.data.objects.new('l',Lg);sc.collection.objects.link(lo);lo.location=loc
  lo.rotation_euler=(Vector((0,0,1.2))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.cameras.new('c');co_=bpy.data.objects.new('c',cam);sc.collection.objects.link(co_);sc.camera=co_
tag=a[6] if len(a)>6 else 'x'
def shoot(name,az,tz,dist,lens,rx,ry):
  sc.render.resolution_x=rx;sc.render.resolution_y=ry
  cam.lens=lens;t=Vector((0,0,tz));r=math.radians(az)
  co_.location=t+Vector((math.sin(r)*dist,-math.cos(r)*dist,0.02))
  co_.rotation_euler=(t-co_.location).to_track_quat('-Z','Y').to_euler()
  sc.render.filepath=f'{W}/{tag}_{name}.png';bpy.ops.render.render(write_still=True)
if mode!='renderbody':
  shoot('face',0,1.68,0.75,70,800,900)
  shoot('face34',-35,1.68,0.75,70,800,900)
  shoot('profil',-80,1.68,0.75,70,800,900)
  shoot('dos',180,1.68,0.75,70,800,900)
if len(a)>5 and a[5]!='-' or mode=='renderbody':
  shoot('full',0,0.95,3.3,50,700,1300); shoot('full34',-35,0.95,3.3,50,700,1300); shoot('fulldos',180,0.95,3.3,50,700,1300)
