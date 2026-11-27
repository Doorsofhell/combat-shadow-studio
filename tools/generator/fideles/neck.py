import json,sys,numpy as np
from PIL import Image,ImageDraw,ImageFilter
def blur(a,s):
    r=int(3*s)+1;x=np.arange(-r,r+1);k=np.exp(-x*x/(2*s*s));k/=k.sum()
    p=np.pad(a,r,mode='edge')
    p=np.apply_along_axis(lambda v:np.convolve(v,k,mode='valid'),0,p)
    p=np.apply_along_axis(lambda v:np.convolve(v,k,mode='valid'),1,p)
    return p
def lum(im):
    a=np.asarray(im.convert('RGB'),dtype=np.float32)/255.;return a,0.299*a[...,0]+0.587*a[...,1]+0.114*a[...,2]
for c in sys.argv[1:]:
    geo=json.load(open(f'/tmp/neck/{c}/geo.json'))
    for name,ymin,ymax in [('body',1.42,1.52),('head',1.42,1.52)]:
        g=[x for x in geo if name in x['mat']][0];pos=np.array(g['pos']).reshape(-1,3);uv=np.array(g['uv']).reshape(-1,2);idx=np.array(g['idx']).reshape(-1,3)
        cur=Image.open(f'/tmp/neck/{c}/cur-{name}.jpeg').convert('RGB');old=Image.open(f'/tmp/neck/{c}/old-{name}.jpeg').convert('RGB').resize(cur.size)
        W,H=cur.size
        # masque : poids par sommet (1 au-dessus de ymax, 0 sous ymin), rempli dans l'espace UV
        y=pos[:,1];w=np.clip(np.minimum((y-1.40)/0.04,(1.54-y)/0.04),0,1)
        m=Image.new('F',(W,H),0);d=ImageDraw.Draw(m)
        for tri in idx:
            wt=float(w[tri].mean())
            if wt<=0:continue
            d.polygon([(uv[i,0]*W,uv[i,1]*H) for i in tri],fill=wt)
        m=blur(np.array(m),3)
        ca,cl=lum(cur);oa,ol=lum(old)
        s=W/40.
        r=(blur(ol,s)+1e-3)/(blur(cl,s)+1e-3)
        r=r/(blur(r,s*3)+1e-6)   # garde seulement la structure à l'échelle du cou
        r=np.clip(r,0.82,1.12)
        f=1+(r-1)*m
        out=np.clip(ca*f[...,None],0,1)
        Image.fromarray((out*255).astype(np.uint8)).save(f'/tmp/neck/{c}/new-{name}.jpeg',quality=82)
        print(c,name,'masque %.3f'%m.mean(),'facteur min %.3f max %.3f'%(f.min(),f.max()))

# Amara et Inaya (corps et tête de la 2.9.0) : images ramenées à la taille actuelle, JPEG 90
# (voir restaure_cou.mjs) :
#   Image.open(old).convert('RGB').resize(cur.size, Image.LANCZOS).save(f'{c}/small-{body|head}.jpeg', quality=90)
