import SuiteMetrics, { StructureMetadata } from "suite-metrics";
import { assert } from "chai";
import { createNestedTestData } from "../../generators/testDataHelpers.ts";

suite("[Metrics] getStructureMetadata", function () {

    test("Simple data", function () {
        const instance: SuiteMetrics = createNestedTestData(false, { numSuites: 10, testsPerSuite: 10, maxDepth: 3 }) as SuiteMetrics;

        const result: StructureMetadata = instance.metrics.getStructureMetadata();
    });
});
