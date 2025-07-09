import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";

/**
 * Test version of SuiteMetrics that allows running tests with predefined durations
 */
class _MockSuiteMetrics extends SuiteMetrics {
    /**
     * Adds a mock test with a specific duration
     *
     * @param path Path of suites to this test
     * @param duration Duration in microseconds
     */
    public addTest(path: string[], duration: number): void {
        this.validatePath(path, { isTest: true });
        const { suite, testName, test } = this.createTestInSuite(path);

        const startTime = Date.now() * 1000; // Convert to microseconds
        test.startTimestamp = startTime;
        test.endTimestamp = startTime + duration;
        test.duration = duration;
        test.completed = true;
    }
}

/**
 * Test version of ConcurrentSuiteMetrics that allows running tests with predefined durations
 */
class _MockConcurrentSuiteMetrics extends ConcurrentSuiteMetrics {
    /**
     * Adds a mock test with a specific duration
     *
     * @param path Path of suites to this test
     * @param duration Duration in microseconds
     */
    public addTest(path: string[], duration: number): void {
        this.validatePath(path, { isTest: true });
        const { suite, testName, test } = this.createTestInSuite(path);

        const startTime = Date.now() * 1000; // Convert to microseconds
        test.startTimestamp = startTime;
        test.endTimestamp = startTime + duration;
        test.duration = duration;
        test.completed = true;
    }
}

export { _MockSuiteMetrics, _MockConcurrentSuiteMetrics };
