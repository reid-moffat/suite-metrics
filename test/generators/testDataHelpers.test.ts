import { expect } from 'chai';
import SuiteMetrics, { ConcurrentSuiteMetrics } from "../../src/index.ts";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    GeneratedTestData,
    PRESET_TYPE
} from "./testDataHelpers.ts";
import concurrentSuiteMetrics from "../../src/ConcurrentSuiteMetrics.js";
import { _MockSuiteMetrics } from "./mocks.js";

suite("Test Data Helpers", function() {

    suite("Simple Test Data Generation", function() {
        test("should create basic flat structure", function() {
            const metrics: SuiteMetrics = createSimpleTestData(false, {
                numSuites: 2,
                testsPerSuite: 3,
                suiteNamePrefix: "Demo",
                testNamePrefix: "Test"
            }) as SuiteMetrics;

            // Verify the structure was created correctly
            expect(metrics.suiteExists(["Demo1"])).to.be.true;
            expect(metrics.suiteExists(["Demo2"])).to.be.true;
            expect(metrics.testExists(["Demo1", "Test1"])).to.be.true;
            expect(metrics.testExists(["Demo2", "Test3"])).to.be.true;

            // Verify metrics
            const suite1Data = metrics.getSuiteMetrics(["Demo1"]);
            expect(suite1Data.testMetrics.numTests).to.equal(3);
        });

        test("should work with ConcurrentSuiteMetrics", function() {
            const metrics: ConcurrentSuiteMetrics = createSimpleTestData(true, {
                numSuites: 2,
                testsPerSuite: 2
            }) as ConcurrentSuiteMetrics;

            expect(metrics.suiteExists(["Suite1"])).to.be.true;
            expect(metrics.testExists(["Suite1", "Test1"])).to.be.true;
        });
    });

    suite("Nested Test Data Generation", function() {
        test("should create nested structure", function() {
            const metrics = new SuiteMetrics();

            const testData = createNestedTestData(metrics, {
                numSuites: 2,
                testsPerSuite: 4,
                maxDepth: 3,
                subSuitesPerSuite: 2
            });

            expect(testData.totalTests).to.be.above(0);
            expect(testData.maxDepthAchieved).to.equal(3);

            // Should have nested structure
            expect(metrics.suiteExists(["Suite1"])).to.be.true;
            expect(metrics.suiteExists(["Suite1", "Suite2_1"])).to.be.true;
            expect(metrics.suiteExists(["Suite1", "Suite2_1", "Suite3_1"])).to.be.true;
        });

        test("should handle different depth configurations", function() {
            const metrics = new SuiteMetrics();

            const testData = createNestedTestData(metrics, {
                numSuites: 1,
                maxDepth: 1,
                testsPerSuite: 3
            });

            expect(testData.maxDepthAchieved).to.equal(1);
            expect(testData.totalSuites).to.equal(1);

            const suiteData = metrics.getSuiteMetrics(["Suite1"]);
            expect(suiteData.testMetrics.numTests).to.equal(3);
            expect(suiteData.childSuites).to.deep.equal([]);
        });
    });

    suite("Complex Test Data Generation", function() {
        test("should create realistic application structure", function() {
            const metrics = new SuiteMetrics();

            const testData: GeneratedTestData = createPresetData(metrics, PRESET_TYPE.REALISTIC_PREMADE);

            expect(testData.totalTests).to.be.above(10);

            // Verify specific structure elements
            expect(metrics.suiteExists(["Authentication"])).to.be.true;
            expect(metrics.suiteExists(["Authentication", "OAuth"])).to.be.true;
            expect(metrics.testExists(["Authentication", "login"])).to.be.true;
            expect(metrics.testExists(["Authentication", "OAuth", "google_login"])).to.be.true;

            expect(metrics.suiteExists(["API", "Users", "Validation"])).to.be.true;
            expect(metrics.testExists(["API", "Users", "Validation", "email_validation"])).to.be.true;
        });

        test("should provide comprehensive test coverage scenarios", function() {
            const metrics = new SuiteMetrics();

            const testData: GeneratedTestData = createPresetData(metrics, PRESET_TYPE.REALISTIC_PREMADE);

            // Test various suite metrics
            const authData = metrics.getSuiteMetrics(["Authentication"]);
            expect(authData.testMetrics.numTests).to.equal(3); // Direct tests only
            expect(authData.childSuites).to.include.members(["OAuth", "TwoFactor"]);

            const apiUsersData = metrics.getSuiteMetrics(["API", "Users"]);
            expect(apiUsersData.testMetrics.numTests).to.equal(4);
            expect(apiUsersData.childSuites).to.deep.equal(["Validation"]);
        });
    });

    suite("Large Test Data Generation", function() {
        test("should create large dataset efficiently", function() {
            const metrics = new SuiteMetrics();

            const startTime = Date.now();
            const testData: GeneratedTestData = createPresetData(metrics, PRESET_TYPE.LARGE_SUITE);
            const endTime = Date.now();

            expect(testData.totalTests).to.be.above(50);
            expect(endTime - startTime).to.be.below(1_000); // Should complete quickly

            // Verify structure integrity
            expect(metrics.suiteExists(["Suite1"])).to.be.true;
            expect(metrics.suiteExists(["Suite5"])).to.be.true;
        });
    });

    suite("Realistic Test Data with Timing", function() {
        test("should create tests with realistic timing variations", function() {
            const metrics = new SuiteMetrics();

            const testData: GeneratedTestData = createPresetData(metrics, PRESET_TYPE.LARGE_SUITE);

            expect(testData.totalTests).to.be.above(0);

            // Verify that tests have realistic durations
            const testMetrics = metrics.getTestMetrics(["Suite1", "Test1"]);
            expect(testMetrics.duration).to.be.above(0);

            // Check if Test2 exists before trying to get its metrics
            if (metrics.testExists(["Suite1", "Test2"])) {
                const testMetrics2 = metrics.getTestMetrics(["Suite1", "Test2"]);
                expect(testMetrics2.duration).to.be.above(0);
                // Note: Due to randomness, durations might occasionally be equal, but usually different
            }
        });
    });

    suite("Edge Case Test Data", function() {
        test("should handle special characters and edge cases", function() {
            const metrics = new SuiteMetrics();

            const testData = createPresetData(metrics, PRESET_TYPE.EDGE_CASES);

            expect(testData.totalTests).to.be.above(0);

            // Verify special character handling
            expect(metrics.suiteExists(["Suite with spaces & symbols!@#$%^&*()"])).to.be.true;
            expect(metrics.testExists(["Suite with spaces & symbols!@#$%^&*()", "Test with spaces"])).to.be.true;

            // Verify unicode handling
            expect(metrics.suiteExists(["测试套件 🧪 тест"])).to.be.true;
            expect(metrics.testExists(["测试套件 🧪 тест", "测试 🧪"])).to.be.true;

            // Verify long names
            expect(metrics.suiteExists(["A".repeat(100)])).to.be.true;
            expect(metrics.testExists(["A".repeat(100), "B".repeat(100)])).to.be.true;

            // Verify case sensitivity
            expect(metrics.testExists(["CaseSuite", "TestName"])).to.be.true;
            expect(metrics.testExists(["CaseSuite", "testname"])).to.be.true;
            expect(metrics.testExists(["CaseSuite", "TESTNAME"])).to.be.true;
        });
    });

    suite("Helper Utility Functions", function() {
        test("getFreshMetrics should provide clean instance", function() {
            // Create some data in current instance
            const metrics1 = SuiteMetrics.getInstance();
            metrics1.startTest(["TempSuite", "TempTest"]);
            metrics1.stopTest();

            expect(metrics1.suiteExists(["TempSuite"])).to.be.true;

            // Get fresh instance
            const metrics2 = new SuiteMetrics();
            expect(metrics2.suiteExists(["TempSuite"])).to.be.false;
        });

        test("getFreshConcurrentMetrics should provide new instance", function() {
            const metrics1 = new ConcurrentSuiteMetrics();
            const metrics2 = new ConcurrentSuiteMetrics();

            // Should be different instances
            expect(metrics1).to.not.equal(metrics2);

            // Both should be clean
            expect(metrics1.suiteExists(["TestSuite"])).to.be.false;
            expect(metrics2.suiteExists(["TestSuite"])).to.be.false;
        });
    });

    suite("Custom Options and Flexibility", function() {
        test("should respect custom naming options", function() {
            const metrics: _MockSuiteMetrics = createSimpleTestData(false, {
                numSuites: 2,
                testsPerSuite: 2,
                suiteNamePrefix: "CustomSuite",
                testNamePrefix: "CustomTest"
            }) as _MockSuiteMetrics;

            expect(metrics.suiteExists(["CustomSuite1"])).to.be.true;
            expect(metrics.suiteExists(["CustomSuite2"])).to.be.true;
            expect(metrics.testExists(["CustomSuite1", "CustomTest1"])).to.be.true;
            expect(metrics.testExists(["CustomSuite2", "CustomTest2"])).to.be.true;
        });

        test("should provide detailed generation information", function() {
            const metrics = new SuiteMetrics();

            const testData = createNestedTestData(metrics, {
                numSuites: 2,
                testsPerSuite: 3,
                maxDepth: 2,
                subSuitesPerSuite: 1
            });

            // Verify GeneratedTestData provides useful information
            expect(testData.testPaths).to.be.an('array');
            expect(testData.suitePaths).to.be.an('array');
            expect(testData.suiteTestCounts).to.be.instanceOf(Map);

            expect(testData.testPaths.length).to.equal(testData.totalTests);
            expect(testData.suitePaths.length).to.equal(testData.totalSuites);

            // Verify suite test counts are accurate
            for (const [suitePath, expectedCount] of testData.suiteTestCounts) {
                const actualSuiteData = metrics.getSuiteMetrics(suitePath.split('/'));
                expect(actualSuiteData.testMetrics.numTests).to.equal(expectedCount);
            }
        });
    });

    suite("Performance and Stress Testing", function() {
        test("should handle normal datasets without timing delays efficiently", function() {
            const metrics = new SuiteMetrics();

            const startTime = Date.now();
            const testData = createPresetData(metrics, PRESET_TYPE.NORMAL);
            const endTime = Date.now();

            expect(testData.totalTests).to.be.above(100);
            expect(endTime - startTime).to.be.below(500); // Should be very fast without delays

            // Verify data integrity
            expect(testData.testPaths.length).to.equal(testData.totalTests);
            expect(testData.suitePaths.length).to.equal(testData.totalSuites);
        });
    });
});
