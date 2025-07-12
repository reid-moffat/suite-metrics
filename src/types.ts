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
    tests: Map<string, Test> | null;
    numSubTests: number;
    subSuites: Map<string, Suite> | null;
};

type SuiteData = {
    name: string;
    parentSuites: string[] | null;
    childSuites: string[] | null;
    testMetrics: {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    }
};

type RecursiveSuiteData = {
    name: string;
    parentSuites: string[] | null;
    childSuites: string[] | null;
    directTestMetrics: {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    }
    subTestMetrics: {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    }
    totalTestMetrics: {
        numTests: number;
        totalTime: number | null;
        averageTime: number | null;
    }
};

export type { Test, Suite, SuiteData, RecursiveSuiteData };
