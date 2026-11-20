#!/usr/bin/env bash
# v2.3.1 : prépare la signature de publication à partir des secrets GitHub, sans jamais afficher une valeur.
# Noms attendus : ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD.
# Si ces noms sont absents, des secrets passés en CANDIDATE_1..4 (aucun aujourd'hui dans le workflow) sont reconnus par leur contenu : le keystore est le seul long texte base64 qui se décode en fichier PKCS12, les
# mots de passe sont ceux qui l'ouvrent (keytool), l'alias est celui qui existe dans le keystore.
# Écrit android/keystore.properties et "signed=1|0" dans $GITHUB_OUTPUT.
set -uo pipefail

JKS="$RUNNER_TEMP/upload.jks"
OUT="${GITHUB_OUTPUT:-/dev/null}"
unsigned() { echo "::warning::$1 : AAB et APK NON SIGNÉS (impossible à envoyer au Play Store)."; echo "signed=0" >> "$OUT"; exit 0; }
opens() { keytool -list -keystore "$JKS" -storetype PKCS12 -storepass "$1" > /dev/null 2>&1; }
has_alias() { keytool -list -keystore "$JKS" -storetype PKCS12 -storepass "$1" -alias "$2" > /dev/null 2>&1; }

KS_B64="${KS_B64:-}"; KS_PASS="${KS_PASS:-}"; KEY_ALIAS="${KEY_ALIAS:-}"; KEY_PASS="${KEY_PASS:-}"
if [ -n "$KS_B64" ] && [ -n "$KS_PASS" ] && [ -n "$KEY_ALIAS" ]; then
  printf %s "$KS_B64" | tr -d ' \r\n\t' | base64 -d > "$JKS" 2>/dev/null || unsigned "ANDROID_KEYSTORE_BASE64 n'est pas du base64 valide"
  opens "$KS_PASS" || unsigned "le mot de passe ANDROID_KEYSTORE_PASSWORD n'ouvre pas le keystore"
  KEY_PASS="${KEY_PASS:-$KS_PASS}"
  echo "Signature : secrets aux noms attendus."
else
  C=("${CANDIDATE_1:-}" "${CANDIDATE_2:-}" "${CANDIDATE_3:-}" "${CANDIDATE_4:-}")
  FOUND=-1
  for i in 0 1 2 3; do
    v=$(printf %s "${C[$i]}" | tr -d ' \r\n\t')
    [ ${#v} -gt 1000 ] || continue
    if printf %s "$v" | base64 -d > "$JKS" 2>/dev/null; then FOUND=$i; break; fi
  done
  [ $FOUND -ge 0 ] || unsigned "aucun secret ne contient le keystore en base64"
  KS_PASS=""
  for i in 0 1 2 3; do
    [ $i -eq $FOUND ] && continue
    v=$(printf %s "${C[$i]}" | tr -d '\r\n')
    [ -n "$v" ] && opens "$v" && { KS_PASS="$v"; break; }
  done
  [ -n "$KS_PASS" ] || unsigned "aucun secret n'ouvre le keystore (mot de passe)"
  KEY_ALIAS=""
  for i in 0 1 2 3; do
    [ $i -eq $FOUND ] && continue
    v=$(printf %s "${C[$i]}" | tr -d ' \r\n\t')
    [ -n "$v" ] && [ "$v" != "$KS_PASS" ] && has_alias "$KS_PASS" "$v" && { KEY_ALIAS="$v"; break; }
  done
  [ -n "$KEY_ALIAS" ] || unsigned "aucun secret ne donne l'alias de la clé"
  # PKCS12 : la clé a le même mot de passe que le fichier (c'est le cas de la clé préparée)
  KEY_PASS="$KS_PASS"
  echo "Signature : secrets reconnus par leur contenu (keystore, mot de passe, alias)."
fi

{
  echo "storeFile=$JKS"
  echo "storePassword=$KS_PASS"
  echo "keyAlias=$KEY_ALIAS"
  echo "keyPassword=$KEY_PASS"
} > android/keystore.properties
echo "signed=1" >> "$OUT"
