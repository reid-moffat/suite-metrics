import { Test, Suite } from "../types/structures.ts";
import { SerializableSuite } from "../types/helpers.ts";
import Performance from "../composites/Performance.ts";
import Suites from "../helpers/Suites.ts";
import Queries from "../composites/Query.ts";
import Statistics from "../composites/Statistics.ts";
import Metrics from "../composites/Metrics.ts";
import LazyCache from "../helpers/LazyCache.ts";

/**
 * Base class providing common functionality for both suite metrics implementations
 */
abstract class BaseSuiteMetrics {

    // Cache for expensive values
    private lazyCache: LazyCache = new LazyCache();

    // All suites and their directly related methods
    protected suites: Suites = new Suites(this.lazyCache);


    /** Queries for Tests, Suites, and their data */
    public queries: Queries = new Queries(this.suites);
    /** Aggregate metrics such as test averages and total counts */
    public metrics: Metrics = new Metrics(this.suites, this.lazyCache);
    /** Gets fastest and slowest test(s) */
    public performance: Performance = new Performance(this.lazyCache);
    /** Statistical methods around Z-scores */
    public statistics: Statistics = new Statistics(this.lazyCache);

    /**
     * Resets all the data in this instance
     */
    protected reset(): void {
        this.lazyCache = new LazyCache();
        this.suites = new Suites(this.lazyCache);

        this.queries = new Queries(this.suites);
        this.metrics = new Metrics(this.suites, this.lazyCache);
        this.performance = new Performance(this.lazyCache);
        this.statistics = new Statistics(this.lazyCache);
    }

    /**
     * Validates a test or suite path, throwing an error if invalid
     *
     * @param path Path to the specified suite or test
     * @param isTest Set to true if this path is for a test (will require an explicit Suite to be in)
     * @throws Error if the provided path is invalid (not an array of strings, contains empty/whitespace elements,
     * or a test without a suite/empty test)
     */
    public static validatePath(path: readonly string[], isTest: boolean): void {

        const type: string = isTest ? "Test" : "Suite";
        if (!Array.isArray(path)) {
            throw new Error(`${type} path must be an array`);
        }

        if (isTest && path.length <= 1) {
            throw new Error('A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)');
        }

        // Check each segment individually to provide specific error locations
        for (let i: number = 0; i < path.length; ++i) {
            const segment: any = path[i];

            if (typeof segment !== "string") {
                throw new Error(`${type} path element at index ${i} must be a 'string', got '${typeof segment}'`);
            }

            if (segment.length === 0) {
                throw new Error(`${type} path element at index ${i} cannot be empty`);
            }

            if (segment.trim().length === 0) {
                throw new Error(`${type} path element at index ${i} cannot be whitespace-only`);
            }
        }
    }

    /**
     * Converts a suite or test path to a readable string
     *
     * @param path Path to the desired suite or test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns Path joined with a comma a space, enclosed in square brackets. E.g. '[suite 1, sub-suite 2, test 3]'
     * @throws Error If the provided path is invalid (BaseSuiteMetrics.validatePath() is called)
     */
    public static pathToString(path: readonly string[]): string {
        BaseSuiteMetrics.validatePath(path, false);
        return `[${path.join(", ")}]`;
    }

    /**
     * Gets all tests in completion order
     *
     * Note: To get tests ordered by completion speed, see performance methods (e.g. metrics.performance.getAllTestsFastestFirst())
     *
     * @returns An array of all tests in this metrics instance, sorted by time of completion (first test completion
     * is ordered first)
     */
    public getTestsInOrder(): Test[] {
        return this.lazyCache.getAllTestsInOrder();
    }

    /**
     * Gets all data in the metrics
     *
     * @returns The top-level Suite object that contains all suites and tests in their hierarchical order
     */
    public getAllData(): Suite {
        return this.suites.getTopLevelSuite();
    }

    /**
     * Stringifies all data in this metrics instance into a JSON string
     *
     * @param includeTopLevel true to include the top-level suite as the top level object
     * @param indent Number of indents for each line (default 4)
     * @returns JSON string representing the structure and data of all suites in this metrics instance
     */
    public toJSONString(includeTopLevel = true, indent: number = 4): string {

        const suiteToSerializable: (suite: Suite) => SerializableSuite = (suite: Suite): SerializableSuite => ({
            name: suite.name,
            tests: Object.fromEntries(suite.tests),
            subSuites: Object.fromEntries(
                Array.from(suite.subSuites.entries()).map(([key, subSuite]: [string, Suite]): [string, SerializableSuite] =>
                    [key, suiteToSerializable(subSuite)]
                )
            ),
            aggregateData: suite.aggregateData
        });

        if (includeTopLevel) {
            const serializableData: SerializableSuite = suiteToSerializable(this.suites.getTopLevelSuite());
            return JSON.stringify(serializableData, null, indent);
        }

        const serializableData: Record<string, SerializableSuite> = Object.fromEntries(
            Array.from(this.suites.getTopLevelSuite().subSuites.entries())
                .map(([key, suite]: [string, Suite]): [string, SerializableSuite] => [key, suiteToSerializable(suite)])
        );

        return JSON.stringify(serializableData, null, indent);
    }
}

export default BaseSuiteMetrics;
