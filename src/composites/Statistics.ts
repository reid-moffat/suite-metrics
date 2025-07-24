import { Test } from "../types/structures.ts";
import Suites from "../helpers/Suites.ts";

/**
 * Statistical methods surrounding Tests and Suites
 */
class Statistics {

    // Ref to suites instance with all this metrics' data
    private readonly suites: Suites;

    // Store calculated standard deviation (population & sample) for efficiency
    private stdDevPopulation: number = 0;
    private stdDevSample: number = 0;

    // Number of tests present when the stDev was calculated (used to verify if recalculation is required)
    private stdDevTests: number = 0;

    constructor(suites: Suites) {
        this.suites = suites;
    }

    /**
     * Gets the standard deviation of the set of all test durations
     *
     * @param usePopulation Set to true for population standard deviation (divide by N),
     *                      false for sample standard deviation (divide by N-1) (default: false)
     * @returns The standard deviation of test durations in microseconds
     * @throws Error If there is insufficient data (less than two total tests)
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

    /**
     * Calculates the Z-score (standard score) for a given test
     *
     * Key Interpretations:
     * - Z = 0: Test duration equals the mean
     * - Z = +1: Test is 1 standard deviation slower than average (84th percentile)
     * - Z = +2: Test is 2 standard deviations slower (97.7th percentile) - Notably slow
     * - Z = +3: Test is 3 standard deviations slower (99.9th percentile) - Extremely slow
     * - Z = -1: Test is 1 standard deviation faster than average (16th percentile)
     * - Z = -2: Test is 2 standard deviations faster (2.3rd percentile) - Notably fast
     * - Z = -3: Test is 3 standard deviations faster (0.13th percentile) - Extremely fast
     *
     * @param test Test object to get (can use query.getTest(path) to get the test object from its path)
     * @returns Z-score value:
     *          - Positive values: test is slower than average
     *          - Negative values: test is faster than average
     *          - 0: test duration equals the mean
     *          - Typical range: -3 to +3 (99.7% of data falls within this range)
     * @throws Error if test doesn't exist, or insufficient data for calculation (<2 total tests, or all tests have
     * the same duration)
     */
    public getTestZScore(test: Test): number {

        const totalTests: number = this.suites.getNumTests();
        if (totalTests < 2) {
            throw new Error('Need at least 2 tests to calculate Z-score');
        }

        // Get statistical measures
        const mean: number = this.suites.getAverageTestDuration();
        const stdDev: number = this.getStandardDeviation();

        if (stdDev === 0) {
            throw new Error('Cannot calculate Z-score: standard deviation is zero (all tests have same duration)');
        }

        // Calculate Z-score: (X - μ) / σ
        const zScore: number = (test.duration - mean) / stdDev;

        return Math.round(zScore * 1000) / 1000;
    }


    /**
     * Updates the stored stdDev value if required (tests added since last calculation)
     *
     * Must be called before any method that uses this.stdDev
     */
    private ensureValidCachedStdDev(): void {
        const isCacheValid: boolean = this.stdDevTests !== this.suites.getNumTests();

        if (!isCacheValid) {
            this.updateCachedStdDev();
        }
    }

    /**
     * Updates the cached this.stdDev value to reflect new test additions
     */
    private updateCachedStdDev(): void {
        const totalTests: number = this.suites.getNumTests();

        if (totalTests < 2) {
            throw new Error('Cannot calculate standard deviation: at least 2 total tests are required');
        }

        // Calculate mean
        const durations: number[] = this.suites.getAllTestsInOrder().map((test: Test): number => test.duration);
        const mean: number = durations.reduce((sum: number, duration: number): number => sum + duration, 0) / durations.length; // TODO: avg?

        // Calculate variance
        const sumSquaredDifferences: number = durations.reduce((sum: number, duration: number): number => {
            const difference: number = duration - mean;
            return sum + (difference * difference);
        }, 0);

        // Update population std dev
        const populationVariance: number = sumSquaredDifferences / durations.length;
        this.stdDevPopulation = Math.sqrt(populationVariance);

        // Update sample std dev
        const sampleVariance: number = sumSquaredDifferences / durations.length - 1;
        this.stdDevSample = Math.sqrt(sampleVariance);
    }
}

export default Statistics;
