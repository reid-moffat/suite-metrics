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

}

export default Suites;
