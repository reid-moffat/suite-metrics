import { Suite, Test } from "../types/structures.ts";
import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";

/**
 * Stores all Suite and Test data for an instance, as well as provides helpers for working with them
 */
class Suites {

    // All suite and test data
    public readonly allSuites: Map<string, Suite> = new Map<string, Suite>();

    // Top-level suite makes top-level metrics and functions easier to handle
    public readonly topLevelSuite: Suite = {
        name: "<Top-Level suite>",
        tests: new Map<string, Test>(),
        subSuites: this.allSuites,
        aggregateData: {
            numTests: 0,
            totalTestTime: 0
        }
    };

    // Total number of completed tests in this instance
    public testCounter: number = 0;

    // All tests in order of insertion
    private readonly testsInOrder: Test[] = [];


    /**
     * Gets the total number of tests in this metrics instance
     */
    public getNumTests(): number {
        return this.testsInOrder.length;
    }

    /**
     * Stores a completed test's data in this metrics instance
     *
     * @param testPath Path to this test
     * @param startTime Time the test was started at
     * @param endTime Time the test was completed at
     */
    public addTest(testPath: string[], startTime: number, endTime: number): void {
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

        // Adds test to its parent suite and updates stats counter
        suite.tests.set(test.name, test);
        this.updateSubTestCounters(test.path, test.duration);

        // Adds to the list of all suites in order
        this.testsInOrder.push(test);
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
        return this.testsInOrder;
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
}

export default Suites;
