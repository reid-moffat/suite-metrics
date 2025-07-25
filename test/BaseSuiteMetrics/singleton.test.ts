import { assert } from 'chai';
import SuiteMetrics, { ConcurrentSuiteMetrics, RecursiveSuiteData, SuiteData, Test } from "suite-metrics";

suite("[Both] Singleton Pattern", function() {

    let suiteMetrics: SuiteMetrics;
    let concurrentMetrics: ConcurrentSuiteMetrics;

    setup(function() {
        suiteMetrics = new SuiteMetrics();
        concurrentMetrics = new ConcurrentSuiteMetrics();
    });

    suite("getInstance returns same instance", function() {
        test("SuiteMetrics", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            assert.equal(instance1, instance2, "Multiple calls to SuiteMetrics.getInstance() should return the same instance");
            assert.instanceOf(instance1, SuiteMetrics, "getInstance() should return a SuiteMetrics instance");
        });

        test("ConcurrentSuiteMetrics", async function() {
            const instance1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            const instance2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.equal(instance1, instance2, "Multiple calls to ConcurrentSuiteMetrics.getInstance() should return the same instance");
            assert.instanceOf(instance1, ConcurrentSuiteMetrics, "getInstance() should return a ConcurrentSuiteMetrics instance");
        });

        test("Compare multiple calls", async function() {
            const normalInstances: SuiteMetrics[] = Array.from({ length: 10 }, _ => SuiteMetrics.getInstance());
            const concurrentInstances: ConcurrentSuiteMetrics[] = await Promise.all(
                Array.from({ length: 10 }, _ => ConcurrentSuiteMetrics.getInstance())
            );

            for (let i = 0; i < normalInstances.length; ++i) {
                assert.instanceOf(normalInstances[i], SuiteMetrics, `SuiteMetrics instance ${i} should be of correct type`);
                assert.equal(normalInstances[i], normalInstances[(i + 1) % normalInstances.length], `SuiteMetrics instances ${i} and ${(i + 1) % normalInstances.length} should be the same`);
            }
            for (let i = 0; i < concurrentInstances.length; ++i) {
                assert.instanceOf(concurrentInstances[i], ConcurrentSuiteMetrics, `ConcurrentSuiteMetrics instance ${i} should be of correct type`);
                assert.equal(concurrentInstances[i], concurrentInstances[(i + 1) % concurrentInstances.length], `ConcurrentSuiteMetrics instances ${i} and ${(i + 1) % concurrentInstances.length} should be the same`);
            }
        });

        test("Singleton consistency across different access patterns", function() {
            // Test various ways of accessing the singleton
            const direct1: SuiteMetrics = SuiteMetrics.getInstance();
            const direct2: SuiteMetrics = SuiteMetrics.getInstance();

            // Access after operations
            direct1.startTest(['test-suite', 'test1']);
            direct1.stopTest();
            const afterOp: SuiteMetrics = SuiteMetrics.getInstance();

            // Access in different execution contexts
            const fromCallback: SuiteMetrics = ((): SuiteMetrics => SuiteMetrics.getInstance())();
            const fromPromise: Promise<SuiteMetrics> = Promise.resolve().then((): SuiteMetrics => SuiteMetrics.getInstance());

            assert.equal(direct1, direct2, "Direct getInstance calls should return same instance");
            assert.equal(direct1, afterOp, "getInstance after operations should return same instance");
            assert.equal(direct1, fromCallback, "getInstance from callback should return same instance");

            return fromPromise.then((promiseInstance: SuiteMetrics) => {
                assert.equal(direct1, promiseInstance, "getInstance from promise should return same instance");
            });
        });

        test("Singleton identity with concurrent access", async function() {
            const instances: SuiteMetrics[] = [];
            const concurrentInstances: ConcurrentSuiteMetrics[] = [];

            // Simulate concurrent access
            for (let i = 0; i < 5; i++) {
                instances.push(SuiteMetrics.getInstance());
                concurrentInstances.push(await ConcurrentSuiteMetrics.getInstance());
            }

            // All SuiteMetrics instances should be identical
            for (let i = 1; i < instances.length; i++) {
                assert.equal(instances[0], instances[i], `SuiteMetrics instance 0 should equal instance ${i} in concurrent access`);
            }

            // All ConcurrentSuiteMetrics instances should be identical
            for (let i = 1; i < concurrentInstances.length; i++) {
                assert.equal(concurrentInstances[0], concurrentInstances[i], `ConcurrentSuiteMetrics instance 0 should equal instance ${i} in concurrent access`);
            }
        });
    });

    suite("resetInstance creates new instance", function() {
        test("SuiteMetrics", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            assert.notEqual(instance1, instance2, "Instance after reset should be different from instance before reset");
            assert.instanceOf(instance1, SuiteMetrics, "Instance before reset should be SuiteMetrics type");
            assert.instanceOf(instance2, SuiteMetrics, "Instance after reset should be SuiteMetrics type");
        });

        test("ConcurrentSuiteMetrics", async function() {
            const instance1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            await ConcurrentSuiteMetrics.resetInstance();
            const instance2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.notEqual(instance1, instance2, "ConcurrentSuiteMetrics instance after reset should be different from instance before reset");
            assert.instanceOf(instance1, ConcurrentSuiteMetrics, "ConcurrentSuiteMetrics instance before reset should be correct type");
            assert.instanceOf(instance2, ConcurrentSuiteMetrics, "ConcurrentSuiteMetrics instance after reset should be correct type");
        });

        test("Reset creates completely fresh instance", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();

            // Add some data to the instance
            instance1.startTest(['reset-test', 'test1']);
            instance1.stopTest();

            assert.isTrue(instance1.queries.testExists(['reset-test', 'test1']), "Test should exist in instance before reset");

            // Reset and get new instance
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            // New instance should be clean
            assert.isFalse(instance2.queries.testExists(['reset-test', 'test1']), "Test should not exist in new instance after reset");
            assert.notEqual(instance1, instance2, "New instance should be different object from old instance");
        });

        test("Reset preserves singleton behavior for new instance", function() {
            SuiteMetrics.resetInstance();
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            assert.equal(instance1, instance2, "Multiple getInstance calls after reset should return same instance");
            assert.instanceOf(instance1, SuiteMetrics, "Instance after reset should be SuiteMetrics type");
        });
    });

    suite("resetInstance idempotency", function() {
        test("SuiteMetrics", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const instance3: SuiteMetrics = SuiteMetrics.getInstance();

            assert.instanceOf(instance1, SuiteMetrics, "First instance should be SuiteMetrics type");
            assert.instanceOf(instance2, SuiteMetrics, "Second instance after first reset should be SuiteMetrics type");
            assert.instanceOf(instance3, SuiteMetrics, "Third instance after second reset should be SuiteMetrics type");

            assert.notEqual(instance1, instance2, "Instance 1 and 2 should be different after reset");
            assert.notEqual(instance2, instance3, "Instance 2 and 3 should be different after second reset");
            assert.notEqual(instance1, instance3, "Instance 1 and 3 should be different");
        });

        test("ConcurrentSuiteMetrics", async function() {
            const instance1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            await ConcurrentSuiteMetrics.resetInstance();
            const instance2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            await ConcurrentSuiteMetrics.resetInstance();
            const instance3: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.instanceOf(instance1, ConcurrentSuiteMetrics, "First ConcurrentSuiteMetrics instance should be correct type");
            assert.instanceOf(instance2, ConcurrentSuiteMetrics, "Second ConcurrentSuiteMetrics instance after first reset should be correct type");
            assert.instanceOf(instance3, ConcurrentSuiteMetrics, "Third ConcurrentSuiteMetrics instance after second reset should be correct type");

            assert.notEqual(instance1, instance2, "ConcurrentSuiteMetrics instance 1 and 2 should be different after reset");
            assert.notEqual(instance2, instance3, "ConcurrentSuiteMetrics instance 2 and 3 should be different after second reset");
            assert.notEqual(instance1, instance3, "ConcurrentSuiteMetrics instance 1 and 3 should be different");
        });

        test("Multiple consecutive resets", function() {
            const originalInstance: SuiteMetrics = SuiteMetrics.getInstance();

            // Perform multiple resets
            SuiteMetrics.resetInstance();
            SuiteMetrics.resetInstance();
            SuiteMetrics.resetInstance();

            const newInstance: SuiteMetrics = SuiteMetrics.getInstance();
            assert.notEqual(originalInstance, newInstance, "Instance after multiple consecutive resets should be different from original");

            // Verify singleton behavior still works
            const sameInstance: SuiteMetrics = SuiteMetrics.getInstance();
            assert.equal(newInstance, sameInstance, "getInstance calls after multiple resets should return same instance");
        });

        test("Reset with data persistence verification", function() {
            // Create instance with data
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            instance1.startTest(['persistence-test', 'test1']);
            instance1.stopTest();

            assert.equal(instance1.metrics.getSuiteMetricsRecursive([]).totalTestMetrics.numTests, 1, "Instance" +
                " should have 1 test before reset");

            // Reset multiple times
            SuiteMetrics.resetInstance();
            SuiteMetrics.resetInstance();

            const instance2: SuiteMetrics = SuiteMetrics.getInstance();
            assert.equal(instance2.metrics.getSuiteMetricsRecursive([]).totalTestMetrics.numTests, 0, "Instance" +
                " should have 0 tests after reset");
            assert.notEqual(instance1, instance2, "Instance after reset should be different object");
        });
    });

    suite("resetInstance doesn't affect future idempotency", function() {
        test("SuiteMetrics", function() {
            SuiteMetrics.resetInstance();
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            assert.equal(instance1, instance2, "Multiple getInstance calls after reset should return same instance");
            assert.instanceOf(instance1, SuiteMetrics, "First instance after reset should be SuiteMetrics type");
            assert.instanceOf(instance2, SuiteMetrics, "Second instance after reset should be SuiteMetrics type");
        });

        test("ConcurrentSuiteMetrics", async function() {
            await ConcurrentSuiteMetrics.resetInstance();
            const instance1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            const instance2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.equal(instance1, instance2, "Multiple ConcurrentSuiteMetrics getInstance calls after reset should return same instance");
            assert.instanceOf(instance1, ConcurrentSuiteMetrics, "First ConcurrentSuiteMetrics instance after reset should be correct type");
            assert.instanceOf(instance2, ConcurrentSuiteMetrics, "Second ConcurrentSuiteMetrics instance after reset should be correct type");
        });

        test("Idempotency after reset with operations", function() {
            SuiteMetrics.resetInstance();

            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            instance1.startTest(['idempotency-test', 'test1']);
            instance1.stopTest();

            const instance2: SuiteMetrics = SuiteMetrics.getInstance();
            assert.equal(instance1, instance2, "getInstance after operations should return same instance");
            assert.isTrue(instance2.queries.testExists(['idempotency-test', 'test1']), "Test should exist in same instance retrieved after operations");
        });

        test("Idempotency across multiple reset cycles", function() {
            // First cycle
            SuiteMetrics.resetInstance();
            const cycle1_instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const cycle1_instance2: SuiteMetrics = SuiteMetrics.getInstance();
            assert.equal(cycle1_instance1, cycle1_instance2, "Instances in first cycle should be the same");

            // Second cycle
            SuiteMetrics.resetInstance();
            const cycle2_instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const cycle2_instance2: SuiteMetrics = SuiteMetrics.getInstance();
            assert.equal(cycle2_instance1, cycle2_instance2, "Instances in second cycle should be the same");

            // Cycles should be different
            assert.notEqual(cycle1_instance1, cycle2_instance1, "Instances from different cycles should be different");
        });
    });

    suite("Cross-class independence", function() {
        test("SuiteMetrics reset", async function() {
            const concurrentInstance1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const concurrentInstance2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.instanceOf(concurrentInstance1, ConcurrentSuiteMetrics, "First ConcurrentSuiteMetrics instance should be correct type");
            assert.instanceOf(concurrentInstance2, ConcurrentSuiteMetrics, "Second ConcurrentSuiteMetrics instance should be correct type");
            assert.equal(concurrentInstance1, concurrentInstance2, "ConcurrentSuiteMetrics instances should be same after SuiteMetrics reset");
        });

        test("ConcurrentSuiteMetrics reset", async function() {
            const suiteInstance1: SuiteMetrics = SuiteMetrics.getInstance();
            await ConcurrentSuiteMetrics.resetInstance();
            const suiteInstance2: SuiteMetrics = SuiteMetrics.getInstance();

            assert.instanceOf(suiteInstance1, SuiteMetrics, "First SuiteMetrics instance should be correct type");
            assert.instanceOf(suiteInstance2, SuiteMetrics, "Second SuiteMetrics instance should be correct type");
            assert.equal(suiteInstance1, suiteInstance2, "SuiteMetrics instances should be same after ConcurrentSuiteMetrics reset");
        });

        test("Both classes maintain separate singleton instances", async function() {
            const suiteInstance: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrentInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            SuiteMetrics.resetInstance();
            await ConcurrentSuiteMetrics.resetInstance();

            const suiteInstance2: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrentInstance2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.notEqual(suiteInstance, suiteInstance2, "SuiteMetrics instances should be different after reset");
            assert.notEqual(concurrentInstance, concurrentInstance2, "ConcurrentSuiteMetrics instances should be different after reset");
        });

        test("Cross-class data isolation", async function() {
            const suiteInstance: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrentInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Add data to both instances
            suiteInstance.startTest(['suite-data', 'test1']);
            suiteInstance.stopTest();

            await concurrentInstance.startTest(['concurrent-data', 'test1']);
            await concurrentInstance.stopTest(['concurrent-data', 'test1']);

            // Verify data exists in both
            assert.isTrue(suiteInstance.queries.testExists(['suite-data', 'test1']), "Test should exist in SuiteMetrics" +
                " instance");
            assert.isTrue(concurrentInstance.queries.testExists(['concurrent-data', 'test1']), "Test should exist in" +
                " ConcurrentSuiteMetrics instance");

            // Reset one class
            SuiteMetrics.resetInstance();
            const newSuiteInstance: SuiteMetrics = SuiteMetrics.getInstance();
            const sameConcurrentInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Verify isolation
            assert.isFalse(newSuiteInstance.queries.testExists(['suite-data', 'test1']), "Test should not exist in new SuiteMetrics instance after reset");
            assert.isTrue(sameConcurrentInstance.queries.testExists(['concurrent-data', 'test1']), "Test should still exist in ConcurrentSuiteMetrics instance after SuiteMetrics reset");
            assert.equal(concurrentInstance, sameConcurrentInstance, "ConcurrentSuiteMetrics instance should remain the same after SuiteMetrics reset");
        });

        test("Independent reset operations", async function() {
            // Get initial instances
            const suite1: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrent1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Reset SuiteMetrics only
            SuiteMetrics.resetInstance();
            const suite2: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrent2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.notEqual(suite1, suite2, "SuiteMetrics instance should be different after reset");
            assert.equal(concurrent1, concurrent2, "ConcurrentSuiteMetrics instance should remain same when only SuiteMetrics is reset");

            // Reset ConcurrentSuiteMetrics only
            await ConcurrentSuiteMetrics.resetInstance();
            const suite3: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrent3: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.equal(suite2, suite3, "SuiteMetrics instance should remain same when only ConcurrentSuiteMetrics is reset");
            assert.notEqual(concurrent2, concurrent3, "ConcurrentSuiteMetrics instance should be different after reset");
        });

        test("Alternating resets maintain independence", async function() {
            const initialSuite: SuiteMetrics = SuiteMetrics.getInstance();
            const initialConcurrent: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Alternating resets
            SuiteMetrics.resetInstance();
            const suite1: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrent1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            await ConcurrentSuiteMetrics.resetInstance();
            const suite2: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrent2: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            SuiteMetrics.resetInstance();
            const suite3: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrent3: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Verify independence
            assert.notEqual(initialSuite, suite1, "SuiteMetrics should change after first reset");
            assert.equal(suite1, suite2, "SuiteMetrics should remain same when ConcurrentSuiteMetrics is reset");
            assert.notEqual(suite2, suite3, "SuiteMetrics should change after second reset");

            assert.equal(initialConcurrent, concurrent1, "ConcurrentSuiteMetrics should remain same when SuiteMetrics is reset");
            assert.notEqual(concurrent1, concurrent2, "ConcurrentSuiteMetrics should change when reset");
            assert.equal(concurrent2, concurrent3, "ConcurrentSuiteMetrics should remain same when SuiteMetrics is reset");
        });
    });

    suite("Instances are empty after reset", function() {
        test("SuiteMetrics", function() {
            // Simulate test completion
            suiteMetrics.startTest(['suite1', 'test1']);
            suiteMetrics.stopTest();

            // Get instance data after reset
            SuiteMetrics.resetInstance();
            const instanceData: RecursiveSuiteData = SuiteMetrics.getInstance().metrics.getSuiteMetricsRecursive([]);

            assert.equal(instanceData.totalTestMetrics.numTests, 0, "Reset SuiteMetrics instance should have 0 tests");
        });

        test("ConcurrentSuiteMetrics", async function() {
            // Simulate test completion
            concurrentMetrics.startTest(['suiteA', 'testA']);
            concurrentMetrics.stopTest(['suiteA', 'testA']);

            // Get instance data before/after reset
            await ConcurrentSuiteMetrics.resetInstance();
            const instance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            const instanceData: RecursiveSuiteData = instance.metrics.getSuiteMetricsRecursive([]);

            assert.equal(instanceData.totalTestMetrics.numTests, 0, "Reset ConcurrentSuiteMetrics instance should have 0 tests");
        });

        test("Complex data structure reset - SuiteMetrics", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();

            // Create complex nested structure
            instance.startTest(['level1', 'test1']);
            instance.stopTest();
            instance.startTest(['level1', 'level2', 'test2']);
            instance.stopTest();
            instance.startTest(['level1', 'level2', 'level3', 'test3']);
            instance.stopTest();

            // Verify data exists
            assert.equal(instance.metrics.getSuiteMetricsRecursive([]).totalTestMetrics.numTests, 3, "Instance should have 3 tests before reset");
            assert.isTrue(instance.queries.suiteExists(['level1']), "Level1 suite should exist before reset");
            assert.isTrue(instance.queries.suiteExists(['level1', 'level2']), "Level1/level2 suite should exist before reset");
            assert.isTrue(instance.queries.suiteExists(['level1', 'level2', 'level3']), "Level1/level2/level3 suite should exist before reset");

            // Reset and verify clean state
            SuiteMetrics.resetInstance();
            const newInstance: SuiteMetrics = SuiteMetrics.getInstance();

            assert.equal(newInstance.metrics.getSuiteMetricsRecursive([]).totalTestMetrics.numTests, 0, "New instance should have 0 tests after reset");
            assert.isFalse(newInstance.queries.suiteExists(['level1']), "Level1 suite should not exist after reset");
            assert.isFalse(newInstance.queries.suiteExists(['level1', 'level2']), "Level1/level2 suite should not exist after reset");
            assert.isFalse(newInstance.queries.suiteExists(['level1', 'level2', 'level3']), "Level1/level2/level3 suite should not exist after reset");
        });

        test("Complex data structure reset - ConcurrentSuiteMetrics", async function() {
            const instance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Create complex nested structure
            await instance.startTest(['level1', 'test1']);
            await instance.stopTest(['level1', 'test1']);
            await instance.startTest(['level1', 'level2', 'test2']);
            await instance.stopTest(['level1', 'level2', 'test2']);
            await instance.startTest(['level1', 'level2', 'level3', 'test3']);
            await instance.stopTest(['level1', 'level2', 'level3', 'test3']);

            // Verify data exists
            assert.equal(instance.metrics.getSuiteMetricsRecursive([]).totalTestMetrics.numTests, 3, "ConcurrentSuiteMetrics instance should have 3 tests before reset");
            assert.isTrue(instance.queries.suiteExists(['level1']), "Level1 suite should exist in ConcurrentSuiteMetrics before reset");
            assert.isTrue(instance.queries.suiteExists(['level1', 'level2']), "Level1/level2 suite should exist in ConcurrentSuiteMetrics before reset");
            assert.isTrue(instance.queries.suiteExists(['level1', 'level2', 'level3']), "Level1/level2/level3 suite should exist in ConcurrentSuiteMetrics before reset");

            // Reset and verify clean state
            await ConcurrentSuiteMetrics.resetInstance();
            const newInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.equal(newInstance.metrics.getSuiteMetricsRecursive([]).totalTestMetrics.numTests, 0, "New ConcurrentSuiteMetrics instance should have 0 tests after reset");
            assert.isFalse(newInstance.queries.suiteExists(['level1']), "Level1 suite should not exist in ConcurrentSuiteMetrics after reset");
            assert.isFalse(newInstance.queries.suiteExists(['level1', 'level2']), "Level1/level2 suite should not exist in ConcurrentSuiteMetrics after reset");
            assert.isFalse(newInstance.queries.suiteExists(['level1', 'level2', 'level3']), "Level1/level2/level3 suite should not exist in ConcurrentSuiteMetrics after reset");
        });

        test("Reset clears all metrics and counters", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();

            // Create multiple tests to increment counters
            instance.startTest(['counter-test', 'test1']);
            instance.stopTest();
            instance.startTest(['counter-test', 'test2']);
            instance.stopTest();
            instance.startTest(['counter-test', 'sub-suite', 'test3']);
            instance.stopTest();

            // Verify counters and data
            const test1: Test = instance.queries.getTest(['counter-test', 'test1']);
            const test2: Test = instance.queries.getTest(['counter-test', 'test2']);
            const test3: Test = instance.queries.getTest(['counter-test', 'sub-suite', 'test3']);

            assert.equal(test1.testNumber, 1, "First test should have testNumber 1");
            assert.equal(test2.testNumber, 2, "Second test should have testNumber 2");
            assert.equal(test3.testNumber, 3, "Third test should have testNumber 3");
            assert.equal(test1.suiteTestNumber, 1, "First test should have suiteTestNumber 1");
            assert.equal(test2.suiteTestNumber, 2, "Second test should have suiteTestNumber 2");
            assert.equal(test3.suiteTestNumber, 1, "Third test in sub-suite should have suiteTestNumber 1");

            // Reset and verify counters restart
            SuiteMetrics.resetInstance();
            const newInstance: SuiteMetrics = SuiteMetrics.getInstance();

            newInstance.startTest(['new-counter-test', 'test1']);
            newInstance.stopTest();

            const newTest: Test = newInstance.queries.getTest(['new-counter-test', 'test1']);
            assert.equal(newTest.testNumber, 1, "Test in new instance should start with testNumber 1");
            assert.equal(newTest.suiteTestNumber, 1, "Test in new instance should start with suiteTestNumber 1");
        });

        test("Reset clears timing data", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();

            // Create test with timing data
            instance.startTest(['timing-test', 'test1']);
            const start: number = Date.now();
            while (Date.now() - start < 1) { /* busy wait */ }
            instance.stopTest();

            const suiteData: SuiteData = instance.metrics.getSuiteMetrics(['timing-test']);
            assert.isNumber(suiteData.testMetrics.totalTime, "Total time should be a number");
            assert.isAbove(suiteData.testMetrics.totalTime, 0, "Total time should be greater than 0");
            assert.isNumber(suiteData.testMetrics.averageTime, "Average time should be a number");
            assert.isAbove(suiteData.testMetrics.averageTime, 0, "Average time should be greater than 0");

            // Reset and verify timing data is cleared
            SuiteMetrics.resetInstance();
            const newInstance: SuiteMetrics = SuiteMetrics.getInstance();

            const topLevelData: RecursiveSuiteData = newInstance.metrics.getSuiteMetricsRecursive([]);
            assert.equal(topLevelData.totalTestMetrics.totalTime, 0, "Total time should be 0 after reset");
            assert.equal(topLevelData.totalTestMetrics.averageTime, 0, "Average time should be 0 after reset");
        });
    });

    suite("getInstance is consistent across operations", function() {
        test("SuiteMetrics", function() {
            const initialInstance: SuiteMetrics = SuiteMetrics.getInstance();
            initialInstance.startTest(['suiteX', 'testY']);
            initialInstance.stopTest();
            const afterOperationsInstance: SuiteMetrics = SuiteMetrics.getInstance();

            assert.instanceOf(initialInstance, SuiteMetrics, "Initial SuiteMetrics instance should be correct type");
            assert.instanceOf(afterOperationsInstance, SuiteMetrics, "SuiteMetrics instance after operations should be correct type");
            assert.equal(initialInstance, afterOperationsInstance, "SuiteMetrics instance should be same before and after operations");
        });

        test("ConcurrentSuiteMetrics", async function() {
            const initialInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
            initialInstance.startTest(['suiteX', 'testY']);
            initialInstance.stopTest(['suiteX', 'testY']);
            const afterOperationsInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            assert.instanceOf(initialInstance, ConcurrentSuiteMetrics, "Initial ConcurrentSuiteMetrics instance should be correct type");
            assert.instanceOf(afterOperationsInstance, ConcurrentSuiteMetrics, "ConcurrentSuiteMetrics instance after operations should be correct type");
            assert.equal(initialInstance, afterOperationsInstance, "ConcurrentSuiteMetrics instance should be same before and after operations");
        });

        test("Instance consistency during complex operations", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();

            // Perform various operations
            instance1.startTest(['complex-ops', 'test1']);
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();
            instance1.stopTest();

            const instance3: SuiteMetrics = SuiteMetrics.getInstance();
            const suiteData: SuiteData = instance3.metrics.getSuiteMetrics(['complex-ops']);
            const instance4: SuiteMetrics = SuiteMetrics.getInstance();

            // All should be the same instance
            assert.equal(instance1, instance2, "Instance should be same during test execution");
            assert.equal(instance2, instance3, "Instance should be same after test completion");
            assert.equal(instance3, instance4, "Instance should be same after data retrieval");

            // Verify operations worked on the same instance
            assert.equal(suiteData.testMetrics.numTests, 1, "Suite should have 1 test after operations");
            assert.isTrue(instance4.queries.testExists(['complex-ops', 'test1']), "Test should exist in final instance");
        });

        test("Instance consistency with error conditions", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();

            // Start a test
            instance1.startTest(['error-test', 'test1']);
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            // Try to start another test (should throw error)
            try {
                instance2.startTest(['error-test', 'test2']);
                assert.fail('Should have thrown error for concurrent test');
            } catch (error) {
                // Expected error
            }

            const instance3: SuiteMetrics = SuiteMetrics.getInstance();

            // Stop the original test
            instance3.stopTest();
            const instance4: SuiteMetrics = SuiteMetrics.getInstance();

            // All should be the same instance
            assert.equal(instance1, instance2, "Instance should be same when attempting concurrent test");
            assert.equal(instance2, instance3, "Instance should be same after error condition");
            assert.equal(instance3, instance4, "Instance should be same after test completion");
        });

        test("Instance consistency across async operations", async function () {
            const instance1: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Start async operations
            const promise1: Promise<ConcurrentSuiteMetrics> = Promise.resolve().then(async () => {
                const asyncInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();
                asyncInstance.startTest(['async-test', 'test1']);
                return asyncInstance;
            });

            const promise2: Promise<ConcurrentSuiteMetrics> = Promise.resolve().then(() => {
                const asyncInstance = ConcurrentSuiteMetrics.getInstance();
                return asyncInstance;
            });

            const [async1, async2] = await Promise.all([promise1, promise2]);
            assert.equal(instance1, async1, "Sync and first async instance should be same");
            assert.equal(instance1, async2, "Sync and second async instance should be same");
            assert.equal(async1, async2, "Both async instances should be same");
            // Clean up
            async1.stopTest(['async-test', 'test1']);
        });
    });

    suite("Singleton state management edge cases", function() {
        test("Instance reference stability during operations", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();
            const originalRef: SuiteMetrics = instance;

            // Perform many operations
            for (let i = 0; i < 10; i++) {
                instance.startTest(['stability-test', `test${i}`]);
                instance.stopTest();

                const currentRef: SuiteMetrics = SuiteMetrics.getInstance();
                assert.equal(currentRef, originalRef, `Instance reference should be stable after operation ${i}`);
            }
        });

        test("Memory consistency after reset", function() {
            // Create instance with data
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            instance1.startTest(['memory-test', 'test1']);
            instance1.stopTest();

            const testData1: Test = instance1.queries.getTest(['memory-test', 'test1']);
            const firstTestNumber = testData1.testNumber;

            // Reset
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            // Verify old reference doesn't affect new instance
            assert.notEqual(instance1, instance2, "Old and new instances should be different objects");
            assert.isFalse(instance2.queries.testExists(['memory-test', 'test1']), "New instance should not have old test data");

            // Create new test with same path
            instance2.startTest(['memory-test', 'test1']);
            instance2.stopTest();

            const testData2: Test = instance2.queries.getTest(['memory-test', 'test1']);

            // Should be different test objects
            // Note: testNumber resets with new instance since testCounter is instance-level
            assert.equal(testData1.testNumber, firstTestNumber, "Old test data should be unchanged");
            assert.equal(testData2.testNumber, 1, "New instance should start counter at 1");
            assert.notEqual(testData1, testData2, "Test data objects should be different");
        });

        test("Concurrent singleton access patterns", async function() {
            // Reset to ensure clean state
            SuiteMetrics.resetInstance();
            await ConcurrentSuiteMetrics.resetInstance();

            const suiteInstances: SuiteMetrics[] = [];
            const concurrentInstances: ConcurrentSuiteMetrics[] = [];

            // Simulate rapid concurrent access
            for (let i = 0; i < 20; i++) {
                suiteInstances.push(SuiteMetrics.getInstance());
                concurrentInstances.push(await ConcurrentSuiteMetrics.getInstance());
            }

            // Verify all instances are identical within their class
            const firstSuite: SuiteMetrics = suiteInstances[0];
            const firstConcurrent: ConcurrentSuiteMetrics = concurrentInstances[0];

            suiteInstances.forEach((instance, index) => {
                assert.equal(instance, firstSuite, `SuiteMetrics instance ${index} should equal first instance`);
            });

            concurrentInstances.forEach((instance, index) => {
                assert.equal(instance, firstConcurrent, `ConcurrentSuiteMetrics instance ${index} should equal first instance`);
            });
        });

        test("Reset behavior with active test state", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();

            // Start a test but don't stop it
            instance.startTest(['active-test', 'test1']);

            // Reset while test is active
            SuiteMetrics.resetInstance();
            const newInstance: SuiteMetrics = SuiteMetrics.getInstance();

            // New instance should be clean and allow starting tests
            assert.notEqual(newInstance, instance, "New instance should be different from old instance");
            assert.doesNotThrow(() => {
                newInstance.startTest(['new-test', 'test1']);
                newInstance.stopTest();
            }, "New instance should allow starting tests without throwing");

            assert.isTrue(newInstance.queries.testExists(['new-test', 'test1']), "New test should exist in new instance");
            assert.isFalse(newInstance.queries.testExists(['active-test', 'test1']), "Active test from old instance should not exist in new instance");
        });

        test("Reset behavior with concurrent active tests", async function() {
            const instance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // Start multiple tests but don't stop them
            await instance.startTest(['concurrent-active', 'test1']);
            await instance.startTest(['concurrent-active', 'test2']);
            await instance.startTest(['concurrent-active', 'sub-suite', 'test3']);

            // Reset while tests are active
            await ConcurrentSuiteMetrics.resetInstance();
            const newInstance: ConcurrentSuiteMetrics = await ConcurrentSuiteMetrics.getInstance();

            // New instance should be clean and allow starting tests
            assert.notEqual(newInstance, instance, "New ConcurrentSuiteMetrics instance should be different from old instance");
            await newInstance.startTest(['new-concurrent', 'test1']);
            await newInstance.stopTest(['new-concurrent', 'test1']);

            await newInstance.startTest(['concurrent-active', 'test1']);
            await newInstance.startTest(['concurrent-active', 'test2']);
            await newInstance.startTest(['concurrent-active', 'sub-suite', 'test3']);

            assert.isTrue(newInstance.queries.testExists(['new-concurrent', 'test1']), "New test should exist in new ConcurrentSuiteMetrics instance");
            assert.isFalse(newInstance.queries.testExists(['concurrent-active', 'test1']), "Active test from old instance should not exist in new ConcurrentSuiteMetrics instance");
        });
    });

    suite("Singleton pattern compliance", function() {
        test("Constructor is not directly accessible", function() {
            // This test verifies that the singleton pattern is properly implemented
            // by ensuring getInstance is the only way to get instances
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            assert.equal(instance1, instance2, "Multiple getInstance calls should return same instance");
            assert.equal(instance1.constructor, SuiteMetrics, "Instance constructor should be SuiteMetrics");
        });

        test("Static methods work correctly", function() {
            // Test that static methods are accessible and work
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            assert.equal(typeof SuiteMetrics.getInstance, 'function', "getInstance should be a function");
            assert.equal(typeof SuiteMetrics.resetInstance, 'function', "resetInstance should be a function");

            // Test resetInstance static method
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();
            assert.notEqual(instance1, instance2, "Instance after resetInstance should be different");
        });

        test("Instance methods work on singleton", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();

            // Test that all expected methods exist and are functions
            assert.equal(typeof instance.startTest, 'function', "startTest should be a function");
            assert.equal(typeof instance.stopTest, 'function', "stopTest should be a function");
            assert.equal(typeof instance.queries.testExists, 'function', "testExists should be a function");
            assert.equal(typeof instance.queries.suiteExists, 'function', "suiteExists should be a function");
            assert.equal(typeof instance.queries.getTest, 'function', "getTest should be a function");
            assert.equal(typeof instance.metrics.getSuiteMetrics, 'function', "getSuiteMetrics should be a function");
            assert.equal(typeof instance.metrics.getSuiteMetricsRecursive, 'function', "getSuiteMetricsRecursive should be a function");
            assert.equal(typeof instance.metrics.printAllSuiteMetrics, 'function', "printAllSuiteMetrics should be a function");
        });

        test("Singleton maintains prototype chain", function() {
            const instance: SuiteMetrics = SuiteMetrics.getInstance();

            assert.isTrue(instance instanceof SuiteMetrics, "Instance should be instanceof SuiteMetrics");
            assert.equal(Object.getPrototypeOf(instance), SuiteMetrics.prototype, "Instance prototype should be SuiteMetrics.prototype");
        });

        test("Multiple resets maintain singleton pattern", function() {
            const instances: SuiteMetrics[] = [];

            // Create multiple instances through reset cycles
            for (let i = 0; i < 5; i++) {
                SuiteMetrics.resetInstance();
                const instance: SuiteMetrics = SuiteMetrics.getInstance();
                instances.push(instance);

                // Verify singleton behavior within each cycle
                const sameInstance: SuiteMetrics = SuiteMetrics.getInstance();
                assert.equal(instance, sameInstance, `Singleton behavior should be maintained in reset cycle ${i}`);
            }

            // Verify all instances from different cycles are different
            for (let i = 0; i < instances.length; i++) {
                for (let j = i + 1; j < instances.length; j++) {
                    assert.notEqual(instances[i], instances[j], `Instances from reset cycles ${i} and ${j} should be different`);
                }
            }
        });
    });
});
