import numpy as np,sys,json
from PIL import Image
geo,joints,base,photo,out,headbase,headout=sys.argv[1:8]
g=np.load(geo); P,Nr,T,UV,M=g['P'],g['N'],g['tris'],g['uvs'],g['mat']
J={k:np.array(v) for k,v in json.load(open(joints)).items()}
B=np.asarray(Image.open(base).convert('RGB')).astype(np.float32)/255; H,W,_=B.shape
PH=np.asarray(Image.open(photo).convert('RGB')).astype(np.float32)/255
def U(r): return np.where(r>0,r*r*np.log(r+1e-12),0)
def tps(src,dst):
  n=len(src); K=U(np.linalg.norm(src[:,None]-src[None],axis=-1)); Pm=np.hstack([np.ones((n,1)),src])
  L=np.zeros((n+3,n+3)); L[:n,:n]=K+1e-8*np.eye(n); L[:n,n:]=Pm; L[n:,:n]=Pm.T
  Y=np.zeros((n+3,2)); Y[:n]=dst; c=np.linalg.solve(L,Y)
  def f(q):
    sh=q.shape[:-1]; q=q.reshape(-1,2); r=U(np.linalg.norm(q[:,None]-src[None],axis=-1))@c[:n]+np.hstack([np.ones((len(q),1)),q])@c[n:]
    return r.reshape(sh+(2,))
  return f
top=np.array([0,0,1.809]); chin=np.array([0,-0.1,1.556])
def pairs(view):
  if view=='front':
    L=[(top,(330,55)),(chin,(330,255)),(J['Neck'],(330,300)),(J['RightArm'],(165,355)),(J['LeftArm'],(495,355)),(J['RightForeArm'],(95,560)),(J['LeftForeArm'],(565,560)),
       (J['RightHand'],(75,790)),(J['LeftHand'],(583,790)),(J['Hips'],(330,815)),(J['RightUpLeg'],(265,820)),(J['LeftUpLeg'],(395,820)),(J['RightLeg'],(250,1067)),(J['LeftLeg'],(417,1067)),(J['RightFoot'],(190,1395)),(J['LeftFoot'],(460,1395))]
  else:
    L=[(top,(1407,58)),(J['Neck'],(1407,300)),(J['LeftArm'],(1253,358)),(J['RightArm'],(1562,358)),(J['LeftForeArm'],(1187,575)),(J['RightForeArm'],(1628,575)),(J['LeftHand'],(1162,758)),(J['RightHand'],(1653,758)),
       (J['Hips'],(1407,815)),(J['LeftUpLeg'],(1340,820)),(J['RightUpLeg'],(1475,820)),(J['LeftLeg'],(1295,1067)),(J['RightLeg'],(1520,1067)),(J['LeftFoot'],(1278,1400)),(J['RightFoot'],(1545,1400))]
  src=np.array([[p[0],p[2]] for p,_ in L]); dst=np.array([d for _,d in L],float); return tps(src,dst)
def pairs_side(view):
  nose=np.array([0,-0.153,1.648]); tp=np.array([0,0.0,1.809])
  if view=='right':
    L=[(tp,(1000,58)),(nose,(1138,251)),(J['RightArm'],(990,385)),(J['RightForeArm'],(1016,618)),(J['RightHand'],(1062,800)),(J['RightUpLeg'],(1012,825)),(J['RightLeg'],(1016,1055)),(J['RightFoot'],(1025,1400))]
  else:
    L=[(tp,(1820,58)),(nose,(1685,251)),(J['LeftArm'],(1816,385)),(J['LeftForeArm'],(1798,618)),(J['LeftHand'],(1744,800)),(J['LeftUpLeg'],(1802,825)),(J['LeftLeg'],(1807,1055)),(J['LeftFoot'],(1798,1400))]
  src=np.array([[p[1],p[2]] for p,_ in L]); dst=np.array([d for _,d in L],float); return tps(src,dst)
