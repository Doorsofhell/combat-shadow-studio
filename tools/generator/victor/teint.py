# second skin grade toward the photo tone (warm tan), only on warm (skin) texels; grey hair/beard kept
import numpy as np,sys
from PIL import Image
src,out=sys.argv[1:3]; g=np.array([float(v) for v in sys.argv[3].split(',')]); satb=float(sys.argv[4]) if len(sys.argv)>4 else 1.0
a=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)/255
warm=np.clip((a[...,0]-a[...,2]-0.03)/0.06,0,1)*np.clip((a@[.3,.59,.11]-0.08)/0.08,0,1)
b=a*g
L=b@[.3,.59,.11]; b=L[...,None]+(b-L[...,None])*satb
if len(sys.argv)>5:
  # zone weight from a texel->3D map (npz with z per texel, made by backhead.py run) : face full, neck reduced
  zm=np.load(sys.argv[5])['z']; zw=0.35+0.65*np.clip((zm-1.53)/0.04,0,1); zw[zm==0]=1
  warm=warm*zw
o=a*(1-warm[...,None])+b*warm[...,None]
Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).save(out,quality=94)
print('warm share',float((warm>0.5).mean()))
