# back of the head: natural nape hairline + neck skin matched + no vertical seam (works in 3D, both UV halves together)
import numpy as np,sys
from PIL import Image,ImageFilter
from scipy.spatial import cKDTree
geo,tex,out=sys.argv[1:4]
g=np.load(geo); P,T,UV,M=g['P'],g['tris'],g['uvs'],g['mat']
A=np.asarray(Image.open(tex).convert('RGB')).astype(np.float32)/255; H,W,_=A.shape
PM=np.zeros((H,W,3),np.float32); VM=np.zeros((H,W),bool)
for t in np.where(M==1)[0]:
  uv=UV[t]*[W,H]; uv[:,1]=H-uv[:,1]
  x0,y0=np.maximum(np.floor(uv.min(0)).astype(int),0); x1,y1=np.minimum(np.ceil(uv.max(0)).astype(int),[W-1,H-1])
  if x1<x0 or y1<y0: continue
  xs,ys=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5); a,b,c=uv
  den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(den)<1e-9: continue
  l1=((b[1]-c[1])*(xs-c[0])+(c[0]-b[0])*(ys-c[1]))/den; l2=((c[1]-a[1])*(xs-c[0])+(a[0]-c[0])*(ys-c[1]))/den; l3=1-l1-l2
  ins=(l1>=-.03)&(l2>=-.03)&(l3>=-.03); vi=T[t]; sl=(slice(y0,y1+1),slice(x0,x1+1))
  PM[sl][ins]=(l1[...,None]*P[vi[0]]+l2[...,None]*P[vi[1]]+l3[...,None]*P[vi[2]])[ins]; VM[sl][ins]=True
x,y,z=PM[...,0],PM[...,1],PM[...,2]
np.savez_compressed(out+'.zmap.npz',z=z.astype(np.float32),x=x.astype(np.float32),y=y.astype(np.float32))
back=VM&(y>-0.03)
wb=np.clip((y+0.03)/0.04,0,1)   # soft border toward the sides
# hairline: nape at z 1.585 in the middle, rising to 1.615 behind the ears (photo back view)
zh=1.612+0.022*np.clip((np.abs(x)-0.035)/0.04,0,1)
blur=lambda im,r:np.asarray(Image.fromarray((np.clip(im,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)/255
hp=A-blur(A,4)
# hair source: texels of the back hair well above the hairline
hs=back&(z>1.67)&(z<1.75); ht=cKDTree(PM[hs]); hc=A[hs]
tgt=back&(z<1.69)&(z>1.50)
ti=np.where(tgt); p=PM[ti]
_,nn=ht.query(p+np.array([0,0,0.06]),k=1); hair=hc[nn]
_,nn8=ht.query(p+np.array([0,0,0.06]),k=24); hairlow=hc[nn8].mean(1)
# neck skin reference: below the hairline, average of the side-neck under the ears (well lit, no hair)
sk=VM&(z>1.47)&(z<1.53)&(np.abs(x)>0.03)&(y>-0.08)&(y<-0.04)
skin=np.median(A[sk],0); print('skin ref',skin.round(3))
zz=p[:,2]; zhp=zh[ti]
wh=np.clip((zz-zhp)/0.009+0.5,0,1)            # 1 = hair, 0 = skin, soft taper 1.6 cm
# taper: short hair becomes sparser/lighter near the hairline -> mix toward skin with hair detail
haircol=(hair*0.75+hairlow*0.25)*0.86
skincol=skin+hp[ti]*0.8
new=haircol*wh[:,None]+skincol*(1-wh[:,None])*1.0
# only replace where the current texel disagrees (keep good hair above 1.64 untouched): weight by height
wz=np.clip((1.69-zz)/0.02,0,1)*wb[ti]
O=A.copy(); O[ti]=new*wz[:,None]+A[ti]*(1-wz[:,None])
# blend into the neck below 1.50 smoothly
nb=back&(z<=1.50)&(z>1.46); nbi=np.where(nb); f=(np.clip((PM[nbi][:,2]-1.46)/0.04,0,1)*wb[nbi])[:,None]
O[nbi]=(skin+hp[nbi]*0.8)*f+A[nbi]*(1-f)
# 3D low-frequency harmonisation of the whole back: kills the UV seam, keeps fine grain
hb=back&(z>1.46); bi=np.where(hb)
Ol=blur(O,3); hp2=O-Ol
sub=np.random.default_rng(0).choice(len(bi[0]),min(len(bi[0]),60000),replace=False)
tr=cKDTree(PM[bi][sub]); _,nn=tr.query(PM[bi],k=12); low=Ol[bi][sub][nn].mean(1)
wbb=wb[bi][:,None]
O[bi]=(low+hp2[bi])*wbb+O[bi]*(1-wbb)
# left/right tone balance of the face (one half was paler): average the low frequency with the mirrored side, keep detail
fr=VM&(y<=-0.0)&(z>1.53); fi=np.where(fr)
Lw=blur(O,10); hpf=O-Lw
mt=cKDTree(PM[fi]); q=PM[fi]*np.array([-1,1,1]); dd,nn=mt.query(q,k=1)
ok=dd<0.004
lowm=Lw[fi][nn]; lowsym=(Lw[fi]+lowm)/2
O[fi]=np.where(ok[:,None],lowsym+hpf[fi],O[fi])
# tone like the photos: hair darker (pepper) at the back and sides, lighter grey kept on top/front; neck warmer
sat=O.max(-1)-O.min(-1); Lo=O@[.3,.59,.11]
scalp=VM&(z>1.60)&((y>-0.07)|(z>1.76))
wsat=np.clip((0.12-sat)/0.06,0,1)*np.clip((z-1.595)/0.012,0,1)
gback=0.68; gtop=0.86
tb=np.clip((y+0.02)/0.06,0,1)*np.clip((1.80-z)/0.06,0,1)    # 1 = back/sides low, 0 = top/front
gain=gtop+(gback-gtop)*tb
wh2=(wsat*scalp)[...,None]
O=O*(1-wh2)+O*gain[...,None]*wh2
neck=VM&(z<1.565); wn=(np.clip((1.565-z)/0.02,0,1)*neck)[...,None]
O=O*(1-wn)+O*np.array([1.03,0.94,0.885])*wn
Image.fromarray((np.clip(O,0,1)*255).astype(np.uint8)).save(out,quality=94)
print('target',len(ti[0]),'back',len(bi[0]))
