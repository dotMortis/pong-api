export default {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/'],
    coverageProvider: 'v8',
    coverageReporters: ['json', 'text', 'lcov', 'clover'],
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    preset: 'ts-jest',
    roots: ['<rootDir>/src'],
    testEnvironment: 'node'
};
