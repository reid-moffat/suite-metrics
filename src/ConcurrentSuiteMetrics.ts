import microtime from 'microtime';
import { ISuiteMetrics, Suite, Test, SuiteData, RecursiveSuiteData } from "./ISuiteMetrics.js";

class ConcurrentSuiteMetrics implements ISuiteMetrics {

    private static _instance: ConcurrentSuiteMetrics;

    private readonly _suite: Map<string, Suite> = new Map<string, Suite>(); // All the suites stored here
    private readonly _topLevelSuite: Suite = { // Helper for iterating through suites (same structure as Suite)
        name: "<Top-Level suite>",
        tests: null,
        numSubTests: 0,
        subSuites: this._suite
    };

    // Tracks active tests - key is the test path as string, value is start time and test reference
    private readonly _activeTests: Map<string, { startTime: number, suite: Suite, testName: string }> = new Map();

    // How many tests have occurred so far
    private _numTests: number = 0;

    // Throws an error if the given name is invalid
    private _validateName({ name, test = false, topLevelAllowed = false } : { name: string[], test?: boolean, topLevelAllowed?: boolean }): string[] {

        if (!Array.isArray(name)) {
            throw new Error('Invalid test/suite name - must be a delimiter string or an array of strings');
        }

        if (topLevelAllowed && test) {
            throw new Error('Cannot call _validateName with both topLevelAllowed and test as both');
        }
        if (!topLevelAllowed && name.length === 0) {
            throw new Error('Test/suite name cannot be empty - must define a path');
        }
        if (test && name.length === 1) {
            throw new Error('Test must be inside at least one suite - i.e. name should be at least two strings (suite + test)');
        }

        if (!name.every((value) => typeof value === 'string')) {
            throw new Error('Invalid test/suite name - must be an array of strings');
        }

        return name;
    }

    // Creates a default suite (given name, no tests and no sub-suites)
    private _createSuite = (name: string): Suite => ({ name: name, tests: null, numSubTests: 0, subSuites: null })

    // Gets a suite by name, with an option to create it if it doesn't exist
    private _getSuite({ name, createIfAbsent = false, test = false } : { name: string[], createIfAbsent?: boolean, test?: boolean }): Suite {
        let suite: Suite = this._topLevelSuite;
        for (let i = 0; i < name.length - (test ? 1 : 0); ++i) {

            // If substitutes don't exist, create them or throw an error is not allowed
            if (suite.subSuites === null) {
                if (!createIfAbsent) {
                    throw new Error(`Suite ${name.slice(0, -1).toString()} does not exist`);
                }
                suite.subSuites = new Map<string, Suite>();
            }

            // Create this suite in the hierarchy if it doesn't exist, or throw an error if not allowed to
            let subSuite = suite.subSuites.get(name[i]);
            if (subSuite === undefined) {
                if (!createIfAbsent) {
                    throw new Error(`Suite ${name.slice(0, -1).toString()} does not exist`);
                }
                suite.subSuites.set(name[i], this._createSuite(name[i]));
                subSuite = suite.subSuites.get(name[i]) as Suite;
            }
            suite = subSuite;
        }

        return suite;
    }

    // Checks if a given suite/test exists
    private _exists(name: string[], test: boolean): boolean {
        let suite: Suite = this._topLevelSuite;

        if (test) {
            // For test existence: navigate to the containing suite, then check for the test
            for (let i = 0; i < name.length - 1; ++i) {
                let subSuite: Suite | undefined = suite.subSuites?.get(name[i]);
                if (!subSuite) {
                    return false;
                }
                suite = subSuite;
            }
            // Check if the test exists in the final suite
            return suite.tests?.has(name[name.length - 1]) ?? false;
        } else {
            // For suite existence: navigate through the entire path
            for (let i = 0; i < name.length; ++i) {
                let subSuite: Suite | undefined = suite.subSuites?.get(name[i]);
                if (!subSuite) {
                    return false;
                }
                suite = subSuite;
            }
            return true;
        }
    }

    // Adds a new test (creating the suite if it doesn't exist)
    private _addTest(name: string[]): Suite {

        let suite: Suite = this._topLevelSuite;

        for (let i = 0; i < name.length - 1; ++i) {

            suite.numSubTests++;

            if (suite.subSuites === null) {
                suite.subSuites = new Map<string, Suite>();
            }
            if (!suite.subSuites.has(name[i])) {
                suite.subSuites.set(name[i], this._createSuite(name[i]));
            }

            suite = suite.subSuites.get(name[i]) as Suite;
        }

        const testName = name[name.length - 1];
        const test: Test = {
            name: testName,
            startTimestamp: -1,
            endTimestamp: -1,
            duration: -1,
            completed: false,
            testNumber: ++this._numTests,
            suiteTestNumber: (suite.tests?.size ?? 0) + 1
        };

        if (!suite.tests) {
            suite.tests = new Map<string, Test>();
        }
        suite.tests.set(test.name, test);

        return suite;
    }

