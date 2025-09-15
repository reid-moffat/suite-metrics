/**
 * Metric type for returned data: total # tests, total time, and average time for a given suite (or suites)
 *
 * Used to package test metrics together for suite/suites, such as getSuiteMetrics and getSuiteMetricsRecursive
 */
type SuiteTestMetrics = {
    /** Number of tests in the given suite(s) */
    readonly numTests: number,
    /** Total time for all tests in the given suite(s) */
    readonly totalTime: number,
    /** Average time for all tests in the given suite(s) */
    readonly averageTime: number
}

/**
 * Returned data for a given suite's metrics, including tests in sub-suites
 *
 * Includes the suite's name, its parent and sub-suites, metrics for the tests directly inside it, sub-suite test
 * metrics, and overall test metrics
 */
type SuiteData = {
    /** Name of this suite */
    readonly name: string;
    /** Parent suites of this suite, ordered from top to bottom. Note: top-level suite is not included */
    readonly parentSuites: string[];
    /** All sub-suite names directly within this suite (non-recursive) */
    readonly subSuites: string[];
    /** Test metrics (total # tests, total time, average time) for tests directly in this suite only (non-recursive) */
    readonly directTestMetrics: SuiteTestMetrics;
    /** Test metrics (total # tests, total time, average time) for tests in sub-suites only */
    readonly subTestMetrics: SuiteTestMetrics;
    /** Test metrics (total # tests, total time, average time) for all tests in this suite and all sub-suites */
    readonly totalTestMetrics: SuiteTestMetrics;
}

/**
 * High-level aggregate metadata regarding all suites and tests
 *
 * Includes metrics such as number of suites, max depth, and leaf
 */
type StructureMetadata = {
    suites: {
        numSuites: number,
        numEmptySuites: number;
        averageTestsPerSuite: number,
        averageTestsPerNonEmptySuite: number,
        maxDepth: number,
        minDepth: number,
        averageDepth: number,
        demographics: {
            numLeaves: number,
            numBranches: number,
            numHybrid: number
        }
    },
    timing: {
        totalTimeDiff: number,
        totalTestDuration: number,
        percentActive: number,
        averageDuration: number,
        medianDuration: number
    }
}

export type { SuiteTestMetrics, SuiteData, StructureMetadata };
