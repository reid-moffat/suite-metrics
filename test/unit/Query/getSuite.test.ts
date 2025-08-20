import SuiteMetrics, { Suite } from "suite-metrics";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Query] getSuite", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result: Suite = instance.queries.getSuite([]);
    });
});
