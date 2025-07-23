import { SuiteData, RecursiveSuiteData, Metrics } from "../types/returnTypes.ts";
import { Test, Suite } from "../types/structures.ts";

/**
 * Base class providing common functionality for both suite metrics implementations
 */
abstract class BaseSuiteMetrics {

    // All suite and test data
    protected readonly suites: Map<string, Suite> = new Map<string, Suite>();

    // Top-level suite makes top-level metrics and functions easier to handle
    private readonly topLevelSuite: Suite = {
        name: "<Top-Level suite>",
        tests: new Map<string, Test>(),
        subSuites: this.suites,
        subSuiteData: {
            numSubTests: 0,
            subTestTotalTime: 0
        }
    };

    // Total number of completed tests in this instance
    protected testCounter: number = 0;

    // Lazy sorted duration array
    private allTests: Test[] = [];
    private cachedSortedTests: Test[] | null = null;
    private sortedCacheValid: boolean = false;

    // Batch invalidation for lazy sorted array
    private newTestsSinceLastSort: number = 0;
    private lastSortTimestamp: number = Date.now();
    private readonly BATCH_SIZE_THRESHOLD: number = 100; // New tests required before forced rebuild
    private readonly TIME_THRESHOLD_MS: number = 5 * 60 * 1000; // Time between forced rebuild


    /**
     * Validates a test or suite path, throwing an error is invalid
     *
     * @param path Path to the specified suite or test
     * @param allowTopLevel Set to true to allow the top-level suite, [], to be valid (default: false)
     * @throws Error if the provided path is invalid (not an array of strings, contains empty/whitespace elements, or
     * empty if allowTopLevel is false)
     */
    public static validatePath(path: string[], allowTopLevel: boolean): void {

        if (!Array.isArray(path)) {
            throw new Error('Suite/test path must be an array');
        }

        if (!allowTopLevel && path.length === 0) {
            throw new Error('Path cannot be empty, must define at least one suite/test');
        }

        // Check each segment individually to provide specific error locations
        for (let i: number = 0; i < path.length; i++) {
            const segment: any = path[i];

            if (typeof segment !== "string") {
                throw new Error(`Suite/test path element at index ${i} must be a 'string', got '${typeof segment}'`);
            }

            if (segment.length === 0) {
                throw new Error(`Suite/test path element at index ${i} cannot be empty`);
            }

            if (segment.trim().length === 0) {
                throw new Error(`Suite/test path element at index ${i} cannot be whitespace-only`);
            }
        }
    }

    /**
     * Converts a suite or test path to a readable string
     *
     * Note: This does not validate the path. Call validatePath to do so
     *
     * @param path Path to the desired suite or test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns Path joined with a comma a space, enclosed in square brackets. E.g. '[suite 1, sub-suite 2, test 3]'
     */
    public static pathToString(path: string[]): string {
        return `[${path.join(", ")}]`;
    }

    /**
     * Gets the total number of completed tests across all suites
     *
     * @returns The total number of completed tests in this metrics instance
     */
    public getTotalTestCount(): number {
        return this.testCounter;
    }

    /**
     * Checks if a given suite exists
     *
     * @param suitePath Path to check for, e.g. ['suite 1', 'sub-suite 2']
     * @returns true if the suite exists, false if not
     */
    public suiteExists(suitePath: string[]): boolean {
        BaseSuiteMetrics.validatePath(suitePath, true);
        return this.pathExists(suitePath, false);
    }

    /**
     * Checks if a given test exists
     *
     * @param testPath Path to check for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns true if the suite exists, false if not
     */
    public testExists(testPath: string[]): boolean {
        BaseSuiteMetrics.validatePath(testPath, false);
        return this.pathExists(testPath, true);
    }

    /**
     * Returns an array of all the test names in a given suite. Top-level suite ([]) allowed
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns An array of all tests in this suite (not including sub-suites)
     */
    public getTestNames(path: string[]): string[] {
        BaseSuiteMetrics.validatePath(path, true);

        const suite: Suite = this.navigateToSuite(path);

        return Array.from(suite.tests.keys());
    }

    /**
     * Returns an array of all the sub-suites names in a given suite. Top-level suite ([]) allowed
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns An array of all sub-suites directly in this suite (not recursive)
     */
    public getSuiteNames(path: string[]): string[] {
        BaseSuiteMetrics.validatePath(path, true);

        const suite: Suite = this.navigateToSuite(path);

        return Array.from(suite.subSuites.keys());
    }

