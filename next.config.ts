import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      //DEV SERVER
      {
        protocol: "http", // or 'https' if your localhost server uses HTTPS
        hostname: "localhost",
        port: "8080", // Replace with the actual port your localhost server is running on (e.g., '3000', '8000')
        pathname: "/**", // Allows any path on localhost
      },
      //PROD SERVER
      {
        protocol: "https", // or 'https' if your localhost server uses HTTPS
        hostname: "jackangione.com",
        port: "8080", // Replace with the actual port your localhost server is running on (e.g., '3000', '8000')
        pathname: "/**", // Allows any path on localhost
      },
    ],
    // Disable private IP check in development
    dangerouslyAllowLocalIP: true,
  },
  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
    "127.99.150.193",
  ],
  output: "standalone",
};

export default nextConfig;
