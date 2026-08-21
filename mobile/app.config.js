const baseConfig = require('./app.json');

const semverTag = /^(?:v)?(\d+\.\d+\.\d+)$/u;
const candidates = [
  process.env.KEYOPS_VERSION,
  process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined,
  process.env.VERCEL_GIT_COMMIT_REF,
];
const taggedVersion = candidates.map((value) => value?.match(semverTag)?.[1]).find(Boolean);

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    version: taggedVersion ?? baseConfig.expo.version,
  },
};
