const { scan } = require('@sonar/scan');

scan({
    serverUrl: 'http://localhost:9000',
    token: 'votre_token_sonar',
    projectKey: 'silen2festation',
    projectName: 'Silen2festation',
    projectVersion: '1.0',
    sources: '.',
    tests: '__tests__',
    inclusions: '**',
    testInclusions: '**/*.test.js,**/*.test.ts',
    javascript: {
        lcov: {
            reportPaths: 'coverage/lcov.info',
        },
    },
    encoding: 'UTF-8',
});
