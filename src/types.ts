type Test = {
    readonly name: string;
    readonly startTimestamp: number;
    readonly endTimestamp: number;
    readonly duration: number;
    readonly testNumber: number;
    readonly suiteTestNumber: number;
};

type Suite = {
    readonly name: string;
    tests: Map<string, Test> | null;
    subSuites: Map<string, Suite> | null;
    numSubTests: number;
};

type SuiteData = {
    readonly name: string;
    readonly parentSuites: string[] | null;
    readonly childSuites: string[] | null;
    readonly testMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
};

type RecursiveSuiteData = {
    readonly name: string;
    readonly parentSuites: string[] | null;
    readonly childSuites: string[] | null;
    readonly directTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
    readonly subTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
    readonly totalTestMetrics: {
        readonly numTests: number;
        readonly totalTime: number | null;
        readonly averageTime: number | null;
    }
};

export type { Test, Suite, SuiteData, RecursiveSuiteData };
