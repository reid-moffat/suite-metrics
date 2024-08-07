import microtime from 'microtime';

type Test = {
    name: string;
    startTimestamp: number;
    endTimestamp: number;
    pass: boolean;
    error?: Error;
};

type Suite = {
    name: string;
    tests: Test[];
    subSuites: Suite[];
};

abstract class SuiteMetrics {

    private readonly _suite: Map<string, Suite> = new Map<string, Suite>();

    private _currentSuite: Suite | null = null;
    private _currentTime: number = 0;

    private validateName(name: string[]): void {
        if (!Array.isArray(name)) {
            throw new Error('Invalid test/suite name - must be a delimiter string or an array of strings');
        }

        if (name.length === 0) {
            throw new Error('Test/suite name cannot be empty - must have at least one name');
        }

        if (!name.every((value) => typeof value === 'string')) {
            throw new Error('Invalid test/suite name - must be an array of strings');
        }
    }

    private getSuite(name: string[]): Suite {
        const suiteName = Array.isArray(name) ? name.slice(0, name.length - 1).join('/') : '';
        const testName = Array.isArray(name) ? name[name.length - 1] : name;

        const suite = this._suite.get(suiteName);
        if (!suite) {
            throw new Error('Suite not found');
        }

        return suite;
    }

    public startTest(name: string[]): void {
        this.validateName(name);

        this._currentTime = microtime.now();
    }

    public stopTest(): void {
        const endTimestamp = microtime.now();

        if (!this._currentSuite) {
            throw new Error('No test currently being measured');
        }

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
