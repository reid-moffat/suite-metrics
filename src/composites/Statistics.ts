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

    public constructor(suites: Suites) {
        this.suites = suites;
    }

    /**
     * Gets the standard deviation of the set of all test durations
     *
     * @param usePopulation Set to true for population standard deviation (divide by N),
     *                      false for sample standard deviation (divide by N-1) (default: true)
     * @returns The standard deviation of test durations in microseconds
     * @throws Error If there is insufficient data (less than two total tests)
     */
    public getStandardDeviation(usePopulation: boolean = true): number {
        this.ensureValidCachedStdDev();

        return usePopulation ? this.stdDevPopulation : this.stdDevSample;
    }

    /**
     * Calculates the exact Z-score for a given test
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
     * @param usePopulation Set to true for population standard deviation (divide by N),
     *                      false for sample standard deviation (divide by N-1) (default: true)
     * @returns Z-score value:
     *          - Positive values: test is slower than average
     *          - Negative values: test is faster than average
     *          - 0: test duration equals the mean
     *          - Typical range: -3 to +3 (99.7% of data falls within this range)
     * @throws Error if test doesn't exist, or insufficient data for calculation (<2 total tests, or all tests have
     * the same duration)
     */
    public getTestZScore(test: Test, usePopulation: boolean = true): number {
        this.ensureValidCachedStdDev();

        // Get statistical measures
        const mean: number = this.suites.getAverageTestDuration();
        const stdDev: number = usePopulation ? this.stdDevPopulation : this.stdDevSample;

        if (stdDev === 0) {
            throw new Error('Cannot calculate Z-score: standard deviation is zero (all tests have same duration)');
        }

        // Calculate Z-score: (X - μ) / σ
        return (test.duration - mean) / stdDev;
    }

    /**
     * Gets all tests with their Z scores
     *
     * @param usePopulation Set to true for population standard deviation (divide by N),
     *                      false for sample standard deviation (divide by N-1) (default: true)
     * @returns Array of all tests in this metrics instance with its corresponding Z-score (exact),
     *          sorted by completion data ascending
     * @throws Error If there is insufficient data for calculation (<2 total tests, or all tests have the same duration)
     */
    public getAllTestsWithZScores(usePopulation: boolean = true): { test: Test, zScore: number }[] {
        this.ensureValidCachedStdDev();

        // Get statistical measures
        const mean: number = this.suites.getAverageTestDuration();
        const stdDev: number = usePopulation ? this.stdDevPopulation : this.stdDevSample;

        if (stdDev === 0) {
            throw new Error('Cannot calculate Z-score: standard deviation is zero (all tests have same duration)');
        }

        // Calculate Z scores
        const allTests: Test[] = this.suites.getAllTestsInOrder();
        return allTests.map((test: Test) => {
            return {
                test: test,
                zScore: (test.duration - mean) / stdDev
            };
        });
    }

    /**
     * Returns a human-readable interpretation of a test's Z-score
     *
     * @param zScore The Z-score of a test
     * @returns Strings to explain the Z-score's meaning: notability and speed
     */
    public interpretZScore(zScore: number): { interpretation: string; severity: 'normal' | 'notable' | 'unusual' | 'extreme'; description: string; } {

        const absZ: number = Math.abs(zScore);
        let interpretation: string;
        let severity: 'normal' | 'notable' | 'unusual' | 'extreme';
        let description: string;

        if (absZ < 1) {
            interpretation = 'Within normal range';
            severity = 'normal';
            description = 'Test performance is close to average';
        } else if (absZ < 2) {
            interpretation = 'Notable deviation';
            severity = 'notable';
            description = `Test is notably ${zScore > 0 ? "slower" : "faster"} than average`;
        } else if (absZ < 3) {
            interpretation = 'Unusual performance';
            severity = 'unusual';
            description = `Test is unusually ${zScore > 0 ? "slow" : "fast"}`;
        } else {
            interpretation = 'Extreme outlier';
            severity = 'extreme';
            description = `Test is extremely ${zScore > 0 ? "slow" : "fast"} (potential issue)`;
        }

        return {
            interpretation,
            severity,
            description
        };
    }


    /**
     * Updates the stored stdDev value if required (tests added since last calculation)
     *
     * Must be called before any method that uses this.stdDev
     */
    private ensureValidCachedStdDev(): void {
        // Skip this calculation if the cache is valid
        const isCacheValid: boolean = this.stdDevTests !== this.suites.getNumTests();
        if (isCacheValid) {
            return;
        }

        const totalTests: number = this.suites.getNumTests();

        if (totalTests < 2) {
            throw new Error('Cannot calculate standard deviation: at least 2 total tests are required');
        }

        // Calculate variance
        const allTests: Test[] = this.suites.getAllTestsInOrder();
        const mean: number = this.suites.getAverageTestDuration();

        const sumSquaredDifferences: number = allTests.reduce((sum: number, test: Test): number => {
            const difference: number = test.duration - mean;
            return sum + (difference * difference);
        }, 0);

        // Update population std dev
        const populationVariance: number = sumSquaredDifferences / allTests.length;
        this.stdDevPopulation = Math.sqrt(populationVariance);

        // Update sample std dev
        const sampleVariance: number = sumSquaredDifferences / allTests.length - 1;
        this.stdDevSample = Math.sqrt(sampleVariance);
    }
}

export default Statistics;
