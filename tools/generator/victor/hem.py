# fill the light band of skin around the shorts with nearby skin colour (3D neighbourhood)
import numpy as np,sys
from PIL import Image
from scipy.spatial import cKDTree
geo,tex,out=sys.argv[1:4]
g=np.load(geo); P,T,UV,M=g['P'],g['tris'],g['uvs'],g['mat']
A=np.asarray(Image.open(tex).convert('RGB')).astype(np.float32)/255; H,W,_=A.shape
PM=np.zeros((H,W,3),np.float32); VM=np.zeros((H,W),bool)
for t in np.where(M==0)[0]:
  uv=UV[t]*[W,H]; uv[:,1]=H-uv[:,1]
  x0,y0=np.maximum(np.floor(uv.min(0)).astype(int),0); x1,y1=np.minimum(np.ceil(uv.max(0)).astype(int),[W-1,H-1])
  if x1<x0 or y1<y0: continue
  xs,ys=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5); a,b,c=uv
  den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(den)<1e-9: continue
  l1=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/den; l2=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/den; l3=1-l1-l2
  ins=(l1>=-.03)&(l2>=-.03)&(l3>=-.03); vi=T[t]; sl=(slice(y0,y1+1),slice(x0,x1+1))
  PM[sl][ins]=(l1[...,None]*P[vi[0]]+l2[...,None]*P[vi[1]]+l3[...,None]*P[vi[2]])[ins]; VM[sl][ins]=True
L=A@[.3,.59,.11]; sh=VM&(L<0.13)
tr=cKDTree(PM[sh]); idx=np.where(VM&~sh); d,_=tr.query(PM[idx],k=1)
D=np.full((H,W),9.0,np.float32); D[idx]=d
ring=VM&~sh&(D<0.022); good=VM&~sh&(D>0.028)&(D<0.09)
gt=cKDTree(PM[good]); gc=A[good]
ri=np.where(ring); _,nn=gt.query(PM[ri],k=48)
fill=gc[nn].mean(1)
# keep a little of the original detail (high-pass)
from PIL import ImageFilter
bl=np.asarray(Image.fromarray((A*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
hp=(A-bl)[ri]*0.6
O=A.copy(); a_=np.clip((0.022-D[ri])/0.006,0,1)[:,None]  # soft edge toward the good skin
O[ri]=(fill+hp)*a_+A[ri]*(1-a_)
Image.fromarray((np.clip(O,0,1)*255).astype(np.uint8)).save(out,quality=92)
print('ring texels',len(ri[0]),'shorts',int(sh.sum()))
