import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";
import { TestDataOptions, SuiteStructure, GeneratedTestData, DEFAULT_OPTIONS } from "./options.ts";
import { randomInt } from "../helpers";

/**
 * Creates a simple flat structure with multiple suites and tests
 */
function createSimpleTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {...DEFAULT_OPTIONS, ...options};
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
                    const duration = randomInt(opts.minDuration, opts.maxDuration);
                    // add delay...
                }
                metrics.stopTest(testPath);
            } else {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomInt(opts.minDuration, opts.maxDuration);
                    // add delay...
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
function createNestedTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {...DEFAULT_OPTIONS, ...options};
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
                    const duration = randomInt(opts.minDuration, opts.maxDuration);
                    // add delay...
                }
                metrics.stopTest(testPath);
            } else {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomInt(opts.minDuration, opts.maxDuration);
                    // add delay...
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
function createCustomTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    structure: SuiteStructure[],
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {...DEFAULT_OPTIONS, ...options};
    const info: GeneratedTestData = {
        totalTests: 0,
        totalSuites: 0,
        maxDepthAchieved: 0,
        testPaths: [],
        suitePaths: [],
        suiteTestCounts: new Map()
    };

    function processStructure(suiteStructure: SuiteStructure): void {
        const {suitePath, tests, subSuites = []} = suiteStructure;

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
                    const duration = randomInt(opts.minDuration, opts.maxDuration);
                    // add delay...
                }
                metrics.stopTest(testPath);
            } else {
                metrics.startTest(testPath);
                if (opts.addTimingDelays) {
                    const duration = randomInt(opts.minDuration, opts.maxDuration);
                    // add delay...
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
function createLargeTestData(
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
function createRealisticTestData(
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
function createComplexTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {...DEFAULT_OPTIONS, ...options};

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
 * Creates test data with specific characteristics for edge case testing
 */
function createEdgeCaseTestData(
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    options: Partial<TestDataOptions> = {}
): GeneratedTestData {
    const opts = {...DEFAULT_OPTIONS, ...options};

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

export {
    TestDataOptions,
    SuiteStructure,
    GeneratedTestData,
    createSimpleTestData,
    createNestedTestData,
    createCustomTestData,
    createLargeTestData,
    createRealisticTestData,
    createComplexTestData,
    createEdgeCaseTestData
};