    /**
     * Gets the slowest test across all suites
     *
     * @returns The test with the longest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getSlowestTest(): Test {
        if (this.getTotalTestCount() === 0) {
            throw new Error(`Error: There are no tests in this metrics instance, could not get the slowest test`);
        }

        this.ensureSortedCache();
        return this.cachedSortedTests![0];
    }

    /**
     * Gets the n slowest tests across all suites, sorted by duration descending
     *
     * Note: If n is greater than the total amount of tests (getTotalTestCount()), this method will still run
     * (no error) but just return a smaller array
     *
     * @param n Number of slowest tests to return. Must be a positive integer
     * @returns Array of the (<=) n slowest tests, sorted by duration descending
     * @throws Error If n is not a positive integer
     */
    public getNSlowestTests(n: number): Test[] {
        if (!Number.isInteger(n) || n <= 0) {
            throw new Error('Number of tests (n) must be a positive integer');
        }

        this.ensureSortedCache();
        return this.cachedSortedTests!.slice(0, Math.min(n, this.cachedSortedTests!.length));
    }

    /**
     * Gets the fastest test across all suites
     *
     * @returns The test with the shortest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getFastestTest(): Test {
        if (this.getTotalTestCount() === 0) {
            throw new Error(`Error: There are no tests in this metrics instance, could not get the slowest test`);
        }

        this.ensureSortedCache();
        return this.cachedSortedTests![this.cachedSortedTests!.length - 1];
    }

    /**
     * Gets the n fastest tests across all suites, sorted by duration ascending
     *
     * Note: If n is greater than the total amount of tests (getTotalTestCount()), this method will still run
     * (no error) but just return a smaller array
     *
     * @param n Number of fastest tests to return. Must be a positive integer
     * @returns Array of the (<=) n fastest tests, sorted by duration ascending
     * @throws Error If n is not a positive integer
     */
    public getNFastestTests(n: number): Test[] {
        if (!Number.isInteger(n) || n <= 0) {
            throw new Error('Number of tests (n) must be a positive integer');
        }

        this.ensureSortedCache();
        const startIndex: number = Math.max(0, this.cachedSortedTests!.length - n);
        return this.cachedSortedTests!.slice(startIndex).reverse();
    }