    // Helper to create a unique key for test path
    private _getTestKey(testPath: string[]): string {
        return testPath.join('::');
    }

    /**
     * Gets an instance on this class. Simplifies having one accessible metrics instance for many classes
     */
    public static getInstance(): ConcurrentSuiteMetrics {
        if (!ConcurrentSuiteMetrics._instance) {
            ConcurrentSuiteMetrics._instance = new ConcurrentSuiteMetrics();
        }
        return ConcurrentSuiteMetrics._instance;
    }

    /**
     * Resets the singleton instance of this class, wiping all data on it to start fresh
     */
    public static resetInstance(): void {
        ConcurrentSuiteMetrics._instance = new ConcurrentSuiteMetrics();
    }

    /**
     * Starts a new test. Call directly before the test for maximum accuracy
     *
     * @param testPath Suites the test is part of, then the test name (in order). E.g. ['suite1', 'suite2', 'test1'] means
     * there is a top-level suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it
     * named 'test1' which we want to measure
     */
    public async startTest(testPath: string[]): Promise<void> {

        const path = this._validateName({ name: testPath, test: true });
        const testKey = this._getTestKey(path);

        if (this._activeTests.has(testKey)) {
            throw new Error(`Test ${testPath.toString()} is already running`);
        }

        const suite = this._addTest(path);
        const testName = path[path.length - 1];
        const startTime = microtime.now(); // Last to ensure the time is as accurate as possible

        this._activeTests.set(testKey, {
            startTime,
            suite,
            testName
        });
    }

    /**
     * Stops the specified test. Call directly after the test for maximum accuracy
     *
     * @param testPath The path of the test to stop
     */
    public async stopTest(testPath: string[]): Promise<void> {
        const endTimestamp = microtime.now();

        const path = this._validateName({ name: testPath, test: true });
        const testKey = this._getTestKey(path);

        const activeTest = this._activeTests.get(testKey);
        if (!activeTest) {
            throw new Error(`Test ${testPath.toString()} is not currently running - call startTest() first`);
        }

        const test: Test = activeTest.suite.tests?.get(activeTest.testName) as Test;

        test.startTimestamp = activeTest.startTime;
        test.endTimestamp = endTimestamp;
        test.duration = test.endTimestamp - test.startTimestamp;
        test.completed = true;

        this._activeTests.delete(testKey);
    }

    /**
     * Returns true if a suite currently exists, false otherwise
     *
     * @param suitePath Name of the suite to check for. E.g. ['suite1', 'suite2'] means there is a top-level suite named
     * 'suite1', which has a suite inside it named 'suite2' which we want to check if it exists
     */
    public suiteExists(suitePath: string[]): boolean {
        this._validateName({ name: suitePath, topLevelAllowed: true });
        return this._exists(suitePath, false);
    }

    /**
     * Returns true if a test currently exists, false otherwise
     * @param testPath Name of the test to check for. E.g. ['suite1', 'suite2', 'test1'] means there is a top-level suite
     * named 'suite1', which has a suite inside it named 'suite2', which has a test inside it named 'test1' which we want
     * to check if it exists
     */
    public testExists(testPath: string[]): boolean {
        this._validateName({ name: testPath, test: true });
        return this._exists(testPath, true);
    }

    /**
     * Gets the metrics for a test (name, start/stop, duration, completion, order). Throws an error if the test does not
     * exist
     *
     * @param testPath Name of the test to get metrics for. E.g. ['suite1', 'suite2', 'test1'] means there is a top-level
     * suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it named 'test1' which
     * we want to get metrics for
     */
    public getTestMetrics(testPath: string[]): Test {

        const path = this._validateName({ name: testPath, test: true });
        const suite: Suite = this._getSuite({ name: path, test: true });

        const test: Test | undefined = suite.tests?.get(path[path.length - 1]);
        if (!test) {
            throw new Error(`Test ${testPath.toString()} does not exist`);
        }

        return {
            name: test.name,
            startTimestamp: test.startTimestamp,
            endTimestamp: test.endTimestamp,
            duration: test.duration,
            completed: test.completed,
            testNumber: test.testNumber,
            suiteTestNumber: test.suiteTestNumber
        };
    }

    /**
     * Gets the metrics for a suite - suite metadata (name, parents, children) and test metrics (number of tests,
     * total time, average time)
     *
     * This method only calculates test metrics for tests directly in this suite. To include tests that are in
     * sub-suites of this suite, use getSuiteMetricsRecursive() instead
     *
     * @param suitePath Name of the suite to get metrics for. E.g. ['suite1', 'suite2'] means there is a top-level suite
     * named 'suite1', which has a suite inside it named 'suite2' which we want to get metrics for. Can also pass a
     * Mocha context ('this') to get the name from it, or an empty array to get metrics for the top-level suite
     */
    public getSuiteMetrics(suitePath: string[]): SuiteData {

        const path = this._validateName({ name: suitePath, topLevelAllowed: true });
        const suite: Suite = this._getSuite({ name: path });

        const directNumTests: number = suite.tests?.size ?? 0;
        let directTotalTime: number = 0;
        suite.tests?.forEach((test) => directTotalTime += test.duration);

        return {
            name: suite.name,
            parentSuites: path.slice(0, path.length - 1),
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            testMetrics: {
                numTests: directNumTests,
                totalTime: directTotalTime,
                averageTime: directNumTests ? directTotalTime / directNumTests : null,
            }
        };
    }

