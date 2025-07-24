import SortedTestCache from "../helpers/SortedTestCache.ts";
import { Test } from "../types/structures.ts";
import Utils from "../helpers/Utils.js";

class Performance {

    // Efficiently manages fastest and slowest tests
    private readonly cache: SortedTestCache;

    public constructor(cache: SortedTestCache) {
        this.cache = cache;
    }

    /**
     * Gets the slowest test across all suites
     *
     * @returns The test with the longest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getSlowestTest(): Test {
        return Utils.deepCopyTest(this.cache.getSlowestTest());
    }

    /**
     * Gets the k slowest tests across all suites, sorted by duration descending
     *
     * @param k Number of slowest tests to return. Must be a positive integer
     * @returns Array of the k slowest tests, sorted by duration descending
     * @throws Error If k is not a positive integer
     * @throws Error if k is greater than the total number of tests (getTotalTestCount())
     */
    public getKSlowestTests(k: number): Test[] {
        return Utils.deepCopyTests(this.cache.getKSlowestTests(k));
    }

    /**
     * Gets all tests sorted by duration descending (slowest first)
     *
     * @returns Array of all tests sorted by duration in descending order
     */
    public getAllTestsSlowestFirst(): Test[] {
        return Utils.deepCopyTests(this.cache.getAllTestsSlowestFirst());
    }

    /**
     * Gets the fastest test across all suites
     *
     * @returns The test with the shortest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getFastestTest(): Test {
        return Utils.deepCopyTest(this.cache.getFastestTest());
    }

    /**
     * Gets the k fastest tests across all suites, sorted by duration ascending
     *
     * @param k Number of fastest tests to return. Must be a positive integer
     * @returns Array of the k fastest tests, sorted by duration ascending
     * @throws Error If k is not a positive integer
     * @throws Error if k is greater than the total number of tests (getTotalTestCount())
     */
    public getKFastestTests(k: number): Test[] {
        return Utils.deepCopyTests(this.cache.getKFastestTests(k));
    }

    /**
     * Gets all tests sorted by duration ascending (fastest first)
     *
     * @returns Array of all tests sorted by duration in ascending order
     */
    public getAllTestsFastestFirst(): Test[] {
        return Utils.deepCopyTests(this.cache.getAllTestsFastestFirst());
    }
}

export default Performance;
