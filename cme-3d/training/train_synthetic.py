#!/usr/bin/env python3
"""Reproduce the tiny neural baseline. Synthetic teacher, *not martial MoCap*.
Training is offline and not packaged into Android. Python + numpy only.
Inputs [hip*3, chest*3, pivot*3, reach, phase-v], targets a bounded posture dampener.
Weights for the 2026-10-23 baseline were generated with seed 27, MSE optimization.
"""
import numpy as np
np.random.seed(27)
n=10000
x=np.random.uniform(-1,1,(n,5)).astype(np.float64)
target=np.stack([-0.07*x[:,0]-0.013*x[:,1],-0.09*x[:,1]+0.014*x[:,0],-0.115*x[:,2]-0.022*x[:,0],-0.055*np.maximum(0,x[:,3])+0.015*x[:,4]],axis=1)
w1=np.random.randn(5,12)*.2;b1=np.zeros(12);w2=np.random.randn(12,4)*.2;b2=np.zeros(4)
for i in range(1100):
    idx=np.random.randint(0,n,256);a=x[idx];y=target[idx]
    h=np.tanh(a@w1+b1);prediction=h@w2+b2
    d=2*(prediction-y)/len(idx);g2=h.T@d;t2=d.sum(0)
    dh=(d@w2.T)*(1-h*h);g1=a.T@dh;t1=dh.sum(0)
    w1-=.14*g1;b1-=.14*t1;w2-=.14*g2;b2-=.14*t2
print('training MSE',np.mean((np.tanh(x@w1+b1)@w2+b2-target)**2))
import json
print(json.dumps({'w1':w1.T.round(5).tolist(),'b1':b1.round(5).tolist(),'w2':w2.T.round(5).tolist(),'b2':b2.round(5).tolist()},separators=(',',':')))
