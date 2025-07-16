/**
 * A completed test's structure in suite metrics
 *
 * Include the test's name, start/end time & duration, overall test number, and test number within this suite
 */
type Test = {
    readonly name: string;
    readonly startTimestamp: number;
    readonly endTimestamp: number;
    readonly duration: number;
    readonly testNumber: number;
    readonly suiteTestNumber: number;
};

/**
 * A test suite's structure in suite metrics
 *
 * Includes the suite's name, tests in the suite, sub-suites this suite has, and the number of tests in sub-suites
 */
type Suite = {
    readonly name: string;
    readonly tests: Map<string, Test>;
    readonly subSuites: Map<string, Suite>;
    numSubTests: number;
};

/**
 * Returned data for a given suite's metrics
 *
 * Includes the suite's name, its parent and child suites, and metrics for the tests directly inside it
 */
type SuiteData = {
    readonly name: string;
    readonly parentSuites: string[];
    readonly childSuites: string[];
    readonly testMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number;
    }
};

/**
 * Returned data for a given suite's metrics, including tests in sub-suites
 *
 * Includes the suite's name, its parent and child suites, metrics for the tests directly inside it, sub-suite test
 * metrics, and overall test metrics
 */
type RecursiveSuiteData = {
    readonly name: string;
    readonly parentSuites: string[];
    readonly childSuites: string[];
    readonly directTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
    readonly subTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
    readonly totalTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
};

export type { Test, Suite, SuiteData, RecursiveSuiteData };
