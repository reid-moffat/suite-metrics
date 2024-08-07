import microtime from 'microtime';

type Test = {
    name: string;
    startTimestamp: number;
    endTimestamp: number;
    pass: boolean;
    executionOrder: number;
    suiteExecutionOrder: number;
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

    // private addTest(name: string[]): void {
    //     if (!this._currentSuite) {
    //         throw new Error('No suite currently being measured');
    //     }
    //
    //     const test: Test = {
    //         name: name[name.length - 1],
    //         startTimestamp: this._currentTime,
    //         endTimestamp: 0,
    //         pass: false,
    //         executionOrder: this._currentSuite.tests.length,
    //         suiteExecutionOrder: this._suite.get(this._currentSuite.name).tests.length
    //     };
    //
    //     this._currentSuite.tests.push(test);
    // }

    private createSuite(name: string): Suite {
        return {
            name: name,
            tests: [],
            subSuites: null
        };
    }

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

    private getSuite(name: string[]): false | Suite {
        const topLevelSuite = this._suite.get(name[0]);
        if (topLevelSuite === undefined) {
            return false;
        }

        let suite: Suite = topLevelSuite;
        for (let i = 1; i < name.length - 1; ++i) {
            const subSuite = suite.subSuites.get(name[i]);
            if (subSuite === undefined) {
                return false;
            }
            suite = subSuite;
        }

        return suite;
    }

    public startTest(name: string[]): void {
        this.validateName(name);

        const suite = this.addSuite(name);
        const test: Test = {
            name: name[name.length - 1],
            startTimestamp: microtime.now(),
            endTimestamp: 0,
            pass: false,
            executionOrder: ++this._currentTestNum,
            suiteExecutionOrder: suite.tests.length + 1
        };

        suite.tests.push(test);
    }

    public stopTest(): void {
        const endTimestamp = microtime.now();

        if (!this._currentSuite) {
            throw new Error('No test currently being measured');
        }

        // get current test

        // const test: Test = {
        //     name: testName,
        //     startTimestamp: this._currentTime,
        //     endTimestamp,
        //     pass: !error,
        //     error
        // };

        this._currentSuite = null;
    }
}
