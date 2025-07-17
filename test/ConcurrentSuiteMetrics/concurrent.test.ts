import { assert } from 'chai';
import { ConcurrentSuiteMetrics, SuiteData } from "../../src/index.ts";
import {
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../generators/testDataHelpers.ts";

// Helper function to simulate async work
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

suite("[ConcurrentSuiteMetrics] Basic tests", function() {

    let metrics: ConcurrentSuiteMetrics;

    setup(function() {
        metrics = new ConcurrentSuiteMetrics();
    });

    suite("Basic Functionality", function() {
        test("Single test timing", async function() {
            const path = ["Basic Functionality", "Single test timing"];
            console.log(`Running test: ${path.join(" > ")}`);

            metrics.startTest(path);
            await delay(10); // Simulate some work
            metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Multiple tests in same suite", async function() {
            const path1 = ["Basic Functionality", "Test 1"];
            const path2 = ["Basic Functionality", "Test 2"];

            console.log(`Running test: ${path1.join(" > ")}`);
            metrics.startTest(path1);
            await delay(5);
            metrics.stopTest(path1);

            console.log(`Running test: ${path2.join(" > ")}`);
            metrics.startTest(path2);
            await delay(15);
            metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Deeply nested suites", async function() {
            const path = ["Level1", "Level2", "Level3", "Level4", "Deep test"];
            console.log(`Running test: ${path.join(" > ")}`);

            metrics.startTest(path);
            await delay(8);
            metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Concurrent Execution", function() {
        test("Two concurrent tests in different suites", async function() {
            const path1 = ["Concurrent Execution", "Suite A", "Concurrent test A"];
            const path2 = ["Concurrent Execution", "Suite B", "Concurrent test B"];

            console.log(`Starting concurrent tests: ${path1.join(" > ")} and ${path2.join(" > ")}`);

            // Start both tests concurrently
            const promise1 = (async () => {
                metrics.startTest(path1);
                await delay(20);
                metrics.stopTest(path1);
            })();

            const promise2 = (async () => {
                await delay(2); // Slight offset to test true concurrency
                metrics.startTest(path2);
                await delay(15);
                metrics.stopTest(path2);
            })();

            await Promise.all([promise1, promise2]);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Multiple concurrent tests in same suite", async function() {
            const basePath = ["Concurrent Execution", "Same Suite"];
            const path1 = [...basePath, "Concurrent test 1"];
            const path2 = [...basePath, "Concurrent test 2"];
            const path3 = [...basePath, "Concurrent test 3"];

            console.log("Starting multiple concurrent tests in same suite");

            // Start all tests concurrently
            const promises = [
                (async () => {
                    metrics.startTest(path1);
                    await delay(10);
                    metrics.stopTest(path1);
                })(),
                (async () => {
                    await delay(2);
                    metrics.startTest(path2);
                    await delay(25);
                    metrics.stopTest(path2);
                })(),
                (async () => {
                    await delay(5);
                    metrics.startTest(path3);
                    await delay(8);
                    metrics.stopTest(path3);
                })()
            ];

            await Promise.all(promises);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Interleaved test execution", async function() {
            const path1 = ["Concurrent Execution", "Interleaved", "Test 1"];
            const path2 = ["Concurrent Execution", "Interleaved", "Test 2"];

            console.log("Testing interleaved execution");

            // Start first test
            metrics.startTest(path1);
            await delay(5);

            // Start second test while first is still running
            metrics.startTest(path2);
            await delay(10);

            // Stop first test
            metrics.stopTest(path1);
            await delay(5);

            // Stop second test
            metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Error Handling", function() {
        test("Invalid test names - empty array", async function() {
            try {
                metrics.startTest([]);
                assert.fail("Should have thrown error for empty test name");
            } catch (error: any) {
                assert.include(error.message, "empty", "Error message should mention empty array");
            }
        });

        test("Invalid test names - single element", async function() {
            try {
                metrics.startTest(["OnlyTestName"]);
                assert.fail("Should have thrown error for test without suite");
            } catch (error: any) {
                assert.include(error.message, "inside at least one suite", "Error message should mention suite requirement");
            }
        });

        test("Invalid test names - non-string elements", async function() {
            try {
                // @ts-ignore - intentionally passing invalid types for testing
                metrics.startTest(["ValidSuite", 123, "TestName"]);
                assert.fail("Should have thrown error for non-string elements");
            } catch (error: any) {
                assert.include(error.message, "non-empty", "Error message should mention non-empty requirement");
            }
        });

        test("Invalid test names - non-array input", async function() {
            try {
                // @ts-ignore - intentionally passing invalid type for testing
                metrics.startTest("NotAnArray");
                assert.fail("Should have thrown error for non-array input");
            } catch (error: any) {
                assert.include(error.message, "strings", "Error message should mention strings requirement");
            }
        });

        test("Stopping test that wasn't started", async function() {
            try {
                metrics.stopTest(["Error Handling", "Non-existent test"]);
                assert.fail("Should have thrown error for stopping non-existent test");
            } catch (error: any) {
                assert.exists(error, "Error should exist when stopping non-existent test");
            }
        });

        test("Starting same test twice", async function() {
            const path = ["Error Handling", "Duplicate test"];

            metrics.startTest(path);

            try {
                metrics.startTest(path); // Should this be allowed or throw an error?
                // Behavior depends on implementation - might overwrite or throw
                metrics.stopTest(path);
            } catch (error: any) {
                // If it throws, that's also valid behavior
                console.log("Duplicate test start threw error:", error.message);
            }
        });
    });

    suite("Metrics Verification", function() {
        test("Test duration accuracy", async function() {
            const path = ["Metrics Verification", "Duration test"];
            const expectedDuration = 50; // milliseconds

            const startTime = Date.now();
            metrics.startTest(path);
            await delay(expectedDuration);
            metrics.stopTest(path);
            const actualElapsed = Date.now() - startTime;

            // Allow some tolerance for timing variations
            assert.closeTo(actualElapsed, expectedDuration + 10, 20, "Actual elapsed time should be close to expected duration");

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Suite metrics with multiple tests", async function() {
            const suitePath = ["Metrics Verification", "Multi-test suite"];

            // Run several tests in the same suite
            for (let i = 1; i <= 3; i++) {
                const testPath = [...suitePath, `Test ${i}`];
                metrics.startTest(testPath);
                await delay(i * 10); // Different durations
                metrics.stopTest(testPath);
            }

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Print format verification", function() {
            // This test just verifies the print method doesn't crash
            const output = metrics.printAllSuiteMetrics();
            assert.isString(output, "Print output should be a string");
            console.log("Print output:", output);
        });
    });

    suite("Suite and Test Existence", function() {
        test("Check suite existence", async function() {
            const suitePath = ["Suite Existence", "Test Suite"];
            const testPath = [...suitePath, "Sample Test"];

            // Initially should not exist
            assert.isFalse(metrics.suiteExists(suitePath), "Suite should not exist initially");

            // After running a test, suite should exist
            metrics.startTest(testPath);
            metrics.stopTest(testPath);

            assert.isTrue(metrics.suiteExists(suitePath), "Suite should exist after running test");
        });

        test("Check test existence", async function() {
            const testPath = ["Suite Existence", "Test Suite", "Existence Test"];

            // Initially should not exist
            assert.isFalse(metrics.testExists(testPath), "Test should not exist initially");

            // After running the test, it should exist
            metrics.startTest(testPath);
            metrics.stopTest(testPath);

            assert.isTrue(metrics.testExists(testPath), "Test should exist after running");
        });

        test("Check nested suite existence", async function() {
            const nestedPath = ["Level1", "Level2", "Level3"];
            const testPath = [...nestedPath, "Nested Test"];

            assert.isFalse(metrics.suiteExists(["Level1"]), "Level1 should not exist initially");
            assert.isFalse(metrics.suiteExists(["Level1", "Level2"]), "Level1>Level2 should not exist initially");
            assert.isFalse(metrics.suiteExists(nestedPath), "Nested path should not exist initially");

            metrics.startTest(testPath);
            metrics.stopTest(testPath);

            assert.isTrue(metrics.suiteExists(["Level1"]), "Level1 should exist after running nested test");
            assert.isTrue(metrics.suiteExists(["Level1", "Level2"]), "Level1>Level2 should exist after running nested test");
            assert.isTrue(metrics.suiteExists(nestedPath), "Nested path should exist after running nested test");
        });
    });

    suite("Metrics Retrieval", function() {
        test("Get suite metrics", async function() {
            const suitePath = ["Metrics Retrieval", "Sample Suite"];

            // Run some tests
            for (let i = 1; i <= 2; i++) {
                const testPath = [...suitePath, `Test ${i}`];
                metrics.startTest(testPath);
                await delay(i * 5);
                metrics.stopTest(testPath);
            }

            const suiteMetrics: SuiteData = metrics.getSuiteMetrics(suitePath);
            assert.exists(suiteMetrics, "Suite metrics should exist");
            assert.strictEqual(suiteMetrics.name, "Sample Suite", "Suite should have correct name");
            assert.strictEqual(suiteMetrics.testMetrics.numTests, 2, "Suite should have 2 tests");
        });

        test("Get recursive suite metrics", async function() {
            const basePath = ["Metrics Retrieval", "Recursive Suite"];

            // Create nested structure with tests at different levels
            metrics.startTest([...basePath, "Direct Test"]);
            await delay(10);
            metrics.stopTest([...basePath, "Direct Test"]);

            metrics.startTest([...basePath, "Sub Suite", "Nested Test"]);
            await delay(15);
            metrics.stopTest([...basePath, "Sub Suite", "Nested Test"]);

            const recursiveMetrics = metrics.getSuiteMetricsRecursive(basePath);
            assert.exists(recursiveMetrics, "Recursive metrics should exist");
            assert.strictEqual(recursiveMetrics.name, "Recursive Suite", "Recursive suite should have correct name");
        });
    });

    suite("Edge Cases", function() {
        test("Tests with same names in different suites", async function() {
            const path1 = ["Edge Cases", "Suite A", "Same Name"];
            const path2 = ["Edge Cases", "Suite B", "Same Name"];

            metrics.startTest(path1);
            await delay(10);
            metrics.stopTest(path1);

            metrics.startTest(path2);
            await delay(20);
            metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Very long test names", async function() {
            const longName = "This is a very long test name that might cause issues with string handling or display formatting";
            const path = ["Edge Cases", "Long Names", longName];

            metrics.startTest(path);
            await delay(5);
            metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Empty suite name components", async function() {
            try {
                metrics.startTest(["Edge Cases", "", "Test"]);
                // Some implementations might allow empty strings, others might not
                metrics.stopTest(["Edge Cases", "", "Test"]);
            } catch (error: any) {
                console.log("Empty suite name threw error:", error.message);
                assert.exists(error, "Error should exist for empty suite name");
            }
        });

        test("Maximum nesting depth", async function() {
            const deepPath = Array(10).fill(0).map((_, i) => `Level${i}`);
            deepPath.push("Deep Test");

            metrics.startTest(deepPath);
            await delay(5);
            metrics.stopTest(deepPath);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Performance Tests", function() {
        test("Many concurrent tests", async function() {
            const numTests = 10;
            const promises: Promise<void>[] = [];

            console.log(`Starting ${numTests} concurrent tests`);

            for (let i = 0; i < numTests; i++) {
                const testPath = ["Performance Tests", "Many concurrent", `Test ${i}`];
                promises.push(
                    (async () => {
                        metrics.startTest(testPath);
                        await delay(Math.random() * 20); // Random duration
                        metrics.stopTest(testPath);
                    })()
                );
            }

            await Promise.all(promises);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Sequential test performance", async function() {
            const numTests = 20;

            console.log(`Running ${numTests} sequential tests`);

            for (let i = 0; i < numTests; i++) {
                const testPath = ["Performance Tests", "Sequential", `Test ${i}`];
                metrics.startTest(testPath);
                await delay(2); // Short duration
                metrics.stopTest(testPath);
            }

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Using Test Data Helpers", function() {
        test("Work with simple test data helper for concurrent metrics", function() {
            const metrics = createSimpleTestData(true, {
                numSuites: 4,
                testsPerSuite: 3,
                suiteNamePrefix: "ConcurrentSuite",
                testNamePrefix: "ConcurrentTest"
            });

            // Verify the structure was created correctly
            assert.isTrue(metrics.suiteExists(["ConcurrentSuite1"]), "ConcurrentSuite1 should exist");
            assert.isTrue(metrics.testExists(["ConcurrentSuite1", "ConcurrentTest1"]), "ConcurrentSuite1>ConcurrentTest1 should exist");
            assert.isTrue(metrics.testExists(["ConcurrentSuite4", "ConcurrentTest3"]), "ConcurrentSuite4>ConcurrentTest3 should exist");

            // Verify metrics work correctly
            const suite1Data = metrics.getSuiteMetrics(["ConcurrentSuite1"]);
            assert.strictEqual(suite1Data.testMetrics.numTests, 3, "ConcurrentSuite1 should have 3 tests");
            assert.isNumber(suite1Data.testMetrics.totalTime, "Suite should have numeric total time");
            assert.isAbove(suite1Data.testMetrics.totalTime!, 0, "Suite total time should be positive");
        });

        test("Work with complex test data helper for concurrent metrics", function() {
            const metrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE);

            // Verify the complex structure was created
            assert.isTrue(metrics.suiteExists(["Authentication"]), "Expected 'Authentication' suite to exist");
            assert.isTrue(metrics.suiteExists(["Authentication", "OAuth"]), "Expected 'Authentication > OAuth' suite to exist");
            assert.isTrue(metrics.suiteExists(["API", "Users", "Validation"]), "Expected 'API > Users > Validation' suite to exist");

            // Verify specific tests exist
            assert.isTrue(metrics.testExists(["Authentication", "login"]), "Authentication>login test should exist");
            assert.isTrue(metrics.testExists(["Authentication", "OAuth", "google_login"]), "Authentication>OAuth>google_login test should exist");
            assert.isTrue(metrics.testExists(["API", "Users", "Validation", "email_validation"]), "API>Users>Validation>email_validation test should exist");

            // Test metrics at different levels
            const authData = metrics.getSuiteMetrics(["Authentication"]);
            assert.strictEqual(authData.testMetrics.numTests, 3, "Authentication suite should have 3 direct tests"); // Direct tests only
            assert.isArray(authData.childSuites, "Authentication suite should have child suites array");
            assert.includeMembers(authData.childSuites!, ["OAuth", "TwoFactor"], "Authentication suite should include OAuth and TwoFactor child suites");

            const apiUsersData = metrics.getSuiteMetrics(["API", "Users"]);
            assert.strictEqual(apiUsersData.testMetrics.numTests, 4, "API>Users suite should have 4 tests");
            assert.deepEqual(apiUsersData.childSuites, ["Validation"], "API>Users suite should have Validation as only child suite");
        });

        test("Handle large datasets efficiently with concurrent metrics", function() {
            const startTime = Date.now();
            const metrics = createSimpleTestData(true, {
                numSuites: 15,
                testsPerSuite: 20,
                addTimingDelays: false // Fast generation for performance test
            });
            const endTime = Date.now();

            assert.isBelow(endTime - startTime, 300, "Large dataset generation should be fast"); // Should be very fast

            // Verify random sampling of the data
            assert.isTrue(metrics.suiteExists(["Suite1"]), "Suite1 should exist in large dataset");
            assert.isTrue(metrics.suiteExists(["Suite8"]), "Suite8 should exist in large dataset");
            assert.isTrue(metrics.suiteExists(["Suite15"]), "Suite15 should exist in large dataset");

            const suite8Data = metrics.getSuiteMetrics(["Suite8"]);
            assert.strictEqual(suite8Data.testMetrics.numTests, 20, "Suite8 should have 20 tests");
            assert.isNumber(suite8Data.testMetrics.totalTime, "Suite8 should have numeric total time");
            assert.isAtLeast(suite8Data.testMetrics.totalTime!, 0, "Suite8 total time should be non-negative");

            // Verify top-level structure
            const topLevelData = metrics.getSuiteMetrics([]);
            assert.isArray(topLevelData.childSuites, "Top level should have child suites array");
            assert.lengthOf(topLevelData.childSuites!, 15, "Top level should have 15 child suites");
        });

        test("Provide useful generation information for concurrent metrics", function() {
            const metrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE);

            // Verify GeneratedTestData provides useful information
            // TODO
        });
    });
});
