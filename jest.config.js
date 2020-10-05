module.exports = {
  verbose: true,
  expand: true,
  projects: [
    {
      displayName: 'Tests',
      collectCoverageFrom: ['./src/**/*.js'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
      coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
      coverageThreshold: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100
        }
      }
    }
  ]
}
