import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Performance] getAllTestsSlowestFirst", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: Test[] = instance.performance.getAllTestsSlowestFirst();
        console.log(`Result: ${serialize(result, 4)}`);

        assert.lengthOf(result, DEFAULT_OPTIONS.numSuites * DEFAULT_OPTIONS.testsPerSuite);
        assert.lengthOf(result, instance.metrics.getTotalTestCount());

        const allTests: Test[] = instance.performance.getAllTestsSlowestFirst();
        for (let i: number = 0; i < result.length; ++i) {
            assert.deepEqual(result[i], allTests[i]);
        }
    });
});
