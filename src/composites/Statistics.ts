import { Test } from "../types/structures.ts";
import Suites from "../helpers/Suites.ts";

/**
 * Statistical methods surrounding Tests and Suites
 */
class Statistics {

    // Ref to suites instance with all this metrics' data
    private readonly suites: Suites;

    constructor(suites: Suites) {
        this.suites = suites;
    }

    /**
     * Gets the standard deviation of the set of all test durations
     *
     * @param usePopulation Set to true for population standard deviation (divide by N),
     *                      false for sample standard deviation (divide by N-1) (default: false)
     * @returns The standard deviation of test durations in microseconds
     * @throws Error If there are no tests in this metrics, or only one for a sample standard deviation
     */
    public getStandardDeviation(usePopulation: boolean = false): number {
        const totalTests: number = this.suites.getAllTestsInOrder().length;

        if (totalTests === 0) {
            throw new Error('Cannot calculate standard deviation: no tests available');
        }

        if (!usePopulation && totalTests < 2) {
            throw new Error('Cannot calculate sample standard deviation: need at least 2 tests');
        }

        // Calculate mean
        const durations: number[] = this.suites.getAllTestsInOrder().map((test: Test): number => test.duration);
        const mean: number = durations.reduce((sum: number, duration: number): number => sum + duration, 0) / durations.length;

        // Calculate variance
        const sumSquaredDifferences: number = durations.reduce((sum: number, duration: number): number => {
            const difference: number = duration - mean;
            return sum + (difference * difference);
        }, 0);

        const divisor: number = usePopulation ? durations.length : durations.length - 1;
        const variance: number = sumSquaredDifferences / divisor;

        return Math.sqrt(variance);
    }
}

export default Statistics;
