import microtime from 'microtime';

type Test = {
    readonly name: string;
    startTimestamp: number;
    endTimestamp: number;
    completed: boolean;
    readonly testNumber: number;
    readonly suiteTestNumber: number;
};

type Suite = {
    name: string;
    tests: Test[];
    subSuites: Map<string, Suite> | null;
};

abstract class SuiteMetrics {

    private readonly _suite: Map<string, Suite> = new Map<string, Suite>();
    private readonly _topLevelSuite: Suite = { name: "__top_level_suite_do_not_use__", tests: [], subSuites: this._suite };

    private _currentSuite: Suite | null = null;
    private _currentTime: number = 0;

    private _currentTestNum: number = 0;

    private validateName(name: string[]): void {
        if (!Array.isArray(name)) {
            throw new Error('Invalid test/suite name - must be a delimiter string or an array of strings');
        }

        if (name.length === 0) {
            throw new Error('Test/suite name cannot be empty - must define a path');
        }

        if (name.length === 1) {
            throw new Error('Test must be inside at least one suite - i.e. name should be at least two strings (suite + test)');
        }

        if (!name.every((value) => typeof value === 'string')) {
            throw new Error('Invalid test/suite name - must be an array of strings');
        }
    }

    private createSuite = (name: string): Suite => ({ name: name, tests: [], subSuites: null })

    private addSuite(name: string[]): Suite {
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

    public startTest(name: string[]): void {
        this.validateName(name);

        this._currentSuite = this.addSuite(name);
        const test: Test = {
            name: name[name.length - 1],
            startTimestamp: 0,
            endTimestamp: 0,
            completed: false,
            testNumber: ++this._currentTestNum,
            suiteTestNumber: this._currentSuite.tests.length + 1
        };

        this._currentSuite.tests.push(test);

        this._currentTime = microtime.now(); // Do this last to ensure the time is as accurate as possible
    }

    public stopTest(): void {
        const endTimestamp = microtime.now();

        if (!this._currentSuite) {
            throw new Error('No test currently being measured - run startTest() first');
        }

        const test: Test = this._currentSuite.tests[this._currentSuite.tests.length - 1];

        test.startTimestamp = this._currentTime;
        test.endTimestamp = endTimestamp;
        test.completed = true;

        this._currentSuite = null;
    }
}
