import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Statistics] getTestZScore", function () {

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
        const tests: Test[] = instance.getTestsInOrder();
        const zScore: number = instance.statistics.getTestZScore(tests[0]);
        console.log(`Z-score: ${serialize(zScore, 4)}`);

        assert.isAtLeast(zScore, getMinZScore(instance.metrics.getTotalTestCount()));
        assert.isAtMost(zScore, getMaxZScore(instance.metrics.getTotalTestCount()));
    });
});
