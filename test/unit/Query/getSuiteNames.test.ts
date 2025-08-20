import SuiteMetrics from "suite-metrics";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";

suite("[Query] getSuiteNames", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result = instance.queries.getSuiteNames([]);
    });
});
