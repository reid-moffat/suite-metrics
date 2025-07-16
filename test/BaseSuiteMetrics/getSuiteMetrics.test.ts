import { assert } from 'chai';
import SuiteMetrics from "../../src/index.ts";
import { createSimpleTestData, createNestedTestData } from "../generators/testDataHelpers.ts";

suite("[BaseSuiteMetrics] getSuiteMetrics", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("Non-array path", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getSuiteMetrics("not an array"), 'Path must be an array of strings', 'Should throw error when path is not an array');
        });

        test("Path with empty strings", function() {
            assert.throws(() => metrics.getSuiteMetrics([""]), 'Path must be an array of non-empty strings', 'Should throw error when path contains single empty string');
            assert.throws(() => metrics.getSuiteMetrics(["suite", ""]), 'Path must be an array of non-empty strings', 'Should throw error when path contains empty string at end');
            assert.throws(() => metrics.getSuiteMetrics(["", "suite"]), 'Path must be an array of non-empty strings', 'Should throw error when path contains empty string at start');
        });

        test("Path with non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getSuiteMetrics([123]), 'Path must be an array of non-empty strings', 'Should throw error when path contains number');
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getSuiteMetrics(["suite", null]), 'Path must be an array of non-empty strings', 'Should throw error when path contains null');
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getSuiteMetrics(["suite", undefined]), 'Path must be an array of non-empty strings', 'Should throw error when path contains undefined');
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getSuiteMetrics([{}, "suite"]), 'Path must be an array of non-empty strings', 'Should throw error when path contains object');
        });

        test("Empty array (top-level suite)", function() {
            assert.doesNotThrow(() => metrics.getSuiteMetrics([]), 'Empty array should be allowed for top-level suite');
        });

        test("isTest and allowTopLevel options together (internal validation)", function() {
            // This tests the internal validatePath method indirectly
            // The getSuiteMetrics method should use allowTopLevel: true, not isTest: true
            assert.doesNotThrow(() => metrics.getSuiteMetrics([]), 'getSuiteMetrics should allow empty array with allowTopLevel option');
        });
    });

    suite("Non-existent Suite Handling", function() {
        test("Non-existent single-level suite", function() {
            assert.throws(() => metrics.getSuiteMetrics(["NonExistentSuite"]), 'Suite path [NonExistentSuite] does not exist', 'Should throw error when single-level suite does not exist');
        });

        test("Non-existent multi-level suite", function() {
            assert.throws(() => metrics.getSuiteMetrics(["NonExistent", "Suite"]), 'Suite path [NonExistent, Suite] does not exist', 'Should throw error when multi-level suite does not exist');
            assert.throws(() => metrics.getSuiteMetrics(["Non", "Existent", "Suite", "Path"]), 'Suite path [Non, Existent, Suite, Path] does not exist', 'Should throw error when deep multi-level suite does not exist');
        });

        test("Partially non-existent nested path", function() {
            metrics.startTest(["Level1", "Level2", "Test1"]);
            metrics.stopTest();

            assert.throws(() => metrics.getSuiteMetrics(["Level1", "NonExistentLevel2"]), 'Suite path [Level1, NonExistentLevel2] does not exist', 'Should throw error when intermediate suite does not exist');
            assert.throws(() => metrics.getSuiteMetrics(["NonExistentLevel1", "Level2"]), 'Suite path [NonExistentLevel1, Level2] does not exist', 'Should throw error when first level suite does not exist');
        });

        test("Test path used as suite path", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            // Test path should not be accessible as suite path
            assert.throws(() => metrics.getSuiteMetrics(["Suite1", "Test1"]), 'Suite path [Suite1, Test1] does not exist', 'Test path should not be accessible as suite path');
        });
    });

    suite("Basic Functionality", function() {
        test("Complete suite data for top-level suite", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            const topLevelData = metrics.getSuiteMetrics([]);

            assert.isObject(topLevelData, 'Top level data should be an object');
            assert.strictEqual(topLevelData.name, "<Top-Level suite>", 'Top level suite should have correct name');
            assert.isNull(topLevelData.parentSuites, 'Top level suite should have null parent suites');
            assert.isArray(topLevelData.childSuites, 'Top level suite should have array of child suites');
            assert.isArray(topLevelData.childSuites, 'Top level suite should have child suites array');
            assert.includeMembers(topLevelData.childSuites!, ["Suite1", "Suite2"], 'Top level suite should include created child suites');
            assert.isObject(topLevelData.testMetrics, 'Top level suite should have test metrics object');
            assert.strictEqual(topLevelData.testMetrics.numTests, 0, 'Top level suite should have no direct tests');
            assert.isNull(topLevelData.testMetrics.totalTime, 'Top level suite should have null total time when no direct tests');
            assert.isNull(topLevelData.testMetrics.averageTime, 'Top level suite should have null average time when no direct tests');
        });

        test("Complete suite data for single-level suite", function() {
            metrics.startTest(["SimpleSuite", "Test1"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["SimpleSuite"]);

            assert.strictEqual(suiteData.name, "SimpleSuite", 'Single-level suite should have correct name');
            assert.deepEqual(suiteData.parentSuites, [], 'Single-level suite should have empty parent suites array');
            assert.deepEqual(suiteData.childSuites, [], 'Single-level suite should have empty child suites array');
            assert.strictEqual(suiteData.testMetrics.numTests, 1, 'Single-level suite should have one test');
            assert.isNumber(suiteData.testMetrics.totalTime, 'Single-level suite should have numeric total time');
            assert.isAbove(suiteData.testMetrics.totalTime!, 0, 'Single-level suite should have positive total time');
            assert.strictEqual(suiteData.testMetrics.averageTime, suiteData.testMetrics.totalTime!, 'Single test suite should have average equal to total time');
        });

        test("Complete suite data for nested suite", function() {
            metrics.startTest(["Level1", "Level2", "Level3", "Test1"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["Level1", "Level2", "Level3"]);

            assert.strictEqual(suiteData.name, "Level3", 'Nested suite should have correct name');
            assert.deepEqual(suiteData.parentSuites, ["Level1", "Level2"], 'Nested suite should have correct parent suites');
            assert.deepEqual(suiteData.childSuites, [], 'Leaf nested suite should have empty child suites array');
            assert.strictEqual(suiteData.testMetrics.numTests, 1, 'Nested suite should have one test');
            assert.isNumber(suiteData.testMetrics.totalTime, 'Nested suite should have numeric total time');
            assert.isAbove(suiteData.testMetrics.totalTime!, 0, 'Nested suite should have positive total time');
            assert.strictEqual(suiteData.testMetrics.averageTime, suiteData.testMetrics.totalTime!, 'Single test nested suite should have average equal to total time');
        });

        test("Suites with special characters in names", function() {
            const specialSuiteName = "Suite with spaces & symbols!@#$%^&*()";
            metrics.startTest([specialSuiteName, "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics([specialSuiteName]);
            assert.strictEqual(suiteData.name, specialSuiteName, 'Suite with special characters should preserve name');
        });

        test("Suites with unicode characters", function() {
            const unicodeSuiteName = "测试套件 🧪 тест";
            metrics.startTest([unicodeSuiteName, "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics([unicodeSuiteName]);
            assert.strictEqual(suiteData.name, unicodeSuiteName, 'Suite with unicode characters should preserve name');
        });
    });

    suite("Test Metrics Calculation", function() {
        test("Correct metrics for suite with single test", function() {
            metrics.startTest(["SingleTestSuite", "OnlyTest"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["SingleTestSuite", "OnlyTest"]);
            const suiteData = metrics.getSuiteMetrics(["SingleTestSuite"]);

            assert.strictEqual(suiteData.testMetrics.numTests, 1, 'Single test suite should have one test');
            assert.strictEqual(suiteData.testMetrics.totalTime, testMetrics.duration, 'Single test suite total time should equal test duration');
            assert.strictEqual(suiteData.testMetrics.averageTime, testMetrics.duration, 'Single test suite average time should equal test duration');
        });

        test("Correct metrics for suite with multiple tests", function() {
            // Create tests with different durations
            metrics.startTest(["MultiTestSuite", "FastTest"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "SlowTest"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 10) { /* busy wait longer */ }
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "MediumTest"]);
            const mediumStart = Date.now();
            while (Date.now() - mediumStart < 5) { /* busy wait medium */ }
            metrics.stopTest();

            const fastTest = metrics.getTestMetrics(["MultiTestSuite", "FastTest"]);
            const slowTest = metrics.getTestMetrics(["MultiTestSuite", "SlowTest"]);
            const mediumTest = metrics.getTestMetrics(["MultiTestSuite", "MediumTest"]);
            const suiteData = metrics.getSuiteMetrics(["MultiTestSuite"]);

            const expectedTotal = fastTest.duration + slowTest.duration + mediumTest.duration;
            const expectedAverage = expectedTotal / 3;

            assert.strictEqual(suiteData.testMetrics.numTests, 3, 'Multi test suite should have three tests');
            assert.strictEqual(suiteData.testMetrics.totalTime, expectedTotal, 'Multi test suite total time should equal sum of test durations');
            assert.strictEqual(suiteData.testMetrics.averageTime, expectedAverage, 'Multi test suite average time should equal total divided by count');
            assert.isAbove(slowTest.duration, mediumTest.duration, 'Slow test should have longer duration than medium test');
            assert.isAbove(mediumTest.duration, fastTest.duration, 'Medium test should have longer duration than fast test');
        });

        test("Suite with no direct tests", function() {
            // Create a suite with only sub-suites (no direct tests)
            metrics.startTest(["ParentSuite", "ChildSuite", "Test1"]);
            metrics.stopTest();

            const parentData = metrics.getSuiteMetrics(["ParentSuite"]);

            assert.strictEqual(parentData.testMetrics.numTests, 0, 'Parent suite with no direct tests should have zero test count');
            assert.isNull(parentData.testMetrics.totalTime, 'Parent suite with no direct tests should have null total time');
            assert.isNull(parentData.testMetrics.averageTime, 'Parent suite with no direct tests should have null average time');
            assert.deepEqual(parentData.childSuites, ["ChildSuite"], 'Parent suite should have child suite');
        });

        test("Only count direct tests, not sub-suite tests", function() {
            // Create a complex hierarchy
            metrics.startTest(["MainSuite", "DirectTest1"]);
            metrics.stopTest();

            metrics.startTest(["MainSuite", "DirectTest2"]);
            metrics.stopTest();

            metrics.startTest(["MainSuite", "SubSuite", "SubTest1"]);
            metrics.stopTest();

            metrics.startTest(["MainSuite", "SubSuite", "SubTest2"]);
            metrics.stopTest();

            const mainSuiteData = metrics.getSuiteMetrics(["MainSuite"]);
            const subSuiteData = metrics.getSuiteMetrics(["MainSuite", "SubSuite"]);

            // Main suite should only count direct tests
            assert.strictEqual(mainSuiteData.testMetrics.numTests, 2, 'Main suite should only count direct tests');
            assert.deepEqual(mainSuiteData.childSuites, ["SubSuite"], 'Main suite should have sub suite as child');

            // Sub suite should count its direct tests
            assert.strictEqual(subSuiteData.testMetrics.numTests, 2, 'Sub suite should count its direct tests');
            assert.deepEqual(subSuiteData.childSuites, [], 'Sub suite should have no child suites');
        });
    });

    suite("Parent and Child Suite Information", function() {
        test("Correctly identify parent suites for nested suites", function() {
            metrics.startTest(["L1", "L2", "L3", "L4", "Test1"]);
            metrics.stopTest();

            const l1Data = metrics.getSuiteMetrics(["L1"]);
            const l2Data = metrics.getSuiteMetrics(["L1", "L2"]);
            const l3Data = metrics.getSuiteMetrics(["L1", "L2", "L3"]);
            const l4Data = metrics.getSuiteMetrics(["L1", "L2", "L3", "L4"]);

            assert.deepEqual(l1Data.parentSuites, [], 'L1 should have no parent suites');
            assert.isArray(l2Data.parentSuites, 'L2 should have parent suites array');
            assert.deepEqual(l2Data.parentSuites!, ["L1"], 'L2 should have L1 as parent');
            assert.isArray(l3Data.parentSuites, 'L3 should have parent suites array');
            assert.deepEqual(l3Data.parentSuites!, ["L1", "L2"], 'L3 should have L1 and L2 as parents');
            assert.isArray(l4Data.parentSuites, 'L4 should have parent suites array');
            assert.deepEqual(l4Data.parentSuites!, ["L1", "L2", "L3"], 'L4 should have L1, L2, and L3 as parents');
        });

        test("Correctly identify child suites", function() {
            // Create a branching structure
            metrics.startTest(["Root", "Branch1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Root", "Branch2", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Root", "Branch3", "SubBranch", "Test3"]);
            metrics.stopTest();

            const rootData = metrics.getSuiteMetrics(["Root"]);
            const branch1Data = metrics.getSuiteMetrics(["Root", "Branch1"]);
            const branch3Data = metrics.getSuiteMetrics(["Root", "Branch3"]);
            const subBranchData = metrics.getSuiteMetrics(["Root", "Branch3", "SubBranch"]);

            assert.isArray(rootData.childSuites, 'Root should have child suites array');
            assert.includeMembers(rootData.childSuites!, ["Branch1", "Branch2", "Branch3"], 'Root should have all branches as children');
            assert.deepEqual(branch1Data.childSuites, [], 'Branch1 should have no child suites');
            assert.deepEqual(branch3Data.childSuites, ["SubBranch"], 'Branch3 should have SubBranch as child');
            assert.deepEqual(subBranchData.childSuites, [], 'SubBranch should have no child suites');
        });

        test("Suites with both direct tests and child suites", function() {
            metrics.startTest(["MixedSuite", "DirectTest"]);
            metrics.stopTest();

            metrics.startTest(["MixedSuite", "ChildSuite", "ChildTest"]);
            metrics.stopTest();

            const mixedData = metrics.getSuiteMetrics(["MixedSuite"]);

            assert.strictEqual(mixedData.testMetrics.numTests, 1, 'Mixed suite should count only direct test');
            assert.deepEqual(mixedData.childSuites, ["ChildSuite"], 'Mixed suite should have child suite');
            assert.deepEqual(mixedData.parentSuites, [], 'Mixed suite should have no parent suites');
        });

        test("Empty array for childSuites when suite has no children", function() {
            metrics.startTest(["LeafSuite", "Test1"]);
            metrics.stopTest();

            const leafData = metrics.getSuiteMetrics(["LeafSuite"]);
            assert.deepEqual(leafData.childSuites, [], 'Leaf suite should have empty child suites array');
        });

        test("Empty array for parentSuites when suite is at top level", function() {
            metrics.startTest(["TopLevelSuite", "Test1"]);
            metrics.stopTest();

            const topData = metrics.getSuiteMetrics(["TopLevelSuite"]);
            assert.deepEqual(topData.parentSuites, [], 'Top level suite should have empty parent suites array');
        });
    });

    suite("Complex Scenarios", function() {
        test("Multiple tests with identical names in different suites", function() {
            metrics.startTest(["Suite1", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "SubSuite", "DuplicateName"]);
            metrics.stopTest();

            const suite1Data = metrics.getSuiteMetrics(["Suite1"]);
            const suite2Data = metrics.getSuiteMetrics(["Suite2"]);
            const subSuiteData = metrics.getSuiteMetrics(["Suite1", "SubSuite"]);

            assert.strictEqual(suite1Data.testMetrics.numTests, 1, 'Suite1 should have one direct test');
            assert.strictEqual(suite2Data.testMetrics.numTests, 1, 'Suite2 should have one direct test');
            assert.strictEqual(subSuiteData.testMetrics.numTests, 1, 'SubSuite should have one direct test');

            assert.deepEqual(suite1Data.childSuites, ["SubSuite"], 'Suite1 should have SubSuite as child');
            assert.deepEqual(suite2Data.childSuites, [], 'Suite2 should have no child suites');
            assert.deepEqual(subSuiteData.childSuites, [], 'SubSuite should have no child suites');
        });

        test("Deeply nested suite hierarchies", function() {
            const deepPath: string[] = [];
            for (let i = 1; i <= 10; i++) {
                deepPath.push(`Level${i}`);
            }
            deepPath.push("DeepTest");

            metrics.startTest(deepPath);
            metrics.stopTest();

            // Test various levels
            const level1Data = metrics.getSuiteMetrics(["Level1"]);
            const level5Data = metrics.getSuiteMetrics(deepPath.slice(0, 5));
            const level10Data = metrics.getSuiteMetrics(deepPath.slice(0, 10));

            assert.deepEqual(level1Data.parentSuites, [], 'Level1 should have no parent suites');
            assert.deepEqual(level1Data.childSuites, ["Level2"], 'Level1 should have Level2 as child');
            assert.strictEqual(level1Data.testMetrics.numTests, 0, 'Level1 should have no direct tests');

            assert.isArray(level5Data.parentSuites, 'Level5 should have parent suites array');
            assert.deepEqual(level5Data.parentSuites!, ["Level1", "Level2", "Level3", "Level4"], 'Level5 should have correct parent suites');
            assert.deepEqual(level5Data.childSuites, ["Level6"], 'Level5 should have Level6 as child');
            assert.strictEqual(level5Data.testMetrics.numTests, 0, 'Level5 should have no direct tests');

            assert.isArray(level10Data.parentSuites, 'Level10 should have parent suites array');
            assert.deepEqual(level10Data.parentSuites!, deepPath.slice(0, 9), 'Level10 should have correct parent suites');
            assert.deepEqual(level10Data.childSuites, [], 'Level10 should have no child suites');
            assert.strictEqual(level10Data.testMetrics.numTests, 1, 'Level10 should have one direct test');
        });

        test("Consistency across multiple operations", function() {
            // Create initial structure
            metrics.startTest(["ConsistencySuite", "Test1"]);
            metrics.stopTest();

            const initialData = metrics.getSuiteMetrics(["ConsistencySuite"]);

            // Add more tests and suites
            metrics.startTest(["ConsistencySuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["ConsistencySuite", "SubSuite", "Test3"]);
            metrics.stopTest();

            const updatedData = metrics.getSuiteMetrics(["ConsistencySuite"]);

            // Verify the suite data updated correctly
            assert.strictEqual(updatedData.testMetrics.numTests, 2, 'Consistency suite should have two direct tests after updates');
            assert.deepEqual(updatedData.childSuites, ["SubSuite"], 'Consistency suite should have SubSuite as child after updates');
            assert.isAtLeast(updatedData.testMetrics.totalTime!, initialData.testMetrics.totalTime!, 'Total time should increase after adding more tests');
        });
    });

    suite("Edge Cases and Error Conditions", function() {
        test("Very long suite names", function() {
            const longSuiteName = "A".repeat(1000);
            metrics.startTest([longSuiteName, "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics([longSuiteName]);
            assert.strictEqual(suiteData.name, longSuiteName, 'Very long suite name should be preserved');
            assert.strictEqual(suiteData.name.length, 1000, 'Suite name should maintain full length');
        });

        test("Suite names that look like array indices", function() {
            metrics.startTest(["0", "1", "2"]);
            metrics.stopTest();

            const suite0Data = metrics.getSuiteMetrics(["0"]);
            const suite1Data = metrics.getSuiteMetrics(["0", "1"]);

            assert.strictEqual(suite0Data.name, "0", 'Suite name that looks like array index should be preserved');
            assert.strictEqual(suite1Data.name, "1", 'Nested suite name that looks like array index should be preserved');
            assert.deepEqual(suite1Data.parentSuites, ["0"], 'Suite with index-like name should have correct parent');
        });

        test("Whitespace-only names (but not empty)", function() {
            const whitespaceSuite1 = "   ";
            const whitespaceSuite2 = "\t\n ";

            metrics.startTest([whitespaceSuite1, whitespaceSuite2, "Test1"]);
            metrics.stopTest();

            const suite1Data = metrics.getSuiteMetrics([whitespaceSuite1]);
            const suite2Data = metrics.getSuiteMetrics([whitespaceSuite1, whitespaceSuite2]);

            assert.strictEqual(suite1Data.name, whitespaceSuite1, 'Whitespace-only suite name should be preserved');
            assert.strictEqual(suite2Data.name, whitespaceSuite2, 'Nested whitespace-only suite name should be preserved');
        });

        test("Case-sensitive suite names", function() {
            metrics.startTest(["CaseSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["casesuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["CASESUITE", "Test3"]);
            metrics.stopTest();

            const suite1Data = metrics.getSuiteMetrics(["CaseSuite"]);
            const suite2Data = metrics.getSuiteMetrics(["casesuite"]);
            const suite3Data = metrics.getSuiteMetrics(["CASESUITE"]);

            assert.strictEqual(suite1Data.name, "CaseSuite", 'Original case suite name should be preserved');
            assert.strictEqual(suite2Data.name, "casesuite", 'Lowercase suite name should be preserved');
            assert.strictEqual(suite3Data.name, "CASESUITE", 'Uppercase suite name should be preserved');

            assert.strictEqual(suite1Data.testMetrics.numTests, 1, 'Original case suite should have one test');
            assert.strictEqual(suite2Data.testMetrics.numTests, 1, 'Lowercase suite should have one test');
            assert.strictEqual(suite3Data.testMetrics.numTests, 1, 'Uppercase suite should have one test');
        });

        test("Suites created in different orders", function() {
            // Create tests in non-hierarchical order
            metrics.startTest(["Z", "Y", "X", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["A", "B", "C", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Z", "Test3"]);
            metrics.stopTest();

            const zData = metrics.getSuiteMetrics(["Z"]);
            const aData = metrics.getSuiteMetrics(["A"]);
            const topData = metrics.getSuiteMetrics([]);

            assert.strictEqual(zData.testMetrics.numTests, 1, 'Z suite should have one direct test');
            assert.deepEqual(zData.childSuites, ["Y"], 'Z suite should have Y as child');
            assert.strictEqual(aData.testMetrics.numTests, 0, 'A suite should have no direct tests');
            assert.deepEqual(aData.childSuites, ["B"], 'A suite should have B as child');
            assert.isArray(topData.childSuites, 'Top level should have child suites array');
            assert.includeMembers(topData.childSuites!, ["Z", "A"], 'Top level should include both Z and A suites');
        });
    });

    suite("Data Immutability and Integrity", function() {
        test("Return copy of suite data (not reference)", function() {
            metrics.startTest(["ImmutableSuite", "Test1"]);
            metrics.stopTest();

            const suiteData1 = metrics.getSuiteMetrics(["ImmutableSuite"]);
            const suiteData2 = metrics.getSuiteMetrics(["ImmutableSuite"]);

            assert.deepEqual(suiteData1, suiteData2, 'Multiple calls should return equal objects');
            assert.notEqual(suiteData1, suiteData2, 'Multiple calls should return different object references');

            // Verify modifying returned object doesn't affect internal state
            // @ts-ignore - Testing immutability
            suiteData1.testMetrics.numTests = 999;
            const suiteData3 = metrics.getSuiteMetrics(["ImmutableSuite"]);
            assert.notEqual(suiteData3.testMetrics.numTests, 999, 'Modifying returned object should not affect internal state');
            assert.deepEqual(suiteData3, suiteData2, 'Internal state should remain unchanged after modification');
        });

        test("All required SuiteData properties", function() {
            metrics.startTest(["CompleteSuite", "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["CompleteSuite"]);

            // Verify all properties from SuiteData type are present
            assert.hasAllKeys(suiteData, [
                'name', 'parentSuites', 'childSuites', 'testMetrics'
            ], 'Suite data should have all required properties');

            // Verify property types
            assert.isString(suiteData.name, 'Name property should be string');
            assert.isTrue(suiteData.parentSuites === null || Array.isArray(suiteData.parentSuites), 'Parent suites should be null or array');
            assert.isTrue(suiteData.childSuites === null || Array.isArray(suiteData.childSuites), 'Child suites should be null or array');
            assert.isObject(suiteData.testMetrics, 'Test metrics property should be object');

            // Verify testMetrics properties
            assert.hasAllKeys(suiteData.testMetrics, ['numTests', 'totalTime', 'averageTime'], 'Test metrics should have all required properties');
            assert.isNumber(suiteData.testMetrics.numTests, 'Number of tests should be number');
            assert.isTrue(suiteData.testMetrics.totalTime === null || typeof suiteData.testMetrics.totalTime === 'number', 'Total time should be null or number');
            assert.isTrue(suiteData.testMetrics.averageTime === null || typeof suiteData.testMetrics.averageTime === 'number', 'Average time should be null or number');
        });

        test("Data consistency with timing calculations", function() {
            metrics.startTest(["TimingConsistency", "Test1"]);
            const start1 = Date.now();
            while (Date.now() - start1 < 3) { /* busy wait */ }
            metrics.stopTest();

            metrics.startTest(["TimingConsistency", "Test2"]);
            const start2 = Date.now();
            while (Date.now() - start2 < 7) { /* busy wait */ }
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["TimingConsistency"]);
            const test1 = metrics.getTestMetrics(["TimingConsistency", "Test1"]);
            const test2 = metrics.getTestMetrics(["TimingConsistency", "Test2"]);

            // Verify timing consistency
            assert.isNumber(suiteData.testMetrics.totalTime, 'Suite should have numeric total time');
            assert.strictEqual(suiteData.testMetrics.totalTime!, test1.duration + test2.duration, 'Suite total time should equal sum of test durations');
            assert.isNumber(suiteData.testMetrics.averageTime, 'Suite should have numeric average time');
            assert.strictEqual(suiteData.testMetrics.averageTime!, (test1.duration + test2.duration) / 2, 'Suite average time should equal total divided by count');
            assert.strictEqual(suiteData.testMetrics.numTests, 2, 'Suite should have correct test count');
        });
    });

    suite("State Isolation", function() {
        test("Not affect other suites when retrieving metrics", function() {
            metrics.startTest(["IsolationSuite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["IsolationSuite2", "Test2"]);
            metrics.stopTest();

            // Getting metrics for one suite shouldn't affect the other
            const suite1Before = metrics.getSuiteMetrics(["IsolationSuite1"]);
            const suite2Before = metrics.getSuiteMetrics(["IsolationSuite2"]);

            // Get suite1 metrics multiple times
            for (let i = 0; i < 5; i++) {
                metrics.getSuiteMetrics(["IsolationSuite1"]);
            }

            const suite1After = metrics.getSuiteMetrics(["IsolationSuite1"]);
            const suite2After = metrics.getSuiteMetrics(["IsolationSuite2"]);

            assert.deepEqual(suite1After, suite1Before, 'Suite1 metrics should remain unchanged after multiple retrievals');
            assert.deepEqual(suite2After, suite2Before, 'Suite2 metrics should remain unchanged after retrieving Suite1 metrics');
        });

        test("Work correctly after instance reset", function() {
            metrics.startTest(["ResetSuite", "Test1"]);
            metrics.stopTest();

            assert.isTrue(metrics.suiteExists(["ResetSuite"]), 'Suite should exist before reset');
            const originalData = metrics.getSuiteMetrics(["ResetSuite"]);
            assert.strictEqual(originalData.testMetrics.numTests, 1, 'Suite should have one test before reset');

            SuiteMetrics.resetInstance();
            const newMetrics = SuiteMetrics.getInstance();

            assert.throws(() => newMetrics.getSuiteMetrics(["ResetSuite"]), 'Should throw error when accessing suite after reset');
            assert.isFalse(newMetrics.suiteExists(["ResetSuite"]), 'Suite should not exist after reset');

            // Should work with new instance
            newMetrics.startTest(["NewSuite", "NewTest"]);
            newMetrics.stopTest();

            const newSuiteData = newMetrics.getSuiteMetrics(["NewSuite"]);
            assert.strictEqual(newSuiteData.name, "NewSuite", 'New suite should work correctly after reset');
            assert.strictEqual(newSuiteData.testMetrics.numTests, 1, 'New suite should have correct test count after reset');
        });
    });

    suite("Performance and Stress Tests", function() {
        test("Large number of tests in same suite efficiently", function() {
            const numTests = 50;

            // Create many tests in same suite
            for (let i = 0; i < numTests; i++) {
                metrics.startTest(["LargeSuite", `Test${i}`]);
                const startTime = Date.now();
                while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
                metrics.stopTest();
            }

            const suiteData = metrics.getSuiteMetrics(["LargeSuite"]);

            assert.strictEqual(suiteData.testMetrics.numTests, numTests, 'Large suite should have correct number of tests');
            assert.isNumber(suiteData.testMetrics.totalTime, 'Large suite should have numeric total time');
            assert.isAbove(suiteData.testMetrics.totalTime!, 0, 'Large suite should have positive total time');
            assert.isNumber(suiteData.testMetrics.averageTime, 'Large suite should have numeric average time');
            assert.strictEqual(suiteData.testMetrics.averageTime!, suiteData.testMetrics.totalTime! / numTests, 'Large suite average should equal total divided by count');
            assert.deepEqual(suiteData.childSuites, [], 'Large suite should have no child suites');
        });

        test("Large number of child suites efficiently", function() {
            const numChildSuites = 50;

            // Create many child suites
            for (let i = 0; i < numChildSuites; i++) {
                metrics.startTest(["ParentSuite", `ChildSuite${i}`, "Test1"]);
                metrics.stopTest();
            }

            const parentData = metrics.getSuiteMetrics(["ParentSuite"]);

            assert.strictEqual(parentData.testMetrics.numTests, 0, 'Parent suite with many children should have no direct tests');
            assert.isArray(parentData.childSuites, 'Parent suite should have child suites array');
            assert.lengthOf(parentData.childSuites!, numChildSuites, 'Parent suite should have correct number of child suites');

            // Verify all child suites are present
            for (let i = 0; i < numChildSuites; i++) {
                assert.include(parentData.childSuites!, `ChildSuite${i}`, `Parent suite should include ChildSuite${i}`);
            }
        });

        test("Deeply nested hierarchies efficiently", function() {
            const depth = 20;
            const path: string[] = [];

            for (let i = 1; i <= depth; i++) {
                path.push(`Level${i}`);
            }
            path.push("DeepTest");

            metrics.startTest(path);
            metrics.stopTest();

            // Test accessing various levels
            for (let i = 1; i <= depth; i++) {
                const levelPath = path.slice(0, i);
                const levelData = metrics.getSuiteMetrics(levelPath);

                assert.strictEqual(levelData.name, `Level${i}`, `Level${i} should have correct name`);
                if (i === 1) {
                    assert.deepEqual(levelData.parentSuites, [], `Level${i} should have no parent suites`);
                } else {
                    assert.isArray(levelData.parentSuites, `Level${i} should have parent suites array`);
                    assert.deepEqual(levelData.parentSuites!, path.slice(0, i - 1), `Level${i} should have correct parent suites`);
                }

                if (i === depth) {
                    assert.deepEqual(levelData.childSuites, [], `Level${i} should have no child suites`);
                    assert.strictEqual(levelData.testMetrics.numTests, 1, `Level${i} should have one test`);
                } else {
                    assert.deepEqual(levelData.childSuites, [`Level${i + 1}`], `Level${i} should have next level as child`);
                    assert.strictEqual(levelData.testMetrics.numTests, 0, `Level${i} should have no direct tests`);
                }
            }
        });
    });

    suite("Error Recovery", function() {
        test("Handle errors gracefully and maintain state", function() {
            // Create valid structure
            metrics.startTest(["ValidSuite", "ValidTest"]);
            metrics.stopTest();

            assert.isTrue(metrics.suiteExists(["ValidSuite"]), 'Valid suite should exist');
            const validData = metrics.getSuiteMetrics(["ValidSuite"]);
            assert.strictEqual(validData.testMetrics.numTests, 1, 'Valid suite should have one test');

            // Try invalid operations
            try {
                // @ts-ignore
                metrics.getSuiteMetrics("invalid");
            } catch (e) {
                // Expected error
            }

            try {
                metrics.getSuiteMetrics(["NonExistent"]);
            } catch (e) {
                // Expected error
            }

            // Verify original state is maintained
            assert.isTrue(metrics.suiteExists(["ValidSuite"]), 'Valid suite should still exist after invalid operations');
            const stillValidData = metrics.getSuiteMetrics(["ValidSuite"]);
            assert.deepEqual(stillValidData, validData, 'Valid suite data should remain unchanged after invalid operations');
        });
    });

    suite("Using Test Data Helpers", function() {
        test("Work correctly with simple test data helper", function() {
            const metrics: SuiteMetrics = createSimpleTestData(false, {
                numSuites: 3,
                testsPerSuite: 4,
                suiteNamePrefix: "HelperSuite",
                testNamePrefix: "HelperTest"
            }) as SuiteMetrics;

            // Verify suite metrics work correctly
            const suite1Data = metrics.getSuiteMetrics(["HelperSuite1"]);
            assert.strictEqual(suite1Data.testMetrics.numTests, 4, 'Helper suite should have correct number of tests');
            assert.deepEqual(suite1Data.childSuites, [], 'Helper suite should have no child suites');
            assert.deepEqual(suite1Data.parentSuites, [], 'Helper suite should have no parent suites');

            const topLevelData = metrics.getSuiteMetrics([]);
            assert.isArray(topLevelData.childSuites, 'Top level should have child suites array');
            assert.includeMembers(topLevelData.childSuites!, ["HelperSuite1", "HelperSuite2", "HelperSuite3"], 'Top level should include helper suites');
        });

        test("Work correctly with nested test data helper", function() {
            const metrics = createNestedTestData(false, {
                numSuites: 2,
                testsPerSuite: 6,
                maxDepth: 3,
                subSuitesPerSuite: 2,
                suiteNamePrefix: "Nested",
                testNamePrefix: "Test"
            });

            // Verify nested structure
            assert.isTrue(metrics.suiteExists(["Nested1"]), 'Nested1 suite should exist');
            assert.isTrue(metrics.suiteExists(["Nested1", "Nested2_1"]), 'Nested2_1 suite should exist');
            assert.isTrue(metrics.suiteExists(["Nested1", "Nested2_1", "Nested3_1"]), 'Nested3_1 suite should exist');

            // Verify metrics at different levels
            const level1Data = metrics.getSuiteMetrics(["Nested1"]);
            const level2Data = metrics.getSuiteMetrics(["Nested1", "Nested2_1"]);
            const level3Data = metrics.getSuiteMetrics(["Nested1", "Nested2_1", "Nested3_1"]);

            assert.lengthOf(level1Data.childSuites, 2, 'Level1 should have 2 sub-suites per suite');
            assert.deepEqual(level2Data.parentSuites, ["Nested1"], 'Level2 should have correct parent suites');
            assert.strictEqual(level3Data.testMetrics.numTests, 6, 'Level3 should have tests at max depth');
        });

        test("Large datasets efficiently with helper", function() {
            const startTime = Date.now();
            const metrics = createSimpleTestData(false, {
                numSuites: 20,
                testsPerSuite: 25,
                addTimingDelays: false // Fast generation
            });
            const endTime = Date.now();

            assert.isBelow(endTime - startTime, 200, 'Large dataset generation should be fast');

            // Verify random sampling of the data
            assert.isTrue(metrics.suiteExists(["Suite1"]), 'Suite1 should exist in large dataset');
            assert.isTrue(metrics.suiteExists(["Suite10"]), 'Suite10 should exist in large dataset');
            assert.isTrue(metrics.suiteExists(["Suite20"]), 'Suite20 should exist in large dataset');

            const suite10Data = metrics.getSuiteMetrics(["Suite10"]);
            assert.strictEqual(suite10Data.testMetrics.numTests, 25, 'Suite10 should have correct number of tests');
        });
    });
});
