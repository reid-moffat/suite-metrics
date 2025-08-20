import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Statistics] getTestZScore", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const tests: Test[] = instance.getTestsInOrder();
        const zScore: number = instance.statistics.getTestZScore(tests[0]);
        console.log(`Z-score: ${serialize(zScore, 4)}`);

        assert.isAtLeast(zScore, -3);
        assert.isAtMost(zScore, 3);
    });
});
