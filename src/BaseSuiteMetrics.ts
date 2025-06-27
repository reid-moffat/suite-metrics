import { Suite, Test, SuiteData, RecursiveSuiteData } from "./types.ts";

/**
 * Base class providing common functionality for suite metrics implementations
 */
abstract class BaseSuiteMetrics {
    protected readonly suites: Map<string, Suite> = new Map<string, Suite>();
    protected readonly topLevelSuite: Suite = {
        name: "<Top-Level suite>",
        tests: null,
        numSubTests: 0,
        subSuites: this.suites
    };

    protected testCounter: number = 0;

    /**
     * Validates and normalizes a test or suite path
     */
    protected validatePath(path: string[], options: {
        isTest?: boolean;
        allowTopLevel?: boolean;
    } = {}): string[] {
        const { isTest = false, allowTopLevel = false } = options;

        if (!Array.isArray(path)) {
            throw new Error('Path must be an array of strings');
        }

        if (allowTopLevel && isTest) {
            throw new Error('Cannot specify both allowTopLevel and isTest');
        }

        if (!allowTopLevel && path.length === 0) {
            throw new Error('Path cannot be empty - must define a path');
        }

        if (isTest && path.length < 2) {
            throw new Error('Test must be inside at least one suite - path should contain at least [suite, test]');
        }

        if (!path.every(segment => typeof segment === 'string' && segment.length > 0)) {
            throw new Error('Path must be an array of non-empty strings');
        }

        return path;
    }

    /**
     * Creates a new suite with default values
     */
    protected createSuite(name: string): Suite {
        return {
            name,
            tests: null,
            numSubTests: 0,
            subSuites: null
        };
    }

    /**
     * Navigates to a suite in the hierarchy, optionally creating missing suites
     */
    protected navigateToSuite(path: string[], options: {
        createIfMissing?: boolean;
        isTestPath?: boolean;
    } = {}): Suite {
        const { createIfMissing = false, isTestPath = false } = options;
        const suitePath = isTestPath ? path.slice(0, -1) : path;

        let currentSuite: Suite = this.topLevelSuite;

        for (const suiteName of suitePath) {
            if (currentSuite.subSuites === null) {
                if (!createIfMissing) {
                    throw new Error(`Suite path [${suitePath.join(', ')}] does not exist`);
                }
                currentSuite.subSuites = new Map<string, Suite>();
            }

            let targetSuite = currentSuite.subSuites.get(suiteName);
            if (targetSuite === undefined) {
                if (!createIfMissing) {
                    throw new Error(`Suite path [${suitePath.join(', ')}] does not exist`);
                }
                targetSuite = this.createSuite(suiteName);
                currentSuite.subSuites.set(suiteName, targetSuite);
            }
            currentSuite = targetSuite;
        }

        return currentSuite;
    }

    /**
     * Checks if a suite or test exists at the given path
     */
    protected pathExists(path: string[], isTest: boolean): boolean {
        try {
            if (isTest) {
                const suite = this.navigateToSuite(path, { isTestPath: true });
                const testName = path[path.length - 1];
                return suite.tests?.has(testName) ?? false;
            } else {
                this.navigateToSuite(path);
                return true;
            }
        } catch {
            return false;
        }
    }

    /**
     * Creates a new test in the specified suite
     */
    protected createTestInSuite(testPath: string[]): { suite: Suite; testName: string; test: Test } {
        const suite = this.navigateToSuite(testPath, { createIfMissing: true, isTestPath: true });
        const testName = testPath[testPath.length - 1];

        // Update sub-test counters for all parent suites
        this.updateSubTestCounters(testPath.slice(0, -1));

        const test: Test = {
            name: testName,
            startTimestamp: -1,
            endTimestamp: -1,
            duration: -1,
            completed: false,
            testNumber: ++this.testCounter,
            suiteTestNumber: (suite.tests?.size ?? 0) + 1
        };

        if (suite.tests === null) {
            suite.tests = new Map<string, Test>();
        }
        suite.tests.set(testName, test);

        return { suite, testName, test };
    }

    /**
     * Updates the sub-test counter for all suites in the path
     */
    private updateSubTestCounters(suitePath: string[]): void {
        let currentSuite: Suite = this.topLevelSuite;
        currentSuite.numSubTests++;

        for (const suiteName of suitePath) {
            currentSuite = currentSuite.subSuites!.get(suiteName)!;
            currentSuite.numSubTests++;
        }
    }

