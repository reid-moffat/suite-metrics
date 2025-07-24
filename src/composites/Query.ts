import BaseSuiteMetrics from "../metrics/BaseSuiteMetrics.ts";
import { Suite, Test } from "../types/structures.ts";
import Utils from "../helpers/Utils.ts";
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

        const suite: Suite = this.suites.navigateToSuite(path);
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

        const suite: Suite = this.suites.navigateToSuite(path);
        return Array.from(suite.tests.keys());
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
        const suite: Suite = this.suites.navigateToSuite(path, { isTestPath: true });
        const testName: string = path[path.length - 1];

        const test: Test | undefined = suite.tests.get(testName);
        if (test === undefined) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} does not exist`);
        }

        return Utils.deepCopyTest(test);
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

        const suite: Suite = this.suites.navigateToSuite(path);
        return Utils.deepCopySuite(suite);
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
                const suite: Suite = this.suites.navigateToSuite(path, { isTestPath: true });
                const testName: string = path[path.length - 1];
                return suite.tests.has(testName);
            } else {
                this.suites.navigateToSuite(path);
                return true;
            }
        } catch {
            return false;
        }
    }
}

export default Queries;
