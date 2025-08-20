import SuiteMetrics from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Query] getTestNames", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: string[] = instance.queries.getTestNames([]);
        console.log(`Result: ${serialize(result, 4)}`);

        assert.equal(result.length, 0);
    });
});
