import { castDraft, freeze, produce, WritableDraft } from 'immer';
import { Test } from "../types/structures.ts";

/**
 * Caches expensive computation values (sorted tests, stats) and lazily re-evaluates them
 */
class LazyCache {

    public constructor() { }

    //
    // Ordered tests caches
    //

    // All tests in order of insertion + cached frozen version to return
    private testsInInsertionOrder: Test[] = [];
    private frozenTestsInInsertionOrder: Test[] | null = null;

    // All tests sorted from slowest to fastest (decreasing duration)
    private allTestsSlowestFirst: Test[] = freeze([]);
    // All tests sorted from fastest to slowest (increasing duration)
    private allTestsFastestFirst: Test[] = freeze([]);

    private sortedTestsValid: boolean = false;

    //
    // Statistics caches
    //

    // Cached calculated standard deviation, making repeated calls without added tests O(1)
    private stdDevPopulation: number = 0;
    private stdDevSample: number = 0;

    // Cached mean test duration
    private meanDuration: number = 0;

    // Cached values for the calculations above (making adding m tests O(m), not O(n))
    private cachedCount: number = 0;
    private cachedSum: number = 0;
    private cachedSumSquares: number = 0;

    private statisticsValid: boolean = false;


    /**
     * Adds a test to this cache (must be called after every test addition in order)
     */
    public addTest(test: Test): void {
        this.testsInInsertionOrder.push(castDraft(test));

        // Invalidate caches
        this.frozenTestsInInsertionOrder = null;
        this.sortedTestsValid = false;
        this.statisticsValid = false;
    }

    /**
     * Gets the total number of tests in this metrics instance
     */
    public getNumTests(): number {
        return this.testsInInsertionOrder.length;
    }

    /**
     * Returns an array with all tests in this metrics instance, in the order they were inserted in
     */
    public getAllTestsInOrder(): Test[] {
        if (!this.frozenTestsInInsertionOrder) {
            this.frozenTestsInInsertionOrder = freeze([...this.testsInInsertionOrder]);
        }
        return this.frozenTestsInInsertionOrder;
    }

    /**
     * Gets all tests by their completion duration, slowest (longer duration) first
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsSlowestFirst(): Test[] {
        this.ensuredSortedTests();
        return this.allTestsSlowestFirst;
    }

    /**
     * Gets all tests by their completion duration, fastest (lower duration) first
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsFastestFirst(): Test[] {
        this.ensuredSortedTests();
        return this.allTestsFastestFirst;
    }

    /**
     * Gets the standard deviation (sample or population)
     */
    public getStdDev(population: boolean): number {
        this.ensureValidCachedStats();
        return population ? this.stdDevPopulation : this.stdDevSample;
    }

    /**
     * Gets the mean test duration in microseconds
     */
    public getMeanDuration(): number {
        this.ensureValidCachedStats();
        return this.meanDuration;
    }


    /**
     * Ensures sorted test caches (allTestsSlowestFirst & allTestsFastestFirst) are valid
     */
    private ensuredSortedTests(): void {
        // Skip if valid
        if (this.sortedTestsValid) {
            return;
        }

        // Re-sort tests to get slowest first
        const newSlowestTests: Test[] = [...this.testsInInsertionOrder].sort((a: Test, b: Test): number => b.duration - a.duration);
        this.allTestsSlowestFirst = freeze(newSlowestTests);

        // Manual reverse slowest tests for efficiency
        const len: number = this.allTestsSlowestFirst.length;
        const startIndex: number = len - 1;
        const fastestFirst = new Array(len);
        for (let i: number = 0; i < len; ++i) {
            fastestFirst[i] = this.allTestsSlowestFirst[startIndex - i];
        }
        this.allTestsFastestFirst = freeze(fastestFirst);

        this.sortedTestsValid = true;
    }

    /**
     * Updates cached values (stDev, sum, mean, etc) if required (if tests were added since last calculation)
     * Must be called before any method that uses any cached value, otherwise cache could be invalid
     *
     * Given:
     * n: Number of tests present during the previous call of this method
     * m: Number of tests added since the previous call of this method
     * The complexity is O(m), not O(m + n), ensuring maximum efficiency
     */
    private ensureValidCachedStats(): void {
        // Skip if valid
        if (this.statisticsValid) {
            return;
        }

        // Zero or one test -> can't calculate standard deviation
        const currentTestCount: number = this.getNumTests();
        if (currentTestCount < 2) {
            throw new Error('Cannot calculate standard deviation: at least 2 total tests are required');
        }

        // Process all new tests (or all tests if this is the first call)
        const testsToProcess: Test[] = this.cachedCount > 0
            ? this.getAllTestsInOrder().slice(this.cachedCount)
            : this.getAllTestsInOrder();

        for (const test of testsToProcess) {
            this.cachedSum += test.duration;
            this.cachedSumSquares += test.duration * test.duration;
        }

        // Recalculate derived values
        this.cachedCount = currentTestCount;
        this.meanDuration = this.cachedSum / this.cachedCount;

        const meanSquare: number = this.cachedSumSquares / this.cachedCount;
        const squareMean: number = this.meanDuration * this.meanDuration;
        const populationVariance: number = meanSquare - squareMean; // Computational formula: Var(X) = E[X²] - (E[X])²

        this.stdDevPopulation = Math.sqrt(populationVariance);
        this.stdDevSample = Math.sqrt(populationVariance * this.cachedCount / (this.cachedCount - 1));


        // Stats cache is now valid
        this.statisticsValid = true;
    }
}

export default LazyCache;
