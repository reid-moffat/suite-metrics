import SuiteMetrics from "suite-metrics";
import { assert } from "chai";
import { createSimpleTestData } from "../../generators/testDataHelpers.ts";

suite("[Metrics] getTotalTestCount", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result: string = instance.metrics.printAllSuiteMetrics();

        assert.isString(result);
    });
});
