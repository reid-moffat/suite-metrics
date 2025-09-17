import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, Suite } from "suite-metrics";
import { assert } from "chai";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../../../generators/testDataHelpers.ts";
import { validateSuiteRecursive } from "../../../helpers/validators.ts";

suite("[BaseSuiteMetrics] getAllData", function() {

    /**
     * Gets and deeply validates a top-level suite
     */
    function runTest(instance: BaseSuiteMetrics) {
        const result: Suite = instance.getAllData();

        // Validations for the top-level suite specifically
        const numTests: number = instance.metrics.getTotalTestCount();
        assert.equal(result.name, "<Top-Level suite>", `Top-level suite must be named <Top-Level suite>`);
        assert.deepEqual(result.path, [], `Top-level suite must have an empty path ([])`);
        assert.equal(result.tests.size, 0, `Top-level suite can't have tests`);
        assert.equal(result.aggregateData.numTests, numTests);
        const average: number = numTests === 0 ? 0 : Math.round(result.aggregateData.totalTestTime / numTests);
        assert.equal(average, instance.metrics.getAverageTestDuration(), `Average duration must be top-level total divided by test count rounded`);

        // Then recursively validate as per normal
        validateSuiteRecursive(result);
    }


    test("Empty instance", function() {
        const instance: SuiteMetrics = new SuiteMetrics();
        runTest(instance);
    });

    test("Empty instance - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = new ConcurrentSuiteMetrics();
        runTest(instance);
    });

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
