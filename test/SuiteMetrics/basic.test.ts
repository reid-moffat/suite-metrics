import { expect } from 'chai';
import SuiteMetrics, { RecursiveSuiteData, SuiteData } from "../../src/index.ts";

suite("[SuiteMetrics] Basic tests", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("should throw error for non-array names", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.startTest("not an array")).to.throw();
        });

        test("should throw error for empty test name", function() {
            expect(() => metrics.startTest([])).to.throw();
        });

        test("should throw error for single-element test name", function() {
            expect(() => metrics.startTest(["just-test"])).to.throw();
        });

        test("should throw error for non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.startTest(["suite", 123])).to.throw();
        });

        test("should allow empty suite name for top-level operations", function() {
            expect(() => metrics.suiteExists([])).to.not.throw();
            expect(() => metrics.getSuiteMetrics([])).to.not.throw();
            expect(() => metrics.getSuiteMetricsRecursive([])).to.not.throw();
        });
    });

    suite("Error Handling", function() {
        test("should throw error when stopping test without starting", function() {
            expect(() => metrics.stopTest()).to.throw();
        });

        test("should throw error for non-existent suite", function() {
            expect(() => metrics.getSuiteMetrics(["NonExistent"])).to.throw();
        });

        test("should throw error for non-existent test", function() {
            expect(() => metrics.getTestMetrics(["NonExistent", "Test"])).to.throw();
        });

        test("should throw error for test in non-existent suite", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            expect(() => metrics.getTestMetrics(["Suite1", "NonExistentTest"])).to.throw();
        });
    });

    suite("Multiple Tests and Suites", function() {
        test("should handle multiple tests in same suite", function() {
            // Create multiple tests
            metrics.startTest(["MultiTestSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test3"]);
            metrics.stopTest();

            expect(metrics.testExists(["MultiTestSuite", "Test1"])).to.be.true;
            expect(metrics.testExists(["MultiTestSuite", "Test2"])).to.be.true;
            expect(metrics.testExists(["MultiTestSuite", "Test3"])).to.be.true;

            const suiteData = metrics.getSuiteMetrics(["MultiTestSuite"]);
            expect(suiteData.testMetrics.numTests).to.equal(3);
            expect(suiteData.testMetrics.totalTime).to.be.a('number').and.be.at.least(0);
            expect(suiteData.testMetrics.averageTime).to.equal(suiteData.testMetrics.totalTime! / 3);
        });

        test("should handle multiple suites at same level", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite3", "Test3"]);
            metrics.stopTest();

            expect(metrics.suiteExists(["Suite1"])).to.be.true;
            expect(metrics.suiteExists(["Suite2"])).to.be.true;
            expect(metrics.suiteExists(["Suite3"])).to.be.true;

            const topLevelData = metrics.getSuiteMetricsRecursive([]);
            expect(topLevelData.subTestMetrics.numTests).to.equal(3);
            expect(topLevelData.childSuites).to.include.members(["Suite1", "Suite2", "Suite3"]);
        });
    });

    suite("Complex Hierarchies", function() {
        setup(function() {
            // Create a complex hierarchy:
            // TopSuite
            //   ├── DirectTest1
            //   ├── DirectTest2
            //   ├── SubSuite1
            //   │   ├── SubTest1
            //   │   └── SubSubSuite
            //   │       └── DeepTest1
            //   └── SubSuite2
            //       ├── SubTest2
            //       └── SubTest3

            metrics.startTest(["TopSuite", "DirectTest1"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "DirectTest2"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite1", "SubTest1"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite1", "SubSubSuite", "DeepTest1"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite2", "SubTest2"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite2", "SubTest3"]);
            metrics.stopTest();
        });

        test("should correctly report direct vs recursive metrics", function() {
            const topSuiteData = metrics.getSuiteMetricsRecursive(["TopSuite"]);

            expect(topSuiteData.directTestMetrics.numTests).to.equal(2); // DirectTest1, DirectTest2
            expect(topSuiteData.subTestMetrics.numTests).to.equal(4); // SubTest1, DeepTest1, SubTest2, SubTest3
            expect(topSuiteData.totalTestMetrics.numTests).to.equal(6);
            expect(topSuiteData.childSuites).to.include.members(["SubSuite1", "SubSuite2"]);
        });

        test("should handle nested suite metrics correctly", function() {
            const subSuite1Data = metrics.getSuiteMetricsRecursive(["TopSuite", "SubSuite1"]);

            expect(subSuite1Data.directTestMetrics.numTests).to.equal(1); // SubTest1
            expect(subSuite1Data.subTestMetrics.numTests).to.equal(1); // DeepTest1
            expect(subSuite1Data.totalTestMetrics.numTests).to.equal(2);
            expect(subSuite1Data.parentSuites).to.deep.equal(["TopSuite"]);
            expect(subSuite1Data.childSuites).to.deep.equal(["SubSubSuite"]);
        });

        test("should handle deep nesting correctly", function() {
            const deepSuiteData = metrics.getSuiteMetrics(["TopSuite", "SubSuite1", "SubSubSuite"]);

            expect(deepSuiteData.testMetrics.numTests).to.equal(1);
            expect(deepSuiteData.parentSuites).to.deep.equal(["TopSuite", "SubSuite1"]);
            expect(deepSuiteData.childSuites).to.deep.equal([]);
        });
    });

    suite("Test Metrics and Ordering", function() {
        test("should track test numbers correctly", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "Test3"]);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(["Suite1", "Test1"]);
            const test2 = metrics.getTestMetrics(["Suite2", "Test2"]);
            const test3 = metrics.getTestMetrics(["Suite1", "Test3"]);

            expect(test1.testNumber).to.equal(1);
            expect(test2.testNumber).to.equal(2);
            expect(test3.testNumber).to.equal(3);

            expect(test1.suiteTestNumber).to.equal(1);
            expect(test2.suiteTestNumber).to.equal(1);
            expect(test3.suiteTestNumber).to.equal(2);
        });

        test("should return complete test metrics", function() {
            metrics.startTest(["TestSuite", "DetailedTest"]);
            // Add small delay to ensure measurable duration
            const start = Date.now();
            while (Date.now() - start < 1) { /* busy wait */ }
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["TestSuite", "DetailedTest"]);

            expect(testMetrics.name).to.equal("DetailedTest");
            expect(testMetrics.startTimestamp).to.be.a('number').and.be.above(0);
            expect(testMetrics.endTimestamp).to.be.a('number').and.be.above(testMetrics.startTimestamp);
            expect(testMetrics.duration).to.be.a('number').and.be.above(0);
            expect(testMetrics.duration).to.equal(testMetrics.endTimestamp - testMetrics.startTimestamp);
            expect(testMetrics.testNumber).to.be.a('number').and.be.above(0);
            expect(testMetrics.suiteTestNumber).to.be.a('number').and.be.above(0);
        });

        test("should calculate timing metrics accurately", function() {
            // Create tests with measurable durations
            metrics.startTest(["TimingSuite", "FastTest"]);
            metrics.stopTest();

            metrics.startTest(["TimingSuite", "SlowTest"]);
            const start = Date.now();
            while (Date.now() - start < 2) { /* busy wait longer */ }
            metrics.stopTest();

            const suiteData = metrics.getSuiteMetrics(["TimingSuite"]);
            const fastTest = metrics.getTestMetrics(["TimingSuite", "FastTest"]);
            const slowTest = metrics.getTestMetrics(["TimingSuite", "SlowTest"]);

            expect(slowTest.duration).to.be.above(fastTest.duration);
            expect(suiteData.testMetrics.totalTime).to.equal(fastTest.duration + slowTest.duration);
            expect(suiteData.testMetrics.averageTime).to.equal((fastTest.duration + slowTest.duration) / 2);
        });
    });

    suite("Existence Checks", function() {
        test("should correctly identify existing and non-existing suites", function() {
            metrics.startTest(["ExistingSuite", "Test1"]);
            metrics.stopTest();

            expect(metrics.suiteExists(["ExistingSuite"])).to.be.true;
            expect(metrics.suiteExists(["NonExistingSuite"])).to.be.false;
            expect(metrics.suiteExists(["ExistingSuite", "SubSuite"])).to.be.false;
        });

        test("should correctly identify existing and non-existing tests", function() {
            metrics.startTest(["TestSuite", "ExistingTest"]);
            metrics.stopTest();

            expect(metrics.testExists(["TestSuite", "ExistingTest"])).to.be.true;
            expect(metrics.testExists(["TestSuite", "NonExistingTest"])).to.be.false;
            expect(metrics.testExists(["NonExistingSuite", "Test"])).to.be.false;
        });
    });

    suite("Edge Cases", function() {
        test("should handle empty suites (no tests)", function() {
            // Create a test to create the suite structure, then check parent
            metrics.startTest(["ParentSuite", "SubSuite", "Test1"]);
            metrics.stopTest();

            const parentData = metrics.getSuiteMetrics(["ParentSuite"]);
            expect(parentData.testMetrics.numTests).to.equal(0);
            expect(parentData.testMetrics.totalTime).to.equal(0);
            expect(parentData.testMetrics.averageTime).to.equal(0);
            expect(parentData.childSuites).to.deep.equal(["SubSuite"]);
        });

        test("should handle top-level suite operations", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            const topLevelData = metrics.getSuiteMetricsRecursive([]);
            expect(topLevelData.name).to.equal("<Top-Level suite>");
            expect(topLevelData.parentSuites).to.deep.equal([]);
            expect(topLevelData.directTestMetrics.numTests).to.equal(0);
            expect(topLevelData.subTestMetrics.numTests).to.equal(2);
            expect(topLevelData.totalTestMetrics.numTests).to.equal(2);
        });

        test("should handle suite with null times correctly", function() {
            // Create suite with no direct tests
            metrics.startTest(["EmptySuite", "SubSuite", "Test1"]);
            metrics.stopTest();

            const emptyData: SuiteData = metrics.getSuiteMetrics(["EmptySuite"]);
            expect(emptyData.testMetrics.totalTime).to.equal(0);
            expect(emptyData.testMetrics.averageTime).to.equal(0);

            const recursiveData: RecursiveSuiteData = metrics.getSuiteMetricsRecursive(["EmptySuite"]);
            expect(recursiveData.directTestMetrics.totalTime).to.equal(0);
            expect(recursiveData.directTestMetrics.averageTime).to.equal(0);
            expect(recursiveData.subTestMetrics.totalTime).to.be.a('number');
        });
    });

    suite("Print Output", function() {
        test("should generate comprehensive print output", function() {
            // Create a complex structure for printing
            metrics.startTest(["PrintSuite", "DirectTest"]);
            metrics.stopTest();

            metrics.startTest(["PrintSuite", "SubSuite", "SubTest"]);
            metrics.stopTest();

            const output = metrics.printAllSuiteMetrics(true);
            expect(output).to.be.a('string');
            expect(output).to.include('Suite: <Top-Level suite>');
            expect(output).to.include('Suite: PrintSuite');
            expect(output).to.include('Suite: SubSuite');
            expect(output).to.include("'DirectTest'");
            expect(output).to.include("'SubTest'");

            const outputWithoutTopLevel = metrics.printAllSuiteMetrics(false);
            expect(outputWithoutTopLevel).to.be.a('string');
            expect(outputWithoutTopLevel).to.not.include('Suite: <Top-Level suite>');
            expect(outputWithoutTopLevel).to.include('Suite: PrintSuite');
        });
    });

    suite("State Management", function() {
        test("should maintain state across multiple operations", function() {
            // Create initial state
            metrics.startTest(["StateSuite", "Test1"]);
            metrics.stopTest();

            expect(metrics.testExists(["StateSuite", "Test1"])).to.be.true;

            // Add more tests
            metrics.startTest(["StateSuite", "Test2"]);
            metrics.stopTest();

            // State should persist
            expect(metrics.testExists(["StateSuite", "Test1"])).to.be.true;
            expect(metrics.testExists(["StateSuite", "Test2"])).to.be.true;

            const suiteData = metrics.getSuiteMetrics(["StateSuite"]);
            expect(suiteData.testMetrics.numTests).to.equal(2);
        });

        test("should handle reset correctly", function() {
            metrics.startTest(["ResetSuite", "Test1"]);
            metrics.stopTest();

            expect(metrics.testExists(["ResetSuite", "Test1"])).to.be.true;

            SuiteMetrics.resetInstance();
            const newMetrics = SuiteMetrics.getInstance();

            expect(newMetrics.testExists(["ResetSuite", "Test1"])).to.be.false;
            expect(newMetrics.suiteExists(["ResetSuite"])).to.be.false;
        });
    });

    suite("Data Integrity", function() {
        test("should return immutable test metrics", function() {
            metrics.startTest(["ImmutableSuite", "Test1"]);
            metrics.stopTest();

            const testMetrics1 = metrics.getTestMetrics(["ImmutableSuite", "Test1"]);
            const testMetrics2 = metrics.getTestMetrics(["ImmutableSuite", "Test1"]);

            expect(testMetrics1).to.deep.equal(testMetrics2);
            expect(testMetrics1).to.not.equal(testMetrics2); // Different objects

            // Verify all properties exist and are correct type
            expect(testMetrics1.name).to.be.a('string');
            expect(testMetrics1.startTimestamp).to.be.a('number');
            expect(testMetrics1.endTimestamp).to.be.a('number');
            expect(testMetrics1.duration).to.be.a('number');
            expect(testMetrics1.testNumber).to.be.a('number');
            expect(testMetrics1.suiteTestNumber).to.be.a('number');
        });

        test("should maintain data consistency in complex scenarios", function() {
            // Create a complex scenario and verify all metrics are consistent
            metrics.startTest(["Consistency", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Consistency", "SubSuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Consistency", "SubSuite", "Test3"]);
            metrics.stopTest();

            const topSuite = metrics.getSuiteMetricsRecursive(["Consistency"]);
            const subSuite = metrics.getSuiteMetricsRecursive(["Consistency", "SubSuite"]);

            // Verify consistency
            expect(topSuite.directTestMetrics.numTests).to.equal(1);
            expect(topSuite.subTestMetrics.numTests).to.equal(2);
            expect(topSuite.totalTestMetrics.numTests).to.equal(3);

            expect(subSuite.directTestMetrics.numTests).to.equal(2);
            expect(subSuite.subTestMetrics.numTests).to.equal(0);
            expect(subSuite.totalTestMetrics.numTests).to.equal(2);

            // Verify time consistency
            expect(topSuite.totalTestMetrics.totalTime).to.equal(
                topSuite.directTestMetrics.totalTime! + topSuite.subTestMetrics.totalTime!
            );
        });
    });
});
