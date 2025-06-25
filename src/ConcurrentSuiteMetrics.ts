import microtime from 'microtime';
import { ISuiteMetrics, Suite, Test, SuiteData, RecursiveSuiteData } from "./ISuiteMetrics.js";

class ConcurrentSuiteMetrics implements ISuiteMetrics {

    getSuiteMetrics(suitePath: string[]): SuiteData {
        return {
            name: "",
            parentSuites: [],
            childSuites: null,
            testMetrics: {
                numTests: 0,
                totalTime: 0,
                averageTime: null
            }
        };
    }

    getSuiteMetricsRecursive(suitePath: string[]): RecursiveSuiteData {
        return {
            name: "",
            parentSuites: [],
            childSuites: null,
            directTestMetrics: {
                numTests: 0,
                totalTime: 0,
                averageTime: null
            },
            subTestMetrics: {
                numTests: 0,
                totalTime: 0,
                averageTime: null
            },
            totalTestMetrics: {
                numTests: 0,
                totalTime: 0,
                averageTime: null
            }
        };
    }

    printAllSuiteMetrics(): string {
        return "";
    }

    async startTest(testPath: string[]): Promise<void> {
    }

    async stopTest(testPath: string[]): Promise<void> {
    }

    suiteExists(suitePath: string[]): boolean {
        return false;
    }

    testExists(testPath: string[]): boolean {
        return false;
    }

}

export default ConcurrentSuiteMetrics;
