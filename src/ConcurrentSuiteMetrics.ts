import { ISuiteMetrics } from "./ISuiteMetrics.js";

class ConcurrentSuiteMetrics implements ISuiteMetrics {
    public startTest(testPath: string[]): void {
        throw new Error("Method not implemented.");
    }

    public stopTest(): void {
        throw new Error("Method not implemented.");
    }

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
        throw new Error("Method not implemented.");
    }
}

export default ConcurrentSuiteMetrics;
