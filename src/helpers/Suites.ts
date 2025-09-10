import { Suite, Test } from "../types/structures.ts";
import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";
import { freeze } from 'immer';

/**
 * Stores all Suite and Test data for an instance, as well as provides helpers for working with them
 */
class Suites {

    // All suite and test data
    private readonly allSuites: Map<string, Suite> = new Map<string, Suite>();

    // Top-level suite makes top-level metrics and functions easier to handle
    private readonly topLevelSuite: Suite = {
        name: "<Top-Level suite>",
        tests: new Map<string, Test>(),
        subSuites: this.allSuites,
        aggregateData: {
            numTests: 0,
            totalTestTime: 0
        }
    };

    // All tests in order of insertion
    private readonly testsInInsertionOrder: Test[] = [];

    // All tests for a given metrics sorted from slowest to fastest
    private testsByDuration: Test[] = [];

    // If the sorted list above is valid
    private orderedTestsValid: boolean = false;


    /**
     * Gets a reference to all suites in this metrics instance (excluding the top-level suite)
     */
    public getAllSuites(): Map<string, Suite> {
        return this.allSuites;
    }

    /**
     * Gets a reference to the top-level suite
     */
    public getTopLevelSuite(): Suite {
        return this.topLevelSuite;
    }

    /**
     * Gets the total number of tests in this metrics instance
     */
    public getNumTests(): number {
        return this.testsInInsertionOrder.length;
    }

    /**
     * Gets the average completion duration for all tests in this metrics instance
     */
    public getAverageTestDuration(): number {
        return Math.round(this.getTopLevelSuite().aggregateData.totalTestTime / this.getNumTests());
    }

    /**
     * Stores and returns a completed test's data in this metrics instance
     *
     * @param testPath Path to this test
     * @param startTime Time the test was started at
     * @param endTime Time the test was completed at
     * @returns The created Test object
     */
    public addTest(testPath: string[], startTime: number, endTime: number): Test {
        const suite: Suite = this.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });

        const test: Test = {
            name: testPath[testPath.length - 1],
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: endTime - startTime,
            testNumber: this.getNumTests() + 1,
            suiteTestNumber: suite.tests.size + 1,
            path: testPath
        };

        // Once a test is added, no modification are required (prevent external modification)
        Object.freeze(test);
        Object.freeze(test.path);

        // Invalidate sorted cache
        this.orderedTestsValid = false;

        // Adds test to its parent suite and updates stats counter
        suite.tests.set(test.name, test);
        this.updateSubTestCounters(test.path, test.duration);

        // Adds to the list of all suites in order
        this.testsInInsertionOrder.push(test);

        return test;
    }

    /**
     * Navigates to (and returns) a suite in the hierarchy, optionally creating missing suites
     *
     * @param path Valid path of the suite to navigate to (can be a test path with isTestPath, see below)
     * @param options Optional flags for specific cases
     * @param options.createIfMissing Set to true to create the suite and all parent suites above it if required (default: false)
     * @param options.isTestPath Set to true if the path is a test (default: false). Will use the test's parent suite
     */
    public navigateToSuite(path: string[], options: { createIfMissing?: boolean; isTestPath?: boolean; } = {}): Suite {
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

                // Prevent modification (except to aggregateData's fields)
                Object.freeze(targetSuite);

                currentSuite.subSuites.set(suiteName, targetSuite);
            }
            currentSuite = targetSuite;
        }

        return currentSuite;
    }

    /**
     * Returns an array with all tests in this metrics instance, in the order they were inserted in
     */
    public getAllTestsInOrder(): Test[] {
        return this.testsInInsertionOrder;
    }

    /**
     * Gets all tests by their completion duration
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsByDuration(): Test[] {
        if (!this.orderedTestsValid) {
            // Sort by duration in descending order (slowest goes first)
            this.testsByDuration = [...this.testsInInsertionOrder].sort((a: Test, b: Test): number => b.duration - a.duration);
            this.orderedTestsValid = true;
        }

        return this.testsByDuration;
    }


    /**
     * Updates the subtest counter (test #s & time) for all suites above this test (including the direct parent suite)
     *
     * @param testPath Path of the test to update parent suites for
     * @param duration Duration of the test
     */
    private updateSubTestCounters(testPath: readonly string[], duration: number): void {
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
}

export default Suites;
