#!/usr/bin/env python3
"""v1.37.9 experimental Amara MMA, structural gate: no commercial source asset used.
Validates semantics of one genuine exported GLB. Does NOT replace kick/skin visual checks.
"""
import base64
import json
from pathlib import Path
import struct

path = Path('public/coaches/mma-amara/tenues/mma.glb')
b = path.read_bytes()
assert b[:4] == b'glTF' and struct.unpack_from('<II', b, 4) == (2, len(b)), 'GLB corrupt'
n = struct.unpack_from('<I', b, 12)[0]
assert struct.unpack_from('<I', b, 16)[0] == 0x4E4F534A, 'not a JSON chunk'
g = json.loads(b[20:20+n])
nodes = [x for x in g.get('nodes', []) if x.get('mesh') is not None]
names = [x.get('name', '') for x in nodes]
assert sum(x.startswith('short-vale-tudo') for x in names) == 1, names
assert sum(x.startswith('haut-brassiere') for x in names) == 1, names
assert sum(x.startswith('bande-brassiere-mma') for x in names) == 1, names
assert not any(x.startswith('short-surshort') for x in names), 'obsolete outer short reintroduced'
assert not any(x.startswith('haut-crop') for x in names), 'old square crop still present'
assert any('mma-shin' in x or 'tibia' in x for x in names), 'MMA protections unexpectedly absent'
metadata = [x.get('extras', {}) for x in g['nodes']]
assert any(e.get('generatorVersion') == '1.37.9' and e.get('clothingStyle') == 'female-compression-reference-1379'
           and e.get('sportsTopCut') == 'scoop-racerback-reference-1379' for e in metadata)
assert any(e.get('cssCompressionStyle') == 'fitted-one-layer-reference-1379'
           and e.get('cssNoOvershort') is True for e in metadata)
assert any(e.get('cssTopStyle') == 'scoop-racerback-reference-1379' for e in metadata)
assert any(e.get('cssBraBandCut') == 'continuous-planar-elastic-1379' for e in metadata)
assert any(e.get('cssBraBandConstruction') == 'smooth-independent-torso-ring-1379' and e.get('cssBraBandSegments') == 96 for e in metadata), 'old jagged bikini shell used instead of ring'
hides = [e for e in metadata if e.get('hideBody')]
assert len(hides) == 1
raw = base64.b64decode(hides[0]['hideBody'], validate=True)
assert len(raw) % 6 == 0 and len(raw) >= 2500, 'hideBody invalid or abnormally empty'
assert len(g.get('skins', [])) > 0, 'no skinning'
assert len(g.get('materials', [])) >= 4, 'materials missing'
print('PASS: Amara MMA model reference, bra and 1 compression short, no overshort, own rig, hideBody =',
      len(raw) // 6, 'points')
print('NOT YET APPROVED: photo.glb original swimsuit and animated kick visual checks remain blockers.')
