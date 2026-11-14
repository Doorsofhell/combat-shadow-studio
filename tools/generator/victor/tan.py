import numpy as np,sys
from PIL import Image
src,out=sys.argv[1:3]; g=np.array([0.82,0.72,0.66])
a=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)/255
sat=a.max(-1)-a.min(-1); L=a@[.3,.59,.11]
mode=sys.argv[3] if len(sys.argv)>3 else 'head'
if mode=='body':
  w=np.clip((L-0.10)/0.08,0,1)
  from PIL import ImageFilter
  w=np.asarray(Image.fromarray((w*255).astype(np.uint8)).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32)/255
else:
  w=np.clip((sat-0.025)/0.06,0,1)*np.clip((a[...,0]-a[...,2]-0.0)/0.05,0,1)*np.clip((L-0.12)/0.08,0,1)
o=a*(1-w[...,None])+a*g*w[...,None]
Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).save(out,quality=92)
print(src,'skin share',float((w>0.5).mean()))
