/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits a static "out/" folder on `npm run build`, so the desktop app
  // (Electron) can serve the frontend without running a Node server.
  // Does not affect `npm run dev`.
  output: "export",
  images: { unoptimized: true },
};

module.exports = nextConfig;