def zbuf(f,depth,scale=0.5,ax=(0,2)):
  ZB=np.full((int(PH.shape[0]*scale)+1,int(PH.shape[1]*scale)+1),np.inf,np.float32)
  Q=f(P[:,list(ax)])*scale; Dd=depth(P)
  for t in range(len(T)):
    vi=T[t]; q=Q[vi]; d=Dd[vi]
    x0,y0=int(max(np.floor(q[:,0].min()),0)),int(max(np.floor(q[:,1].min()),0)); x1,y1=int(min(np.ceil(q[:,0].max()),ZB.shape[1]-1)),int(min(np.ceil(q[:,1].max()),ZB.shape[0]-1))
    if x1<x0 or y1<y0: continue
    xs,ys=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
    a,b,c=q; den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(den)<1e-12: continue
    l1=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/den; l2=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/den; l3=1-l1-l2
    ins=(l1>=0)&(l2>=0)&(l3>=0)
    if not ins.any(): continue
    dd=l1*d[0]+l2*d[1]+l3*d[2]; sub=ZB[y0:y1+1,x0:x1+1]; sub[ins]=np.minimum(sub[ins],dd[ins])
  return lambda px,py:ZB[np.clip((py*scale).astype(int),0,ZB.shape[0]-1),np.clip((px*scale).astype(int),0,ZB.shape[1]-1)]
def sample(img,px,py):
  h,w,_=img.shape; ix=np.clip(px.astype(int),0,w-2); iy=np.clip(py.astype(int),0,h-2); fx=np.clip(px-ix,0,1)[:,None]; fy=np.clip(py-iy,0,1)[:,None]
  return (img[iy,ix]*(1-fx)+img[iy,ix+1]*fx)*(1-fy)+(img[iy+1,ix]*(1-fx)+img[iy+1,ix+1]*fx)*fy
