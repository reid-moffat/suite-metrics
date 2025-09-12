import { Test } from "../types/structures.ts";

class LazyCache {

    public constructor() { }

    // All tests in order of insertion
    private readonly testsInInsertionOrder: Test[] = [];

    // All tests sorted from slowest to fastest (decreasing duration)
    private allTestsSlowestFirst: Test[] = [];
    // All tests sorted from fastest to slowest (increasing duration)
    private allTestsFastestFirst: Test[] = [];

    // If the sorted lists (testsByDuration, testsByDurationReversed) are valid
    private cacheValid: boolean = false;


    /**
     * Adds a test to this cache (must be called after every test addition in order)
     */
    public addTest(test: Test): void {
        this.testsInInsertionOrder.push(test);
    }

    /**
     * Returns an array with all tests in this metrics instance, in the order they were inserted in
     */
    public getAllTestsInOrder(): Test[] {
        return this.testsInInsertionOrder;
    }

    /**
     * Gets all tests by their completion duration, slowest (longer duration) first
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsSlowestFirst(): Test[] {
        this.ensureSortedCache();
        return this.allTestsSlowestFirst;
    }

    /**
     * Gets all tests by their completion duration, fastest (lower duration) first
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsFastestFirst(): Test[] {
        this.ensureSortedCache();
        return this.allTestsFastestFirst;
    }

    /**
     * Ensures sorted test caches (allTestsSlowestFirst & allTestsFastestFirst) are valid
     */
    private ensureSortedCache() {
        // Update sorted cached arrays if required
        if (!this.cacheValid) {
            this.allTestsSlowestFirst = [...this.testsInInsertionOrder].sort((a: Test, b: Test): number => b.duration - a.duration);

            // Manual reverse for efficiency
            const len: number = this.allTestsSlowestFirst.length;
            const startIndex: number = len - 1;
            this.allTestsFastestFirst = new Array(len);
            for (let i: number = 0; i < len; ++i) {
                this.allTestsFastestFirst[i] = this.allTestsSlowestFirst[startIndex - i];
            }

            this.cacheValid = true;
        }
    }
}

export default LazyCache;
