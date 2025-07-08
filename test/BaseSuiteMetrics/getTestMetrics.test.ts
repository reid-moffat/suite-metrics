import { expect } from 'chai';
import SuiteMetrics from "../../src/index.ts";

suite("getTestMetrics - Comprehensive Test Coverage", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("should throw error for non-array path", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getTestMetrics("not an array")).to.throw('Path must be an array of strings');
        });

        test("should throw error for empty path", function() {
            expect(() => metrics.getTestMetrics([])).to.throw('Path cannot be empty - must define a path');
        });

        test("should throw error for single-element path", function() {
            expect(() => metrics.getTestMetrics(["just-test"])).to.throw('A test must be inside at least one suite - it must contain at least [suite, test]');
        });

        test("should throw error for path with empty strings", function() {
            expect(() => metrics.getTestMetrics(["suite", ""])).to.throw('Path must be an array of non-empty strings');
        });

        test("should throw error for path with non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getTestMetrics(["suite", 123])).to.throw('Path must be an array of non-empty strings');
        });

        test("should throw error for path with null/undefined elements", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getTestMetrics(["suite", null])).to.throw('Path must be an array of non-empty strings');
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.getTestMetrics(["suite", undefined])).to.throw('Path must be an array of non-empty strings');
        });
    });

    suite("Non-existent Test/Suite Handling", function() {
        test("should throw error for non-existent suite", function() {
            expect(() => metrics.getTestMetrics(["NonExistentSuite", "Test"])).to.throw('Suite path [NonExistentSuite] does not exist');
        });

        test("should throw error for non-existent test in existing suite", function() {
            metrics.startTest(["ExistingSuite", "ExistingTest"]);
            metrics.stopTest();

            expect(() => metrics.getTestMetrics(["ExistingSuite", "NonExistentTest"])).to.throw('Test [ExistingSuite, NonExistentTest] does not exist');
        });

        test("should throw error for non-existent test in nested suite", function() {
            metrics.startTest(["Parent", "Child", "ExistingTest"]);
            metrics.stopTest();

            expect(() => metrics.getTestMetrics(["Parent", "Child", "NonExistentTest"])).to.throw('Test [Parent, Child, NonExistentTest] does not exist');
        });

        test("should throw error for test path that points to suite", function() {
            metrics.startTest(["Suite1", "SubSuite", "Test1"]);
            metrics.stopTest();

            // Trying to get test metrics for a suite path should fail
            expect(() => metrics.getTestMetrics(["Suite1", "SubSuite"])).to.throw('Test [Suite1, SubSuite] does not exist');
        });

        test("should throw error for partially non-existent nested path", function() {
            metrics.startTest(["Level1", "Level2", "Test1"]);
            metrics.stopTest();

            expect(() => metrics.getTestMetrics(["Level1", "NonExistentLevel2", "Test1"])).to.throw('Suite path [Level1, NonExistentLevel2] does not exist');
        });
    });

    suite("Basic Functionality", function() {
        test("should return complete test metrics for simple test", function() {
            metrics.startTest(["SimpleSuite", "SimpleTest"]);
            const startTime = Date.now();
            // Add small delay to ensure measurable duration
            while (Date.now() - startTime < 100) { /* busy wait */ }
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["SimpleSuite", "SimpleTest"]);

            expect(testMetrics).to.be.an('object');
            expect(testMetrics.name).to.equal("SimpleTest");
            expect(testMetrics.startTimestamp).to.be.a('number').and.be.above(0);
            expect(testMetrics.endTimestamp).to.be.a('number').and.be.above(testMetrics.startTimestamp);
            expect(testMetrics.duration).to.be.a('number').and.be.above(0);
            expect(testMetrics.duration).to.equal(testMetrics.endTimestamp - testMetrics.startTimestamp);
            expect(testMetrics.completed).to.be.true;
            expect(testMetrics.testNumber).to.be.a('number').and.be.above(0);
            expect(testMetrics.suiteTestNumber).to.be.a('number').and.be.above(0);
        });

        test("should return test metrics for nested test", function() {
            metrics.startTest(["Level1", "Level2", "Level3", "DeepTest"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["Level1", "Level2", "Level3", "DeepTest"]);

            expect(testMetrics.name).to.equal("DeepTest");
            expect(testMetrics.completed).to.be.true;
            expect(testMetrics.testNumber).to.be.a('number').and.be.above(0);
            expect(testMetrics.suiteTestNumber).to.equal(1); // First test in this suite
        });

        test("should handle tests with special characters in names", function() {
            const specialTestName = "Test with spaces & symbols!@#$%^&*()";
            metrics.startTest(["SpecialSuite", specialTestName]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["SpecialSuite", specialTestName]);
            expect(testMetrics.name).to.equal(specialTestName);
        });

        test("should handle tests with unicode characters", function() {
            const unicodeTestName = "测试 🧪 тест";
            metrics.startTest(["UnicodeSuite", unicodeTestName]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["UnicodeSuite", unicodeTestName]);
            expect(testMetrics.name).to.equal(unicodeTestName);
        });
    });

    suite("Test Numbering and Ordering", function() {
        test("should assign correct global test numbers", function() {
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
        });

        test("should assign correct suite-specific test numbers", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            const suite1Test1 = metrics.getTestMetrics(["Suite1", "Test1"]);
            const suite2Test1 = metrics.getTestMetrics(["Suite2", "Test1"]);
            const suite1Test2 = metrics.getTestMetrics(["Suite1", "Test2"]);
            const suite2Test2 = metrics.getTestMetrics(["Suite2", "Test2"]);

            expect(suite1Test1.suiteTestNumber).to.equal(1);
            expect(suite2Test1.suiteTestNumber).to.equal(1);
            expect(suite1Test2.suiteTestNumber).to.equal(2);
            expect(suite2Test2.suiteTestNumber).to.equal(2);
        });

        test("should handle suite test numbering in nested suites", function() {
            metrics.startTest(["Parent", "Child1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Parent", "Child2", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Parent", "Child1", "Test2"]);
            metrics.stopTest();

            const child1Test1 = metrics.getTestMetrics(["Parent", "Child1", "Test1"]);
            const child2Test1 = metrics.getTestMetrics(["Parent", "Child2", "Test1"]);
            const child1Test2 = metrics.getTestMetrics(["Parent", "Child1", "Test2"]);

            expect(child1Test1.suiteTestNumber).to.equal(1);
            expect(child2Test1.suiteTestNumber).to.equal(1);
            expect(child1Test2.suiteTestNumber).to.equal(2);
        });
    });

    suite("Timing and Duration", function() {
        test("should record accurate timing information", function() {
            metrics.startTest(["TimingSuite", "TimingTest"]);

            // Add measurable delay
            const delayStart = Date.now();
            while (Date.now() - delayStart < 100) { /* busy wait */ }

            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["TimingSuite", "TimingTest"]);

            // Verify timing properties exist and are reasonable
            expect(testMetrics.startTimestamp).to.be.a('number').and.be.above(0);
            expect(testMetrics.endTimestamp).to.be.a('number').and.be.above(testMetrics.startTimestamp);
            expect(testMetrics.duration).to.be.a('number').and.be.above(0);
            expect(testMetrics.duration).to.equal(testMetrics.endTimestamp - testMetrics.startTimestamp);

            // Verify the duration is reasonable (should be at least a few microseconds due to the delay)
            expect(testMetrics.duration).to.be.above(1000); // At least 1ms in microseconds
        });

        test("should handle very short duration tests", function() {
            metrics.startTest(["QuickSuite", "QuickTest"]);
            for (let i = 0; i < 100; ++i) {
                // Placeholder work ...
            }
            metrics.stopTest(); // Immediate stop

            const testMetrics = metrics.getTestMetrics(["QuickSuite", "QuickTest"]);

            expect(testMetrics.duration).to.be.a('number');
            expect(testMetrics.duration).to.be.at.least(0);
            expect(testMetrics.startTimestamp).to.be.below(testMetrics.endTimestamp);
        });

        test("should handle tests with different durations", function() {
            // Fast test
            metrics.startTest(["DurationSuite", "FastTest"]);
            let start = Date.now();
            while (Date.now() - start < 10) { /* busy wait for a short time */ }
            metrics.stopTest();

            // Slow test
            metrics.startTest(["DurationSuite", "SlowTest"]);
            start = Date.now();
            while (Date.now() - start < 100) { /* busy wait longer */ }
            metrics.stopTest();

            const fastTest = metrics.getTestMetrics(["DurationSuite", "FastTest"]);
            const slowTest = metrics.getTestMetrics(["DurationSuite", "SlowTest"]);

            expect(slowTest.duration).to.be.above(fastTest.duration);
            expect(fastTest.duration).to.be.above(0);
            expect(slowTest.duration).to.be.above(0);
        });
    });

    suite("Data Immutability and Integrity", function() {
        test("should return a copy of test data (not reference)", function() {
            metrics.startTest(["ImmutableSuite", "ImmutableTest"]);
            metrics.stopTest();

            const testMetrics1 = metrics.getTestMetrics(["ImmutableSuite", "ImmutableTest"]);
            const testMetrics2 = metrics.getTestMetrics(["ImmutableSuite", "ImmutableTest"]);

            expect(testMetrics1).to.deep.equal(testMetrics2);
            expect(testMetrics1).to.not.equal(testMetrics2); // Different object references

            // Verify modifying returned object doesn't affect internal state
            // @ts-ignore - Testing immutability
            testMetrics1.duration = 999999;
            const testMetrics3 = metrics.getTestMetrics(["ImmutableSuite", "ImmutableTest"]);
            expect(testMetrics3.duration).to.not.equal(999999);
            expect(testMetrics3).to.deep.equal(testMetrics2);
        });

        test("should maintain readonly properties", function() {
            metrics.startTest(["ReadonlySuite", "ReadonlyTest"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["ReadonlySuite", "ReadonlyTest"]);

            // These should be readonly according to the type definition
            expect(testMetrics.name).to.be.a('string');
            expect(testMetrics.testNumber).to.be.a('number');
            expect(testMetrics.suiteTestNumber).to.be.a('number');
        });

        test("should have all required Test properties", function() {
            metrics.startTest(["CompleteSuite", "CompleteTest"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["CompleteSuite", "CompleteTest"]);

            // Verify all properties from Test type are present
            expect(testMetrics).to.have.all.keys([
                'name', 'startTimestamp', 'endTimestamp', 'duration',
                'completed', 'testNumber', 'suiteTestNumber'
            ]);

            // Verify property types
            expect(testMetrics.name).to.be.a('string');
            expect(testMetrics.startTimestamp).to.be.a('number');
            expect(testMetrics.endTimestamp).to.be.a('number');
            expect(testMetrics.duration).to.be.a('number');
            expect(testMetrics.completed).to.be.a('boolean');
            expect(testMetrics.testNumber).to.be.a('number');
            expect(testMetrics.suiteTestNumber).to.be.a('number');
        });
    });

    suite("Complex Scenarios", function() {
        test("should handle multiple tests in deeply nested suites", function() {
            const deepPath1 = ["L1", "L2", "L3", "L4", "L5", "Test1"];
            const deepPath2 = ["L1", "L2", "L3", "L4", "L5", "Test2"];
            const deepPath3 = ["L1", "L2", "L3", "L4", "L6", "Test3"];

            metrics.startTest(deepPath1);
            metrics.stopTest();

            metrics.startTest(deepPath2);
            metrics.stopTest();

            metrics.startTest(deepPath3);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(deepPath1);
            const test2 = metrics.getTestMetrics(deepPath2);
            const test3 = metrics.getTestMetrics(deepPath3);

            expect(test1.name).to.equal("Test1");
            expect(test2.name).to.equal("Test2");
            expect(test3.name).to.equal("Test3");

            expect(test1.suiteTestNumber).to.equal(1);
            expect(test2.suiteTestNumber).to.equal(2);
            expect(test3.suiteTestNumber).to.equal(1); // Different suite (L6 vs L5)

            expect(test1.testNumber).to.equal(1);
            expect(test2.testNumber).to.equal(2);
            expect(test3.testNumber).to.equal(3);
        });

        test("should handle tests with identical names in different suites", function() {
            metrics.startTest(["Suite1", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "SubSuite", "DuplicateName"]);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(["Suite1", "DuplicateName"]);
            const test2 = metrics.getTestMetrics(["Suite2", "DuplicateName"]);
            const test3 = metrics.getTestMetrics(["Suite1", "SubSuite", "DuplicateName"]);

            expect(test1.name).to.equal("DuplicateName");
            expect(test2.name).to.equal("DuplicateName");
            expect(test3.name).to.equal("DuplicateName");

            expect(test1.testNumber).to.equal(1);
            expect(test2.testNumber).to.equal(2);
            expect(test3.testNumber).to.equal(3);

            expect(test1.suiteTestNumber).to.equal(1);
            expect(test2.suiteTestNumber).to.equal(1);
            expect(test3.suiteTestNumber).to.equal(1);
        });

        test("should maintain consistency across multiple operations", function() {
            // Create a complex test structure
            metrics.startTest(["ConsistencySuite", "Test1"]);
            metrics.stopTest();

            const initialTest = metrics.getTestMetrics(["ConsistencySuite", "Test1"]);

            // Add more tests
            metrics.startTest(["ConsistencySuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["ConsistencySuite", "SubSuite", "Test3"]);
            metrics.stopTest();

            // Original test should remain unchanged
            const laterTest = metrics.getTestMetrics(["ConsistencySuite", "Test1"]);
            expect(laterTest).to.deep.equal(initialTest);

            // New tests should have correct numbering
            const test2 = metrics.getTestMetrics(["ConsistencySuite", "Test2"]);
            const test3 = metrics.getTestMetrics(["ConsistencySuite", "SubSuite", "Test3"]);

            expect(test2.suiteTestNumber).to.equal(2);
            expect(test3.suiteTestNumber).to.equal(1);
            expect(test2.testNumber).to.equal(2);
            expect(test3.testNumber).to.equal(3);
        });
    });

    suite("Edge Cases and Error Conditions", function() {
        test("should handle very long suite and test names", function() {
            const longSuiteName = "A".repeat(1000);
            const longTestName = "B".repeat(1000);

            metrics.startTest([longSuiteName, longTestName]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics([longSuiteName, longTestName]);
            expect(testMetrics.name).to.equal(longTestName);
            expect(testMetrics.name.length).to.equal(1000);
        });

        test("should handle suite names that look like array indices", function() {
            metrics.startTest(["0", "1", "2"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["0", "1", "2"]);
            expect(testMetrics.name).to.equal("2");
        });

        test("should handle whitespace-only names (but not empty)", function() {
            const whitespaceSuite = "   ";
            const whitespaceTest = "\t\n ";

            metrics.startTest([whitespaceSuite, whitespaceTest]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics([whitespaceSuite, whitespaceTest]);
            expect(testMetrics.name).to.equal(whitespaceTest);
        });

        test("should handle case-sensitive test names", function() {
            metrics.startTest(["CaseSuite", "TestName"]);
            metrics.stopTest();

            metrics.startTest(["CaseSuite", "testname"]);
            metrics.stopTest();

            metrics.startTest(["CaseSuite", "TESTNAME"]);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(["CaseSuite", "TestName"]);
            const test2 = metrics.getTestMetrics(["CaseSuite", "testname"]);
            const test3 = metrics.getTestMetrics(["CaseSuite", "TESTNAME"]);

            expect(test1.name).to.equal("TestName");
            expect(test2.name).to.equal("testname");
            expect(test3.name).to.equal("TESTNAME");

            expect(test1.suiteTestNumber).to.equal(1);
            expect(test2.suiteTestNumber).to.equal(2);
            expect(test3.suiteTestNumber).to.equal(3);
        });
    });

    suite("State Isolation", function() {
        test("should not affect other tests when retrieving metrics", function() {
            metrics.startTest(["IsolationSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["IsolationSuite", "Test2"]);
            metrics.stopTest();

            // Getting metrics for one test shouldn't affect the other
            const test1Before = metrics.getTestMetrics(["IsolationSuite", "Test1"]);
            const test2Before = metrics.getTestMetrics(["IsolationSuite", "Test2"]);

            // Get test1 metrics multiple times
            for (let i = 0; i < 5; i++) {
                metrics.getTestMetrics(["IsolationSuite", "Test1"]);
            }

            const test1After = metrics.getTestMetrics(["IsolationSuite", "Test1"]);
            const test2After = metrics.getTestMetrics(["IsolationSuite", "Test2"]);

            expect(test1After).to.deep.equal(test1Before);
            expect(test2After).to.deep.equal(test2Before);
        });

        test("should work correctly after instance reset", function() {
            metrics.startTest(["ResetSuite", "Test1"]);
            metrics.stopTest();

            expect(metrics.testExists(["ResetSuite", "Test1"])).to.be.true;

            SuiteMetrics.resetInstance();
            const newMetrics = SuiteMetrics.getInstance();

            expect(() => newMetrics.getTestMetrics(["ResetSuite", "Test1"])).to.throw();
            expect(newMetrics.testExists(["ResetSuite", "Test1"])).to.be.false;

            // Should work with new instance
            newMetrics.startTest(["NewSuite", "NewTest"]);
            newMetrics.stopTest();

            const newTestMetrics = newMetrics.getTestMetrics(["NewSuite", "NewTest"]);
            expect(newTestMetrics.name).to.equal("NewTest");
            expect(newTestMetrics.testNumber).to.equal(1); // Reset counter
        });
    });
});
