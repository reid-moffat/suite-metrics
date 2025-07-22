/**
 * A completed test's structure in suite metrics
 *
 * Include the test's name, start/end time & duration, overall test number, test number within this suite, and path
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
    /** Path to this test. E.g. ['suite 1', 'sub-suite 2', 'test 3'] */
    readonly path: string[];
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

    /** Stores aggregate test data from sub-suites to prevent the need for recursive calls */
    readonly subSuiteData: {
        /** Number of tests in this suite AND in all sub-suites of this suite */
        numSubTests: number;
        /** Total test time for all sub-suite tests */
        subTestTotalTime: number;
    };
};

export type { Test, Suite };
