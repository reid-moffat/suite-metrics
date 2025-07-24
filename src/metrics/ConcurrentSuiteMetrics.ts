import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.ts';
import Mutex from "../helpers/Mutex.ts";

// Path segments joined with '::'
type TestKey = string;

// Microsecond timestamp the test began at
type StartTime = number;

/**
 * Provides metrics for tests and test suites, with the ability to track multiple test simultaneously
 */
class ConcurrentSuiteMetrics extends BaseSuiteMetrics {

    // Lazy singleton instance
    private static _instance: ConcurrentSuiteMetrics | null = null;

    // Stores key (joined path) and start time for each active test
    private readonly activeTests: Map<TestKey, StartTime> = new Map<string, number>();

    // Mutexes for the lazy singleton and any instance
    private static readonly instanceMutex: Mutex = new Mutex();
    private readonly testMutex: Mutex = new Mutex();


    /**
     * Gets the lazy singleton instance of ConcurrentSuiteMetrics
     *
     * @returns The globally available ConcurrentSuiteMetrics instance
     */
    public static getInstance(): ConcurrentSuiteMetrics {
        if (ConcurrentSuiteMetrics._instance === null) {
            ConcurrentSuiteMetrics._instance = new ConcurrentSuiteMetrics();
        }
        return ConcurrentSuiteMetrics._instance;
    }

    /**
     * Resets ConcurrentSuiteMetrics' lazy singleton instance (from getInstance()), clearing all data
     */
    public static resetInstance(): void {
        ConcurrentSuiteMetrics._instance = null;
    }

    /**
     * Starts timing a new test. May be called when other tests are actively running
     *
     * @param path Path of suites to this test. E.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public startTest(path: string[]): void {
        // Validate path and ensure test isn't already completed
        const testExists: boolean = this.queries.testExists(path);
        if (testExists) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} already exists`);
        }

        // Verify test isn't already running
        const testKey: string = this.createTestKey(path);
        if (this.activeTests.has(testKey)) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} is already running`);
        }

        this.activeTests.set(testKey, microtime.now());
    }

    /**
     * Stops timing a specific test
     *
     * @param path Path of suites to this test. E.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public stopTest(path: string[]): void {
        const endTime: number = microtime.now();
        BaseSuiteMetrics.validatePath(path, true);
        const testKey: string = this.createTestKey(path);

        // Verify test exists
        const testStartTime: number | undefined = this.activeTests.get(testKey);
        if (testStartTime === undefined) {
            throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} is not currently running. Call startTest() first to begin testing`);
        }

        // Store test data and remove from active tests
        this.suites.addTest(path, testStartTime, endTime);
        this.activeTests.delete(testKey);
    }


    /**
     * Creates a unique key for a test path to track concurrent tests
     *
     * @returns String value of the test path joined with "::". E.g. ['suite1', 'suite2', 'test1'] -> "suite1::suite2::test1"
     */
    private createTestKey(testPath: string[]): string {
        return testPath.join('::');
    }
}

export default ConcurrentSuiteMetrics;
