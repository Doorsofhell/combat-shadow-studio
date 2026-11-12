#!/usr/bin/env python3
"""Strict checks for one freshly generated outfit set.

No Blender dependencies: validates GLB JSON nodes after the export has completed.
"""
import json
import pathlib
import struct
import sys

VERSION = "1.37.2"
OUTFITS = ("boxe", "kickboxing", "muaythai", "mma", "bjj", "bjj-nogi", "judo")


def validate(path: pathlib.Path) -> None:
    if not path.is_file() or path.stat().st_size < 1000:
        raise ValueError(f"{path}: absent ou fichier trop petit")
    with path.open("rb") as f:
        header = f.read(20)
        if len(header) != 20 or header[:4] != b"glTF":
            raise ValueError(f"{path}: en-tête GLB invalide")
        _, glb_version, file_size, json_size, chunk_type = struct.unpack("<4sIIII", header)
        if glb_version != 2 or chunk_type != 0x4E4F534A or file_size != path.stat().st_size:
            raise ValueError(f"{path}: structure GLB invalide")
        data = json.loads(f.read(json_size))
    if not data.get("meshes") or not data.get("skins"):
        raise ValueError(f"{path}: maillage ou squelette manquant")
    versions = [
        node.get("extras", {}).get("generatorVersion")
        for node in data.get("nodes", [])
        if isinstance(node.get("extras"), dict)
    ]
    if VERSION not in versions:
        raise ValueError(f"{path}: generatorVersion absent ou incorrect ({versions}); modèle ancien ou export Blender incomplet")
    if not any(node.get("mesh") is not None for node in data.get("nodes", [])):
        raise ValueError(f"{path}: pas de maillage porté")
    print(f"OK {path} : GLB {file_size} octets, generatorVersion={VERSION}", flush=True)


def main() -> int:
    if len(sys.argv) != 3:
        raise SystemExit("usage: validate-outfit-build-v1372.py COACH OUTDIR")
    coach = sys.argv[1]
    directory = pathlib.Path(sys.argv[2])
    for outfit in OUTFITS:
        try:
            validate(directory / f"{outfit}.glb")
        except Exception as exc:
            print(f"::error title=Régénération {coach}/{outfit}::{exc}", file=sys.stderr, flush=True)
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
