interface ISuiteMetrics {
    startTest(testPath: string[]): void;
    stopTest(): void;

    suiteExists(suitePath: string[]): boolean;
    testExists(testPath: string[]): boolean;

    getSuiteMetrics(suitePath: string[]): number;
    getSuiteMetricsRecursive(suitePath: string[]): number;
    printAllSuiteMetrics(): string;
}

export default ISuiteMetrics;
