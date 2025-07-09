/**
 * Configuration options for generating test data
 */
interface TestDataOptions {
    /** Number of top-level suites to create */
    numSuites?: number;
    /** Number of tests per suite */
    testsPerSuite?: number;
    /** Maximum nesting depth for suites */
    maxDepth?: number;
    /** Number of sub-suites per parent suite */
    subSuitesPerSuite?: number;
    /** Base name for suites (will be numbered) */
    suiteNamePrefix?: string;
    /** Base name for tests (will be numbered) */
    testNamePrefix?: string;
    /** Minimum duration for tests in microseconds */
    minDuration?: number;
    /** Maximum duration for tests in microseconds */
    maxDuration?: number;
    /** Whether to add realistic timing delays */
    addTimingDelays?: boolean;
    /** Custom suite structure (overrides other suite options) */
    customStructure?: SuiteStructure[];
}

/**
 * Represents a custom suite structure
 */
interface SuiteStructure {
    /** Suite path (e.g., ['Parent', 'Child']) */
    suitePath: string[];
    /** Tests to create in this suite */
    tests: string[];
    /** Sub-suites to create */
    subSuites?: SuiteStructure[];
}

/**
 * Information about generated test data
 */
interface GeneratedTestData {
    /** Total number of tests created */
    totalTests: number;
    /** Total number of suites created */
    totalSuites: number;
    /** Maximum depth achieved */
    maxDepthAchieved: number;
    /** List of all test paths created */
    testPaths: string[][];
    /** List of all suite paths created */
    suitePaths: string[][];
    /** Mapping of suite paths to their direct test counts */
    suiteTestCounts: Map<string, number>;
}

/**
 * Default options for test data generation
 */
const DEFAULT_OPTIONS: Required<TestDataOptions> = {
    numSuites: 3,
    testsPerSuite: 2,
    maxDepth: 2,
    subSuitesPerSuite: 1,
    suiteNamePrefix: "Suite",
    testNamePrefix: "Test",
    minDuration: 1000, // 1ms in microseconds
    maxDuration: 10000, // 10ms in microseconds
    addTimingDelays: false,
    customStructure: []
};

export { TestDataOptions, SuiteStructure, GeneratedTestData, DEFAULT_OPTIONS };
