const { execFileSync } = require('node:child_process');

const baseConfig = require('./app.json');

const semverTag = /^(?:v)?(\d+\.\d+\.\d+)$/u;
const candidates = [
  process.env.KEYOPS_VERSION,
  process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined,
  process.env.VERCEL_GIT_COMMIT_REF,
];
try {
  candidates.push(
    execFileSync('git', ['describe', '--tags', '--exact-match', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim(),
  );
} catch {
  // Hosted builds use GITHUB_REF_NAME or VERCEL_GIT_COMMIT_REF instead.
}
const taggedVersion = candidates.map((value) => value?.match(semverTag)?.[1]).find(Boolean);

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    version: taggedVersion ?? baseConfig.expo.version,
  },
};
