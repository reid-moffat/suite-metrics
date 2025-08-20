import SuiteMetrics from "suite-metrics";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";

suite("[Query] getSuite", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result = instance.queries.getSuite([]);
    });
});
