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

class Mutex {
    private _locked: boolean = false;
    private _queue: Array<() => void> = [];

    public async acquireAsync(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this._locked) {
                this._locked = true;
                resolve();
            } else {
                this._queue.push(resolve);
            }
        });
    }

    public release(): void {
        if (this._queue.length > 0) {
            const nextResolve = this._queue.shift();
            if (nextResolve) {
                nextResolve();
            }
        } else {
            this._locked = false;
        }
    }
}

export default ConcurrentSuiteMetrics;
