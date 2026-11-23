import { resolve as pathResolve, dirname, extname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const ROOT = pathResolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'next/server') {
    return defaultResolve('next/server.js', context, defaultResolve);
  }

  let targetPath = specifier;

  if (specifier.startsWith('@/')) {
    targetPath = join(ROOT, 'src', specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (context.parentURL) {
      const parentDir = dirname(fileURLToPath(context.parentURL));
      targetPath = pathResolve(parentDir, specifier);
    }
  }

  if (targetPath.startsWith('/') || targetPath.match(/^[a-zA-Z]:\\/)) {
    const candidates = [
      targetPath,
      targetPath + '.ts',
      targetPath + '.tsx',
      targetPath + '.js',
      join(targetPath, 'index.ts'),
      join(targetPath, 'index.tsx'),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c) && !fs.statSync(c).isDirectory()) {
        return {
          url: pathToFileURL(c).href,
          shortCircuit: true,
        };
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
