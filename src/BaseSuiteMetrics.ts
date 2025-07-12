import { Suite, Test, SuiteData, RecursiveSuiteData } from "./types.ts";

/**
 * Base class providing common functionality for suite metrics implementations
 */
abstract class BaseSuiteMetrics {

    protected readonly suites: Map<string, Suite> = new Map<string, Suite>(); // All suite data

    // Top-level suite makes top-level metrics and functions easier to handle
    protected readonly topLevelSuite: Suite = {
        name: "<Top-Level suite>",
        tests: null,
        numSubTests: 0,
        subSuites: this.suites
    };

    protected testCounter: number = 0; // Number of tests in this instance


    /**
     * Returns true if a given suite exists in this instance, false if not
     *
     * @param suitePath Path to check for, e.g. ['suite 1', 'sub-suite 2']
     */
    public suiteExists(suitePath: string[]): boolean {
        this.validatePath(suitePath, { allowTopLevel: true });
        return this.pathExists(suitePath, false);
    }

    /**
     * Returns true if a given test exists in this instance, false if not
     *
     * @param testPath Path to check for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public testExists(testPath: string[]): boolean {
        this.validatePath(testPath, { isTest: true });
        return this.pathExists(testPath, true);
    }

    /**
     * Gets metrics for a specific test
     *
     * @param path Path to get metrics for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public getTestMetrics(path: string[]): Test {
        this.validatePath(path, { isTest: true });
        const suite = this.navigateToSuite(path, { isTestPath: true });
        const testName = path[path.length - 1];

        const test = suite.tests?.get(testName);
        if (!test) {
            throw new Error(`Test [${path.join(', ')}] does not exist`);
        }

        return { ...test }; // Return a copy to prevent external modification
    }

    /**
     * Gets metrics (metadata plus number and time stats for tests) for a given suite
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']
     */
    public getSuiteMetrics(path: string[]): SuiteData {
        this.validatePath(path, { allowTopLevel: true });
        const suite = this.navigateToSuite(path);
        const testMetrics = this.calculateDirectTestMetrics(suite);

        return {
            name: suite.name,
            parentSuites: path.length > 0 ? path.slice(0, -1) : null,
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            testMetrics
        };
    }

    /**
     * Gets metrics (metadata plus number and time stats for tests) for a given suite and its sub-suites
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']
     */
    public getSuiteMetricsRecursive(path: string[]): RecursiveSuiteData {
        this.validatePath(path, { allowTopLevel: true });
        const suite = this.navigateToSuite(path);

        const directMetrics = this.calculateDirectTestMetrics(suite);
        const [totalTests, totalTime] = this.calculateRecursiveTestMetrics(suite);
        const subTests = totalTests - directMetrics.numTests;
        const subTime = totalTime - (directMetrics.totalTime ?? 0);

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
     * @param topLevelSuite Include a top-level suite with all suite data summed up at the top
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
     */
    protected validatePath(path: string[], options: {
        isTest?: boolean;
        allowTopLevel?: boolean;
    } = {}): void {

        const { isTest = false, allowTopLevel = false } = options;

        // Ensure the path is an array of non-empty strings
        if (!Array.isArray(path)) {
            throw new Error('Path must be an array of strings');
        }
        if (!path.every((segment) => typeof segment === 'string' && segment.length > 0)) {
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
     */
    protected navigateToSuite(path: string[], options: {
        createIfMissing?: boolean;
        isTestPath?: boolean;
    } = {}): Suite {
        const { createIfMissing = false, isTestPath = false } = options;
        const suitePath = isTestPath ? path.slice(0, -1) : path;

        let currentSuite: Suite = this.topLevelSuite;

        for (const suiteName of suitePath) {
            if (currentSuite.subSuites === null) {
                if (!createIfMissing) {
                    throw new Error(`Suite path [${suitePath.join(', ')}] does not exist`);
                }
                currentSuite.subSuites = new Map<string, Suite>();
            }

            let targetSuite = currentSuite.subSuites.get(suiteName);
            if (targetSuite === undefined) {
                if (!createIfMissing) {
                    throw new Error(`Suite path [${suitePath.join(', ')}] does not exist`);
                }
                targetSuite = {
                    name: suiteName,
                    tests: null,
                    numSubTests: 0,
                    subSuites: null
                };
                currentSuite.subSuites.set(suiteName, targetSuite);
            }
            currentSuite = targetSuite;
        }

        return currentSuite;
    }

    /**
     * Checks if a suite or test exists at the given path
     */
    private pathExists(path: string[], isTest: boolean): boolean {
        try {
            if (isTest) {
                const suite = this.navigateToSuite(path, { isTestPath: true });
                const testName = path[path.length - 1];
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
     * Adds a completed test's data
     */
    protected addTest(testPath: string[], startTime: number, endTime: number): void {
        const suite: Suite = this.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });
        const testName: string = testPath[testPath.length - 1];

        // Update sub-test counters for all parent suites
        this.updateSubTestCounters(testPath.slice(0, -1));

        const test: Test = {
            name: testName,
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: endTime - startTime,
            testNumber: ++this.testCounter,
            suiteTestNumber: (suite.tests?.size ?? 0) + 1
        };

        if (suite.tests === null) {
            suite.tests = new Map<string, Test>();
        }
        suite.tests.set(testName, test);
    }

    /**
     * Updates the sub-test counter for all suites in the path
     */
    private updateSubTestCounters(suitePath: string[]): void {
        let currentSuite: Suite = this.topLevelSuite;
        currentSuite.numSubTests++;

        for (const suiteName of suitePath) {
            currentSuite = currentSuite.subSuites!.get(suiteName)!;
            currentSuite.numSubTests++;
        }
    }

    /**
     * Calculates test metrics for a suite (direct tests only)
     */
    private calculateDirectTestMetrics(suite: Suite): {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    } {
        const numTests = suite.tests?.size ?? 0;

        if (numTests === 0) {
            return { numTests: 0, totalTime: null, averageTime: null };
        }

        const totalTime = Array.from(suite.tests!.values())
            .reduce((sum, test) => sum + test.duration, 0);

        return {
            numTests,
            totalTime,
            averageTime: totalTime / numTests
        };
    }

    /**
     * Recursively calculates test metrics for a suite and all its sub-suites
     */
    private calculateRecursiveTestMetrics(suite: Suite): [number, number] {
        let totalTests = suite.tests?.size ?? 0;
        let totalTime = 0;

        // Add direct test times
        suite.tests?.forEach(test => totalTime += test.duration);

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
     */
    private formatSuiteForPrint(suite: Suite, lines: string[], indentLevel: number): void {
        const indent = ' '.repeat(indentLevel);
        const directTestCount = suite.tests?.size ?? 0;
        const directTestDuration = Array.from(suite.tests?.values() ?? [])
            .reduce((sum, test) => sum + test.duration, 0);

        lines.push(`${indent}Suite: ${suite.name}`);
        lines.push(`${indent}  Summary:`);
        lines.push(`${indent}    - Total direct tests: ${directTestCount}`);
        lines.push(`${indent}      Total duration: ${(directTestDuration / 1000).toFixed(2)} ms`);
        lines.push(`${indent}    - Total direct Sub-Suites: ${suite.subSuites?.size ?? 0}`);
        lines.push(`${indent}    - Total Sub-Suite tests: ${suite.numSubTests}`);

        if (suite.tests && suite.tests.size > 0) {
            lines.push(`\n${indent}  Tests:`);
            let testNumber = 1;
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