def run(B,matid,zmax,out,tint):
 H,W,_=B.shape
 PM=np.zeros((H,W,3),np.float32); NM=np.zeros((H,W,3),np.float32); VM=np.zeros((H,W),bool)
 for t in np.where(M==matid)[0]:
   uv=UV[t]*[W,H]; uv[:,1]=H-uv[:,1]
   x0,y0=np.floor(uv.min(0)).astype(int); x1,y1=np.ceil(uv.max(0)).astype(int)
   x0=max(x0,0);y0=max(y0,0);x1=min(x1,W-1);y1=min(y1,H-1)
   if x1<x0 or y1<y0: continue
   xs,ys=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
   a,b,c=uv; den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
   if abs(den)<1e-9: continue
   l1=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/den; l2=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/den; l3=1-l1-l2
   ins=(l1>=-.02)&(l2>=-.02)&(l3>=-.02)
   if not ins.any(): continue
   vi=T[t]; sl=(slice(y0,y1+1),slice(x0,x1+1))
   PM[sl][ins]=(l1[...,None]*P[vi[0]]+l2[...,None]*P[vi[1]]+l3[...,None]*P[vi[2]])[ins]
   NM[sl][ins]=(l1[...,None]*Nr[vi[0]]+l2[...,None]*Nr[vi[1]]+l3[...,None]*Nr[vi[2]])[ins]; VM[sl][ins]=True
 NM/=np.linalg.norm(NM,axis=-1,keepdims=True)+1e-9
 VM&=PM[...,2]<zmax
 idx=np.where(VM); p=PM[idx]; n=NM[idx]
 print('body texels',len(p))

 bg=PH[20:80,900:1000].reshape(-1,3).mean(0)
 acc=np.zeros((len(p),3)); ws=np.zeros(len(p))
 # photo-space boxer mask, dilated, so hems never leak onto the skin
 Lp=PH@[.3,.59,.11]; satp=PH.max(-1)-PH.min(-1); bm=((Lp<0.22)&(satp<0.08)).astype(np.float32)
 from PIL import ImageFilter
 bm=np.asarray(Image.fromarray((bm*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(25)))>0
 for view,depth,face,xr in [('front',lambda q:q[...,1],-n[:,1],(0,640)),('back',lambda q:-q[...,1],n[:,1],(1125,1715)),('right',lambda q:q[...,0],-n[:,0],(890,1160)),('left',lambda q:-q[...,0],n[:,0],(1665,1950))]:
   ax=(0,2) if view in('front','back') else (1,2)
   f=pairs(view) if ax==(0,2) else pairs_side(view); z=zbuf(f,depth,ax=ax); pp=f(p[:,list(ax)]); px,py=pp[:,0],pp[:,1]
   d=depth(p); ok=(d<=z(px,py)+0.01)&(px>xr[0])&(px<xr[1])&(py>0)&(py<PH.shape[0]-1)
   c=sample(PH,px,py); L=c@[.3,.59,.11]; sat=c.max(-1)-c.min(-1)
   dark=bm[np.clip(py.astype(int),0,PH.shape[0]-1),np.clip(px.astype(int),0,PH.shape[1]-1)]
   isbg=np.abs(c-bg).max(-1)<0.06
   w=(np.clip((face-0.15)/0.35,0,1)*ok*~dark*~isbg*np.clip((zmax-p[:,2])/0.04,0,1))**2
   acc+=c*w[:,None]; ws+=w
 col=np.zeros((H,W,3),np.float32); wt=np.zeros((H,W),np.float32)
 col[idx]=acc/np.maximum(ws,1e-6)[:,None]; wt[idx]=np.clip(ws*1.5,0,1)
 Lb=B@[.3,.59,.11]
 shorts=(Lb<0.14)&VM
 def bl(a):
   pp_=np.pad(a,1); return sum(pp_[1+dy:1+dy+a.shape[0],1+dx:1+dx+a.shape[1]] for dy in(-1,0,1) for dx in(-1,0,1))
 sh=shorts.astype(np.float32)
 for _ in range(8): sh=np.minimum(bl(sh),1.0)
 wt[sh>0]=0; col[sh>0]=0
 mk=(wt>0).astype(np.float32)
 for _ in range(6):
   cs=np.stack([bl(col[...,i]*mk) for i in range(3)],-1); ms=bl(mk); grow=(mk==0)&(ms>0)
   col[grow]=cs[grow]/ms[grow][:,None]; wt[grow]=(bl(wt)/np.maximum(ms,1e-6))[grow]; mk[grow]=1
 # tint the base where no photo reaches toward the photo skin tone
 sk=PH[400:520,250:420].reshape(-1,3).mean(0); bs=B[VM].reshape(-1,3); bsk=bs[(bs@[.3,.59,.11])>0.4].mean(0)
 hi=(wt>0.8)&VM
 gn=col[hi].mean(0)/np.maximum(B[hi].mean(0),1e-3); print('base gain',gn.round(3))
 B2=np.clip(B*gn,0,1) if tint else B
 if tint:
   # fill every body texel the photos missed from its photo neighbours (diffusion), keep base detail as high-pass
   cf=col.copy(); m2=(wt>0.3).astype(np.float32); cf*=m2[...,None]
   small=lambda a:np.array(Image.fromarray(a.astype(np.float32),'F').resize((W//8,H//8),Image.BILINEAR))
   cs=np.stack([small(cf[...,i]) for i in range(3)],-1); ms=small(m2); cs=np.where(ms[...,None]>0.05,cs/np.maximum(ms,1e-6)[...,None],0); ms=(ms>0.05).astype(np.float32)
   for _ in range(60):
     cs2=np.stack([bl(cs[...,i]*ms) for i in range(3)],-1); ms2=bl(ms)
     grow=(ms<=0)&(ms2>0); cs[grow]=cs2[grow]/ms2[grow][:,None]; ms[grow]=1
   cs=cs/np.maximum(ms,1e-6)[...,None]*(ms>0)[...,None] if False else cs
   big=lambda a:np.asarray(Image.fromarray(a.astype(np.float32),'F').resize((W,H),Image.BILINEAR))
   low=np.stack([big(cs[...,i]) for i in range(3)],-1)
   # low-frequency of base
   bsm=np.stack([big(small(B[...,i])) for i in range(3)],-1)
   B2=np.clip(low+(B-bsm)*0.8,0,1)
   B2[shorts]=B[shorts]
 if True:
   # wide feather: erode then blur at 1/4 res so photo patches fade into the fill (no hard rectangles)
   wq=np.array(Image.fromarray(wt.astype(np.float32),'F').resize((W//4,H//4),Image.BILINEAR))
   for _ in range(3): wq=np.minimum(wq,-np.maximum.reduce([-np.roll(wq,s,a) for s in(-1,1) for a in(0,1)]))
   for _ in range(6): wq=bl(wq)/9.0
   wt=np.asarray(Image.fromarray(wq.astype(np.float32),'F').resize((W,H),Image.BILINEAR))*(wt>0)
 else:
   for _ in range(4): wt=np.where(VM|(wt>0),bl(wt)/9.0,wt)
 o=B2*(1-wt[...,None])+col*wt[...,None]
 Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).save(out,quality=92)
 print('coverage',float((wt>0.5).sum()/VM.sum()),'skin',sk.round(3))

run(B,0,1.70,out,True)
HB=np.asarray(Image.open(headbase).convert('RGB')).astype(np.float32)/255
run(HB,1,1.545,headout,False)
