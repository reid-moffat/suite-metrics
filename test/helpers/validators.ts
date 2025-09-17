import { Suite, Test, SuiteData } from "suite-metrics";
import { assert } from "chai";

// Required data to validate (total & average time differ each run)
type SuiteDataValidate = {
    name: string;
    parentSuites: string[] | null;
    childSuites: string[] | null;
    directTestMetrics: {
        numTests: number;
    }
    subTestMetrics: {
        numTests: number;
    }
    totalTestMetrics: {
        numTests: number;
    }
};

/**
 * Validates recursive suite data
 *
 * @param data Suite data returned from the metrics
 * @param expected Expected suite data (note: total and average time are left out since these vary each time)
 */
const validateSuiteData = (data: SuiteData, expected: SuiteDataValidate) => {
    assert.isObject(data);
    assert.hasAllKeys(data, ['name', 'parentSuites', 'childSuites', 'directTestMetrics', 'subTestMetrics', 'totalTestMetrics']);

    assert.isString(data.name);
    assert.strictEqual(data.name, expected.name);
    assert.deepStrictEqual(data.parentSuites, expected.parentSuites);
    assert.deepStrictEqual(data.subSuites, expected.childSuites);

    assert.hasAllKeys(data.directTestMetrics, ['numTests', 'totalTime', 'averageTime']);
    assert.strictEqual(data.directTestMetrics.numTests, expected.directTestMetrics.numTests);
    if (expected.directTestMetrics.numTests === 0) {
        assert.isNull(data.directTestMetrics.totalTime);
        assert.isNull(data.directTestMetrics.averageTime);
    } else {
        assert.isNumber(data.directTestMetrics.totalTime);
        assert.isAbove(data.directTestMetrics.totalTime, 0);
        assert.isTrue(Number.isInteger(data.directTestMetrics.totalTime));
        assert.isNumber(data.directTestMetrics.averageTime);
        assert.isAbove(data.directTestMetrics.averageTime, 0);
        assert.isTrue(Number.isInteger(data.directTestMetrics.averageTime)); // @ts-ignore
        assert.strictEqual(data.directTestMetrics.averageTime, data.directTestMetrics.totalTime / data.directTestMetrics.numTests);
    }

    assert.hasAllKeys(data.subTestMetrics, ['numTests', 'totalTime', 'averageTime']);
    assert.strictEqual(data.subTestMetrics.numTests, expected.subTestMetrics.numTests);
    if (expected.subTestMetrics.numTests === 0) {
        assert.isNull(data.subTestMetrics.totalTime);
        assert.isNull(data.subTestMetrics.averageTime);
    } else {
        assert.isNumber(data.subTestMetrics.totalTime);
        assert.isAbove(data.subTestMetrics.totalTime, 0);
        assert.isTrue(Number.isInteger(data.subTestMetrics.totalTime));
        assert.isNumber(data.subTestMetrics.averageTime);
        assert.isAbove(data.subTestMetrics.averageTime, 0);
        assert.isTrue(Number.isInteger(data.subTestMetrics.averageTime)); // @ts-ignore
        assert.strictEqual(data.subTestMetrics.averageTime, data.subTestMetrics.totalTime / data.subTestMetrics.numTests);
    }

    assert.hasAllKeys(data.totalTestMetrics, ['numTests', 'totalTime', 'averageTime']);
    assert.strictEqual(data.totalTestMetrics.numTests, expected.totalTestMetrics.numTests);
    if (expected.totalTestMetrics.numTests === 0) {
        assert.isNull(data.totalTestMetrics.totalTime);
        assert.isNull(data.totalTestMetrics.averageTime);
    } else {
        assert.isNumber(data.totalTestMetrics.totalTime);
        assert.isAbove(data.totalTestMetrics.totalTime, 0);
        assert.isTrue(Number.isInteger(data.totalTestMetrics.totalTime));
        assert.isNumber(data.totalTestMetrics.averageTime);
        assert.isAbove(data.totalTestMetrics.averageTime, 0);
        assert.isTrue(Number.isInteger(data.totalTestMetrics.averageTime)); // @ts-ignore
        assert.strictEqual(data.totalTestMetrics.averageTime, data.totalTestMetrics.totalTime / data.totalTestMetrics.numTests);
    }
}

/**
 * Recursively validates a suite and all its sub-suites
 */
