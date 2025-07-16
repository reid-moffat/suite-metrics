import { Suite, Test, SuiteData, RecursiveSuiteData } from "./types.ts";

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
        numSubTests: 0,
        subSuites: this.suites
    };

    // Total number of tests in this instance
    protected testCounter: number = 0;


    /**
     * Checks if a given suite exists
     *
     * @param suitePath Path to check for, e.g. ['suite 1', 'sub-suite 2']
     * @returns true if the suite exists, false if not
     */
    public suiteExists(suitePath: string[]): boolean {
        this.validatePath(suitePath, { allowTopLevel: true });
        return this.pathExists(suitePath, false);
    }

    /**
     * Checks if a given test exists
     *
     * @param testPath Path to check for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns true if the suite exists, false if not
     */
    public testExists(testPath: string[]): boolean {
        this.validatePath(testPath, { isTest: true });
        return this.pathExists(testPath, true);
    }

    /**
     * Gets metrics for a specific test
     *
     * @param path Path to get metrics for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns An object with test's name, timestamps, durations, and number
     */
    public getTestMetrics(path: string[]): Test {
        this.validatePath(path, { isTest: true });
        const suite: Suite = this.navigateToSuite(path, { isTestPath: true });
        const testName: string = path[path.length - 1];

        const test: Test | undefined = suite.tests?.get(testName);
        if (test === undefined) {
            throw new Error(`Test [${path.join(', ')}] does not exist`);
        }

        return { ...test }; // Return a copy to prevent external modification
    }

    /**
     * Gets metrics for a specific suite
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']
     * @returns An object with suite's name, parent/child, and test statistics
     */
    public getSuiteMetrics(path: string[]): SuiteData {
        this.validatePath(path, { allowTopLevel: true });
        const suite: Suite = this.navigateToSuite(path);
        const testMetrics = this.calculateDirectTestMetrics(suite);

        return {
            name: suite.name,
            parentSuites: path.slice(0, -1),
            childSuites: Array.from(suite.subSuites.keys()),
            testMetrics
        };
    }

    /**
     * Gets metrics for a given suite and its sub-suites
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']
     * @returns An object with suite metadata, and metrics for direct & subtests
     */
    public getSuiteMetricsRecursive(path: string[]): RecursiveSuiteData {
        this.validatePath(path, { allowTopLevel: true });
        const suite: Suite = this.navigateToSuite(path);

        const directMetrics = this.calculateDirectTestMetrics(suite);
        const [totalTests, totalTime] = this.calculateRecursiveTestMetrics(suite);
        const subTests: number = totalTests - directMetrics.numTests;
        const subTime: number = totalTime - (directMetrics.totalTime ?? 0);

        return {
            name: suite.name,
            parentSuites: path.length > 0 ? path.slice(0, -1) : null,
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            directTestMetrics: directMetrics,
            subTestMetrics: {
                numTests: subTests,
                totalTime: subTests > 0 ? subTime : null,
                averageTime: subTests > 0 ? subTime / subTests : null
            },
            totalTestMetrics: {
                numTests: totalTests,
                totalTime: totalTests > 0 ? totalTime : null,
                averageTime: totalTests > 0 ? totalTime / totalTests : null
            }
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
     * Validates a test or suite path
     *
     * @param path Path to the specified suite or test
     * @param options Optional flags for specific cases
     * @param options.isTest Set to true if this is validating a test (default: false)
     * @param options.alowTopLevel Set to true to allow the top-level suite, [], to be valid (default: false)
     */
    protected validatePath(path: string[], options: { isTest?: boolean; allowTopLevel?: boolean; } = {}): void {

        const { isTest = false, allowTopLevel = false } = options;

        // Ensure the path is an array of non-empty strings
        if (!Array.isArray(path)) {
            throw new Error('Path must be an array of strings');
        }
        if (!path.every((segment: string): boolean => typeof segment === "string" && segment.length > 0)) {
            throw new Error('Path must be an array of non-empty strings');
        }

        // Ensure the configuration is valid
        if (allowTopLevel && isTest) {
            throw new Error('Cannot specify both allowTopLevel and isTest');
        }
        if (!allowTopLevel && path.length === 0) {
            throw new Error('Path cannot be empty - must define a path');
        }
        if (isTest && path.length < 2) {
            throw new Error('A test must be inside at least one suite - it must contain at least [suite, test]');
        }
    }

    /**
     * Navigates to a suite in the hierarchy, optionally creating missing suites
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
                    throw new Error(`Suite path [${suitePath.join(', ')}] does not exist`);
                }
                targetSuite = {
                    name: suiteName,
                    tests: new Map<string, Test>(),
                    numSubTests: 0,
                    subSuites: new Map<string, Suite>()
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
                return suite.tests?.has(testName) ?? false;
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

        const test: Test = {
            name: testName,
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: endTime - startTime,
            testNumber: ++this.testCounter,
            suiteTestNumber: (suite.tests?.size ?? 0) + 1
        };

        suite.tests.set(testName, test);

        // Update sub-test counters for all parent suites
        this.updateSubTestCounters(testPath.slice(0, -1));
    }

    /**
     * Updates the subtest counter for all suites above this suite
     *
     * @param suitePath Path of the suite to update
     */
    private updateSubTestCounters(suitePath: string[]): void {
        let currentSuite: Suite = this.topLevelSuite;
        currentSuite.numSubTests++;

        for (const suiteName of suitePath) {
            currentSuite = currentSuite.subSuites.get(suiteName)!;
            if (currentSuite === undefined) {
                throw new Error(`Error - suite '${suiteName}' not found`);
            }

            currentSuite.numSubTests++;
        }
    }

    /**
     * Calculates metrics for all tests directly in a suite
     *
     * @param suite Suite object to calculate metrics for
     */
    private calculateDirectTestMetrics(suite: Suite): {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    } {
        const numTests: number = suite.tests?.size ?? 0;

        if (numTests === 0) {
            return { numTests: 0, totalTime: null, averageTime: null };
        }

        const totalTime: number = Array.from(suite.tests!.values())
            .reduce((sum: number, test: Test): number => sum + test.duration, 0);

        return {
            numTests,
            totalTime,
            averageTime: totalTime / numTests
        };
    }

    /**
     * Recursively calculates test metrics for a suite and all its sub-suites
     *
     * @param suite Suite object to calculate test metrics for recursively
     */
    private calculateRecursiveTestMetrics(suite: Suite): [number, number] {
        let totalTests: number = suite.tests?.size ?? 0;
        let totalTime: number = 0;

        // Add direct test times
        suite.tests?.forEach((test: Test): void => { totalTime += test.duration; });

        // Recursively add sub-suite metrics
        if (suite.subSuites) {
            for (const subSuite of suite.subSuites.values()) {
                const [subTests, subTime] = this.calculateRecursiveTestMetrics(subSuite);
                totalTests += subTests;
                totalTime += subTime;
            }
        }

        return [totalTests, totalTime];
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
        const directTestCount: number = suite.tests?.size ?? 0;
        const directTestDuration: number = Array.from(suite.tests?.values() ?? [])
            .reduce((sum: number, test: Test) => sum + test.duration, 0);

        lines.push(`${indent}Suite: ${suite.name}`);
        lines.push(`${indent}  Summary:`);
        lines.push(`${indent}    - Total direct tests: ${directTestCount}`);
        lines.push(`${indent}      Total duration: ${(directTestDuration / 1000).toFixed(2)} ms`);
        lines.push(`${indent}    - Total direct Sub-Suites: ${suite.subSuites?.size ?? 0}`);
        lines.push(`${indent}    - Total Sub-Suite tests: ${suite.numSubTests}`);

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
