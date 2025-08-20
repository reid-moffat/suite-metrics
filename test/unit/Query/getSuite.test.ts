import SuiteMetrics, { Suite } from "suite-metrics";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Query] getSuite", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: Suite = instance.queries.getSuite([]);
        console.log(`Result: ${JSON.stringify(result, null, 4)}`);

        assert.equal(result.tests.size, 0);
        assert.equal(result.subSuites.size, DEFAULT_OPTIONS.numSuites);
    });
});