function validateSuiteRecursive(suite: Suite): AggregateData {

    // Validate top-level object
    assert.isNotNull(suite, `Expected suite to not be null`);
    assert.isObject(suite, `Expected suite to be an object`);
    assert.isNotArray(suite, `Expected suite to not be an array`);
    assert.isNotEmpty(suite, `Expected suite to not be empty`);

    // Validate top-level keys exist
    const expectedKeys: string[] = ["name", "path", "tests", "subSuites", "aggregateData"];
    assert.hasAllKeys(suite, expectedKeys, `Expected suite ${JSON.stringify(suite)} to contain only keys ${JSON.stringify(expectedKeys)}`);

    // Validate aggregate data object
    const aggregateData = suite.aggregateData;
    assert.isNotNull(aggregateData, `Expected aggregateData to not be null`);
    assert.isObject(aggregateData, `Expected aggregateData to be an object`);
    assert.isNotArray(aggregateData, `Expected aggregateData to not be an array`);
    assert.isNotEmpty(aggregateData, `Expected aggregateData to not be empty`);

    // Validate aggregate data keys exist
    const expectedAggregateKeys: string[] = ["numTests", "totalTestTime"];
    assert.hasAllKeys(aggregateData, expectedAggregateKeys, `Expected aggregateData ${JSON.stringify(aggregateData)} to contain only keys ${JSON.stringify(expectedAggregateKeys)}`);


    // Validate all keys are the expected type
    assert.isString(suite.name);
    assert.isArray(suite.path);
    suite.path.forEach((val: string): void => assert.isString(val));
    assert.instanceOf(suite.tests, Map);
    assert.instanceOf(suite.subSuites, Map);

    assert.isNumber(suite.aggregateData.numTests);
    assert.isNumber(suite.aggregateData.totalTestTime);


    // Validate tests + start calculating aggregate data manually
    const tempAggregateData: AggregateData = {
        numTests: suite.tests.size,
        totalTestTime: 0
    };
    for (const test of suite.tests.values()) {
        validateTest(test);
        tempAggregateData.totalTestTime += test.duration;
    }

    // Recursively validate all sub-suites
    for (const subSuite of suite.subSuites.values()) {
        const data: AggregateData = validateSuiteRecursive(subSuite);
        tempAggregateData.numTests += data.numTests;
        tempAggregateData.totalTestTime += data.totalTestTime;
    }

    // Finally, validate data points
    assert.isAtLeast(aggregateData.numTests, suite.tests.size, `Num tests must be at least the number of tests directly in this suite`);
    assert.equal(aggregateData.numTests, tempAggregateData.numTests, `Expected aggregateData's numTests to match calculated value`);
    assert.equal(aggregateData.totalTestTime, tempAggregateData.totalTestTime, `Expected aggregateData's totalTestTime to match calculated value`);

    return aggregateData;
}

/**
 * Validates a test object is valid, optionally validating name as well
 */
function validateTest(test: Test, name?: string) {

    // Validate top-level object
    assert.isNotNull(test, `Expected test to not be null`);
    assert.isObject(test, `Expected test to be an object`);
    assert.isNotArray(test, `Expected test to not be an array`);
    assert.isNotEmpty(test, `Expected test to not be empty`);

    // Validate top-level keys exist
    const expectedKeys: string[] = ["name", "path", "startTimestamp", "endTimestamp", "duration", "testNumber", "suiteTestNumber"];
    assert.hasAllKeys(test, expectedKeys, `Expected test ${JSON.stringify(test)} to contain only keys ${JSON.stringify(expectedKeys)}`);

    // Validate value types
    assert.isString(test.name);
    assert.isArray(test.path);
    assert.isNumber(test.startTimestamp);
    assert.isNumber(test.endTimestamp);
    assert.isNumber(test.duration);
    assert.isNumber(test.testNumber);
    assert.isNumber(test.suiteTestNumber);

    // Validate specific values
    assert.isAtLeast(test.name.length, 1, `Test name must be at least 1 character long`);
    test.path.forEach((val: string): void => {
        assert.isString(val, `All values in test's path must strings`);
        assert.isAtLeast(val.length, 1, `All values in test's path must be at least 1 character long`);
    });
    assert.isAbove(test.startTimestamp, 0, `Start timestamp must be positive`);
    assert.isAtLeast(test.endTimestamp, test.startTimestamp, `End timestamp must be at least the start timestamp`);
    assert.equal(test.duration, test.endTimestamp - test.startTimestamp, `Expected duration to be the start/end difference`);
    assert.isAtLeast(test.testNumber, 1, `Test number must be at least 1`);
    assert.isAtLeast(test.suiteTestNumber, 1, `Test must have a suite test # of at least 1`);

    if (name) {
        assert.strictEqual(test.name, name, `Test name ${test.name} and expected name ${name} don't match`);
    }
}

type AggregateData = {
    numTests: number,
    totalTestTime: number
};

export { validateSuiteData, SuiteDataValidate, validateSuiteRecursive, validateTest };
