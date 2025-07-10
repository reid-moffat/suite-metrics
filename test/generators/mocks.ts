import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";
import microtime from "microtime";

/**
 * Test version of SuiteMetrics that allows running tests with predefined durations
 */
class _MockSuiteMetrics extends SuiteMetrics {

    // Set the initial time 1 hour ago for a semi-realistic start time
    private static readonly hourInMicrosec = 60 * 60 * 1000 * 1000;
    private currentMockTime: number = microtime.now() - _MockSuiteMetrics.hourInMicrosec;

    /**
     * Adds a mock test
     *
     * @param path Path of suites to this test
     * @param options Optional parameters for the test.
     * @param options.duration Test duration in microseconds. Defaults to a random number in (5ms - 2s)
     * @param options.completed The completion status of the test. Defaults to true
     */
    public addTest(path: string[], options: { duration?: number; completed?: boolean } = {}): void {
        this.validatePath(path, { isTest: true });
        const { test } = this.createTestInSuite(path);

        const duration = options.duration ?? Math.floor(Math.random() * (2_000_000 - 5_000 + 1)) + 5_000;

        test.startTimestamp = this.currentMockTime;
        test.endTimestamp = this.currentMockTime + duration;
        test.duration = duration;
        test.completed = options.completed ?? true;

        this.currentMockTime += duration;

        // Add a slight, random delay to simulate the time between tests (e.g., framework overhead)
        const interTestDelay = Math.floor(Math.random() * (5_000 - 100 + 1)) + 100; // (0.1ms - 5ms)
        this.currentMockTime += interTestDelay;
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
