import sys
from PIL import Image
# mean brightness and colour of the body pixels (not the white background, not the floor shadow band)
for f in sys.argv[1:]:
    im=Image.open(f).convert('RGB'); w,h=im.size; px=im.load(); n=0; s=[0,0,0]
    for y in range(0,int(h*0.78),2):
        for x in range(0,w,2):
            r,g,b=px[x,y]
            if r+g+b<700: n+=1; s[0]+=r; s[1]+=g; s[2]+=b
    m=[c/max(1,n) for c in s]
    print(f, 'pixels', n, 'RGB moyen', [round(c,1) for c in m], 'luminance', round(0.2126*m[0]+0.7152*m[1]+0.0722*m[2],1))
