import { Suite, Test } from "../types/structures.ts";
import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";
import { freeze, produce, castDraft } from 'immer';

/**
 * Stores all Suite and Test data for an instance, as well as provides helpers for working with them
 */
class Suites {

    // All suite and test data (child of )
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

        // Create test object, freeze, and update related suite data
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
        this.addTestUpdates(suite, test);

        // Add to list of tests & invalidate sorted cache
        this.orderedTestsValid = false;
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
        BaseSuiteMetrics.validatePath(path, isTestPath);
        const loopLength: number = path.length + (isTestPath ? -1 : 0);

        // Loop through suite path, creating undefined suites if necessary (or throwing an error)
        let currentSuite: Suite = this.topLevelSuite;
        for (let i: number = 0; i < loopLength; ++i) {
            let targetSuite: Suite | undefined = currentSuite.subSuites.get(path[i]);
            if (targetSuite === undefined) {
                if (!createIfMissing) {
                    throw new Error(`Suite path ${BaseSuiteMetrics.pathToString(path)} does not exist (suite '${path[i]}' is not defined)`);
                }

                targetSuite = this.addSuite(currentSuite, path[i]);
            }
            currentSuite = targetSuite;
        }

        // The final, deepest suite
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
    private addTestUpdates(suite: Suite, test: Test): void {
        // Find and update the suite in our data structures
        if (suite === this.topLevelSuite) {
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                draft.tests.set(test.name, castDraft(test));
            });
        } else {
            const updateSuiteInMap = (suitesMap: Map<string, Suite>, suitePath: readonly string[], test: Test) => {
                if (suitePath.length === 0) {
                    return;
                }

                const [currentSuiteName, ...remainingPath] = suitePath;

                if (remainingPath.length === 0) {
                    // This is our target suite - update it within the current produce context
                    const suite = suitesMap.get(currentSuiteName);
                    if (suite) {
                        // Create new suite with updated tests map
                        const newTests = new Map(suite.tests);
                        newTests.set(test.name, test);

                        const updatedSuite: Suite = {
                            name: suite.name,
                            tests: newTests,
                            subSuites: suite.subSuites,
                            aggregateData: suite.aggregateData
                        };

                        suitesMap.set(currentSuiteName, freeze(updatedSuite, true));
                    }
                } else {
                    // Keep navigating deeper
                    const suite = suitesMap.get(currentSuiteName);
                    if (suite) {
                        updateSuiteInMap(suite.subSuites, remainingPath, test);
                    }
                }
            }

            // Update the suite in allSuites map
            this.allSuites = produce(this.allSuites, draft => {
                // Navigate to the suite and update it
                updateSuiteInMap(draft, test.path.slice(0, -1), test);
            });

            // Also update the reference in topLevelSuite.subSuites
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                updateSuiteInMap(draft.subSuites, test.path.slice(0, -1), test);
            });
        }

        // Update top-level suite
        this.topLevelSuite = produce(this.topLevelSuite, draft => {
            draft.aggregateData.numTests++;
            draft.aggregateData.totalTestTime += test.duration;
        });

        const suitePath: readonly string[] = test.path.slice(0, -1);
        if (suitePath.length === 0) {
            return;
        }

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
                        totalTestTime: suite.aggregateData.totalTestTime + test.duration
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

    /**
     * Adds a new suite to its parent, updating any required stats
     */
    private addSuite(parentSuite: Suite, suiteName: string): Suite {
        //
        // Step 1: Create and freeze suite
        //

        const suiteData: Suite = {
            name: suiteName,
            tests: new Map<string, Test>(),
            subSuites: new Map<string, Suite>(),
            aggregateData: {
                numTests: 0,
                totalTestTime: 0
            }
        };
        const newSuite: Suite = freeze(suiteData, true);


        //
        // Step 2: If parent suite is the top level suite,
        //

        if (parentSuite === this.topLevelSuite) {
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                draft.subSuites.set(suiteName, castDraft(newSuite));
            });
            this.allSuites.set(suiteName, newSuite);

            return newSuite;
        }


        //
        // Step 3: If not,
        //

        const addSuiteToMap = (suitesMap: Map<string, Suite>, targetParent: Suite, suiteName: string, newSuite: Suite) => {
            for (const [key, suite] of suitesMap) {
                if (suite === targetParent) {
                    // Found the parent - create updated version with new suite
                    const updatedParent: Suite = {
                        name: suite.name,
                        tests: suite.tests,
                        subSuites: new Map(suite.subSuites).set(suiteName, newSuite),
                        aggregateData: suite.aggregateData
                    };
                    suitesMap.set(key, freeze(updatedParent, true));
                    return;
                }

                // Recursively search in nested suites
                addSuiteToMap(suite.subSuites, targetParent, suiteName, newSuite);
            }
        }

        // Update nested suite structure
        this.allSuites = produce(this.allSuites, draft => {
            addSuiteToMap(draft, parentSuite, suiteName, newSuite);
        });

        this.topLevelSuite = produce(this.topLevelSuite, draft => {
            addSuiteToMap(draft.subSuites, parentSuite, suiteName, newSuite);
        });

        return newSuite;
    }
}

export default Suites;
