import SuiteMetrics from "suite-metrics";
import { assert } from "chai";
import { createSimpleTestData } from "../../generators/testDataHelpers.ts";
import { DEFAULT_OPTIONS } from "../../generators/options.ts";

suite("[Metrics] getAverageTestDuration", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result: number = instance.metrics.getAverageTestDuration();

        assert.isAtLeast(result, DEFAULT_OPTIONS.minDuration);
        assert.isAtMost(result, DEFAULT_OPTIONS.maxDuration);
    });
});
