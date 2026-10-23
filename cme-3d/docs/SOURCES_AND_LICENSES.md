# Open-source survey and provenance gate

This is a **screening register**. A GitHub repo being listed here means that we studied or selected its approach, not that its source code was copied or imported. Only dependencies declared in `package.json` are executed. Any future MoCap datasets need their own redistribution permissions.

| Project | Original location | Contribution contemplated | Preliminary decision |
| --- | --- | --- | --- |
| Microsoft Rocketbox | https://github.com/microsoft/Microsoft-Rocketbox | Realistic photo-textured male/female models, existing Shadow derivatives | Assets reused with MIT copyright notice |
| MakeHuman / MPFB | https://github.com/makehumancommunity | Next-gen topology, morphable skeleton, facial rig authoring | External authoring stage; separate code and asset licenses |
| IK-threejs | https://github.com/upf-gti/IK-threejs | CCD/FABRIK solver benchmark | Research; custom core solver currently |
| retargeting-threejs | https://github.com/upf-gti/retargeting-threejs | Skeleton mapping and BVH/FBX retargeting | Research; future opt-in adapter |
| p0qp0q-IK-Solver | https://github.com/increasinglyHuman/p0qp0q-IK-Solver | Swing-twist constraints | Experimental / audit required |
| three-ws-motion | https://github.com/nirholas/three-ws-motion | Procedural full-body motion | Experimental / performance and provenance audit required |
| Bandai Namco Motion Dataset (Japan) | https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset | Martial movement study | CC BY-NC; **do not redistribute commercially** |
| KungFuAthleteBot (China) | https://github.com/NPCLEI/KungFuAthleteBot | Video-guided technical poses | Verify provenance, dataset licenses, redistribution before use |
| GMR (China/international) | https://github.com/YanjieZe/GMR | Retargeting algorithm inspiration, many humanoids | Offline reference, robot topology differs |
| RIMKit / CoRe (Korea) | https://github.com/tmjeong1103/RIMKit | Contact-aware human-to-humanoid retargeting | Offline reference, MuJoCo not bundled |
| gmr-motionlab | https://github.com/chaowei-code/gmr-motionlab | Motion smoothing and foot-contact benchmarks | Research; independently implemented temporal smoothing |
| HY-Motion (China) | https://github.com/Tencent-Hunyuan/HY-Motion-1.0 | Text-to-motion inspiration | **Excluded from deployment: geographic/license restrictions require review** |
| Rapier | https://github.com/dimforge/rapier | Optional physically-based contacts/collisions | Future optional module, not runtime dependency |
| three-vrm | https://github.com/pixiv/three-vrm | Humanoid canonical coordinates/rig conventions | Future adapter reference |
| gltf-avatar-threejs | https://github.com/shrekshao/gltf-avatar-threejs | Clothing/skin sharing between rigs | Conceptual reference; existing Shadow outfit structure retained |

Do not claim technical or legal verification just from a repository description. Every external code/data ingestion requires a pinned revision, SPDX/license documentation, dependency audit, tests and source attribution.

Original Rocketbox terms are reproduced under `public/fighters/LICENSE-ROCKETBOX.txt`.