    /**
     * Calculates test metrics for a suite (direct tests only)
     */
    protected calculateDirectTestMetrics(suite: Suite): {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    } {
        const numTests = suite.tests?.size ?? 0;

        if (numTests === 0) {
            return { numTests: 0, totalTime: null, averageTime: null };
        }

        const totalTime = Array.from(suite.tests!.values())
            .reduce((sum, test) => sum + test.duration, 0);

        return {
            numTests,
            totalTime,
            averageTime: totalTime / numTests
        };
    }

    /**
     * Recursively calculates test metrics for a suite and all its sub-suites
     */
    protected calculateRecursiveTestMetrics(suite: Suite): [number, number] {
        let totalTests = suite.tests?.size ?? 0;
        let totalTime = 0;

        // Add direct test times
        suite.tests?.forEach(test => totalTime += test.duration);

        // Recursively add sub-suite metrics
        if (suite.subSuites) {
            for (const subSuite of suite.subSuites.values()) {
                const [subTests, subTime] = this.calculateRecursiveTestMetrics(subSuite);
                totalTests += subTests;
                totalTime += subTime;
            }
        }

        return [totalTests, totalTime];
    }

    /**
     * Formats suite information for printing
     */
    protected formatSuiteForPrint(suite: Suite, lines: string[], indentLevel: number): void {
        const indent = ' '.repeat(indentLevel);
        const directTestCount = suite.tests?.size ?? 0;
        const directTestDuration = Array.from(suite.tests?.values() ?? [])
            .reduce((sum, test) => sum + test.duration, 0);

        lines.push(`${indent}Suite: ${suite.name}`);
        lines.push(`${indent}  Summary:`);
        lines.push(`${indent}    - Total direct tests: ${directTestCount}`);
        lines.push(`${indent}      Total duration: ${(directTestDuration / 1000).toFixed(2)} ms`);
        lines.push(`${indent}    - Total direct Sub-Suites: ${suite.subSuites?.size ?? 0}`);
        lines.push(`${indent}    - Total Sub-Suite tests: ${suite.numSubTests}`);

        if (suite.tests && suite.tests.size > 0) {
            lines.push(`\n${indent}  Tests:`);
            let testNumber = 1;
            for (const test of suite.tests.values()) {
                lines.push(`${indent}    ${testNumber++}) '${test.name}': ${(test.duration / 1000).toFixed(2)} ms`);
            }
        }

        if (suite.subSuites && suite.subSuites.size > 0) {
            lines.push(`\n${indent}  Sub-Suites:`);
            for (const subSuite of suite.subSuites.values()) {
                this.formatSuiteForPrint(subSuite, lines, indentLevel + 4);
            }
        }
    }

    // ISuiteMetrics interface implementation
    public suiteExists(suitePath: string[]): boolean {
        this.validatePath(suitePath, { allowTopLevel: true });
        return this.pathExists(suitePath, false);
    }

    public testExists(testPath: string[]): boolean {
        this.validatePath(testPath, { isTest: true });
        return this.pathExists(testPath, true);
    }

    public getSuiteMetrics(suitePath: string[]): SuiteData {
        const path = this.validatePath(suitePath, { allowTopLevel: true });
        const suite = this.navigateToSuite(path);
        const testMetrics = this.calculateDirectTestMetrics(suite);

        return {
            name: suite.name,
            parentSuites: path.length > 0 ? path.slice(0, -1) : null,
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            testMetrics
        };
    }

    public getSuiteMetricsRecursive(suitePath: string[]): RecursiveSuiteData {
        const path = this.validatePath(suitePath, { allowTopLevel: true });
        const suite = this.navigateToSuite(path);

        const directMetrics = this.calculateDirectTestMetrics(suite);
        const [totalTests, totalTime] = this.calculateRecursiveTestMetrics(suite);
        const subTests = totalTests - directMetrics.numTests;
        const subTime = totalTime - (directMetrics.totalTime ?? 0);

        return {
            name: suite.name,
            parentSuites: path.length > 0 ? path.slice(0, -1) : null,
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            directTestMetrics: directMetrics,
            subTestMetrics: {
                numTests: subTests,
                totalTime: subTests > 0 ? subTime : null,
                averageTime: subTests > 0 ? subTime / subTests : null
            },
            totalTestMetrics: {
                numTests: totalTests,
                totalTime: totalTests > 0 ? totalTime : null,
                averageTime: totalTests > 0 ? totalTime / totalTests : null
            }
        };
    }

    public printAllSuiteMetrics(topLevelSuite: boolean = true): string {
        const lines: string[] = [];

        if (topLevelSuite) {
            this.formatSuiteForPrint(this.topLevelSuite, lines, 0);
        } else {
            for (const suite of this.suites.values()) {
                this.formatSuiteForPrint(suite, lines, 0);
            }
        }

        return lines.join('\n');
    }
}

export default BaseSuiteMetrics;
