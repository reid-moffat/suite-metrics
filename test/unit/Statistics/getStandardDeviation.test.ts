import SuiteMetrics from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Statistics] getStandardDeviation", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: number = instance.statistics.getStandardDeviation();
        console.log(`Result: ${serialize(result, 4)}`);


    });
});
