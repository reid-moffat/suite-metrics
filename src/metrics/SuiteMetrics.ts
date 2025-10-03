import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.ts';
import { Test } from "../types/structures.ts";

// Metadata for the currently running test
type TestMetadata = { testPath: readonly string[]; startTime: number; };

/**
 * Provides metrics for tests and test suites
 *
 * Note: Only one test can run at a time. For concurrent tests, use ConcurrentSuiteMetrics
 */
class SuiteMetrics extends BaseSuiteMetrics {

    // Lazy singleton instance
    private static _instance: SuiteMetrics = new SuiteMetrics();

    // Currently running test's data (path and start time, or null if no ongoing test)
    private activeTest: TestMetadata | null = null;


    /**
     * Gets the lazy singleton instance of SuiteMetrics
     *
     * @returns The globally available SuiteMetrics instance
     */
    public static getInstance(): SuiteMetrics {
        return SuiteMetrics._instance;
    }

    /**
     * Resets SuiteMetrics' lazy singleton instance (from getInstance()), clearing all data
     *
     * The singleton's reference is always preserved. It is created at setup time and persists through the entire
     * program, including after resetting the instance (instance data is reset, but the reference remains)
     */
    public static resetInstance(): void {
        SuiteMetrics._instance.reset();
        SuiteMetrics._instance.activeTest = null;
    }

    /**
     * Starts timing a new test
     *
     * Note: Only one test may be active at a time. For multiple concurrent tests, use ConcurrentSuiteMetrics
     *
     * @param path Path of suites to this test. E.g. ['suite 1', 'sub-suite 2', 'test 3']
     */
    public startTest(path: readonly string[]): void {
        if (this.activeTest !== null) {
            throw new Error('Only one test may run at a time with SuiteMetrics. Call stopTest() first before ' +
                'starting a new test, or use ConcurrentSuiteMetrics to run multiple tests simultaneously');
        }

        BaseSuiteMetrics.validatePath(path, true);

        this.activeTest = {
            testPath: path,
            startTime: -1
        };
        this.activeTest.startTime = microtime.now() // Get at the last moment for highest accuracy
    }

    /**
     * Stops timing the currently active test, storing the test information
     *
     * @returns The newly created Test object
     */
    public stopTest(): Test {
        const endTime: number = microtime.now(); // Get immediately for highest accuracy

        if (this.activeTest === null) {
            throw new Error('No test is currently running. Call startTest() first to begin a test');
        }

        const { testPath, startTime }: TestMetadata = this.activeTest;
        const test: Test = this.suites.addTest(testPath, startTime, endTime);

        this.activeTest = null;
        return test;
    }
}

export default SuiteMetrics;
