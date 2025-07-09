import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";

/**
 * Configuration options for generating test data
 */
export interface TestDataOptions {
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
export interface SuiteStructure {
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
export interface GeneratedTestData {
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

/**
 * Generates a random duration between min and max
 */
function randomDuration(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Adds a realistic timing delay (busy wait)
 */
function addDelay(microseconds: number): void {
    const milliseconds = microseconds / 1000;
    const start = Date.now();
    while (Date.now() - start < milliseconds) {
        // Busy wait
    }
}

/**
 * Creates a simple flat structure with multiple suites and tests
 */
export function createSimpleTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const info: GeneratedTestData = {
        totalTests: 0,
        totalSuites: 0,
        maxDepthAchieved: 1,
        testPaths: [],
        suitePaths: [],
        suiteTestCounts: new Map()
    };

    for (let suiteIndex = 1; suiteIndex <= opts.numSuites; suiteIndex++) {
        const suiteName = `${opts.suiteNamePrefix}${suiteIndex}`;
        const suitePath = [suiteName];

        info.suitePaths.push([...suitePath]);
        info.totalSuites++;
        info.suiteTestCounts.set(suitePath.join('/'), opts.testsPerSuite);

        for (let testIndex = 1; testIndex <= opts.testsPerSuite; testIndex++) {
            const testName = `${opts.testNamePrefix}${testIndex}`;
            const testPath = [...suitePath, testName];

            if (metrics instanceof ConcurrentSuiteMetrics) {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomDuration(opts.minDuration, opts.maxDuration);
                    addDelay(duration);
                }
                metrics.stopTest(testPath);
            } else {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomDuration(opts.minDuration, opts.maxDuration);
                    addDelay(duration);
                }
                metrics.stopTest();
            }

            info.testPaths.push(testPath);
            info.totalTests++;
        }
    }

    return info;
}

/**
 * Creates a nested structure with multiple levels of suites
 */
export function createNestedTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const info: GeneratedTestData = {
        totalTests: 0,
        totalSuites: 0,
        maxDepthAchieved: 0,
        testPaths: [],
        suitePaths: [],
        suiteTestCounts: new Map()
    };

    function createNestedLevel(currentPath: string[], depth: number): void {
        if (depth > opts.maxDepth) return;

        info.maxDepthAchieved = Math.max(info.maxDepthAchieved, depth);

        // Create tests at this level
        const testsAtThisLevel = depth === opts.maxDepth ? opts.testsPerSuite : Math.max(1, Math.floor(opts.testsPerSuite / 2));
        info.suiteTestCounts.set(currentPath.join('/'), testsAtThisLevel);

        for (let testIndex = 1; testIndex <= testsAtThisLevel; testIndex++) {
            const testName = `${opts.testNamePrefix}${testIndex}`;
            const testPath = [...currentPath, testName];

            if (metrics instanceof ConcurrentSuiteMetrics) {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomDuration(opts.minDuration, opts.maxDuration);
                    addDelay(duration);
                }
                metrics.stopTest(testPath);
            } else {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomDuration(opts.minDuration, opts.maxDuration);
                    addDelay(duration);
                }
                metrics.stopTest();
            }

            info.testPaths.push(testPath);
            info.totalTests++;
        }

        // Create sub-suites if we haven't reached max depth
        if (depth < opts.maxDepth) {
            for (let subSuiteIndex = 1; subSuiteIndex <= opts.subSuitesPerSuite; subSuiteIndex++) {
                const subSuiteName = `${opts.suiteNamePrefix}${depth + 1}_${subSuiteIndex}`;
                const subSuitePath = [...currentPath, subSuiteName];

                info.suitePaths.push([...subSuitePath]);
                info.totalSuites++;

                createNestedLevel(subSuitePath, depth + 1);
            }
        }
    }

    // Create top-level suites
    for (let suiteIndex = 1; suiteIndex <= opts.numSuites; suiteIndex++) {
        const suiteName = `${opts.suiteNamePrefix}${suiteIndex}`;
        const suitePath = [suiteName];

        info.suitePaths.push([...suitePath]);
        info.totalSuites++;

        createNestedLevel(suitePath, 1);
    }

    return info;
}

/**
 * Creates test data from a custom structure definition
 */
