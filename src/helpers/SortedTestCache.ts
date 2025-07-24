import { Test } from "../types/structures.ts";

/**
 * Manages a lazy sorted cache of tests for efficient retrieval of fastest/slowest tests
 */
class SortedTestCache {

    // All tests for a given metrics in their original test order
    private readonly originalOrder: Test[] = [];

    // All tests for a given metrics sorted from slowest to fastest
    private cache: Test[] = [];

    // Whether the cache is sorted
    private sortedCacheValid: boolean = false;

    /**
     * Returns the total number of tests
     */
    public getNumTests(): number {
        return this.originalOrder.length;
    }

    /**
     * Returns a reference to the cache
     */
    public get(): Test[] {
        return this.cache
    }

    /**
     * Gets all tests in the order they were completed
     */
    public getTestsInOrder(): Test[] {
        return this.originalOrder;
    }

    /**
     * Adds a test to the cache and invalidates the sorted cache
     *
     * @param test The test to add
     */
    public addTest(test: Test): void {
        this.originalOrder.push(test);
        this.sortedCacheValid = false;
    }

    /**
     * Rebuilds the sorted cache if invalid
     */
    public ensureSortedCache(): void {
        if (!this.sortedCacheValid) {
            // Sort by duration in descending order (slowest goes first)
            this.cache = this.originalOrder.sort((a: Test, b: Test): number => b.duration - a.duration);
            this.sortedCacheValid = true;
        }
    }
}

export default SortedTestCache;
