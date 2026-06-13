import { Stack } from "expo-router";
import { GluestackUIProvider } from "@gluestack-ui/themed"
import { config } from "@gluestack-ui/config";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <Stack />
    </GluestackUIProvider>
  );
}
