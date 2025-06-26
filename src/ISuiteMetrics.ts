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

interface ISuiteMetrics {
    suiteExists(suitePath: string[]): boolean;
    testExists(testPath: string[]): boolean;

    getSuiteMetrics(suitePath: string[]): SuiteData;
    getSuiteMetricsRecursive(suitePath: string[]): RecursiveSuiteData;
    printAllSuiteMetrics(): string;
}

export { ISuiteMetrics, Test, Suite, SuiteData, RecursiveSuiteData };