    // Recursive helper for getSuiteMetricsRecursive()
    private _subSuiteMetrics(suite: Suite): [number, number] {
        let numTests = suite.tests?.size ?? 0;
        let totalTime = 0;
        suite.tests?.forEach((test) => totalTime += test.duration);

        if (suite.subSuites) {
            for (let subSuite of suite.subSuites.values()) {
                const [subNumTests, subTotalTime] = this._subSuiteMetrics(subSuite);
                numTests += subNumTests;
                totalTime += subTotalTime;
            }
        }

        return [numTests, totalTime];
    }

    /**
     * Gets the metrics for a suite (metadata - name, parents, children) and metrics for all its sub-suite's tests
     * (number of tests, total time, average time)
     *
     * @param suitePath Name of the suite to get metrics for. E.g. ['suite1', 'suite2'] means there is a top-level suite
     * named 'suite1', which has a suite inside it named 'suite2' which we want to get metrics for. Can also pass an
     * empty array to get metrics for the top-level suite
     */
    public getSuiteMetricsRecursive(suitePath: string[]): RecursiveSuiteData {

        const path = this._validateName({ name: suitePath, topLevelAllowed: true });
        const suite: Suite = this._getSuite({ name: path });

        const directNumTests: number = suite.tests?.size ?? 0;
        let directTotalTime: number = 0;
        suite.tests?.forEach((test) => directTotalTime += test.duration);

        let subNumTests = 0;
        let subTotalTime = 0;

        if (suite.subSuites) {
            for (const subSuite of suite.subSuites.values()) {
                const [num, total] = this._subSuiteMetrics(subSuite);
                subNumTests += num;
                subTotalTime += total;
            }
        }

        return {
            name: suite.name,
            parentSuites: path.slice(0, path.length - 1),
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            directTestMetrics: {
                numTests: directNumTests,
                totalTime: directTotalTime,
                averageTime: directNumTests ? directTotalTime / directNumTests : null,
            },
            subTestMetrics: {
                numTests: subNumTests,
                totalTime: subTotalTime,
                averageTime: subNumTests ? subTotalTime / subNumTests : null,
            },
            totalTestMetrics: {
                numTests: directNumTests + subNumTests,
                totalTime: directTotalTime + subTotalTime,
                averageTime: (directNumTests + subNumTests) ? (directTotalTime + subTotalTime) / (directNumTests + subNumTests) : null,
            }
        };
    }

    private _printSuiteHelper(suite: Suite, lines: string[], indent: number): void {

        let duration = 0;
        if (suite.tests !== null) {
            suite.tests.forEach((test) => duration += test.duration);
        }

        const indentStr = ' '.repeat(indent);
        lines.push(`${indentStr}Suite: ${suite.name}`);
        lines.push(`${indentStr}  Summary:`);
        lines.push(`${indentStr}    - Total direct tests: ${suite.tests?.size ?? 0}`);
        lines.push(`${indentStr}      Total duration: ${(duration / 1000).toFixed(2)} ms`);
        lines.push(`${indentStr}    - Total direct Sub-Suites: ${suite.subSuites?.size ?? 0}`);
        lines.push(`${indentStr}    - Total Sub-Suite tests: ${suite.numSubTests}`);

        if (suite.tests !== null) {
            lines.push(`\n${indentStr}  Tests:`);
            let num = 1;
            for (const test of suite.tests.values()) {
                lines.push(`${indentStr}    ${num++}) '${test.name}': ${(test.duration / 1000).toFixed(2)} ms`);
            }
        }

        if (suite.subSuites !== null) {
            lines.push(`\n${indentStr}  Sub-Suites:`);
            for (const subSuite of suite.subSuites.values() ) {
                this._printSuiteHelper(subSuite, lines, indent + 4);
            }
        }
    }

    /**
     * Returns a formatted string of all the test suite metrics
     *
     * @param topLevelSuite (Defaults to true) Include the default top-level suite, providing a summary of all suites
     */
    public printAllSuiteMetrics(topLevelSuite: boolean = true): string {
        const lines: string[] = [];

        if (topLevelSuite) {
            this._printSuiteHelper(this._topLevelSuite, lines, 0);
        } else {
            for (const suite of this._suite.values()) {
                this._printSuiteHelper(suite, lines, 0);
            }
        }

        return lines.join('\n');
    }
}

export default ConcurrentSuiteMetrics;
