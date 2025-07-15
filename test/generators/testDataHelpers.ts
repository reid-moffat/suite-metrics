import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";
import { TestDataOptions, SuiteStructure, GeneratedTestData, DEFAULT_OPTIONS } from "./options.ts";
import { randomInt } from "../helpers.ts";
import { realisticStructure, edgeCaseStructure } from "./presets.ts";
import { _MockConcurrentSuiteMetrics, _MockSuiteMetrics } from "./mocks.js";

/**
 * Creates a simple flat structure with multiple suites and tests
 */
function createSimpleTestData(
    isConcurrent: boolean = false,
    options: Partial<TestDataOptions> = {}
): _MockSuiteMetrics | _MockConcurrentSuiteMetrics {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const metrics: _MockSuiteMetrics | _MockConcurrentSuiteMetrics =
        isConcurrent
            ? new _MockConcurrentSuiteMetrics()
            : new _MockSuiteMetrics();

    for (let suiteIndex: number = 1; suiteIndex <= opts.numSuites; suiteIndex++) {
        const suiteName = `${opts.suiteNamePrefix}${suiteIndex}`;
        const suitePath: string[] = [suiteName];

        for (let testIndex: number = 1; testIndex <= opts.testsPerSuite; testIndex++) {
            const testName = `${opts.testNamePrefix}${testIndex}`;
            const testPath: string[] = [...suitePath, testName];

            const duration: number = randomInt(opts.minDuration, opts.maxDuration);
            metrics.addMockTest(testPath, duration);
        }
    }

    return metrics;
}

/**
 * Creates a nested structure with multiple levels of suites
 */
function createNestedTestData(
    isConcurrent: boolean = false,
    options: Partial<TestDataOptions> = {}
): _MockSuiteMetrics | _MockConcurrentSuiteMetrics {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const metrics: _MockSuiteMetrics | _MockConcurrentSuiteMetrics =
        isConcurrent
            ? new _MockConcurrentSuiteMetrics()
            : new _MockSuiteMetrics();

    function createNestedLevel(currentPath: string[], depth: number): void {
        if (depth > opts.maxDepth) return;

        // Create tests at this level
        const testsAtThisLevel = depth === opts.maxDepth ? opts.testsPerSuite : Math.max(1, Math.floor(opts.testsPerSuite / 2));

        for (let testIndex = 1; testIndex <= testsAtThisLevel; testIndex++) {
            const testName = `${opts.testNamePrefix}${testIndex}`;
            const testPath = [...currentPath, testName];

            const duration: number = randomInt(opts.minDuration, opts.maxDuration);
            metrics.addMockTest(testPath, duration);
        }

        // Create sub-suites if we haven't reached max depth
        if (depth < opts.maxDepth) {
            for (let subSuiteIndex = 1; subSuiteIndex <= opts.subSuitesPerSuite; subSuiteIndex++) {
                const subSuiteName = `${opts.suiteNamePrefix}${depth + 1}_${subSuiteIndex}`;
                const subSuitePath = [...currentPath, subSuiteName];

                createNestedLevel(subSuitePath, depth + 1);
            }
        }
    }

    // Create top-level suites
    for (let suiteIndex = 1; suiteIndex <= opts.numSuites; suiteIndex++) {
        const suiteName = `${opts.suiteNamePrefix}${suiteIndex}`;
        const suitePath = [suiteName];

        createNestedLevel(suitePath, 1);
    }

    return metrics;
}

/**
 * Creates test data from a custom structure definition
 */
function createCustomTestData(
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

enum PRESET_TYPE {
    /** Default settings, creates a few suites and tests */
    NORMAL,

    /** Large amount of data (600 tests) randomly generated */
    LARGE_SUITE,

    /** Hardcoded realistic small data (auth, API, frontend) */
    REALISTIC_PREMADE,

    /** A bunch of weird cases: numeric paths, unicode (e.g. 测), long names, etc */
    EDGE_CASES
}

/**
 * Creates test data based on various presets
 */
function createPresetData(
    isConcurrent: boolean = false,
    preset: PRESET_TYPE
): _MockSuiteMetrics | _MockConcurrentSuiteMetrics {

    switch (preset) {
        case PRESET_TYPE.NORMAL:
            const normalOpts = {
                ...DEFAULT_OPTIONS,
                addTimingDelays: true,
                minDuration: 500,
                maxDuration: 50_000,
            };

            return createNestedTestData(isConcurrent, normalOpts);
        case PRESET_TYPE.LARGE_SUITE:
            const largeOpts = {
                ...DEFAULT_OPTIONS,
                numSuites: 20,
                testsPerSuite: 30,
                maxDepth: 3,
                subSuitesPerSuite: 3,
                addTimingDelays: false
            };

            return createNestedTestData(isConcurrent, largeOpts);
        case PRESET_TYPE.REALISTIC_PREMADE:
            return createCustomTestData(isConcurrent, realisticStructure);
        case PRESET_TYPE.EDGE_CASES:
            return createCustomTestData(isConcurrent, edgeCaseStructure);
        default:
            throw new Error(`createPresetData: Case for enum '${preset}' has not be defined`);
    }
}

export {
    TestDataOptions,
    SuiteStructure,
    GeneratedTestData,
    createSimpleTestData,
    createNestedTestData,
    createCustomTestData,
    createPresetData,
    PRESET_TYPE
};
