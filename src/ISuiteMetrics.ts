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
        readonly averageTime: number | null; // Null for no tests (avoid NaN for dividing by 0)
    }
};

type RecursiveSuiteData = {
    readonly name: string;
    readonly parentSuites: string[] | null;
    readonly childSuites: string[] | null;
    readonly directTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number | null;
    }
    readonly subTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number | null;
    }
    readonly totalTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number;
        readonly averageTime: number | null;
    }
};

interface ISuiteMetrics {
    startTest(testPath: string[]): void;
    stopTest(): void;

    suiteExists(suitePath: string[]): boolean;
    testExists(testPath: string[]): boolean;

    getSuiteMetrics(suitePath: string[]): SuiteData;
    getSuiteMetricsRecursive(suitePath: string[]): RecursiveSuiteData;
    printAllSuiteMetrics(): string;
}

export { ISuiteMetrics, Test, Suite, SuiteData, RecursiveSuiteData };
