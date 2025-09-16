import SuiteMetrics, { ConcurrentSuiteMetrics, StructureMetadata } from "suite-metrics";
import { assert } from "chai";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../../generators/testDataHelpers.ts";

suite("[Metrics] getStructureMetadata", function () {

    /**
     * Validates that an object exactly matches the StructureMetadata structure
     */
    function assertStructureMetadata(obj: any) {

        // Top-level validation
        assert.isNotNull(obj, `Expected structure to not be null`);
        assert.isObject(obj, `Expected structure to be an object`);
        assert.isNotArray(obj, `Expected structure to not be an array`);
        assert.isNotEmpty(obj, `Expected structure to not be empty`);

        // Validate root-level keys
        const rootKeys: string[] = Object.keys(obj);
        const expectedRootKeys: string[] = ['suites', 'timing'];
        assert.sameMembers(rootKeys, expectedRootKeys,
            `Root object should have exactly keys: ${expectedRootKeys.join(', ')}`);

        // Validate suites object
        const suites: any = obj.suites;
        assert.isNotNull(suites, `Expected 'suites' object to not be null`);
        assert.isObject(suites, `Expected 'suites' to be an object`);
        assert.isNotArray(suites, `Expected 'suites' to not be an array`);
        assert.isNotEmpty(suites, `Expected 'suites' to not be empty`);

        const suitesKeys: string[] = Object.keys(suites);
        const expectedSuitesKeys: string[] = [
            'numSuites', 'numLeaves', 'numBranches', 'numHybrid',
            'averageTestsPerSuite', 'averageTestsPerNonEmptySuite',
            'maxDepth', 'minDepth', 'averageDepth', 'averageDepthWeighted'
        ];
        assert.sameMembers(suitesKeys, expectedSuitesKeys,
            `suites object should have exactly keys: ${expectedSuitesKeys.join(', ')}`);

        // Validate all suites properties are numbers
        expectedSuitesKeys.forEach((key: string): void => {
            assert.isNumber(suites[key], `Expected suites.${key} to be a number`);
            assert.isNotNaN(suites[key], `Expected suites.${key} to not be NaN`);
        });

        // Validate timing object
        const timing: any = obj.timing;
        assert.isNotNull(timing, `Expected 'timing' object to not be null`);
        assert.isObject(timing, `Expected 'timing' to be an object`);
        assert.isNotArray(timing, `Expected 'timing' object to not be an array`);
        assert.isNotEmpty(timing, `Expected 'timing' to not be empty`);

        const timingKeys: string[] = Object.keys(timing);
        const expectedTimingKeys: string[] = [
            'totalTests', 'totalTimeDiff', 'totalTestDuration',
            'percentActive', 'averageDuration', 'medianDuration'
        ];
        assert.sameMembers(timingKeys, expectedTimingKeys,
            `timing object should have exactly keys: ${expectedTimingKeys.join(', ')}`);

        // Validate all timing properties are numbers
        expectedTimingKeys.forEach((key: string): void => {
            assert.isNumber(timing[key], `Expected timing.${key} to be a number`);
            assert.isNotNaN(timing[key], `Expected timing.${key} to not be NaN`);
        });
    }

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const structureMetadata: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);
        assertStructureMetadata(structureMetadata);
    });

    test("Nested data", function () {
        const instance: SuiteMetrics = createNestedTestData() as SuiteMetrics;

        const structureMetadata: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);
        assertStructureMetadata(structureMetadata);
    });

    test("Custom edge case data", function () {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.EDGE_CASES) as SuiteMetrics;

        const structureMetadata: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);
        assertStructureMetadata(structureMetadata);
    });

    test("Custom large data", function () {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.LARGE_SUITE) as SuiteMetrics;

        const structureMetadata: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);
        assertStructureMetadata(structureMetadata);
    });

    test("Custom large data concurrent", function () {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.LARGE_SUITE) as ConcurrentSuiteMetrics;

        const structureMetadata: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);
        assertStructureMetadata(structureMetadata);
    });
});
