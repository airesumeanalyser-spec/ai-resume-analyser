import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  // Base path for deployment at careersimplified.co.in/ai-resume-builder
  // Note: basename must begin with Vite's base config for the dev server
  basename: "/ai-resume-builder/",
} satisfies Config;
