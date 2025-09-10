import { Suite, Test } from "../types/structures.ts";
import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";
import { freeze, produce, castDraft, WritableDraft } from 'immer';

/**
 * Stores all Suite and Test data for an instance, as well as provides helpers for working with them
 */
class Suites {

    // All suite and test data
    private allSuites: Map<string, Suite> = new Map<string, Suite>();

    // Top-level suite makes top-level metrics and functions easier to handle
    private topLevelSuite: Suite = freeze({
        name: "<Top-Level suite>",
        tests: new Map<string, Test>(),
        subSuites: this.allSuites,
        aggregateData: {
            numTests: 0,
            totalTestTime: 0
        }
    }, true);

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
    public addTest(testPath: readonly string[], startTime: number, endTime: number): Test {
        const suite: Suite = this.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });

        // Create test object and freeze recursively to block modification
        const testData: Test = {
            name: testPath[testPath.length - 1],
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: endTime - startTime,
            testNumber: this.getNumTests() + 1,
            suiteTestNumber: suite.tests.size + 1,
            path: testPath
        };
        const test: Test = freeze(testData, true);

        // Invalidate sorted cache
        this.orderedTestsValid = false;

        // Adds test to its parent suite and updates parent counters
        this.updateSuiteWithTest(suite, test);
        this.updateTestCounters(test.path, test.duration);

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
    public navigateToSuite(path: readonly string[], options: { createIfMissing?: boolean; isTestPath?: boolean; } = {}): Suite {
        const { createIfMissing = false, isTestPath = false } = options;
        const suitePath: readonly string[] = isTestPath ? path.slice(0, -1) : path;

        let currentSuite: Suite = this.topLevelSuite;

        for (const suiteName of suitePath) {
            let targetSuite: Suite | undefined = currentSuite.subSuites.get(suiteName);
            if (targetSuite === undefined) {
                if (!createIfMissing) {
                    throw new Error(`Suite path ${BaseSuiteMetrics.pathToString(suitePath)} does not exist`);
                }

                // Create and add suite
                const suiteData: Suite = {
                    name: suiteName,
                        tests: new Map<string, Test>(),
                        subSuites: new Map<string, Suite>(),
                        aggregateData: {
                        numTests: 0,
                            totalTestTime: 0
                    }
                };
                targetSuite = freeze(suiteData, true);

                this.addSuiteToParent(currentSuite, suiteName, targetSuite);
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
     * Add a test to a suite
     */
    private updateSuiteWithTest(suite: Suite, test: Test): void {
        // Find and update the suite in our data structures
        if (suite === this.topLevelSuite) {
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                draft.tests.set(test.name, castDraft(test));
            });
        } else {
            // Update the suite in allSuites map
            this.allSuites = produce(this.allSuites, draft => {
                // Navigate to the suite and update it
                this.updateSuiteInMap(draft, test.path.slice(0, -1), test);
            });

            // Also update the reference in topLevelSuite.subSuites
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                this.updateSuiteInMap(draft.subSuites, test.path.slice(0, -1), test);
            });
        }
    }

    /**
     * Helper to recursively find and update a suite in a map structure
     */
    private updateSuiteInMap(suitesMap: Map<string, Suite>, suitePath: readonly string[], test: Test): void {
        if (suitePath.length === 0) {
            return;
        }

        const [currentSuiteName, ...remainingPath] = suitePath;

        if (remainingPath.length === 0) {
            // This is our target suite - update it within the current produce context
            const suite = suitesMap.get(currentSuiteName);
            if (suite) {
                // Don't call produce() here - we're already inside a produce() call
                // Just update the draft directly
                const updatedSuite = { ...suite };
                updatedSuite.tests = new Map(suite.tests);
                updatedSuite.tests.set(test.name, test);
                suitesMap.set(currentSuiteName, freeze(updatedSuite, true));
            }
        } else {
            // Keep navigating deeper
            const suite = suitesMap.get(currentSuiteName);
            if (suite) {
                this.updateSuiteInMap(suite.subSuites, remainingPath, test);
            }
        }
    }

    /**
     * Adds a new suite to its parent
     */
    private addSuiteToParent(parentSuite: Suite, suiteName: string, newSuite: Suite): void {
        if (parentSuite === this.topLevelSuite) {
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                draft.subSuites.set(suiteName, castDraft(newSuite));
            });
            // Also update allSuites
            this.allSuites.set(suiteName, newSuite);
        } else {
            // Update nested suite structure - this is more complex and would need
            // similar recursive updating as updateSuiteWithTest
        }
    }

    /**
     * Updates the subtest counter (test #s & time) for all suites above this test (including the direct parent suite)
     *
     * @param testPath Path of the test to update parent suites for
     * @param duration Duration of the test
     */
    private updateTestCounters(testPath: readonly string[], duration: number): void {
        // Update top-level suite
        this.topLevelSuite = produce(this.topLevelSuite, draft => {
            draft.aggregateData.numTests++;
            draft.aggregateData.totalTestTime += duration;
        });

        const suitePath = testPath.slice(0, -1);
        if (suitePath.length === 0) return;

        // Helper function to update counters recursively
        const updateCountersRecursively = (suitesMap: Map<string, Suite>, path: readonly string[], depth: number = 0) => {
            if (depth >= path.length) return;

            const suiteName = path[depth];
            const suite = suitesMap.get(suiteName);

            if (suite) {
                // Create updated suite with new counters
                const updatedSuite = {
                    ...suite,
                    aggregateData: {
                        numTests: suite.aggregateData.numTests + 1,
                        totalTestTime: suite.aggregateData.totalTestTime + duration
                    }
                };

                suitesMap.set(suiteName, freeze(updatedSuite, true));

                // Continue to nested suites
                if (depth + 1 < path.length) {
                    updateCountersRecursively(updatedSuite.subSuites, path, depth + 1);
                }
            }
        };

        // Update allSuites
        this.allSuites = produce(this.allSuites, draft => {
            updateCountersRecursively(draft, suitePath);
        });

        // Update topLevelSuite.subSuites
        this.topLevelSuite = produce(this.topLevelSuite, draft => {
            updateCountersRecursively(draft.subSuites, suitePath);
        });
    }
}

export default Suites;
