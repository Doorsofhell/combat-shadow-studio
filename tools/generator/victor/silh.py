import numpy as np,sys
from PIL import Image,ImageFilter
def mask_photo():
    a=np.asarray(Image.open('ref/corps_boxer.jpg').convert('RGB')).astype(int)[:,0:600]
    m=((a[...,0]-a[...,2])>14)|(a.mean(-1)<80)
    m=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    return np.asarray(m)>0
def mask_render(p):
    a=np.asarray(Image.open(p).convert('RGB')).astype(int); bg=a[5:30,5:30].reshape(-1,3).mean(0)
    return np.abs(a-bg).max(-1)>10
def prof(m):
    ys=np.where(m.sum(1)>3)[0]; top,bot=ys[0],ys[-1]; H=bot-top; res={}
    for f in np.arange(0.12,0.97,0.02):
        r=m[int(top+f*H)]; d=np.diff(np.r_[0,r.astype(int),0]); s=np.where(d==1)[0]; e=np.where(d==-1)[0]
        res[round(f,2)]=[(round((a)/H*1000),round((b-a)/H*1000)) for a,b in zip(s,e) if b-a>H*0.006]
    return res,top,bot
P,pt,pb=prof(mask_photo()); V,vt,vb=prof(mask_render(sys.argv[1]))
print('photo top/bot',pt,pb,'render',vt,vb)
for f in P: print(f,'P',[w for _,w in P[f]],'V',[w for _,w in V[f]])
Image.fromarray((mask_photo()*255).astype(np.uint8)).resize((300,768)).save('w2/maskP.png')
