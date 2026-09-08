import { readFile, writeFile } from 'node:fs/promises';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const basePath = repositoryName.endsWith('.github.io')
  ? ''
  : `/${repositoryName}`;

for (const file of ['dist/client/index.html', 'dist/client/index.rsc']) {
  const source = await readFile(file, 'utf8');
  const prepared = source
    .replaceAll('/_next/', `${basePath}/_next/`)
    .replaceAll('/favicon.svg', `${basePath}/favicon.svg`);
  await writeFile(file, prepared);
}

await writeFile('dist/client/.nojekyll', '');
