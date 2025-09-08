import SuiteMetrics, { Test } from "suite-metrics";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Performance] getAllTestsFastestFirst", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const fastestTests: Test[] = instance.performance.getAllTestsFastestFirst();
        const slowestTests: Test[] = instance.performance.getAllTestsSlowestFirst();

        // Ensure lengths match
        assert.lengthOf(fastestTests, DEFAULT_OPTIONS.numSuites * DEFAULT_OPTIONS.testsPerSuite);
        assert.lengthOf(fastestTests, instance.metrics.getTotalTestCount());

        assert.lengthOf(slowestTests, DEFAULT_OPTIONS.numSuites * DEFAULT_OPTIONS.testsPerSuite);
        assert.lengthOf(slowestTests, instance.metrics.getTotalTestCount());

        assert.lengthOf(fastestTests, slowestTests.length);

        // Ensure ordering is valid
        for (let i: number = 0; i < fastestTests.length - 1; ++i) {
            assert.isAtMost(fastestTests[i].duration, fastestTests[i + 1].duration);
        }
        for (let i: number = 0; i < slowestTests.length - 1; ++i) {
            assert.isAtLeast(slowestTests[i].duration, slowestTests[i + 1].duration);
        }

        // Ensure data is the same but the order is just swapped
        for (let i: number = 0; i < slowestTests.length; ++i) {
            assert.deepEqual(fastestTests[i], slowestTests[slowestTests.length - i - 1]);
        }
    });
});
