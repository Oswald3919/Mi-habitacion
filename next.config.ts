import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// Keep Turbopack anchored to this app when the parent workspace also has a lockfile.
const projectRoot = dirname(fileURLToPath(import.meta.url));
const nextConfig: NextConfig = { turbopack: { root: projectRoot } };

export default nextConfig;
