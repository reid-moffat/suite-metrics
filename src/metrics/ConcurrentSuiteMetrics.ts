import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.ts';
import { E_CANCELED, E_TIMEOUT, Mutex, withTimeout } from 'async-mutex';
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

    // Lazy singleton instance
    private static _instance: ConcurrentSuiteMetrics | null = null;

    // Stores key (joined path) and start time for each active test
    private readonly activeTests: Map<TestKey, StartTime> = new Map();

    // Mutexes for the lazy singleton and for any specific instance
    private static readonly instanceMutex = withTimeout(new Mutex(), 100);
    private readonly testMutex = withTimeout(new Mutex(), 100);


    /**
     * Gets the lazy singleton instance of ConcurrentSuiteMetrics (thread-safe)
     *
     * @returns The globally available ConcurrentSuiteMetrics instance
     */
    public static async getInstance(): Promise<ConcurrentSuiteMetrics> {
        let release: (() => void) | null = null;

        try {
            release = await ConcurrentSuiteMetrics.instanceMutex.acquire();

            if (ConcurrentSuiteMetrics._instance === null) {
                ConcurrentSuiteMetrics._instance = new ConcurrentSuiteMetrics();
            }
            return ConcurrentSuiteMetrics._instance;
        } catch (error: any) {
            // Handle specific mutex errors
            if (error === E_TIMEOUT) {
                throw new Error('Failed to acquire singleton lock: Timeout after 100ms');
            }
            if (error === E_CANCELED) {
                throw new Error('Failed to acquire singleton lock: Singleton acquisition was cancelled');
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
     */
    public static async resetInstance(): Promise<void> {
        let release: (() => void) | null = null;

        try {
            release = await ConcurrentSuiteMetrics.instanceMutex.acquire();
            ConcurrentSuiteMetrics._instance = null;
        } catch (error: any) {
            if (error === E_TIMEOUT) {
                throw new Error('Failed to acquire singleton lock for reset: timeout after 100ms');
            }
            if (error === E_CANCELED) {
                throw new Error('Singleton reset was cancelled');
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
                throw new Error(`Failed to acquire test mutex for starting test ${BaseSuiteMetrics.pathToString(path)}: timeout after 100ms`);
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
                throw new Error(`Failed to acquire test mutex for stopping test ${BaseSuiteMetrics.pathToString(path)}: timeout after 100ms`);
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
     * @returns String value of the test path joined with "::". E.g. ['suite1', 'suite2', 'test1'] -> "suite1::suite2::test1"
     */
    private createTestKey(testPath: readonly string[]): string {
        return testPath.join('::');
    }
}

export default ConcurrentSuiteMetrics;
