import microtime from 'microtime';
import { ISuiteMetrics, Suite, Test, SuiteData, RecursiveSuiteData } from "./ISuiteMetrics.js";

class SuiteMetrics implements ISuiteMetrics {

    private static _instance: SuiteMetrics;

    private readonly _suite: Map<string, Suite> = new Map<string, Suite>(); // All the suites stored here
    private readonly _topLevelSuite: Suite = { // Helper for iterating through suites (same structure as Suite)
        name: "<Top-Level suite>",
        tests: null,
        numSubTests: 0,
        subSuites: this._suite
    };

    // Tracks current test from startTest() to simplify stopTest() logic + increase accuracy
    private _currentSuite: Suite | null = null;
    private _currentTest: string | null = null;
    private _currentTime: number = 0;

    // How many tests have occurred so far
    private _numTests: number = 0;

    // Throws an error if the given name is invalid
    private _validateName(name: string[], test: boolean): void {
        if (!Array.isArray(name)) {
            throw new Error('Invalid test/suite name - must be a delimiter string or an array of strings');
        }

        if (name.length === 0) {
            throw new Error('Test/suite name cannot be empty - must define a path');
        }

        if (test && name.length === 1) {
            throw new Error('Test must be inside at least one suite - i.e. name should be at least two strings (suite + test)');
        }

        if (!name.every((value) => typeof value === 'string')) {
            throw new Error('Invalid test/suite name - must be an array of strings');
        }
    }

    // Creates a default suite (given name, no tests and no sub-suites)
    private _createSuite = (name: string): Suite => ({ name: name, tests: null, numSubTests: 0, subSuites: null })

    // Gets a suite by name, with an option to create it if it doesn't exist
    private _getSuite(name: string[], createIfAbsent: boolean, test: boolean): Suite {
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
        for (let i = 0; i < name.length - (test ? 0 : 1); ++i) {

            if (test && i === name.length - 1) {
                return suite.tests?.has(name[i]) ?? false;
            }

            let subSuite: Suite | undefined = suite.subSuites?.get(name[i]);
            if (!subSuite) {
                return false;
            }
            suite = subSuite;
        }

        return true;
    }

    // Adds a new test (suite can not exist)
    private _addTest(name: string[]): void {

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
        this._currentSuite = suite;
        this._currentTest = name[name.length - 1];

        const test: Test = {
            name: name[name.length - 1],
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
    }

    /**
     * Gets an instance on this class. Simplifies having one accessible metrics instance for many classes
     */
    public static getInstance(): SuiteMetrics {
        if (!SuiteMetrics._instance) {
            SuiteMetrics._instance = new SuiteMetrics();
        }
        return SuiteMetrics._instance;
    }

    /**
     * Starts a new test. Call directly before the test for maximum accuracy
     *
     * @param name Suites the test is part of, then the test name (in order). E.g. ['suite1', 'suite2', 'test1'] means
     * there is a top-level suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it
     * named 'test1' which we want to measure
     */
    public startTest(name: string[]): void {
        this._validateName(name, true);

        this._addTest(name);

        this._currentTime = microtime.now(); // Last to ensure the time is as accurate as possible
    }

    /**
     * Stops the current test (the last time startTest() was called). Call directly after the test for maximum accuracy
     */
    public stopTest(): void {
        const endTimestamp = microtime.now();

        if (!this._currentSuite) {
            throw new Error('No test currently being measured - run startTest() first');
        }

        const test: Test = this._currentSuite.tests?.get(this._currentTest as string) as Test;

        test.startTimestamp = this._currentTime;
        test.endTimestamp = endTimestamp;
        test.duration = test.endTimestamp - test.startTimestamp
        test.completed = true;

        this._currentSuite = null;
    }

    /**
     * Returns true if a suite currently exists, false otherwise
     *
     * @param name Name of the suite to check for. E.g. ['suite1', 'suite2'] means there is a top-level suite named
     * 'suite1', which has a suite inside it named 'suite2' which we want to check if it exists
     */
    public suiteExists(name: string[]): boolean {
        this._validateName(name, false);
        return this._exists(name, false);
    }

    /**
     * Returns true if a test currently exists, false otherwise
     * @param name Name of the test to check for. E.g. ['suite1', 'suite2', 'test1'] means there is a top-level suite
     * named 'suite1', which has a suite inside it named 'suite2', which has a test inside it named 'test1' which we want
     * to check if it exists
     */
    public testExists(name: string[]): boolean {
        this._validateName(name, true);
        return this._exists(name, true);
    }

    /**
     * Gets the metrics for a test (name, start/stop, duration, completion, order). Throws an error if the test does not
     * exist
     *
     * @param name Name of the test to get metrics for. E.g. ['suite1', 'suite2', 'test1'] means there is a top-level
     * suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it named 'test1' which
     * we want to get metrics for
     */
    public getTestMetrics(name: string[]): Test {
        this._validateName(name, true);

        const suite: Suite = this._getSuite(name, false, true);

        const test: Test | undefined = suite.tests?.get(name[name.length - 1]);
        if (!test) {
            throw new Error(`Test ${name.toString()} does not exist`);
        }

        return test;
    }

    /**
     * Gets the metrics for a suite - suite metadata (name, parents, children) and test metrics (number of tests,
     * total time, average time)
     *
     * This method only calculates test metrics for tests directly in this suite. To include tests that are in
     * sub-suites of this suite, use getSuiteMetricsRecursive() instead
     *
     * @param name Name of the suite to get metrics for. E.g. ['suite1', 'suite2'] means there is a top-level suite
     * named 'suite1', which has a suite inside it named 'suite2' which we want to get metrics for
     */
    public getSuiteMetrics(name: string[]): SuiteData {
        this._validateName(name, false);

        const suite: Suite = this._getSuite(name, false, false);

        const directNumTests: number = suite.tests?.size ?? 0;
        let directTotalTime: number = 0;
        suite.tests?.forEach((test) => directTotalTime += test.duration);

        return {
            name: suite.name,
            parentSuites: name.slice(0, name.length - 1),
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
     * @param name Name of the suite to get metrics for. E.g. ['suite1', 'suite2'] means there is a top-level suite
     * named 'suite1', which has a suite inside it named 'suite2' which we want to get metrics for
     */
    public getSuiteMetricsRecursive(name: string[]): RecursiveSuiteData {
        this._validateName(name, false);

        const suite: Suite = this._getSuite(name, false, false);

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
            parentSuites: name.slice(0, name.length - 1),
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
     * @param topLevelSuite (Defaults to true) Include the default top-level suite, summarizing all other suites
     * inside it
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

export default SuiteMetrics;
