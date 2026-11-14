# final head touch: grey hair without warm cast, no centre seam on forehead/hair
import numpy as np,sys
from PIL import Image
from scipy.spatial import cKDTree
src,zmap,out=sys.argv[1:4]
A=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)/255
Z=np.load(zmap); x,y,z=Z['x'],Z['y'],Z['z']; VM=z>0
sat=A.max(-1)-A.min(-1); L=A@[.3,.59,.11]
hairz=np.clip((z-1.745)/0.012,0,1); hairz=np.maximum(hairz,np.clip((y+0.05)/0.03,0,1)*np.clip((z-1.60)/0.01,0,1))
wh=VM*hairz*np.clip((0.17-sat)/0.06,0,1)
O=A.copy(); O=O*(1-0.65*wh[...,None])+L[...,None]*np.array([1.0,0.99,0.97])*0.65*wh[...,None]
# centre seam at the front: average across both halves in 3D
fr=VM&(np.abs(x)<0.008)&(y<-0.02)&(z>1.56); fi=np.where(fr)
allf=VM&(np.abs(x)<0.03)&(y<-0.02)&(z>1.55); ai=np.where(allf)
PM=np.stack([x,y,z],-1)
tr=cKDTree(PM[ai]); _,nn=tr.query(PM[fi],k=30); avg=O[ai][nn].mean(1)
w=np.clip(1-np.abs(x[fi])/0.008,0,1)[:,None]
O[fi]=avg*w+O[fi]*(1-w)
Image.fromarray((np.clip(O,0,1)*255).astype(np.uint8)).save(out,quality=94)
print('hair texels',int((wh>0.5).sum()),'seam',len(fi[0]))
