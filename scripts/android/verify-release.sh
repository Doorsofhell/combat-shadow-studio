#!/usr/bin/env bash
# Contrôles Play Store sur l'AAB et l'APK de publication (v2.3.1). Lancé par .github/workflows/android-release.yml
# après `gradlew bundleRelease assembleRelease`. Échoue (exit 1) si une règle bloquante n'est pas respectée.
# Écrit out-release/ : AAB, APK, SHA256SUMS.txt, RAPPORT.md.
set -euo pipefail

V=$(node -p "require('./package.json').version")
CODE=$(grep '^versionCode=' android/version.properties | cut -d= -f2)
PKG=fr.combatshadowstudio.app
TARGET=36
MIN=24
BT="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/build-tools/36.0.0"
SIGNED="${SIGNED:-0}"
AAB=android/app/build/outputs/bundle/release/app-release.aab
APK=android/app/build/outputs/apk/release/app-release.apk
[ -f "$APK" ] || APK=android/app/build/outputs/apk/release/app-release-unsigned.apk
OUT=out-release
mkdir -p "$OUT"
R="$OUT/RAPPORT.md"
FAIL=0
ok() { echo "- TEST RÉUSSI : $1" >> "$R"; echo "OK  $1"; }
ko() { echo "- TEST ÉCHOUÉ : $1" >> "$R"; echo "::error::$1"; FAIL=1; }
na() { echo "- NON EXÉCUTÉ : $1" >> "$R"; echo "--  $1"; }

{
  echo "# Combat Shadow Studio v$V : contrôles Play Store"
  echo
  echo "Commit \`${GITHUB_SHA:-local}\`, versionCode $CODE, signé : $([ "$SIGNED" = 1 ] && echo oui || echo NON)."
  echo
} > "$R"

[ -f "$AAB" ] && ok "AAB produit ($(du -h "$AAB" | cut -f1))" || ko "AAB absent"
[ -f "$APK" ] && ok "APK produit ($(du -h "$APK" | cut -f1))" || ko "APK absent"

# Manifeste fusionné, lu dans l'APK de publication
B=$("$BT/aapt2" dump badging "$APK")
echo "$B" | grep -q "package: name='$PKG'" && ok "identifiant $PKG" || ko "identifiant différent de $PKG"
echo "$B" | grep -q "versionCode='$CODE'" && ok "versionCode $CODE" || ko "versionCode différent de $CODE"
echo "$B" | grep -q "versionName='$V'" && ok "versionName $V" || ko "versionName différent de $V"
echo "$B" | grep -q "targetSdkVersion:'$TARGET'" && ok "SDK cible $TARGET (exigence Google Play)" || ko "SDK cible différent de $TARGET"
echo "$B" | grep -q "minSdkVersion:'$MIN'" && ok "SDK minimal $MIN (Android 7.0)" || ko "SDK minimal différent de $MIN"
if echo "$B" | grep -q "application-debuggable"; then ko "application débogable"; else ok "application non débogable"; fi

# Permissions : INTERNET, plus la permission interne (signature) qu'AndroidX ajoute à toutes les applications
PERMS=$(echo "$B" | sed -n "s/^uses-permission: name='\([^']*\)'.*/\1/p" | sort -u)
BAD=$(echo "$PERMS" | grep -v -x -e 'android.permission.INTERNET' -e "$PKG.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION" || true)
if [ -z "$BAD" ]; then ok "permissions : $(echo $PERMS | tr ' ' ',')"; else ko "permissions inattendues : $(echo $BAD | tr ' ' ',')"; fi

# Pages mémoire de 16 Ko (obligatoire pour les mises à jour depuis novembre 2025)
if "$BT/zipalign" -c -P 16 -v 4 "$APK" > /dev/null; then ok "alignement 16 Ko (zipalign -P 16)"; else ko "alignement 16 Ko"; fi
SO=$(unzip -l "$APK" | grep -c '\.so$' || true)
ok "bibliothèques natives : $SO"

# Signature
if [ "$SIGNED" = 1 ]; then
  if "$BT/apksigner" verify --print-certs "$APK" > "$OUT/apk-cert.txt"; then
    ok "APK signé (apksigner) : $(grep -m1 'SHA-256' "$OUT/apk-cert.txt" | sed 's/.*: //')"
  else ko "signature APK invalide"; fi
  if jarsigner -verify "$AAB" | grep -q 'jar verified'; then
    ok "AAB signé (jarsigner)"
    keytool -printcert -jarfile "$AAB" | grep -m1 'SHA256' | sed 's/^\s*/  - empreinte de la clé d’importation : /' >> "$R"
  else ko "signature AAB invalide"; fi
else
  na "signature : secrets de la clé d’importation absents, fichiers NON SIGNÉS (refusés par le Play Store)"
fi

# Manifeste de l'AAB lui-même (ce que reçoit Google Play)
BTJ="$RUNNER_TEMP/bundletool.jar"
if curl -fsSL -o "$BTJ" https://github.com/google/bundletool/releases/download/1.18.1/bundletool-all-1.18.1.jar; then
  M=$(java -jar "$BTJ" dump manifest --bundle "$AAB")
  echo "$M" | grep -q "android:versionCode=\"$CODE\"" && ok "AAB : versionCode $CODE (bundletool)" || ko "AAB : versionCode"
  echo "$M" | grep -q "android:targetSdkVersion=\"$TARGET\"" && ok "AAB : SDK cible $TARGET (bundletool)" || ko "AAB : SDK cible"
else
  na "bundletool indisponible"
fi

# Tests unitaires lancés avant la compilation
if [ -f vitest.log ]; then
  echo >> "$R"; echo "Tests unitaires (Vitest) :" >> "$R"; echo '```' >> "$R"
  grep -E '^\s+(Test Files|Tests)\s' vitest.log | sed 's/\x1b\[[0-9;]*m//g' >> "$R" || true
  grep -E '^ FAIL ' vitest.log | sed 's/\x1b\[[0-9;]*m//g' | sort -u >> "$R" || true
  echo '```' >> "$R"
fi

S=$([ "$SIGNED" = 1 ] && echo "" || echo "-NON-SIGNE")
cp "$AAB" "$OUT/combat-shadow-studio-v$V-play$S.aab"
cp "$APK" "$OUT/combat-shadow-studio-v$V$S.apk"
(cd "$OUT" && sha256sum *.aab *.apk > SHA256SUMS.txt)
echo >> "$R"; echo '```' >> "$R"; cat "$OUT/SHA256SUMS.txt" >> "$R"; echo '```' >> "$R"
cat "$R" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
cat "$R"
exit $FAIL
