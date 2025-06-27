import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.js';
import { Test } from './types.js';

/**
 * Concurrent suite metrics implementation - multiple tests can run simultaneously
 */
class ConcurrentSuiteMetrics extends BaseSuiteMetrics {
    private static instance: ConcurrentSuiteMetrics;

    private readonly activeTests = new Map<string, {
        testPath: string[];
        startTime: number;
    }>();

    /**
     * Creates a unique key for a test path to track concurrent tests
     */
    private createTestKey(testPath: string[]): string {
        return testPath.join('::');
    }

    /**
     * Gets the singleton instance of ConcurrentSuiteMetrics
     */
    public static getInstance(): ConcurrentSuiteMetrics {
        if (!ConcurrentSuiteMetrics.instance) {
            ConcurrentSuiteMetrics.instance = new ConcurrentSuiteMetrics();
        }
        return ConcurrentSuiteMetrics.instance;
    }

    /**
     * Resets the singleton instance, clearing all data
     */
    public static resetInstance(): void {
        ConcurrentSuiteMetrics.instance = new ConcurrentSuiteMetrics();
    }

    /**
     * Starts timing a test - multiple tests can run concurrently
     */
    public async startTest(testPath: string[]): Promise<void> {
        const validatedPath = this.validatePath(testPath, { isTest: true });
        const testKey = this.createTestKey(validatedPath);

        if (this.activeTests.has(testKey)) {
            throw new Error(`Test [${testPath.join(', ')}] is already running`);
        }

        this.createTestInSuite(validatedPath);

        this.activeTests.set(testKey, {
            testPath: validatedPath,
            startTime: microtime.now()
        });
    }

    /**
     * Stops timing a specific test
     */
    public async stopTest(testPath: string[]): Promise<void> {
        const endTime = microtime.now();
        const validatedPath = this.validatePath(testPath, { isTest: true });
        const testKey = this.createTestKey(validatedPath);

        const activeTest = this.activeTests.get(testKey);
        if (!activeTest) {
            throw new Error(`Test [${testPath.join(', ')}] is not currently running - call startTest() first`);
        }

        const suite = this.navigateToSuite(validatedPath, { isTestPath: true });
        const testName = validatedPath[validatedPath.length - 1];
        const test = suite.tests!.get(testName)!;

        test.startTimestamp = activeTest.startTime;
        test.endTimestamp = endTime;
        test.duration = endTime - activeTest.startTime;
        test.completed = true;

        this.activeTests.delete(testKey);
    }

    /**
     * Gets metrics for a specific test
     */
    public getTestMetrics(testPath: string[]): Test {
        const validatedPath = this.validatePath(testPath, { isTest: true });
        const suite = this.navigateToSuite(validatedPath, { isTestPath: true });
        const testName = validatedPath[validatedPath.length - 1];

        const test = suite.tests?.get(testName);
        if (!test) {
            throw new Error(`Test [${testPath.join(', ')}] does not exist`);
        }

        return { ...test }; // Return a copy to prevent external modification
    }
}

export default ConcurrentSuiteMetrics;
