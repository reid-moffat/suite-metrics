import { expect } from 'chai';
import SuiteMetrics from "../../src/index.ts";

suite("testExists Method", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("should throw error for non-array path", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.testExists("not an array")).to.throw('Path must be an array of strings');
        });

        test("should throw error for array with non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.testExists([123, "test"])).to.throw('Path must be an array of non-empty strings');
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.testExists(["suite", null])).to.throw('Path must be an array of non-empty strings');
            // @ts-ignore - Testing runtime validation
            expect(() => metrics.testExists(["suite", undefined])).to.throw('Path must be an array of non-empty strings');
        });

        test("should throw error for array with empty string elements", function() {
            expect(() => metrics.testExists(["suite", ""])).to.throw('Path must be an array of non-empty strings');
            expect(() => metrics.testExists(["", "test"])).to.throw('Path must be an array of non-empty strings');
        });

        test("should throw error for empty array", function() {
            expect(() => metrics.testExists([])).to.throw('Path cannot be empty - must define a path');
        });

        test("should return false for single-element array", function() {
            expect(metrics.testExists(["just-test"])).to.be.false;
        });
    });

    suite("Basic Functionality", function() {
        test("should return false for non-existent test in non-existent suite", function() {
            expect(metrics.testExists(["NonExistentSuite", "NonExistentTest"])).to.be.false;
        });

        test("should return false for non-existent test in existing suite", function() {
            // Create a suite with one test
            metrics.startTest(["ExistingSuite", "ExistingTest"]);
            metrics.stopTest();

            expect(metrics.testExists(["ExistingSuite", "NonExistentTest"])).to.be.false;
        });

        test("should return true for existing test", function() {
            metrics.startTest(["TestSuite", "ExistingTest"]);
            metrics.stopTest();

            expect(metrics.testExists(["TestSuite", "ExistingTest"])).to.be.true;
        });

        test("should return true for existing test in nested suite", function() {
            metrics.startTest(["Level1", "Level2", "Level3", "DeepTest"]);
            metrics.stopTest();

            expect(metrics.testExists(["Level1", "Level2", "Level3", "DeepTest"])).to.be.true;
        });

        test("should return false for test path that points to suite", function() {
            // Create nested structure
            metrics.startTest(["Suite1", "Suite2", "ActualTest"]);
            metrics.stopTest();

            // These are suites, not tests
            expect(metrics.testExists(["Suite1", "Suite2"])).to.be.false;
            expect(metrics.testExists(["Suite1"])).to.be.false;
        });
    });

    suite("Multiple Tests in Same Suite", function() {
        test("should handle multiple tests correctly", function() {
            // Create multiple tests in same suite
            metrics.startTest(["MultiTestSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test3"]);
            metrics.stopTest();

            expect(metrics.testExists(["MultiTestSuite", "Test1"])).to.be.true;
            expect(metrics.testExists(["MultiTestSuite", "Test2"])).to.be.true;
            expect(metrics.testExists(["MultiTestSuite", "Test3"])).to.be.true;
            expect(metrics.testExists(["MultiTestSuite", "Test4"])).to.be.false;
        });

        test("should handle tests with same name in different suites", function() {
            metrics.startTest(["Suite1", "SameName"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "SameName"]);
            metrics.stopTest();

            expect(metrics.testExists(["Suite1", "SameName"])).to.be.true;
            expect(metrics.testExists(["Suite2", "SameName"])).to.be.true;
            expect(metrics.testExists(["Suite3", "SameName"])).to.be.false;
        });
    });

    suite("Edge Cases", function() {
        test("should handle tests with special characters", function() {
            metrics.startTest(["Suite", "Test@#$%^&*()"]);
            metrics.stopTest();

            expect(metrics.testExists(["Suite", "Test@#$%^&*()"])).to.be.true;
            expect(metrics.testExists(["Suite", "Test@#$%^&*()_different"])).to.be.false;
        });

        test("should handle tests with spaces", function() {
            metrics.startTest(["Suite", "Test With Spaces"]);
            metrics.stopTest();

            expect(metrics.testExists(["Suite", "Test With Spaces"])).to.be.true;
            expect(metrics.testExists(["Suite", "TestWithSpaces"])).to.be.false;
        });

        test("should handle very long test names", function() {
            const longTestName = "T".repeat(1000);
            metrics.startTest(["Suite", longTestName]);
            metrics.stopTest();

            expect(metrics.testExists(["Suite", longTestName])).to.be.true;
        });

        test("should be case sensitive for test names", function() {
            metrics.startTest(["Suite", "CaseSensitiveTest"]);
            metrics.stopTest();

            expect(metrics.testExists(["Suite", "CaseSensitiveTest"])).to.be.true;
            expect(metrics.testExists(["Suite", "casesensitivetest"])).to.be.false;
            expect(metrics.testExists(["Suite", "CASESENSITIVETEST"])).to.be.false;
            expect(metrics.testExists(["Suite", "CaseSENSITIVETest"])).to.be.false;
        });

        test("should handle deeply nested test paths", function() {
            const deepPath: string[] = [];
            for (let i = 1; i <= 10; i++) {
                deepPath.push(`Level${i}`);
            }
            deepPath.push("VeryDeepTest");

            metrics.startTest(deepPath);
            metrics.stopTest();

            expect(metrics.testExists(deepPath)).to.be.true;

            // Verify that partial paths don't work as test paths
            for (let i = 1; i < deepPath.length; i++) {
                const partialPath = deepPath.slice(0, i);
                if (partialPath.length >= 2) {
                    expect(metrics.testExists(partialPath)).to.be.false;
                }
            }
        });
    });

    suite("State Consistency", function() {
        test("should maintain consistency during test lifecycle", function() {
            // Before test creation
            expect(metrics.testExists(["Suite", "Test"])).to.be.false;

            // During test execution
            metrics.startTest(["Suite", "Test"]);
            expect(metrics.testExists(["Suite", "Test"])).to.be.true;

            // After test completion
            metrics.stopTest();
            expect(metrics.testExists(["Suite", "Test"])).to.be.true;
        });

        test("should handle multiple test creation and completion cycles", function() {
            // First cycle
            metrics.startTest(["Suite", "Test1"]);
            expect(metrics.testExists(["Suite", "Test1"])).to.be.true;
            metrics.stopTest();
            expect(metrics.testExists(["Suite", "Test1"])).to.be.true;

            // Second cycle
            metrics.startTest(["Suite", "Test2"]);
            expect(metrics.testExists(["Suite", "Test1"])).to.be.true; // Previous test still exists
            expect(metrics.testExists(["Suite", "Test2"])).to.be.true;
            metrics.stopTest();
            expect(metrics.testExists(["Suite", "Test1"])).to.be.true;
            expect(metrics.testExists(["Suite", "Test2"])).to.be.true;
        });
    });
});
