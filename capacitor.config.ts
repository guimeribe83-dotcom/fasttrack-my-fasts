import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5df1cfab6382458ca987a870c0144151',
  appName: 'fasttrack-my-fasts',
  webDir: 'dist',
  server: {
    url: 'https://5df1cfab-6382-458c-a987-a870c0144151.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
