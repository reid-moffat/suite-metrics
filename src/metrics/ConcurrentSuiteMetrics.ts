import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.ts';
import { E_CANCELED, E_TIMEOUT, Mutex, MutexInterface, withTimeout } from 'async-mutex';
import { Test } from "../types/structures.ts";

// Path segments joined with '::'
type TestKey = string;

// Microsecond timestamp the test began at
type StartTime = number;

/**
 * Provides metrics for tests and test suites, with the ability to track multiple test simultaneously
 *
 * Note: This class is thread-safe when working with its singleton and starting/stopping tests, however, querying
 * test data with other methods (getTest(), toJSON(), etc) is not thread-safe. Do not mix test running with getting
 * metrics concurrently
 */
class ConcurrentSuiteMetrics extends BaseSuiteMetrics {

    // Lazy singleton instance & mutex
    private static readonly _instance: ConcurrentSuiteMetrics = new ConcurrentSuiteMetrics();
    private static readonly _instanceMutex: MutexInterface = withTimeout(new Mutex(), 100);

    // Stores key (joined path) and start time for each active test
    private readonly activeTests: Map<TestKey, StartTime> = new Map();

    // Instance mutex for starting & stopping tests
    private testMutex: MutexInterface;
    private mutexTimeout: number;


    /**
     * @param mutexTimeoutMs Timeout in milliseconds for acquiring the test mutex (default: 100ms).
     * If a test operation can't acquire the mutex within this time, it will throw an error.
     *
     * Note: This is not a limit on test execution time, only on mutex acquisition (starting or stopping a test).
     */
    public constructor(mutexTimeoutMs: number = 100) {
        super();
        this.testMutex = withTimeout(new Mutex(), mutexTimeoutMs);
        this.mutexTimeout = mutexTimeoutMs;
    }

    /**
     * Gets the lazy singleton instance of ConcurrentSuiteMetrics (thread-safe)
     *
     * @returns The globally available ConcurrentSuiteMetrics instance
     */
    public static async getInstance(): Promise<ConcurrentSuiteMetrics> {
        let release: (() => void) | null = null;

        try {
            release = await ConcurrentSuiteMetrics._instanceMutex.acquire();
            return ConcurrentSuiteMetrics._instance;
        } catch (error: any) {
            // Handle specific mutex errors
            if (error === E_TIMEOUT) {
                throw new Error('Failed to acquire singleton lock for get: Timeout after 100ms');
            }
            if (error === E_CANCELED) {
                throw new Error('Failed to acquire singleton lock for get: Lock acquisition was cancelled');
            }

            throw new Error(`Unexpected exception getting singleton: ${error.message}`);
        } finally {
            if (release) {
                release();
            }
        }
    }

    /**
     * Resets ConcurrentSuiteMetrics' lazy singleton instance (from getInstance()), clearing all data (thread-safe)
     *
     * The singleton's reference is always preserved. It is created at setup time and persists through the entire
     * program, including after resetting the instance (instance data is reset, but the reference remains)
     *
     * @param mutexTimeoutMs Timeout in milliseconds for acquiring the test mutex (default: 100ms).
     * If a test operation can't acquire the mutex within this time, it will throw an error.
     *
     * Note: This is not a limit on test execution time, only on mutex acquisition (starting or stopping a test).
     */
    public static async resetInstance(mutexTimeoutMs: number = 100): Promise<void> {
        let release: (() => void) | null = null;

        try {
            release = await ConcurrentSuiteMetrics._instanceMutex.acquire();

            ConcurrentSuiteMetrics._instance.suites.reset();
            ConcurrentSuiteMetrics._instance.testMutex = withTimeout(new Mutex(), mutexTimeoutMs);
            ConcurrentSuiteMetrics._instance.mutexTimeout = mutexTimeoutMs;
            ConcurrentSuiteMetrics._instance.activeTests.clear();
        } catch (error: any) {
            if (error === E_TIMEOUT) {
                throw new Error('Failed to acquire singleton lock for reset: Timeout after 100ms');
            }
            if (error === E_CANCELED) {
                throw new Error('Failed to acquire singleton lock for reset: Lock acquisition was cancelled');
            }

            throw new Error(`Unexpected exception resetting singleton: ${error.message}`);
        } finally {
            if (release) {
                release();
            }
        }
    }

    /**
     * Starts timing a new test. May be called when other tests are actively running (thread-safe)
     *
     * This method gets the test start time directly before returning, after waiting in queue. More concurrent
     * tests do not affect test timing accuracy.
     *
     * @param path Path of suites to this test. E.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public async startTest(path: readonly string[]): Promise<void> {
        BaseSuiteMetrics.validatePath(path, true);

        let release: (() => void) | null = null;
        try {
            release = await this.testMutex.acquire();

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
        } catch (error: any) {
            // Handle specific mutex errors
            if (error === E_TIMEOUT) {
                throw new Error(`Failed to acquire test mutex for starting test ${BaseSuiteMetrics.pathToString(path)}: timeout after ${this.mutexTimeout}ms`);
            }
            if (error === E_CANCELED) {
                throw new Error(`Test start operation for ${BaseSuiteMetrics.pathToString(path)} was cancelled`);
            }

            throw new Error(`Error starting test: ${error.message}`);
        } finally {
            if (release) {
                release();
            }
        }
    }

    /**
     * Stops timing a specific test (thread-safe)
     *
     * This method gets the test end time immediately, before waiting in queue. More concurrent tests do not affect
     * test timing accuracy
     *
     * @param path Path of suites to this test. E.g. ['suite 1', 'sub-suite 2', 'test 3']
     * @returns The newly created Test object (as a Promise)
     */
    public async stopTest(path: readonly string[]): Promise<Test> {
        const endTime: number = microtime.now(); // Get immediately for highest accuracy
        BaseSuiteMetrics.validatePath(path, true);

        let release: (() => void) | null = null;
        try {
            release = await this.testMutex.acquire();

            const testKey: string = this.createTestKey(path);

            // Verify test exists
            const testStartTime: number | undefined = this.activeTests.get(testKey);
            if (testStartTime === undefined) {
                throw new Error(`Test ${BaseSuiteMetrics.pathToString(path)} is not currently running. Call startTest() first to begin testing`);
            }

            // Store test data and remove from active tests
            const test: Test = this.suites.addTest(path, testStartTime, endTime);
            this.activeTests.delete(testKey);

            return test;
        } catch (error: any) {
            // Handle specific mutex errors
            if (error === E_TIMEOUT) {
                throw new Error(`Failed to acquire test mutex for stopping test ${BaseSuiteMetrics.pathToString(path)}: timeout after ${this.mutexTimeout}ms`);
            }
            if (error === E_CANCELED) {
                throw new Error(`Test stop operation for ${BaseSuiteMetrics.pathToString(path)} was cancelled`);
            }

            // Re-throw business logic errors (test not running, etc.) and unexpected errors
            throw Error(`Error stopping test: ${error.message}`);
        } finally {
            if (release) {
                release();
            }
        }
    }


    /**
     * Creates a unique key for a test path to track concurrent tests
     *
     * @param testPath Path to create key for
     * @returns String value of the test path joined with "::". E.g. ['suite1', 'suite2', 'test1'] -> "suite1::suite2::test1"
     */
    private createTestKey(testPath: readonly string[]): string {
        return testPath.join('::');
    }
}

export default ConcurrentSuiteMetrics;
