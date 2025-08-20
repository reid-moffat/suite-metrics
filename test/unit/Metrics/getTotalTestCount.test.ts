import SuiteMetrics from "suite-metrics";
import { assert } from "chai";
import { createSimpleTestData } from "../../generators/testDataHelpers.ts";
import { DEFAULT_OPTIONS } from "../../generators/options.ts";

suite("[Metrics] getTotalTestCount", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result: number = instance.metrics.getTotalTestCount();

        assert.equal(result, DEFAULT_OPTIONS.numSuites * DEFAULT_OPTIONS.testsPerSuite);
    });
});
