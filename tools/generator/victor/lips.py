# replace the dark painted stroke on the lip seam (reads as a thin moustache) by lip colour, and give the upper lip some colour
import numpy as np,sys
from PIL import Image,ImageFilter
src,out=sys.argv[1:3]
a=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)/255; L=a@[.3,.59,.11]
H,W,_=a.shape; y0,y1,x0,x1=812,842,918,1132
m=np.zeros((H,W),bool); m[y0:y1,x0:x1]=L[y0:y1,x0:x1]<0.24
mi=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))
w=np.asarray(mi).astype(np.float32)/255
# horizontal envelope so lip colour fades toward the corners
xs=np.arange(W); env=np.clip(1-np.abs(xs-1024)/110,0,1)**0.6
o=a.copy(); yy=np.arange(H)[:,None]
cols=np.where(m.any(0))[0]; seam=np.full(W,-1.0)
for x in cols: seam[x]=np.where(m[:,x])[0].max()   # bottom edge of the stroke = top of lower lip
sx=np.where(seam>0)[0]; seam_s=np.interp(xs,sx,np.convolve(np.pad(seam[sx],4,mode='edge'),np.ones(9)/9,'valid'))
xs_=np.arange(W)
env=np.clip(1-np.abs(xs_-1024)/115,0,1)**0.5
# mirror the lower lip upward (keeps real skin/lip grain), slightly darker
src=np.zeros_like(a)
for y in range(y0-12,y1+2):
  sy=np.clip((2*seam_s-y+3).astype(int),0,H-1); src[y]=a[sy,xs_]*0.93
d=yy-seam_s[None,:]
band=np.clip((d+11)/3,0,1)*np.clip((1-d)/2,0,1)*env[None,:]   # from 11 px above to the seam
wt=np.maximum(w,band*0.85)
reg=np.zeros((H,W),np.float32); reg[y0-14:y1+4,x0:x1]=1; wt*=reg
o=a*(1-wt[...,None])+src*wt[...,None]
line=np.exp(-((d-0.5)/1.0)**2)*env[None,:]*reg*0.25   # soft, thin lip line
o=o*(1-line[...,None]*0.45)
Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).save(out,quality=94)
print('stroke texels',int(m.sum()))
