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
    /** Aggregate data for suites (note: the top-level suite is excluded as this is only for navigation) */
    suites: {
        /** Total number of suites */
        numSuites: number,
        /** Number of suites without any sub-suites (only tests) */
        numLeaves: number,
        /** Number of suites without any tests (only sub-suites) */
        numBranches: number;
        /** Number of suites with both sub-suite(s) and test(s) */
        numHybrid: number

        /** Average number of tests per suite */
        averageTestsPerSuite: number,
        /** Average number of tests per suite that has tests */
        averageTestsPerNonEmptySuite: number,
        /** Maximum suite depth (e.g. ['suite 1', 'suite 2'] -> 2), or -1 if no suites */
        maxDepth: number,
        /** Minimum depth for a suite with tests, or Number.MAX_SAFE_INTEGER if no tests */
        minDepth: number,
        /** Average depth for suites with tests */
        averageDepth: number,
        /** Average depth for suites with tests, weighted by the number of tests per suite */
        averageDepthWeighted: number,
    },
    /** Aggregate data for test timings */
    timing: {
        /** Time in microseconds between the first test starting and last test ending (includes non-testing time) */
        totalTimeDiff: number,
        /** Total duration of all tests combined in microseconds */
        totalTestDuration: number,
        /** Percent of the total time difference from tests running. This can show overhead or other non-test delays */
        percentActive: number,
        /** Average duration for all tests */
        averageDuration: number,
        /** Median duration for all tests */
        medianDuration: number
    }
}

export type { SuiteTestMetrics, SuiteData, StructureMetadata };
