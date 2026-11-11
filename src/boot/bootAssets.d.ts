/** 1.34 (tools/build/bootModels.ts): bytes served and fingerprint of each file of the start screen */
declare module 'virtual:boot-assets' {
  const assets: Record<string, [bytes: number, version: string]>;
  export default assets;
}
