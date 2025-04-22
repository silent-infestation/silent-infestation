const scanner = require('sonarqube-scanner');

scanner(
    {
        serverUrl: 'http://localhost:9000',
        token: 'votre_token_sonar',
        options: {
            'sonar.projectKey': 'silen2festation',
            'sonar.projectName': 'Silen2festation',
            'sonar.projectVersion': '1.0',
            'sonar.sources': '.',
            'sonar.tests': '__tests__',
            'sonar.inclusions': '**',
            'sonar.test.inclusions': '**/*.test.js,**/*.test.ts',
            'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
            'sonar.sourceEncoding': 'UTF-8',
        },
    },
    () => process.exit()
);
