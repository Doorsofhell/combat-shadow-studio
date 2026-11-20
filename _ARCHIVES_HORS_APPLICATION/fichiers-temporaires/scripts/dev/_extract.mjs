import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { writeFileSync } from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
for (const t of doc.getRoot().listTextures()) writeFileSync(`${process.argv[3]}/${t.getName()}.jpg`, t.getImage());
