import { freeze, produce, castDraft } from 'immer';
import { Suite, Test } from "../types/structures.ts";
import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";
import LazyCache from "./LazyCache.ts";

/**
 * Stores all Suite and Test data for an instance, as well as provides helpers for working with them
 */
class Suites {

    // Top-level suite makes top-level metrics and functions easier to handle
    private topLevelSuite: Suite = this.createInitialSuite();

    // Ref to lazy-loaded expensive values cache
    private readonly lazyCache: LazyCache;

    public constructor(lazyCache: LazyCache) {
        this.lazyCache = lazyCache;
    }


    /**
     * Returns a default, empty top-level suite
     */
    private createInitialSuite(): Suite {
        return freeze({
            name: "<Top-Level suite>",
            path: [],
            tests: new Map<string, Test>(),
            subSuites: new Map<string, Suite>(),

            aggregateData: {
                numTests: 0,
                totalTestTime: 0
            }
        }, true);
    }

    /**
     * Resets all suite data to default
     */
    public reset(): void {
        this.createInitialSuite();
        this.lazyCache.reset();
    }


    /**
     * Gets a reference to the top-level suite
     */
    public getTopLevelSuite(): Suite {
        return this.topLevelSuite;
    }

    /**
     * Gets the average completion duration for all tests in this metrics instance (rounded to the nearest microsecond)
     */
    public getAverageTestDuration(): number {
        return Math.round(this.getTopLevelSuite().aggregateData.totalTestTime / this.lazyCache.getNumTests());
    }

    /**
     * Stores and returns a completed test's data in this metrics instance
     *
     * @param testPath Path to this test
     * @param startTime Time the test was started at
     * @param endTime Time the test was completed at
     * @returns The newly created Test object
     */
    public addTest(testPath: readonly string[], startTime: number, endTime: number): Test {
        const suite: Suite = this.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });

        // Create test object and freeze
        const testData: Test = {
            name: testPath[testPath.length - 1],
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: endTime - startTime,
            testNumber: this.lazyCache.getNumTests() + 1,
            suiteTestNumber: suite.tests.size + 1,
            path: testPath
        };
        const test: Test = freeze(testData, true);

        // Add to and update suite hierarchy
        this.addTestData(suite, test);

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

        let currentSuite: Suite = this.topLevelSuite;
        const loopLength: number = path.length + (isTestPath ? -1 : 0);

        // Loop through suite path, creating undefined suites if necessary (or throwing an error)
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
     * Add a test to a suite and update counters (total tests & time) for suite hierarchy
     */
    private addTestData(suite: Suite, test: Test): void {

        // Add to cache
        this.lazyCache.addTest(test);

        // If the target suite is the top-level suite, handle it directly
        if (suite === this.topLevelSuite) {
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                draft.tests.set(test.name, castDraft(test));
                draft.aggregateData.numTests++;
                draft.aggregateData.totalTestTime += test.duration;
            });
            return;
        }

        // Recursively update a suite in the hierarchy
        const updateSuiteInHierarchy = (
            suitesMap: Map<string, Suite>,
            targetPath: readonly string[],
            test: Test,
            depth: number = 0
        ): void => {
            // Get the next suite in the hierarchy
            const currentSuiteName: string = targetPath[depth];
            const currentSuite: Suite | undefined = suitesMap.get(currentSuiteName);
            if (!currentSuite) {
                throw new Error(`Internal error: Suite '${currentSuiteName}' not found while adding test ${BaseSuiteMetrics.pathToString(test.path)}`);
            }

            if (depth === targetPath.length - 1) {
                // Direct parent suite -> add the test
                currentSuite.tests.set(test.name, castDraft(test));
            } else {
                // Intermediary suite -> recursively update
                updateSuiteInHierarchy(currentSuite.subSuites, targetPath, test, depth + 1);
            }

            // Update aggregate data for this suite
            const draftSuite = castDraft(currentSuite);
            draftSuite.aggregateData.numTests++;
            draftSuite.aggregateData.totalTestTime += test.duration;
        };

        // For nested suites, update the entire chain from top-level down
        this.topLevelSuite = produce(this.topLevelSuite, draft => {
            draft.aggregateData.numTests++;
            draft.aggregateData.totalTestTime += test.duration;

            updateSuiteInHierarchy(draft.subSuites, suite.path, test);
        });
    }

    /**
     * Adds a new (empty) suite to the suite hierarchy
     *
     * Each suite in the new suite's hierarchy needs to be updated, but just references (complexity is a function of
     * depth, not # of tests or # of unrelated suites)
     */
    private addSuite(parentSuite: Suite, newSuiteName: string): Suite {
        // Create and freeze new suite
        const suiteData: Suite = {
            name: newSuiteName,
            path: [...parentSuite.path, newSuiteName],
            tests: new Map<string, Test>(),
            subSuites: new Map<string, Suite>(),

            aggregateData: {
                numTests: 0,
                totalTestTime: 0
            }
        };
        const newSuite: Suite = freeze(suiteData, true);

        // Parent is top-level suite -> handle insertion directly
        if (parentSuite === this.topLevelSuite) {
            this.topLevelSuite = produce(this.topLevelSuite, draft => {
                draft.subSuites.set(newSuiteName, castDraft(newSuite));
            });
            return newSuite;
        }

        // For nested suites, we need to update the entire chain from top-level down as refs are immutable
        const updateNestedSuite = (
            suitesMap: Map<string, Suite>,
            pathToParent: readonly string[],
            newSuiteName: string,
            newSuite: Suite,
            depth: number = 0
        ): void => {
            // Get the next suite in the hierarchy
            const currentSuiteName: string = pathToParent[depth];
            const currentSuite: Suite | undefined = suitesMap.get(currentSuiteName);
            if (!currentSuite) {
                throw new Error(`Internal error: Suite '${currentSuiteName}' not found while adding suite '${newSuiteName}' to path ${BaseSuiteMetrics.pathToString(pathToParent)}`);
            }

            if (depth === pathToParent.length - 1) {
                // Parent suite -> add the new suite to it
                currentSuite.subSuites.set(newSuiteName, castDraft(newSuite));
            } else {
                // Intermediary suite -> recursively update the next level
                updateNestedSuite(currentSuite.subSuites, pathToParent, newSuiteName, newSuite, depth + 1);
            }
        }

        // Start updating from the top-level suite
        this.topLevelSuite = produce(this.topLevelSuite, draft => {
            updateNestedSuite(draft.subSuites, parentSuite.path, newSuiteName, newSuite);
        });

        return newSuite;
    }
}

export default Suites;
