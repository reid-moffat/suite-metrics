import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.ts';

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

    /**
     * Creates a unique key for a test path to track concurrent tests
     */
    private createTestKey(testPath: string[]): string {
        return testPath.join('::');
    }

    /**
     * Gets the singleton instance of ConcurrentSuiteMetrics
     *
     * @returns
     */
    public static getInstance(): ConcurrentSuiteMetrics {
        if (ConcurrentSuiteMetrics._instance === null) {
            ConcurrentSuiteMetrics._instance = new ConcurrentSuiteMetrics();
        }
        return ConcurrentSuiteMetrics._instance;
    }

    /**
     * Resets the singleton instance (from getInstance()), clearing all data
     */
    public static resetInstance(): void {
        ConcurrentSuiteMetrics._instance = new ConcurrentSuiteMetrics();
    }

    /**
     * Starts timing a new test (may be called when other tests are running)
     *
     * @param path Path of suites to this test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public startTest(path: string[]): void {
        this.validatePath(path, { isTest: true });
        const testKey = this.createTestKey(path);

        if (this.activeTests.has(testKey)) {
            throw new Error(`Test [${path.join(', ')}] is already running`);
        }

        this.createTestInSuite(path);

        this.activeTests.set(testKey, microtime.now());
    }

    /**
     * Stops timing a specific test
     *
     * @param path Path of suites to this test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public stopTest(path: string[]): void {
        const endTime = microtime.now();
        this.validatePath(path, { isTest: true });
        const testKey = this.createTestKey(path);

        const testStartTime = this.activeTests.get(testKey);
        if (!testStartTime) {
            throw new Error(`Test [${path.join(', ')}] is not currently running - call startTest() first`);
        }

        const suite = this.navigateToSuite(path, { isTestPath: true });
        const testName = path[path.length - 1];
        const test = suite.tests!.get(testName)!;

        test.startTimestamp = testStartTime;
        test.endTimestamp = endTime;
        test.duration = endTime - testStartTime;
        test.completed = true;

        this.activeTests.delete(testKey);
    }
}

export default ConcurrentSuiteMetrics;
