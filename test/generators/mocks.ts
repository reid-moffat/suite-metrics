import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";
import microtime from "microtime";

// Set the initial time 1 hour ago for a semi-realistic start time
const hourInMicrosec = 60 * 60 * 1000 * 1000;

/**
 * Test version of SuiteMetrics that allows mocking tests
 */
class _MockSuiteMetrics extends SuiteMetrics {

    private currentMockTime: number = microtime.now() - hourInMicrosec;

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

        this.currentMockTime += duration;

        // Add a slight, random delay to simulate the time between tests (e.g., framework overhead)
        const interTestDelay = Math.floor(Math.random() * (5_000 - 100 + 1)) + 100; // (0.1ms - 5ms)
        this.currentMockTime += interTestDelay;
    }
}

/**
 * Test version of ConcurrentSuiteMetrics that allows mocking tests
 */
class _MockConcurrentSuiteMetrics extends ConcurrentSuiteMetrics {

    private currentMockTime: number = microtime.now() - hourInMicrosec;

    // State for managing concurrent batches
    private currentConcurrentCount: number = 0; // The number of tests added to the current batch so far
    private maxDurationInBatch: number = 0; // The longest test duration within the current batch
    private maxConcurrentTestsInBatch: number = 0; // The target number of tests for the current concurrent batch

    /**
     * Adds a mock test, simulating concurrent execution by grouping tests into batches
     *
     * @param path Path of suites to this test
     * @param options Optional parameters for the test.
     * @param options.duration Duration in microseconds. Defaults to a random value (5ms - 2s).
     * @param options.completed The completion status of the test. Defaults to true.
     */
    public addTest(path: string[], options: { duration?: number; completed?: boolean } = {}): void {
        this.validatePath(path, { isTest: true });
        const { test } = this.createTestInSuite(path);

        // Starting a new batch of concurrent tests: create the concurrent size and set start time
        if (this.currentConcurrentCount === 0) {
            this.maxConcurrentTestsInBatch = Math.floor(Math.pow(Math.random(), 20) * 100) + 1;
        }

        const duration = options.duration ?? Math.floor(Math.random() * (2_000_000 - 5_000 + 1)) + 5_000;

        // All tests in a concurrent batch start at the same time
        test.startTimestamp = this.currentMockTime;
        test.endTimestamp = this.currentMockTime + duration;
        test.duration = duration;

        // Update max duration if required
        if (duration > this.maxDurationInBatch) {
            this.maxDurationInBatch = duration;
        }
        this.currentConcurrentCount++;

        // Add a slight, random delay to simulate the time between tests (e.g., framework overhead)
        const interTestDelay = Math.floor(Math.random() * (5_000 - 100 + 1)) + 100; // (0.1ms - 5ms)
        this.currentMockTime += interTestDelay;

        // If this was the LAST test in the concurrent batch, reset the batch counters
        if (this.currentConcurrentCount === this.maxConcurrentTestsInBatch) {
            this.currentMockTime += this.maxDurationInBatch;

            this.currentConcurrentCount = 0;
            this.maxDurationInBatch = 0;
            this.maxConcurrentTestsInBatch = 0;
        }
    }
}

export { _MockSuiteMetrics, _MockConcurrentSuiteMetrics };
