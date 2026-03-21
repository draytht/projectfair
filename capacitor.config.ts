import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nocarry.app',
  appName: 'NoCarry',
  webDir: 'out',
  server: {
    // Replace with your production URL once deployed (e.g. https://nocarry.vercel.app)
    url: 'https://nocarry.space',
    cleartext: false,
  },
};

export default config;