export function createCustomTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    structure: SuiteStructure[],
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const info: GeneratedTestData = {
        totalTests: 0,
        totalSuites: 0,
        maxDepthAchieved: 0,
        testPaths: [],
        suitePaths: [],
        suiteTestCounts: new Map()
    };

    function processStructure(suiteStructure: SuiteStructure): void {
        const { suitePath, tests, subSuites = [] } = suiteStructure;

        info.maxDepthAchieved = Math.max(info.maxDepthAchieved, suitePath.length);
        info.suitePaths.push([...suitePath]);
        info.totalSuites++;
        info.suiteTestCounts.set(suitePath.join('/'), tests.length);

        // Create tests in this suite
        for (const testName of tests) {
            const testPath = [...suitePath, testName];

            if (metrics instanceof ConcurrentSuiteMetrics) {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomDuration(opts.minDuration, opts.maxDuration);
                    addDelay(duration);
                }
                metrics.stopTest(testPath);
            } else {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomDuration(opts.minDuration, opts.maxDuration);
                    addDelay(duration);
                }
                metrics.stopTest();
            }

            info.testPaths.push(testPath);
            info.totalTests++;
        }

        // Process sub-suites
        for (const subSuite of subSuites) {
            processStructure(subSuite);
        }
    }

    for (const suiteStructure of structure) {
        processStructure(suiteStructure);
    }

    return info;
}

/**
 * Creates a large dataset for performance testing
 */
export function createLargeTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {
        ...DEFAULT_OPTIONS,
        numSuites: 10,
        testsPerSuite: 20,
        maxDepth: 3,
        subSuitesPerSuite: 3,
        addTimingDelays: false, // Disable delays for performance
        ...options
    };

    return createNestedTestData(metrics, opts);
}

/**
 * Creates test data with realistic timing variations
 */
export function createRealisticTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {
        ...DEFAULT_OPTIONS,
        addTimingDelays: true,
        minDuration: 500,   // 0.5ms
        maxDuration: 50000, // 50ms
        ...options
    };

    return createNestedTestData(metrics, opts);
}

/**
 * Creates a complex mixed structure with various patterns
 */
export function createComplexTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const complexStructure: SuiteStructure[] = [
        {
            suitePath: ["Authentication"],
            tests: ["login", "logout", "password_reset"],
            subSuites: [
                {
                    suitePath: ["Authentication", "OAuth"],
                    tests: ["google_login", "github_login"],
                },
                {
                    suitePath: ["Authentication", "TwoFactor"],
                    tests: ["sms_verification", "app_verification"],
                }
            ]
        },
        {
            suitePath: ["API"],
            tests: ["health_check"],
            subSuites: [
                {
                    suitePath: ["API", "Users"],
                    tests: ["create_user", "get_user", "update_user", "delete_user"],
                    subSuites: [
                        {
                            suitePath: ["API", "Users", "Validation"],
                            tests: ["email_validation", "password_strength"],
                        }
                    ]
                },
                {
                    suitePath: ["API", "Posts"],
                    tests: ["create_post", "get_posts", "update_post"],
                }
            ]
        },
        {
            suitePath: ["Frontend"],
            tests: ["page_load"],
            subSuites: [
                {
                    suitePath: ["Frontend", "Components"],
                    tests: ["button_click", "form_submission", "modal_display"],
                },
                {
                    suitePath: ["Frontend", "Navigation"],
                    tests: ["menu_navigation", "breadcrumb_display"],
                }
            ]
        }
    ];

    return createCustomTestData(metrics, complexStructure, opts);
}

/**
 * Utility function to get a fresh concurrent metrics instance
 */
export function getFreshConcurrentMetrics(): ConcurrentSuiteMetrics {
    return new ConcurrentSuiteMetrics();
}

/**
 * Creates test data with specific characteristics for edge case testing
 */
export function createEdgeCaseTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const edgeCaseStructure: SuiteStructure[] = [
        // Suite with special characters
        {
            suitePath: ["Suite with spaces & symbols!@#$%^&*()"],
            tests: ["Test with spaces", "Test!@#$%^&*()"],
        },
        // Suite with unicode characters
        {
            suitePath: ["测试套件 🧪 тест"],
            tests: ["测试 🧪", "тест"],
        },
        // Very long names
        {
            suitePath: ["A".repeat(100)],
            tests: ["B".repeat(100)],
        },
        // Numeric-looking names
        {
            suitePath: ["0", "1"],
            tests: ["2", "3"],
        },
        // Whitespace names (but not empty)
        {
            suitePath: ["   ", "\t\n "],
            tests: [" test ", "\ttest\n"],
        },
        // Case sensitivity tests
        {
            suitePath: ["CaseSuite"],
            tests: ["TestName", "testname", "TESTNAME"],
        }
    ];

    return createCustomTestData(metrics, edgeCaseStructure, opts);
}
