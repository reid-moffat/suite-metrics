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

    // Tracks current test from startTest() to simplify stopTest() logic + increase accuracy
    private _currentSuite: Suite | null = null;
    private _currentTests: Map<string[], { suite: Suite; test: string }> = new Map();
    private _currentTime: number = 0;

    // How many tests have occurred so far
    private _numTests: number = 0;

    // Lock for concurrent operations
    private _lock: Mutex = new Mutex();

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

    // Adds a new test (creating the suite if it doesn't exist)
    private _addTest(name: string[], time: number): void {

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
        this._currentTests.set(name.slice(0, -1), { suite: suite, test: name[name.length - 1] });

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
     * Starts a new test. Call directly before the test for maximum accuracy
     *
     * @param name Suites the test is part of, then the test name (in order). E.g. ['suite1', 'suite2', 'test1'] means
     * there is a top-level suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it
     * named 'test1' which we want to measure
     */
    public async startTest(name: string[]): Promise<void> {
        await this._lock.acquireAsync();

        try {
            const path = this._validateName({ name: name, test: true });
            const time = microtime.now();
            this._addTest(path, time);

            this._currentTime = time; // Last to ensure the time is as accurate as possible
            this._currentSuite = this._findOrCreateSuite(path);
            this._currentTests.set(path, time);
        } finally {
            this._lock.release();
        }
    }

    /**
     * Stops the current test (the last time startTest() was called). Call directly after the test for maximum accuracy
     */
    public async stopTest(path: string[]): Promise<void> {
        await this._lock.acquireAsync();

        try {
            if (!this._currentSuite) {
                throw new Error('No test currently being measured - run startTest() first');
            }

            const endTimestamp = microtime.now();
            const test: Test = this._currentSuite.tests?.get(this._currentTest as string) as Test;

            test.startTimestamp = this._currentTime;
            test.endTimestamp = endTimestamp;
            test.duration = test.endTimestamp - test.startTimestamp;
            test.completed = true;

            this._currentSuite = null;
            this._currentTests.delete() = null;
        } finally {
            this._lock.release();
        }
    }

    private _findOrCreateSuite(path: string[]): Suite {
        let currentLevel = this._topLevelSuite;
        for (let i = 0; i < path.length - 1; i++) {
            const suiteName = path[i];
            // @ts-ignore
            let suite = currentLevel.subSuites.get(suiteName);
            if (!suite) {
                suite = {
                    name: suiteName,
                    tests: null,
                    numSubTests: 0,
                    subSuites: new Map<string, Suite>()
                }; // @ts-ignore
                currentLevel.subSuites.set(suiteName, suite);
            }
            currentLevel = suite;
        }
        return currentLevel;
    }



    // private static _instance: ConcurrentSuiteMetrics;
    //
    // private readonly _suite: Map<string, Suite> = new Map<string, Suite>();
    // private readonly _topLevelSuite: Suite = {
    //     name: "<Top-Level suite>",
    //     tests: null,
    //     numSubTests: 0,
    //     subSuites: this._suite,
    // };
    //
    // // Map to track current tests for each test ID
    // private _currentTests: Map<string, { suite: Suite; test: string }> = new Map();
    //
    // // How many tests have occurred so far
    // private _numTests: number = 0;
    //
    // // helper functions (_validateName, _addTest, etc - assume they work as expected, don't need to edit them)...
    //
    // /**
    //  * Starts a new test. Call directly before the test for maximum accuracy
    //  *
    //  * @param name Suites the test is part of, then the test name (in order). E.g. ['suite1', 'suite2', 'test1'] means
    //  * there is a top-level suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it
    //  * named 'test1' which we want to measure
    //  */
    // public startTest(name: string[]): string {
    //     const path = this._validateName({ name: name, test: true });
    //
    //     this._addTest(path);
    //
    //     const testID = microtime.now().toString();
    //     const currentTest = {
    //         suite: this._getSuite(path.slice(0, -1)),
    //         test: path[path.length - 1],
    //     };
    //     this._currentTests.set(testID, currentTest);
    //
    //     return testID;
    // }
    //
    // /**
    //  * Stops the test with the given ID (the ID returned by the last time startTest() was called). Call directly after the test for maximum accuracy
    //  */
    // public stopTest(testID: string): void {
    //     const endTimestamp = microtime.now();
    //
    //     const currentTest = this._currentTests.get(testID);
    //     if (!currentTest) {
    //         throw new Error('No test currently being measured with this ID - run startTest() first');
    //     }
    //
    //     const { suite, test } = currentTest;
    //     const testObj: Test = suite.tests.get(test) as Test;
    //
    //     testObj.startTimestamp = testObj.startTimestamp || microtime.now();
    //     testObj.endTimestamp = endTimestamp;
    //     testObj.duration = testObj.endTimestamp - testObj.startTimestamp;
    //     testObj.completed = true;
    //
    //     this._currentTests.delete(testID);
    // }

    public suiteExists(suitePath: string[]): boolean {
        throw new Error("Method not implemented.");
    }

    public testExists(testPath: string[]): boolean {
        throw new Error("Method not implemented.");
    }

    public getSuiteMetrics(suitePath: string[]): import("./ISuiteMetrics.js").SuiteData {
        throw new Error("Method not implemented.");
    }

    public getSuiteMetricsRecursive(suitePath: string[]): import("./ISuiteMetrics.js").RecursiveSuiteData {
        throw new Error("Method not implemented.");
    }

    public printAllSuiteMetrics(): string {
        const lines: string[] = [];

        for (const suite of this._suite.values()) {
            this._printSuiteHelper(suite, lines, 0);
        }

        return lines.join('\n');
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
}

class Mutex {
    private _locked: boolean = false;
    private _queue: Array<() => void> = [];

    public async acquireAsync(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this._locked) {
                this._locked = true;
                resolve();
            } else {
                this._queue.push(resolve);
            }
        });
    }

    public release(): void {
        if (this._queue.length > 0) {
            const nextResolve = this._queue.shift();
            if (nextResolve) {
                nextResolve();
            }
        } else {
            this._locked = false;
        }
    }
}

export default ConcurrentSuiteMetrics;
