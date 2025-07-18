/**
 * A completed test's structure in suite metrics
 *
 * Include the test's name, start/end time & duration, overall test number, and test number within this suite
 */
type Test = {
    /** The test's name. Determined during startTest(), this is unique for the suite it's in */
    readonly name: string;
    /** Timestamp the test began, in microseconds. Obtained at the end of startTest() for maximal accuracy */
    readonly startTimestamp: number;
    /** Timestamp the test ended at, in microseconds. Obtained at the beginning of stopTest() for maximal accuracy */
    readonly endTimestamp: number;
    /** Duration the test took, in microseconds. Equal to endTimestamp - startTimestamp */
    readonly duration: number;
    /** Order this test was completed in for all tests in any suite. E.g. 34th test of 150 -> 34 */
    readonly testNumber: number;
    /** Order this test was completed in for this suite. E.g. the 3rd of 6 test in the suite -> 3 */
    readonly suiteTestNumber: number;
};

/**
 * A test suite's structure in suite metrics
 *
 * Includes the suite's name, tests in the suite, sub-suites this suite has, and the number of tests in sub-suites
 */
type Suite = {
    /** The suite's name */
    readonly name: string;
    /** All tests directly in this suite (doesn't include sub-suites). Maps the test name to the Test type object */
    readonly tests: Map<string, Test>;
    /** All sub-suites directly within this suite (non-recursive). Maps the suite name to the Suite type object */
    readonly subSuites: Map<string, Suite>;
    /** Number of tests in this suite AND in all sub-suites of this suite */
    numSubTests: number;
};

/**
 * Metric type for returned data: total # tests, total time, and average time for a given suite (or suites)
 *
 * Used to package test metrics together for suite/suites, such as getSuiteMetrics and getSuiteMetricsRecursive
 */
type Metrics = {
    /** Number of tests in the given suite(s) */
    readonly numTests: number,
    /** Total time for all tests in the given suite(s) */
    readonly totalTime: number,
    /** Average time for all tests in the given suite(s) */
    readonly averageTime: number
}

/**
 * Returned data for a given suite's metrics
 *
 * Includes the suite's name, its parent and sub-suites, and metrics for the tests directly inside it
 */
type SuiteData = {
    /** Name of the suite */
    readonly name: string;
    /** Parent suites of this suite, ordered from top to bottom. Note: top-level suite is not included */
    readonly parentSuites: string[];
    /** All sub-suite names directly within this suite (non-recursive) */
    readonly subSuites: string[];
    /** Metrics for this suite's direct tests (not including sub-suites). Total # tests, total time, average time */
    readonly testMetrics: Metrics;
};

/**
 * Returned data for a given suite's metrics, including tests in sub-suites
 *
 * Includes the suite's name, its parent and sub-suites, metrics for the tests directly inside it, sub-suite test
 * metrics, and overall test metrics
 */
type RecursiveSuiteData = {
    /** Name of this suite */
    readonly name: string;
    /** Parent suites of this suite, ordered from top to bottom. Note: top-level suite is not included */
    readonly parentSuites: string[];
    /** All sub-suite names directly within this suite (non-recursive) */
    readonly subSuites: string[];
    /** Test metrics (total # tests, total time, average time) for tests directly in this suite only (non-recursive) */
    readonly directTestMetrics: Metrics;
    /** Test metrics (total # tests, total time, average time) for tests in sub-suites only */
    readonly subTestMetrics: Metrics;
    /** Test metrics (total # tests, total time, average time) for all tests in this suite and all sub-suites */
    readonly totalTestMetrics: Metrics;
}

export type { Test, Suite, Metrics, SuiteData, RecursiveSuiteData };
