import SuiteMetrics from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Query] getSuiteNames", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: string[] = instance.queries.getSuiteNames([]);
        console.log(`Result: ${serialize(result, 4)}`);

        assert.equal(result.length, DEFAULT_OPTIONS.numSuites);
        for (let i: number = 0; i < result.length; ++i) {
            assert.isString(result[i]);
            assert.equal(result[i], DEFAULT_OPTIONS.suiteNamePrefix + (i + 1));
        }
    });
});
