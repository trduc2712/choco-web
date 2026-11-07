export default {
  extends: ['@commitlint/config-conventional'],
  defaultIgnores: false,
  ignores: [
    (message) => /^Merge pull request #\d+ from \S+/.test(message),
    (message) =>
      /^Merge (?:branch|remote-tracking branch) '[^']+'(?: into \S+)?(?:\r?\n|$)/.test(
        message,
      ),
  ],
  rules: { 'scope-case': [2, 'always', 'lower-case'] },
}
