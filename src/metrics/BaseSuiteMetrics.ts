import { SuiteData, RecursiveSuiteData, SuiteTestMetrics } from "../types/returnTypes.ts";
import { Test, Suite } from "../types/structures.ts";
import { SerializableSuite } from "../types/helpers.ts";
import Performance from "../composites/Performance.ts";
import Suites from "../helpers/Suites.ts";
import Queries from "../composites/Query.ts";
import Statistics from "../composites/Statistics.ts";
import Metrics from "../composites/Metrics.ts";

/**
 * Base class providing common functionality for both suite metrics implementations
 */
abstract class BaseSuiteMetrics {

    private readonly suites: Suites = new Suites();

    public readonly queries: Queries = new Queries(this.suites);
    public readonly metrics: Metrics = new Metrics(this.suites);
    public readonly performance: Performance = new Performance(this.suites);
    public readonly statistics: Statistics = new Statistics(this.suites);

    /**
     * Validates a test or suite path, throwing an error if invalid
     *
     * @param path Path to the specified suite or test
     * @param isTest Set to true if this path is for a test (will require an explicit Suite to be in)
     * @throws Error if the provided path is invalid (not an array of strings, contains empty/whitespace elements,
     * or a test without a suite/empty test)
     */
    public static validatePath(path: string[], isTest: boolean): void {

        if (!Array.isArray(path)) {
            throw new Error('Suite/test path must be an array');
        }

        if (isTest && path.length <= 1) {
            throw new Error('A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)');
        }

        // Check each segment individually to provide specific error locations
        for (let i: number = 0; i < path.length; i++) {
            const segment: any = path[i];

            if (typeof segment !== "string") {
                throw new Error(`Suite/test path element at index ${i} must be a 'string', got '${typeof segment}'`);
            }

            if (segment.length === 0) {
                throw new Error(`Suite/test path element at index ${i} cannot be empty`);
            }

            if (segment.trim().length === 0) {
                throw new Error(`Suite/test path element at index ${i} cannot be whitespace-only`);
            }
        }
    }

    /**
     * Converts a suite or test path to a readable string
     *
     * Note: This does not validate the path. Call validatePath to do so
     *
     * @param path Path to the desired suite or test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns Path joined with a comma a space, enclosed in square brackets. E.g. '[suite 1, sub-suite 2, test 3]'
     */
    public static pathToString(path: string[]): string {
        return `[${path.join(", ")}]`;
    }

    /**
     * Gets the total number of completed tests across all suites
     *
     * @returns The total number of completed tests in this metrics instance
     */
    public getTotalTestCount(): number {
        return this.suites.testCounter;
    }

    /**
     * Gets the average completion time for all tests in this metrics instance
     *
     * @returns The average test completion time, rounded to the nearest microsecond
     * @throws Error if there are no completed tests in this instance
     */
    public getAverageTestTime(): number {
        if (this.getTotalTestCount() === 0) {
            throw new Error(`There are no completed tests in this instance`);
        }

        return Math.round(this.suites.topLevelSuite.aggregateData.totalTestTime / this.getTotalTestCount());
    }

    /**
     * Gets all tests in order
     *
     * @returns An array of all tests in this metrics instance, sorted by time of completion (first test completion
     * is ordered first)
     */
    public getTestsInOrder(): Test[] {
        return this.deepCopyTests(this.suites.getAllTestsInOrder());
    }

    /**
     * Stringifies all data in this metrics instance into JSON
     *
     * @param indent Number of indents for each line (default 4)
     * @returns JSON string representing the structure and data of all suites in this metrics instance
     */
    public toJSON(indent: number = 4): string {
        const serializableSuites: Record<string, SerializableSuite> = Object.fromEntries(
            Array.from(this.suites.allSuites.entries())
                .map(([key, suite]: [string, Suite]): [string, SerializableSuite] => [key, this.suiteToSerializable(suite)])
        );

        return JSON.stringify(serializableSuites, null, indent);
    }

    /**
     * Stores a completed test's data in this metrics instance
     *
     * @param testPath Path to this test
     * @param startTime Time the test was started at
     * @param endTime Time the test was completed at
     */
    protected addTest(testPath: string[], startTime: number, endTime: number): void {
        const suite: Suite = this.suites.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });
        const testName: string = testPath[testPath.length - 1];
        const testDuration: number = endTime - startTime;

        const test: Test = {
            name: testName,
            startTimestamp: startTime,
            endTimestamp: endTime,
            duration: testDuration,
            testNumber: ++this.suites.testCounter,
            suiteTestNumber: suite.tests.size + 1,
            path: testPath
        };

        this.suites.addTest(suite, test);
    }

    /**
     * Creates a deep copy of a Test object to prevent external modifications
     */
    private deepCopyTest(test: Test): Test {
        return {
            ...test,
            path: [...test.path]
        };
    }

    /**
     * Creates a deep copy of an array of Test objects to prevent external modifications
     */
    private deepCopyTests(tests: Test[]): Test[] {
        return tests.map((test: Test): Test => this.deepCopyTest(test));
    }

    /**
     * Converts a Suite object into a serializable object (maps can't be natively serialized)
     */
    private suiteToSerializable(suite: Suite): SerializableSuite {
        return {
            name: suite.name,
            tests: Object.fromEntries(suite.tests),
            subSuites: Object.fromEntries(
                Array.from(suite.subSuites.entries()).map(([key, subSuite]: [string, Suite]): [string, SerializableSuite] => [
                    key,
                    this.suiteToSerializable(subSuite)
                ])
            ),
            aggregateData: suite.aggregateData
        };
    }
}

export default BaseSuiteMetrics;
