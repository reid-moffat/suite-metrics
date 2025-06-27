import microtime from 'microtime';
import BaseSuiteMetrics from './BaseSuiteMetrics.js';
import { Test } from './types.js';

/**
 * Sequential suite metrics implementation - only one test can run at a time
 */
class SuiteMetrics extends BaseSuiteMetrics {
    private static instance: SuiteMetrics;

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
     * Resets the singleton instance, clearing all data
     */
    public static resetInstance(): void {
        SuiteMetrics.instance = new SuiteMetrics();
    }

    /**
     * Starts timing a test - only one test can be active at a time
     */
    public startTest(name: string[]): void {
        if (this.currentTestContext !== null) {
            throw new Error('Another test is already running - call stopTest() first');
        }

        const testPath = this.validatePath(name, { isTest: true });
        this.createTestInSuite(testPath);

        this.currentTestContext = {
            testPath,
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

    /**
     * Gets metrics for a specific test
     */
    public getTestMetrics(name: string[]): Test {
        const testPath = this.validatePath(name, { isTest: true });
        const suite = this.navigateToSuite(testPath, { isTestPath: true });
        const testName = testPath[testPath.length - 1];

        const test = suite.tests?.get(testName);
        if (!test) {
            throw new Error(`Test [${testPath.join(', ')}] does not exist`);
        }

        return { ...test }; // Return a copy to prevent external modification
    }
}

export default SuiteMetrics;
