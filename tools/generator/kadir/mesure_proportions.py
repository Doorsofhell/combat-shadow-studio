import numpy as np, sys
from scipy.spatial import ConvexHull
d=np.load(sys.argv[2] if len(sys.argv)>2 else 'k0.npz'); R=d['R']; T=d['tris']; M=d['mat']
D=np.zeros_like(R)
if len(sys.argv)>1:
    a=np.fromfile(sys.argv[1],np.float32).reshape(-1,9); g=a[:,3:6]; D=np.stack([g[:,0],-g[:,2],g[:,1]],1)
P=R+D
def perim(s):
    q=P[s][:,:2]; h=ConvexHull(q); v=q[h.vertices]; return np.linalg.norm(v-np.roll(v,1,0),axis=1).sum()
for z0 in [1.50,1.52,1.54,1.56,1.58]:
    s=(abs(R[:,2]-z0)<0.004)&(np.hypot(R[:,0],R[:,1])<0.11)
    print('cou z%.2f tour %.1f cm'%(z0,perim(s)*100))
f=(R[:,1]<-0.04)
for nm,z0 in [('pommettes',1.655),('joues',1.62),('mâchoire',1.585)]:
    s=(abs(R[:,2]-z0)<0.004)&f&(abs(R[:,0])<0.09); print(nm,'largeur %.1f cm'%((P[s,0].max()-P[s,0].min())*100))
s=(abs(R[:,2]-1.70)<0.005)&(abs(R[:,0])<0.09); print('crâne largeur %.1f'%((P[s,0].max()-P[s,0].min())*100))