    /**
     * Gets metrics for a specific test
     *
     * @param path Path to get metrics for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns An object with test's name, timestamps, durations, and number
     */
    public getTestMetrics(path: string[]): Test {
        BaseSuiteMetrics.validatePath(path, false);
        const suite: Suite = this.navigateToSuite(path, { isTestPath: true });
        const testName: string = path[path.length - 1];

        const test: Test | undefined = suite.tests.get(testName);
        if (test === undefined) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} does not exist`);
        }

        return { ...test }; // Return a copy to prevent external modification
    }

    /**
     * Gets metrics for a specific suite
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']. Top-level suite ([]) allowed
     * @returns An object with suite's name, parent/sub-suites, and test statistics
     */
    public getSuiteMetrics(path: string[]): SuiteData {
        BaseSuiteMetrics.validatePath(path, true);
        const suite: Suite = this.navigateToSuite(path);
        const testMetrics: Metrics = this.calculateDirectTestMetrics(suite);

        return {
            name: suite.name,
            parentSuites: path.slice(0, -1),
            subSuites: Array.from(suite.subSuites.keys()),
            testMetrics
        };
    }

    /**
     * Gets metrics for a given suite and its sub-suites
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']. Top-level suite ([]) allowed
     * @returns An object with suite metadata, and metrics for direct & subtests
     */
    public getSuiteMetricsRecursive(path: string[]): RecursiveSuiteData {
        BaseSuiteMetrics.validatePath(path, true);
        const suite: Suite = this.navigateToSuite(path);

        // Direct metrics: Test and duration data for just the tests directly in this suite
        const directMetrics: Metrics = this.calculateDirectTestMetrics(suite);

        // Total metrics: Test and duration data for all tests in this suite and all sub-suites
        const totalTests: number = suite.subSuiteData.numSubTests;
        const totalTime: number = suite.subSuiteData.subTestTotalTime;
        const averageTotalTime: number = totalTests === 0 ? 0 : totalTime / totalTests;
        const totalMetrics: Metrics = {
            numTests: totalTests,
            totalTime: totalTime,
            averageTime: averageTotalTime
        };

        // Sub metrics: Test and duration data for all tests in all sub-suites (but not this suite directly)
        const subTests: number = totalTests - directMetrics.numTests;
        const subTime: number = totalTime - directMetrics.totalTime;
        const averageSubTime: number = subTests === 0 ? 0 : subTime / subTests;
        const subMetrics: Metrics = {
            numTests: subTests,
            totalTime: subTime,
            averageTime: averageSubTime
        };

        return {
            name: suite.name,
            parentSuites: path.slice(0, -1),
            subSuites: Array.from(suite.subSuites.keys()),

            directTestMetrics: directMetrics,
            subTestMetrics: subMetrics,
            totalTestMetrics: totalMetrics
        };
    }

    /**
     * Returns a formatted string with all suite's data regarding tests
     *
     * @param topLevelSuite Include a top-level suite with all suite data summed up at the top (default: true)
     * @returns Formatted string (warning: may be very long for large contexts)
     */
    public printAllSuiteMetrics(topLevelSuite: boolean = true): string {
        const lines: string[] = [];

        if (topLevelSuite) {
            this.formatSuiteForPrint(this.topLevelSuite, lines, 0);
        } else {
            for (const suite of this.suites.values()) {
                this.formatSuiteForPrint(suite, lines, 0);
            }
        }

        return lines.join('\n');
    }


    /**
     * Navigates to (and returns) a suite in the hierarchy, optionally creating missing suites
     *
     * @param path Path of the suite to navigate to (can be a test path with isTestPath, see below)
     * @param options Optional flags for specific cases
     * @param options.createIfMissing Set to true to create the suite and all parent suites above it if required (default: false)
     * @param options.isTestPath Set to true if the path is a test (default: false). Will use the test's suite
     */
    protected navigateToSuite(path: string[], options: { createIfMissing?: boolean; isTestPath?: boolean; } = {}): Suite {
        const { createIfMissing = false, isTestPath = false } = options;
        const suitePath: string[] = isTestPath ? path.slice(0, -1) : path;

        let currentSuite: Suite = this.topLevelSuite;

        for (const suiteName of suitePath) {
            let targetSuite: Suite | undefined = currentSuite.subSuites.get(suiteName);
            if (targetSuite === undefined) {
                if (!createIfMissing) {
                    throw new Error(`Suite path ${BaseSuiteMetrics.pathToString(suitePath)} does not exist`);
                }

                targetSuite = {
                    name: suiteName,
                    tests: new Map<string, Test>(),
                    subSuites: new Map<string, Suite>(),
                    subSuiteData: {
                        numSubTests: 0,
                        subTestTotalTime: 0
                    }
                };
                currentSuite.subSuites.set(suiteName, targetSuite);
            }
            currentSuite = targetSuite;
        }

        return currentSuite;
    }

    /**
     * Checks if a suite or test exists at the given path
     *
     * @param path Path to check if exists
     * @param isTest Specifies if this is checking for a test (false to check for a suite)
     */
    private pathExists(path: string[], isTest: boolean): boolean {
        try {
            if (isTest) {
                const suite: Suite = this.navigateToSuite(path, { isTestPath: true });
                const testName: string = path[path.length - 1];
                return suite.tests.has(testName);
            } else {
                this.navigateToSuite(path);
                return true;
            }
        } catch {
            return false;
        }
    }

    /**
     * Stores a completed test's data in this metrics instance
     *
     * @param testPath Path to this test
     * @param startTime Time the test was started at
     * @param endTime Time the test was completed at
     */
    protected addTest(testPath: string[], startTime: number, endTime: number): void {
        const suite: Suite = this.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });
        const testName: string = testPath[testPath.length - 1];
        const testDuration: number = endTime - startTime;

        const test: Test = {
            name: testName,
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: testDuration,
            testNumber: ++this.testCounter,
            suiteTestNumber: suite.tests.size + 1,
            path: testPath
        };

        // Add test to the map and update counters for parent suites
        suite.tests.set(testName, test);
        this.updateSubTestCounters(testPath, testDuration);

        // Add to flat array and invalidate cache
        this.allTests.push(test);
        this.invalidateCache();
    }

    /**
     * Invalidates the sorted cache and updates batch tracking
     */
    private invalidateCache(): void {
        this.sortedCacheValid = false;
        this.newTestsSinceLastSort++;
    }

    /**
     * Rebuilds the sorted cache
     */
    private rebuildSortedCache(): void {
        // Sort by duration in descending order (slowest goes first)
        this.cachedSortedTests = [...this.allTests].sort((a: Test, b: Test) => b.duration - a.duration);
        this.sortedCacheValid = true;
        this.newTestsSinceLastSort = 0;
        this.lastSortTimestamp = Date.now();
    }

    /**
     * Ensures sorted cache is built and valid
     */
    private ensureSortedCache(): void {
        const now: number = Date.now();
        const timeThresholdExceeded: boolean = (now - this.lastSortTimestamp) > this.TIME_THRESHOLD_MS;
        const batchThresholdExceeded: boolean = this.newTestsSinceLastSort >= this.BATCH_SIZE_THRESHOLD;

        if (!this.sortedCacheValid || timeThresholdExceeded || batchThresholdExceeded) {
            this.rebuildSortedCache();
        }
    }

    /**
     * Updates the subtest counter (test #s & time) for all suites above this test (including the direct parent suite)
     *
     * @param testPath Path of the test to update parent suites for
     * @param duration Duration of the test
     */
    private updateSubTestCounters(testPath: string[], duration: number): void {
        // Add time and counter to top-level suite
        let currentSuite: Suite = this.topLevelSuite;
        currentSuite.subSuiteData.numSubTests++;
        currentSuite.subSuiteData.subTestTotalTime += duration;

        // Add time and counter to each parent suite
        for (const suiteName of testPath.slice(0, -1)) {
            currentSuite = currentSuite.subSuites.get(suiteName)!;
            if (currentSuite === undefined) {
                throw new Error(`Error updating counters: suite '${suiteName}' not found`);
            }

            currentSuite.subSuiteData.numSubTests++;
            currentSuite.subSuiteData.subTestTotalTime += duration;
        }
    }

    /**
     * Calculates metrics for all tests directly in a suite
     *
     * @param suite Suite object to calculate metrics for
     */
    private calculateDirectTestMetrics(suite: Suite): Metrics {
        const numTests: number = suite.tests.size;

        if (numTests === 0) {
            return { numTests: 0, totalTime: 0, averageTime: 0 };
        }

        const totalTime: number = Array.from(suite.tests.values())
            .reduce((sum: number, test: Test): number => sum + test.duration, 0);

        return {
            numTests,
            totalTime,
            averageTime: totalTime / numTests
        };
    }

    /**
     * Formats suite information for printing
     *
     * @param suite Suite object to get information for
     * @param lines Current array of lines (pass [] on initial call)
     * @param indentLevel Number of indents for each level of information separation
     */
    private formatSuiteForPrint(suite: Suite, lines: string[], indentLevel: number): void {
        const indent: string = ' '.repeat(indentLevel);
        const directTestCount: number = suite.tests.size;
        const directTestDuration: number = Array.from(suite.tests.values())
            .reduce((sum: number, test: Test): number => sum + test.duration, 0);

        lines.push(`${indent}Suite: ${suite.name}`);
        lines.push(`${indent}  Summary:`);
        lines.push(`${indent}    - Total direct tests: ${directTestCount}`);
        lines.push(`${indent}      Total duration: ${(directTestDuration / 1000).toFixed(3)} ms`);
        lines.push(`${indent}    - Total direct Sub-Suites: ${suite.subSuites.size}`);
        lines.push(`${indent}    - Total Sub-Suite tests: ${suite.subSuiteData.numSubTests}`);
        lines.push(`${indent}    - Total Sub-Suite time: ${(suite.subSuiteData.subTestTotalTime / 1000).toFixed(3)} ms`);

        if (suite.tests && suite.tests.size > 0) {
            lines.push(`\n${indent}  Tests:`);
            let testNumber: number = 1;
            for (const test of suite.tests.values()) {
                lines.push(`${indent}    ${testNumber++}) '${test.name}': ${(test.duration / 1000).toFixed(2)} ms`);
            }
        }

        if (suite.subSuites && suite.subSuites.size > 0) {
            lines.push(`\n${indent}  Sub-Suites:`);
            for (const subSuite of suite.subSuites.values()) {
                this.formatSuiteForPrint(subSuite, lines, indentLevel + 4);
            }
        }
    }
}

export default BaseSuiteMetrics;
