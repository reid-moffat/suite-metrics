import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";
import { TestDataOptions, SuiteStructure, GeneratedTestData, DEFAULT_OPTIONS } from "./options.ts";
import { randomInt } from "../helpers.ts";
import { realisticStructure, edgeCaseStructure } from "./presets.ts";

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
    metrics: SuiteMetrics | ConcurrentSuiteMetrics,
    preset: PRESET_TYPE
): GeneratedTestData {

    switch (preset) {
        case PRESET_TYPE.NORMAL:
            const normalOpts = {
                ...DEFAULT_OPTIONS,
                addTimingDelays: true,
                minDuration: 500,
                maxDuration: 50_000,
            };

            return createNestedTestData(metrics, normalOpts);
        case PRESET_TYPE.LARGE_SUITE:
            const largeOpts = {
                ...DEFAULT_OPTIONS,
                numSuites: 20,
                testsPerSuite: 30,
                maxDepth: 3,
                subSuitesPerSuite: 3,
                addTimingDelays: false
            };

            return createNestedTestData(metrics, largeOpts);
        case PRESET_TYPE.REALISTIC_PREMADE:
            return createCustomTestData(metrics, realisticStructure);
        case PRESET_TYPE.EDGE_CASES:
            return createCustomTestData(metrics, edgeCaseStructure);
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
