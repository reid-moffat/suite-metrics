import SuiteMetrics from "suite-metrics";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Query] getSuiteNames", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result = instance.queries.getSuiteNames([]);
    });
});
