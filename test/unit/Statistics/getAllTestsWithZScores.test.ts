import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Statistics] getAllTestsWithZScores", function () {

    /**
     * Gets the minimum theoretical Z-score for a set of n tests
     */
    function getMinZScore(n: number) {
        return -Math.sqrt(n - 1);
    }

    /**
     * Gets the maximum theoretical Z-score for a set of n tests
     */
    function getMaxZScore(n: number) {
        return Math.sqrt(n - 1);
    }

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const tests: { test: Test, zScore: number }[] = instance.statistics.getAllTestsWithZScores();
        console.log(`Result: ${serialize(tests, 4)}`);

        assert.lengthOf(tests, DEFAULT_OPTIONS.testsPerSuite * DEFAULT_OPTIONS.numSuites);
        assert.lengthOf(tests, instance.metrics.getTotalTestCount());

        for (let i: number = 0; i < tests.length; ++i) {
            assert.isAtLeast(tests[i].zScore, getMinZScore(instance.metrics.getTotalTestCount()));
            assert.isAtMost(tests[i].zScore, getMaxZScore(instance.metrics.getTotalTestCount()));
        }
    });
});
