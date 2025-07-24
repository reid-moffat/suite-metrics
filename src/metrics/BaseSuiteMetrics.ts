import { SuiteData, RecursiveSuiteData, Metrics } from "../types/returnTypes.ts";
import { Test, Suite } from "../types/structures.ts";
import SortedTestCache from "../helpers/SortedTestCache.ts";
import { SerializableSuite } from "../types/helpers.js";

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
        aggregateData: {
            numTests: 0,
            totalTestTime: 0
        }
    };

    // Total number of completed tests in this instance
    protected testCounter: number = 0;

    // Efficiently manages fastest and slowest tests
    private readonly testPerformance: SortedTestCache = new SortedTestCache();


    /**
     * Validates a test or suite path, throwing an error if invalid
     *
     * @param path Path to the specified suite or test
     * @param isTest Set to true if this path is for a test (will require an explicit Suite to be in)
     * @throws Error if the provided path is invalid (not an array of strings, contains empty/whitespace elements,
     * or a test without a suite/empty test)
     */
    public static validatePath(path: string[], isTest: boolean): void {

        if (!Array.isArray(path)) {
            throw new Error('Suite/test path must be an array');
        }

        if (isTest && path.length <= 1) {
            throw new Error('A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)');
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
     * Gets the average completion time for all tests in this metrics instance
     *
     * @returns The average test completion time, rounded to the nearest microsecond
     * @throws Error if there are no completed tests in this instance
     */
    public getAverageTestTime(): number {
        if (this.getTotalTestCount() === 0) {
            throw new Error(`There are no completed tests in this instance`);
        }

        return Math.round(this.topLevelSuite.aggregateData.totalTestTime / this.topLevelSuite.aggregateData.numTests);
    }

    /**
     * Checks if a given suite exists
     *
     * @param suitePath Path to check for, e.g. ['suite 1', 'sub-suite 2']
     * @returns true if the suite exists, false if not
     */
    public suiteExists(suitePath: string[]): boolean {
        BaseSuiteMetrics.validatePath(suitePath, false);
        return this.pathExists(suitePath, false);
    }

    /**
     * Checks if a given test exists
     *
     * @param testPath Path to check for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns true if the suite exists, false if not
     */
    public testExists(testPath: string[]): boolean {
        BaseSuiteMetrics.validatePath(testPath, true);
        return this.pathExists(testPath, true);
    }

    /**
     * Returns an array of all the sub-suites names in a given suite. Top-level suite ([]) allowed
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns An array of all sub-suites directly in this suite (not recursive)
     */
    public getSuiteNames(path: string[]): string[] {
        BaseSuiteMetrics.validatePath(path, false);

        const suite: Suite = this.navigateToSuite(path);
        return Array.from(suite.subSuites.keys());
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
     * Gets all tests in order
     *
     * @returns An array of all tests in this metrics instance, sorted by time of completion (first test completion
     * is ordered first)
     */
    public getTestsInOrder(): Test[] {
        return this.deepCopyTests(this.testPerformance.getTestsInOrder());
    }

    /**
     * Gets the slowest test across all suites
     *
     * @returns The test with the longest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getSlowestTest(): Test {
        return this.deepCopyTest(this.testPerformance.getSlowestTest());
    }

    /**
     * Gets the k slowest tests across all suites, sorted by duration descending
     *
     * @param k Number of slowest tests to return. Must be a positive integer
     * @returns Array of the k slowest tests, sorted by duration descending
     * @throws Error If k is not a positive integer
     * @throws Error if k is greater than the total number of tests (getTotalTestCount())
     */
    public getKSlowestTests(k: number): Test[] {
        return this.deepCopyTests(this.testPerformance.getKSlowestTests(k));
    }

    /**
     * Gets all tests sorted by duration descending (slowest first)
     *
     * @returns Array of all tests sorted by duration in descending order
     */
    public getAllTestsSlowestFirst(): Test[] {
        return this.deepCopyTests(this.testPerformance.getAllTestsSlowestFirst());
    }

    /**
     * Gets the fastest test across all suites
     *
     * @returns The test with the shortest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getFastestTest(): Test {
        return this.deepCopyTest(this.testPerformance.getFastestTest());
    }

    /**
     * Gets the k fastest tests across all suites, sorted by duration ascending
     *
     * @param k Number of fastest tests to return. Must be a positive integer
     * @returns Array of the k fastest tests, sorted by duration ascending
     * @throws Error If k is not a positive integer
     * @throws Error if k is greater than the total number of tests (getTotalTestCount())
     */
    public getKFastestTests(k: number): Test[] {
        return this.deepCopyTests(this.testPerformance.getKFastestTests(k));
    }

    /**
     * Gets all tests sorted by duration ascending (fastest first)
     *
     * @returns Array of all tests sorted by duration in ascending order
     */
    public getAllTestsFastestFirst(): Test[] {
        return this.deepCopyTests(this.testPerformance.getAllTestsFastestFirst());
    }

    /**
     * Gets the Test at a specific path
     *
     * @param path Path of the desired test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns A copy of the Test object at the given path
     * @throws Error If the test path doesn't exist
     */
    public getTest(path: string[]): Test {
        BaseSuiteMetrics.validatePath(path, true);
        const suite: Suite = this.navigateToSuite(path, { isTestPath: true });
        const testName: string = path[path.length - 1];

        const test: Test | undefined = suite.tests.get(testName);
        if (test === undefined) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} does not exist`);
        }

        return this.deepCopyTest(test);
    }

    /**
     * Gets the Suite at a specific path
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns A copy of the Suite object at the given path
     * @throws Error if the Suite path doesn't exist
     */
    public getSuite(path: string[]): Suite {
        BaseSuiteMetrics.validatePath(path, false);

        const suite: Suite = this.navigateToSuite(path);
        return this.deepCopySuite(suite);
    }

    /**
     * Gets metrics for a specific suite
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']. Top-level suite ([]) allowed
     * @returns An object with suite's name, parent/sub-suites, and test statistics
     */
    public getSuiteMetrics(path: string[]): SuiteData {
        BaseSuiteMetrics.validatePath(path, false);
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
        BaseSuiteMetrics.validatePath(path, false);
        const suite: Suite = this.navigateToSuite(path);

        // Direct metrics: Test and duration data for just the tests directly in this suite
        const directMetrics: Metrics = this.calculateDirectTestMetrics(suite);

        // Total metrics: Test and duration data for all tests in this suite and all sub-suites
        const totalTests: number = suite.aggregateData.numTests;
        const totalTime: number = suite.aggregateData.totalTestTime;
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
     * Stringifies all data in this metrics instance into JSON
     *
     * @param indent Number of indents for each line (default 4)
     * @returns JSON string representing the structure and data of all suites in this metrics instance
     */
    public toJSON(indent: number = 4): string {
        const serializableSuites: Record<string, SerializableSuite> = Object.fromEntries(
            Array.from(this.suites.entries())
                .map(([key, suite]: [string, Suite]): [string, SerializableSuite] => [key, this.suiteToSerializable(suite)])
        );

        return JSON.stringify(serializableSuites, null, indent);
    }


    /**
     * Navigates to (and returns) a suite in the hierarchy, optionally creating missing suites
     *
     * @param path Valid path of the suite to navigate to (can be a test path with isTestPath, see below)
     * @param options Optional flags for specific cases
     * @param options.createIfMissing Set to true to create the suite and all parent suites above it if required (default: false)
     * @param options.isTestPath Set to true if the path is a test (default: false). Will use the test's parent suite
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
                    aggregateData: {
                        numTests: 0,
                        totalTestTime: 0
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

        // Add to & invalidate cache
        this.testPerformance.addTest(test);
    }

    /**
     * Creates a deep copy of a test object to prevent external modifications
     */
    private deepCopyTest(test: Test): Test {
        return {
            ...test,
            path: [...test.path]
        };
    }

    /**
     * Creates a deep copy of an array of test objects to prevent external modifications
     */
    private deepCopyTests(tests: Test[]): Test[] {
        return tests.map((test: Test): Test => (
            {
                ...test,
                path: [...test.path]
            }
        ));
    }

    /**
     * Creates a deep copy of a test object to prevent external modifications
     */
    private deepCopySuite(suite: Suite): Suite {
        return {
            ...suite
        };
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
        currentSuite.aggregateData.numTests++;
        currentSuite.aggregateData.totalTestTime += duration;

        // Add time and counter to each parent suite
        for (const suiteName of testPath.slice(0, -1)) {
            currentSuite = currentSuite.subSuites.get(suiteName)!;
            if (currentSuite === undefined) {
                throw new Error(`Error updating counters: suite '${suiteName}' not found`);
            }

            currentSuite.aggregateData.numTests++;
            currentSuite.aggregateData.totalTestTime += duration;
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
        lines.push(`${indent}    - Total Sub-Suite tests: ${suite.aggregateData.numTests}`);
        lines.push(`${indent}    - Total Sub-Suite time: ${(suite.aggregateData.totalTestTime / 1000).toFixed(3)} ms`);

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

    /**
     * Converts a Suite object into a serializable object (maps can't be natively serialized)
     */
    private suiteToSerializable(suite: Suite): SerializableSuite {
        return {
            name: suite.name,
            tests: Object.fromEntries(suite.tests),
            subSuites: Object.fromEntries(
                Array.from(suite.subSuites.entries()).map(([key, subSuite]: [string, Suite]): [string, SerializableSuite] => [
                    key,
                    this.suiteToSerializable(subSuite)
                ])
            ),
            aggregateData: suite.aggregateData
        };
    }
}

export default BaseSuiteMetrics;
