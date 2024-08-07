import microtime from 'microtime';

type Test = {
    readonly name: string;
    startTimestamp: number;
    endTimestamp: number;
    duration: number;
    completed: boolean;
    readonly testNumber: number;
    readonly suiteTestNumber: number;
};

type Suite = {
    readonly name: string;
    readonly tests: Test[];
    subSuites: Map<string, Suite> | null;
};

type SuiteData = {
    readonly name: string;
    readonly parentSuites: string[];
    readonly childSuites: string[] | null;
    readonly testMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number;
    }
};

type RecursiveSuiteData = {
    readonly name: string;
    readonly parentSuites: string[] | null;
    readonly childSuites: string[] | null;
    readonly directTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number;
    }
    readonly subTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number;
    }
    readonly totalTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number;
    }
};

abstract class SuiteMetrics {

    private readonly _suite: Map<string, Suite> = new Map<string, Suite>();
    private readonly _topLevelSuite: Suite = { name: "__top_level_suite_do_not_use__", tests: [], subSuites: this._suite };

    private _currentSuite: Suite | null = null;
    private _currentTime: number = 0;

    private _currentTestNum: number = 0;

    private validateName(name: string[], test: boolean): void {
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

    private createSuite = (name: string): Suite => ({ name: name, tests: [], subSuites: null })

    // Gets a suite by name, creating it (and any parent suites) if they don't exist
    private getSuite(name: string[]): Suite {
        let suite: Suite = this._topLevelSuite;
        for (let i = 0; i < name.length - 1; ++i) {

            if (suite.subSuites === null) {
                suite.subSuites = new Map<string, Suite>();
            }

            let subSuite = suite.subSuites.get(name[i]);
            if (subSuite === undefined) {
                suite.subSuites.set(name[i], this.createSuite(name[i]));
                subSuite = suite.subSuites.get(name[i]) as Suite;
            }
            suite = subSuite;
        }

        return suite;
    }

    /**
     * Starts a new test. Call directly before the test for maximum accuracy
     *
     * @param name Suites the test is part of, then the test name (in order). E.g. ['suite1', 'suite2', 'test1'] means
     * there is a top-level suite named 'suite1', which has a suite inside it named 'suite2', which has a test inside it
     * named 'test1' which we want to measure
     */
    public startTest(name: string[]): void {
        this.validateName(name, true);

        this._currentSuite = this.getSuite(name);
        const test: Test = {
            name: name[name.length - 1],
            startTimestamp: -1,
            endTimestamp: -1,
            duration: -1,
            completed: false,
            testNumber: ++this._currentTestNum,
            suiteTestNumber: this._currentSuite.tests.length + 1
        };

        this._currentSuite.tests.push(test);

        this._currentTime = microtime.now(); // Do this last to ensure the time is as accurate as possible
    }

    /**
     * Stops the current test (the last time startTest() was called). Call directly after the test for maximum accuracy
     */
    public stopTest(): void {
        const endTimestamp = microtime.now();

        if (!this._currentSuite) {
            throw new Error('No test currently being measured - run startTest() first');
        }

        const test: Test = this._currentSuite.tests[this._currentSuite.tests.length - 1];

        test.startTimestamp = this._currentTime;
        test.endTimestamp = endTimestamp;
        test.duration = test.endTimestamp - test.startTimestamp
        test.completed = true;

        this._currentSuite = null;
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
        this.validateName(name, false);

        const suite: Suite = this.getSuite(name);

        const directNumTests = suite.tests.length;
        const directTotalTime = suite.tests.reduce((acc, test) => acc + test.duration, 0);

        return {
            name: suite.name,
            parentSuites: name.slice(0, name.length - 1),
            childSuites: suite.subSuites ? Array.from(suite.subSuites.keys()) : null,
            testMetrics: {
                numTests: directNumTests,
                totalTime: directTotalTime,
                averageTime: directTotalTime / directNumTests,
            }
        };
    }

    private _subSuiteMetrics(suite: Suite): void {
        ;
    }

    private getSuiteMetricsRecursive(name: string[]): void {
        ;
    }
}
