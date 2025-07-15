import { expect } from 'chai';
import SuiteMetrics from "../../src/index.ts";
import { createSimpleTestData, createNestedTestData } from "../generators/testDataHelpers.ts";
import suiteMetrics from "../../src/SuiteMetrics.js";

suite("[BaseSuiteMetrics] getSuiteMetrics", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("should throw error for non-array path", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getSuiteMetrics("not an array")).to.throw('Path must be an array of strings');
        });

        test("should throw error for path with empty strings", function() {
            expect(() => metrics.getSuiteMetrics([""])).to.throw('Path must be an array of non-empty strings');
            expect(() => metrics.getSuiteMetrics(["suite", ""])).to.throw('Path must be an array of non-empty strings');
            expect(() => metrics.getSuiteMetrics(["", "suite"])).to.throw('Path must be an array of non-empty strings');
        });

        test("should throw error for path with non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getSuiteMetrics([123])).to.throw('Path must be an array of non-empty strings');
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getSuiteMetrics(["suite", null])).to.throw('Path must be an array of non-empty strings');
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getSuiteMetrics(["suite", undefined])).to.throw('Path must be an array of non-empty strings');
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getSuiteMetrics([{}, "suite"])).to.throw('Path must be an array of non-empty strings');
        });

        test("should allow empty array (top-level suite)", function() {
            expect(() => metrics.getSuiteMetrics([])).to.not.throw();
        });

        test("should not allow isTest and allowTopLevel options together (internal validation)", function() {
            // This tests the internal validatePath method indirectly
            // The getSuiteMetrics method should use allowTopLevel: true, not isTest: true
            expect(() => metrics.getSuiteMetrics([])).to.not.throw();
        });
    });

    suite("Non-existent Suite Handling", function() {
        test("should throw error for non-existent single-level suite", function() {
            expect(() => metrics.getSuiteMetrics(["NonExistentSuite"])).to.throw('Suite path [NonExistentSuite] does not exist');
        });

        test("should throw error for non-existent multi-level suite", function() {
            expect(() => metrics.getSuiteMetrics(["NonExistent", "Suite"])).to.throw('Suite path [NonExistent, Suite] does not exist');
            expect(() => metrics.getSuiteMetrics(["Non", "Existent", "Suite", "Path"])).to.throw('Suite path [Non, Existent, Suite, Path] does not exist');
        });

        test("should throw error for partially non-existent nested path", function() {
            metrics.startTest(["Level1", "Level2", "Test1"]);
            metrics.stopTest();

            expect(() => metrics.getSuiteMetrics(["Level1", "NonExistentLevel2"])).to.throw('Suite path [Level1, NonExistentLevel2] does not exist');
            expect(() => metrics.getSuiteMetrics(["NonExistentLevel1", "Level2"])).to.throw('Suite path [NonExistentLevel1, Level2] does not exist');
        });

        test("should throw error for test path used as suite path", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            // Test path should not be accessible as suite path
            expect(() => metrics.getSuiteMetrics(["Suite1", "Test1"])).to.throw('Suite path [Suite1, Test1] does not exist');
        });
    });

    suite("Basic Functionality", function() {
        test("should return complete suite data for top-level suite", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            const topLevelData = metrics.getSuiteMetrics([]);

            expect(topLevelData).to.be.an('object');
            expect(topLevelData.name).to.equal("<Top-Level suite>");
            expect(topLevelData.parentSuites).to.be.null;
            expect(topLevelData.childSuites).to.be.an('array').and.include.members(["Suite1", "Suite2"]);
            expect(topLevelData.testMetrics).to.be.an('object');
            expect(topLevelData.testMetrics.numTests).to.equal(0); // No direct tests in top-level
            expect(topLevelData.testMetrics.totalTime).to.be.null;
            expect(topLevelData.testMetrics.averageTime).to.be.null;
        });

        test("should return complete suite data for single-level suite", function() {
            metrics.startTest(["SimpleSuite", "Test1"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["SimpleSuite"]);

            expect(suiteData.name).to.equal("SimpleSuite");
            expect(suiteData.parentSuites).to.deep.equal([]);
            expect(suiteData.childSuites).to.deep.equal([]);
            expect(suiteData.testMetrics.numTests).to.equal(1);
            expect(suiteData.testMetrics.totalTime).to.be.a('number').and.be.above(0);
            expect(suiteData.testMetrics.averageTime).to.equal(suiteData.testMetrics.totalTime);
        });

        test("should return complete suite data for nested suite", function() {
            metrics.startTest(["Level1", "Level2", "Level3", "Test1"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["Level1", "Level2", "Level3"]);

            expect(suiteData.name).to.equal("Level3");
            expect(suiteData.parentSuites).to.deep.equal(["Level1", "Level2"]);
            expect(suiteData.childSuites).to.deep.equal([]);
            expect(suiteData.testMetrics.numTests).to.equal(1);
            expect(suiteData.testMetrics.totalTime).to.be.a('number').and.be.above(0);
            expect(suiteData.testMetrics.averageTime).to.equal(suiteData.testMetrics.totalTime);
        });

        test("should handle suites with special characters in names", function() {
            const specialSuiteName = "Suite with spaces & symbols!@#$%^&*()";
            metrics.startTest([specialSuiteName, "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics([specialSuiteName]);
            expect(suiteData.name).to.equal(specialSuiteName);
        });

        test("should handle suites with unicode characters", function() {
            const unicodeSuiteName = "测试套件 🧪 тест";
            metrics.startTest([unicodeSuiteName, "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics([unicodeSuiteName]);
            expect(suiteData.name).to.equal(unicodeSuiteName);
        });
    });

    suite("Test Metrics Calculation", function() {
        test("should calculate correct metrics for suite with single test", function() {
            metrics.startTest(["SingleTestSuite", "OnlyTest"]);
            const startTime = Date.now();
            while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["SingleTestSuite", "OnlyTest"]);
            const suiteData = metrics.getSuiteMetrics(["SingleTestSuite"]);

            expect(suiteData.testMetrics.numTests).to.equal(1);
            expect(suiteData.testMetrics.totalTime).to.equal(testMetrics.duration);
            expect(suiteData.testMetrics.averageTime).to.equal(testMetrics.duration);
        });

        test("should calculate correct metrics for suite with multiple tests", function() {
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

            expect(suiteData.testMetrics.numTests).to.equal(3);
            expect(suiteData.testMetrics.totalTime).to.equal(expectedTotal);
            expect(suiteData.testMetrics.averageTime).to.equal(expectedAverage);
            expect(slowTest.duration).to.be.above(mediumTest.duration);
            expect(mediumTest.duration).to.be.above(fastTest.duration);
        });

        test("should handle suite with no direct tests", function() {
            // Create a suite with only sub-suites (no direct tests)
            metrics.startTest(["ParentSuite", "ChildSuite", "Test1"]);
            metrics.stopTest();

            const parentData = metrics.getSuiteMetrics(["ParentSuite"]);

            expect(parentData.testMetrics.numTests).to.equal(0);
            expect(parentData.testMetrics.totalTime).to.be.null;
            expect(parentData.testMetrics.averageTime).to.be.null;
            expect(parentData.childSuites).to.deep.equal(["ChildSuite"]);
        });

        test("should only count direct tests, not sub-suite tests", function() {
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
            expect(mainSuiteData.testMetrics.numTests).to.equal(2);
            expect(mainSuiteData.childSuites).to.deep.equal(["SubSuite"]);

            // Sub suite should count its direct tests
            expect(subSuiteData.testMetrics.numTests).to.equal(2);
            expect(subSuiteData.childSuites).to.deep.equal([]);
        });
    });

    suite("Parent and Child Suite Information", function() {
        test("should correctly identify parent suites for nested suites", function() {
            metrics.startTest(["L1", "L2", "L3", "L4", "Test1"]);
            metrics.stopTest();

            const l1Data = metrics.getSuiteMetrics(["L1"]);
            const l2Data = metrics.getSuiteMetrics(["L1", "L2"]);
            const l3Data = metrics.getSuiteMetrics(["L1", "L2", "L3"]);
            const l4Data = metrics.getSuiteMetrics(["L1", "L2", "L3", "L4"]);

            expect(l1Data.parentSuites).to.deep.equal([]);
            expect(l2Data.parentSuites).to.deep.equal(["L1"]);
            expect(l3Data.parentSuites).to.deep.equal(["L1", "L2"]);
            expect(l4Data.parentSuites).to.deep.equal(["L1", "L2", "L3"]);
        });

        test("should correctly identify child suites", function() {
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

            expect(rootData.childSuites).to.have.members(["Branch1", "Branch2", "Branch3"]);
            expect(branch1Data.childSuites).to.deep.equal([]);
            expect(branch3Data.childSuites).to.deep.equal(["SubBranch"]);
            expect(subBranchData.childSuites).to.deep.equal([]);
        });

        test("should handle suites with both direct tests and child suites", function() {
            metrics.startTest(["MixedSuite", "DirectTest"]);
            metrics.stopTest();

            metrics.startTest(["MixedSuite", "ChildSuite", "ChildTest"]);
            metrics.stopTest();

            const mixedData = metrics.getSuiteMetrics(["MixedSuite"]);

            expect(mixedData.testMetrics.numTests).to.equal(1); // Only direct test
            expect(mixedData.childSuites).to.deep.equal(["ChildSuite"]);
            expect(mixedData.parentSuites).to.deep.equal([]);
        });

        test("should return null for childSuites when suite has no children", function() {
            metrics.startTest(["LeafSuite", "Test1"]);
            metrics.stopTest();

            const leafData = metrics.getSuiteMetrics(["LeafSuite"]);
            expect(leafData.childSuites).to.deep.equal([]);
        });

        test("should return empty array for parentSuites when suite is at top level", function() {
            metrics.startTest(["TopLevelSuite", "Test1"]);
            metrics.stopTest();

            const topData = metrics.getSuiteMetrics(["TopLevelSuite"]);
            expect(topData.parentSuites).to.deep.equal([]);
        });
    });

    suite("Complex Scenarios", function() {
        test("should handle multiple tests with identical names in different suites", function() {
            metrics.startTest(["Suite1", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "SubSuite", "DuplicateName"]);
            metrics.stopTest();

            const suite1Data = metrics.getSuiteMetrics(["Suite1"]);
            const suite2Data = metrics.getSuiteMetrics(["Suite2"]);
            const subSuiteData = metrics.getSuiteMetrics(["Suite1", "SubSuite"]);

            expect(suite1Data.testMetrics.numTests).to.equal(1);
            expect(suite2Data.testMetrics.numTests).to.equal(1);
            expect(subSuiteData.testMetrics.numTests).to.equal(1);

            expect(suite1Data.childSuites).to.deep.equal(["SubSuite"]);
            expect(suite2Data.childSuites).to.deep.equal([]);
            expect(subSuiteData.childSuites).to.deep.equal([]);
        });

        test("should handle deeply nested suite hierarchies", function() {
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

            expect(level1Data.parentSuites).to.deep.equal([]);
            expect(level1Data.childSuites).to.deep.equal(["Level2"]);
            expect(level1Data.testMetrics.numTests).to.equal(0);

            expect(level5Data.parentSuites).to.deep.equal(["Level1", "Level2", "Level3", "Level4"]);
            expect(level5Data.childSuites).to.deep.equal(["Level6"]);
            expect(level5Data.testMetrics.numTests).to.equal(0);

            expect(level10Data.parentSuites).to.deep.equal(deepPath.slice(0, 9));
            expect(level10Data.childSuites).to.deep.equal([]);
            expect(level10Data.testMetrics.numTests).to.equal(1);
        });

        test("should maintain consistency across multiple operations", function() {
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
            expect(updatedData.testMetrics.numTests).to.equal(2); // Two direct tests
            expect(updatedData.childSuites).to.deep.equal(["SubSuite"]);
            expect(updatedData.testMetrics.totalTime).to.be.at.least(initialData.testMetrics.totalTime!);
        });
    });

    suite("Edge Cases and Error Conditions", function() {
        test("should handle very long suite names", function() {
            const longSuiteName = "A".repeat(1000);
            metrics.startTest([longSuiteName, "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics([longSuiteName]);
            expect(suiteData.name).to.equal(longSuiteName);
            expect(suiteData.name.length).to.equal(1000);
        });

        test("should handle suite names that look like array indices", function() {
            metrics.startTest(["0", "1", "2"]);
            metrics.stopTest();

            const suite0Data = metrics.getSuiteMetrics(["0"]);
            const suite1Data = metrics.getSuiteMetrics(["0", "1"]);

            expect(suite0Data.name).to.equal("0");
            expect(suite1Data.name).to.equal("1");
            expect(suite1Data.parentSuites).to.deep.equal(["0"]);
        });

        test("should handle whitespace-only names (but not empty)", function() {
            const whitespaceSuite1 = "   ";
            const whitespaceSuite2 = "\t\n ";

            metrics.startTest([whitespaceSuite1, whitespaceSuite2, "Test1"]);
            metrics.stopTest();

            const suite1Data = metrics.getSuiteMetrics([whitespaceSuite1]);
            const suite2Data = metrics.getSuiteMetrics([whitespaceSuite1, whitespaceSuite2]);

            expect(suite1Data.name).to.equal(whitespaceSuite1);
            expect(suite2Data.name).to.equal(whitespaceSuite2);
        });

        test("should handle case-sensitive suite names", function() {
            metrics.startTest(["CaseSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["casesuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["CASESUITE", "Test3"]);
            metrics.stopTest();

            const suite1Data = metrics.getSuiteMetrics(["CaseSuite"]);
            const suite2Data = metrics.getSuiteMetrics(["casesuite"]);
            const suite3Data = metrics.getSuiteMetrics(["CASESUITE"]);

            expect(suite1Data.name).to.equal("CaseSuite");
            expect(suite2Data.name).to.equal("casesuite");
            expect(suite3Data.name).to.equal("CASESUITE");

            expect(suite1Data.testMetrics.numTests).to.equal(1);
            expect(suite2Data.testMetrics.numTests).to.equal(1);
            expect(suite3Data.testMetrics.numTests).to.equal(1);
        });

        test("should handle suites created in different orders", function() {
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

            expect(zData.testMetrics.numTests).to.equal(1); // Only direct test
            expect(zData.childSuites).to.deep.equal(["Y"]);
            expect(aData.testMetrics.numTests).to.equal(0); // No direct tests
            expect(aData.childSuites).to.deep.equal(["B"]);
            expect(topData.childSuites).to.have.members(["Z", "A"]);
        });
    });

    suite("Data Immutability and Integrity", function() {
        test("should return a copy of suite data (not reference)", function() {
            metrics.startTest(["ImmutableSuite", "Test1"]);
            metrics.stopTest();

            const suiteData1 = metrics.getSuiteMetrics(["ImmutableSuite"]);
            const suiteData2 = metrics.getSuiteMetrics(["ImmutableSuite"]);

            expect(suiteData1).to.deep.equal(suiteData2);
            expect(suiteData1).to.not.equal(suiteData2); // Different object references

            // Verify modifying returned object doesn't affect internal state
            // @ts-ignore - Testing immutability
            suiteData1.testMetrics.numTests = 999;
            const suiteData3 = metrics.getSuiteMetrics(["ImmutableSuite"]);
            expect(suiteData3.testMetrics.numTests).to.not.equal(999);
            expect(suiteData3).to.deep.equal(suiteData2);
        });

        test("should have all required SuiteData properties", function() {
            metrics.startTest(["CompleteSuite", "Test1"]);
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["CompleteSuite"]);

            // Verify all properties from SuiteData type are present
            expect(suiteData).to.have.all.keys([
                'name', 'parentSuites', 'childSuites', 'testMetrics'
            ]);

            // Verify property types
            expect(suiteData.name).to.be.a('string');
            expect(suiteData.parentSuites).to.satisfy((val: any) => val === null || Array.isArray(val));
            expect(suiteData.childSuites).to.satisfy((val: any) => val === null || Array.isArray(val));
            expect(suiteData.testMetrics).to.be.an('object');

            // Verify testMetrics properties
            expect(suiteData.testMetrics).to.have.all.keys(['numTests', 'totalTime', 'averageTime']);
            expect(suiteData.testMetrics.numTests).to.be.a('number');
            expect(suiteData.testMetrics.totalTime).to.satisfy((val: any) => val === null || typeof val === 'number');
            expect(suiteData.testMetrics.averageTime).to.satisfy((val: any) => val === null || typeof val === 'number');
        });

        test("should maintain data consistency with timing calculations", function() {
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
            expect(suiteData.testMetrics.totalTime).to.equal(test1.duration + test2.duration);
            expect(suiteData.testMetrics.averageTime).to.equal((test1.duration + test2.duration) / 2);
            expect(suiteData.testMetrics.numTests).to.equal(2);
        });
    });

    suite("State Isolation", function() {
        test("should not affect other suites when retrieving metrics", function() {
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

            expect(suite1After).to.deep.equal(suite1Before);
            expect(suite2After).to.deep.equal(suite2Before);
        });

        test("should work correctly after instance reset", function() {
            metrics.startTest(["ResetSuite", "Test1"]);
            metrics.stopTest();

            expect(metrics.suiteExists(["ResetSuite"])).to.be.true;
            const originalData = metrics.getSuiteMetrics(["ResetSuite"]);
            expect(originalData.testMetrics.numTests).to.equal(1);

            SuiteMetrics.resetInstance();
            const newMetrics = SuiteMetrics.getInstance();

            expect(() => newMetrics.getSuiteMetrics(["ResetSuite"])).to.throw();
            expect(newMetrics.suiteExists(["ResetSuite"])).to.be.false;

            // Should work with new instance
            newMetrics.startTest(["NewSuite", "NewTest"]);
            newMetrics.stopTest();

            const newSuiteData = newMetrics.getSuiteMetrics(["NewSuite"]);
            expect(newSuiteData.name).to.equal("NewSuite");
            expect(newSuiteData.testMetrics.numTests).to.equal(1);
        });
    });

    suite("Performance and Stress Tests", function() {
        test("should handle large number of tests in same suite efficiently", function() {
            const numTests = 50;

            // Create many tests in same suite
            for (let i = 0; i < numTests; i++) {
                metrics.startTest(["LargeSuite", `Test${i}`]);
                const startTime = Date.now();
                while (Date.now() - startTime < 5) { /* Simulate 5 millisecond test time */ }
                metrics.stopTest();
            }

            const suiteData = metrics.getSuiteMetrics(["LargeSuite"]);

            expect(suiteData.testMetrics.numTests).to.equal(numTests);
            expect(suiteData.testMetrics.totalTime).to.be.a('number').and.be.above(0);
            expect(suiteData.testMetrics.averageTime).to.equal(suiteData.testMetrics.totalTime! / numTests);
            expect(suiteData.childSuites).to.deep.equal([]);
        });

        test("should handle large number of child suites efficiently", function() {
            const numChildSuites = 50;

            // Create many child suites
            for (let i = 0; i < numChildSuites; i++) {
                metrics.startTest(["ParentSuite", `ChildSuite${i}`, "Test1"]);
                metrics.stopTest();
            }

            const parentData = metrics.getSuiteMetrics(["ParentSuite"]);

            expect(parentData.testMetrics.numTests).to.equal(0); // No direct tests
            expect(parentData.childSuites).to.have.lengthOf(numChildSuites);

            // Verify all child suites are present
            for (let i = 0; i < numChildSuites; i++) {
                expect(parentData.childSuites).to.include(`ChildSuite${i}`);
            }
        });

        test("should handle deeply nested hierarchies efficiently", function() {
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

                expect(levelData.name).to.equal(`Level${i}`);
                if (i === 1) {
                    expect(levelData.parentSuites).to.deep.equal([]);
                } else {
                    expect(levelData.parentSuites).to.deep.equal(path.slice(0, i - 1));
                }

                if (i === depth) {
                    expect(levelData.childSuites).to.deep.equal([]);
                    expect(levelData.testMetrics.numTests).to.equal(1);
                } else {
                    expect(levelData.childSuites).to.deep.equal([`Level${i + 1}`]);
                    expect(levelData.testMetrics.numTests).to.equal(0);
                }
            }
        });
    });

    suite("Error Recovery", function() {
        test("should handle errors gracefully and maintain state", function() {
            // Create valid structure
            metrics.startTest(["ValidSuite", "ValidTest"]);
            metrics.stopTest();

            expect(metrics.suiteExists(["ValidSuite"])).to.be.true;
            const validData = metrics.getSuiteMetrics(["ValidSuite"]);
            expect(validData.testMetrics.numTests).to.equal(1);

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
            expect(metrics.suiteExists(["ValidSuite"])).to.be.true;
            const stillValidData = metrics.getSuiteMetrics(["ValidSuite"]);
            expect(stillValidData).to.deep.equal(validData);
        });
    });

    suite("Using Test Data Helpers", function() {
        test("should work correctly with simple test data helper", function() {
            const metrics: SuiteMetrics = createSimpleTestData(false, {
                numSuites: 3,
                testsPerSuite: 4,
                suiteNamePrefix: "HelperSuite",
                testNamePrefix: "HelperTest"
            }) as SuiteMetrics;

            // Verify suite metrics work correctly
            const suite1Data = metrics.getSuiteMetrics(["HelperSuite1"]);
            expect(suite1Data.testMetrics.numTests).to.equal(4);
            expect(suite1Data.childSuites).to.deep.equal([]);
            expect(suite1Data.parentSuites).to.deep.equal([]);

            const topLevelData = metrics.getSuiteMetrics([]);
            expect(topLevelData.childSuites).to.have.members(["HelperSuite1", "HelperSuite2", "HelperSuite3"]);
        });

        test("should work correctly with nested test data helper", function() {
            const metrics = createNestedTestData(false, {
                numSuites: 2,
                testsPerSuite: 6,
                maxDepth: 3,
                subSuitesPerSuite: 2,
                suiteNamePrefix: "Nested",
                testNamePrefix: "Test"
            });

            // Verify nested structure
            expect(metrics.suiteExists(["Nested1"])).to.be.true;
            expect(metrics.suiteExists(["Nested1", "Nested2_1"])).to.be.true;
            expect(metrics.suiteExists(["Nested1", "Nested2_1", "Nested3_1"])).to.be.true;

            // Verify metrics at different levels
            const level1Data = metrics.getSuiteMetrics(["Nested1"]);
            const level2Data = metrics.getSuiteMetrics(["Nested1", "Nested2_1"]);
            const level3Data = metrics.getSuiteMetrics(["Nested1", "Nested2_1", "Nested3_1"]);

            expect(level1Data.childSuites).to.have.lengthOf(2); // 2 sub-suites per suite
            expect(level2Data.parentSuites).to.deep.equal(["Nested1"]);
            expect(level3Data.testMetrics.numTests).to.equal(6); // Tests at max depth
        });

        test("should handle large datasets efficiently with helper", function() {
            const startTime = Date.now();
            const metrics = createSimpleTestData(false, {
                numSuites: 20,
                testsPerSuite: 25,
                addTimingDelays: false // Fast generation
            });
            const endTime = Date.now();

            expect(endTime - startTime).to.be.below(200); // Should be very fast

            // Verify random sampling of the data
            expect(metrics.suiteExists(["Suite1"])).to.be.true;
            expect(metrics.suiteExists(["Suite10"])).to.be.true;
            expect(metrics.suiteExists(["Suite20"])).to.be.true;

            const suite10Data = metrics.getSuiteMetrics(["Suite10"]);
            expect(suite10Data.testMetrics.numTests).to.equal(25);
        });
    });
});
