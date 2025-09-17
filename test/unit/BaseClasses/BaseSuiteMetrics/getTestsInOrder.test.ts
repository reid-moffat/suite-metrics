import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, Test } from "suite-metrics";
import { assert } from "chai";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../../../generators/testDataHelpers.ts";
import { validateTest } from "../../../helpers/validators.ts";

suite("[BaseSuiteMetrics] getTestsInOrder", function() {

    /**
     * Gets and deeply validates all tests in order
     */
    function runTest(instance: BaseSuiteMetrics) {
        const results: Test[] = instance.getTestsInOrder();

        assert.equal(results.length, instance.metrics.getTotalTestCount());

        for (let i: number = 0; i < results.length; ++i) {
            const test: Test = results[i];
            validateTest(test);

            // Ensure this test order is valid
            if (i !== 0) {
                assert.isAtLeast(test.startTimestamp, results[i - 1].endTimestamp);
            }
            if (i !== results.length - 1) {
                assert.isAtMost(test.endTimestamp, results[i + 1].startTimestamp);
            }
        }
    }

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Simple data - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createSimpleTestData(true) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Nested data", function() {
        const instance: SuiteMetrics = createNestedTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Nested data - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createNestedTestData(true) as ConcurrentSuiteMetrics;
        runTest(instance);
    });


    test("Normal preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.NORMAL) as SuiteMetrics;
        runTest(instance);
    });

    test("Normal preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.NORMAL) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Large preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.LARGE_SUITE) as SuiteMetrics;
        runTest(instance);
    });

    test("Large preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.LARGE_SUITE) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Realistic preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.REALISTIC_PREMADE) as SuiteMetrics;
        runTest(instance);
    });

    test("Realistic preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Edge case preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.EDGE_CASES) as SuiteMetrics;
        runTest(instance);
    });

    test("Edge case preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.EDGE_CASES) as ConcurrentSuiteMetrics;
        runTest(instance);
    });
});
