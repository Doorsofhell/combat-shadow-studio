import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android packaging. appId is the permanent Google Play identifier: it can never change once the
 * app is published (see docs/ANDROID.md).
 */
const config: CapacitorConfig = {
  appId: 'fr.combatshadowstudio.app',
  appName: 'Combat Shadow Studio',
  webDir: 'dist',
  android: {
    // the app never loads remote content; everything is served from the APK
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // the coach animations run at 60 fps: keep the WebView hardware accelerated (default)
  },
};

export default config;
