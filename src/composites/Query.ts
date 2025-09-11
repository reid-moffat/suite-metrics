import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";
import { Suite, Test } from "../types/structures.ts";
import Suites from "../helpers/Suites.ts";

/**
 * Query based methods for checking Tests and Suites
 */
class Queries {

    private readonly suites: Suites;

    public constructor(suites: Suites) {
        this.suites = suites;
    }

    /**
     * Checks if a given suite exists
     *
     * Note: The top-level suite ([]) always exists
     *
     * @param suitePath Path to check for, e.g. ['suite 1', 'sub-suite 2']
     * @returns true if the suite exists, false if not
     */
    public suiteExists(suitePath: readonly string[]): boolean {
        return this.pathExists(suitePath, false);
    }

    /**
     * Checks if a given test exists
     *
     * @param testPath Path to check for, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns true if the suite exists, false if not
     */
    public testExists(testPath: readonly string[]): boolean {
        return this.pathExists(testPath, true);
    }

    /**
     * Gets the Suite at a specific path. Top-level suite ([]) allowed
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns The Suite object at the given path
     * @throws Error if the Suite path doesn't exist
     */
    public getSuite(path: readonly string[]): Suite {
        return this.suites.navigateToSuite(path);
    }

    /**
     * Gets the Test at a specific path
     *
     * @param path Path of the desired test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns The Test object at the given path
     * @throws Error If the test path doesn't exist
     */
    public getTest(path: readonly string[]): Test {
        const suite: Suite = this.suites.navigateToSuite(path, { isTestPath: true });
        const testName: string = path[path.length - 1];

        const test: Test | undefined = suite.tests.get(testName);
        if (test === undefined) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} does not exist`);
        }

        return test;
    }

    /**
     * Returns an array of all the sub-suites names in a given suite. Top-level suite ([]) allowed
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns An array of all sub-suites directly in this suite (not recursive)
     * @throws Error if the Suite path doesn't exist
     */
    public getSuiteNames(path: readonly string[]): string[] {
        const suite: Suite = this.suites.navigateToSuite(path);
        return Array.from(suite.subSuites.keys());
    }

    /**
     * Returns an array of all the test names in a given suite. Top-level suite ([]) allowed
     *
     * @param path Path to the desired suite, e.g. ['suite 1', 'sub-suite 2']
     * @returns An array of all tests directly in this suite (not including sub-suites)
     * @throws Error if the Suite path doesn't exist
     */
    public getTestNames(path: readonly string[]): string[] {
        const suite: Suite = this.suites.navigateToSuite(path);
        return Array.from(suite.tests.keys());
    }


    /**
     * Checks if a suite or test exists at the given path
     *
     * @param path Path to check if exists
     * @param isTest Specifies if this is checking for a test (false to check for a suite)
     */
    private pathExists(path: readonly string[], isTest: boolean): boolean {
        BaseSuiteMetrics.validatePath(path, isTest);

        const loopLength: number = path.length + (isTest ? -1 : 0);
        
        // Navigate through the suite hierarchy to check if path exists
        let currentSuite: Suite = this.suites.getTopLevelSuite();
        for (let i: number = 0; i < loopLength; ++i) {
            const targetSuite: Suite | undefined = currentSuite.subSuites.get(path[i]);
            if (targetSuite === undefined) {
                return false;
            }
            currentSuite = targetSuite;
        }

        // Checking for a test -> verify it exists in the final suite
        if (isTest) {
            const testName: string = path[path.length - 1];
            return currentSuite.tests.has(testName);
        }

        return true;
    }
}

export default Queries;
