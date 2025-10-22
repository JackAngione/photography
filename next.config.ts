import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "skipLibCheck": true,
        "paths": {
            "@/*": ["./src/*"]
        }
    }
};

export default nextConfig;
