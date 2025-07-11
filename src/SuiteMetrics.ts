import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.ts';

/**
 * Sequential suite metrics implementation.
 * Note: Only one test can run at a time, for concurrent tests use ConcurrentSuiteMetrics
 */
class SuiteMetrics extends BaseSuiteMetrics {

    private static instance: SuiteMetrics; // Singleton

    private currentTestContext: {
        testPath: string[];
        startTime: number;
    } | null = null;

    /**
     * Gets the singleton instance of SuiteMetrics
     */
    public static getInstance(): SuiteMetrics {
        if (!SuiteMetrics.instance) {
            SuiteMetrics.instance = new SuiteMetrics();
        }
        return SuiteMetrics.instance;
    }

    /**
     * Resets the singleton instance (from getInstance()), clearing all data
     */
    public static resetInstance(): void {
        SuiteMetrics.instance = new SuiteMetrics();
    }

    /**
     * Starts timing a new test
     * Note: Only one test can be active at a time. For multiple concurrent tests, use ConcurrentSuiteMetrics
     *
     * @param path Path of suites to this test, e.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public startTest(path: string[]): void {
        if (this.currentTestContext !== null) {
            throw new Error('Another test is already running - call stopTest() first');
        }

        this.validatePath(path, { isTest: true });
        this.createTestInSuite(path);

        this.currentTestContext = {
            testPath: path,
            startTime: microtime.now()
        };
    }

    /**
     * Stops timing the currently active test
     */
    public stopTest(): void {
        const endTime = microtime.now();

        if (this.currentTestContext === null) {
            throw new Error('No test is currently running - call startTest() first');
        }

        const { testPath, startTime } = this.currentTestContext;
        const suite = this.navigateToSuite(testPath, { isTestPath: true });
        const testName = testPath[testPath.length - 1];
        const test = suite.tests!.get(testName)!;

        test.startTimestamp = startTime;
        test.endTimestamp = endTime;
        test.duration = endTime - startTime;
        test.completed = true;

        this.currentTestContext = null;
    }
}

export default SuiteMetrics;
