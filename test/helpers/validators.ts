import { Suite, SuiteData } from "suite-metrics";
import { expect } from 'chai';
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

    console.log(`Validating recursive suite metrics:\nResult: ${JSON.stringify(data, null, 4)}\nExpected: ${JSON.stringify(expected, null, 4)}`);

    expect(data).to.be.an('object');
    expect(data).to.have.all.keys(['name', 'parentSuites', 'childSuites', 'directTestMetrics', 'subTestMetrics', 'totalTestMetrics']);
    console.log(`\n✅ Structure validated`);

    expect(data.name).to.be.a('string');
    expect(data.name).to.equal(expected.name);
    expect(data.parentSuites).to.deep.equal(expected.parentSuites);
    expect(data.subSuites).to.deep.equal(expected.childSuites);
    console.log(`✅ Metadata validated`);

    expect(data.directTestMetrics).to.have.all.keys(['numTests', 'totalTime', 'averageTime']);
    expect(data.directTestMetrics.numTests).to.equal(expected.directTestMetrics.numTests);
    if (expected.directTestMetrics.numTests === 0) {
        expect(data.directTestMetrics.totalTime).to.be.null;
        expect(data.directTestMetrics.averageTime).to.be.null;
    } else {
        expect(data.directTestMetrics.totalTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num));
        expect(data.directTestMetrics.averageTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num)); // @ts-ignore
        expect(data.directTestMetrics.averageTime).to.equal(data.directTestMetrics.totalTime / data.directTestMetrics.numTests);
    }
    console.log(`✅ Direct test metrics validated`);

    expect(data.subTestMetrics).to.have.all.keys(['numTests', 'totalTime', 'averageTime']);
    expect(data.subTestMetrics.numTests).to.equal(expected.subTestMetrics.numTests);
    if (expected.subTestMetrics.numTests === 0) {
        expect(data.subTestMetrics.totalTime).to.be.null;
        expect(data.subTestMetrics.averageTime).to.be.null;
    } else {
        expect(data.subTestMetrics.totalTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num));
        expect(data.subTestMetrics.averageTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num)); // @ts-ignore
        expect(data.subTestMetrics.averageTime).to.equal(data.subTestMetrics.totalTime / data.subTestMetrics.numTests);
    }
    console.log(`✅ Sub test metrics validated`);

    expect(data.totalTestMetrics).to.have.all.keys(['numTests', 'totalTime', 'averageTime']);
    expect(data.totalTestMetrics.numTests).to.equal(expected.totalTestMetrics.numTests);
    if (expected.totalTestMetrics.numTests === 0) {
        expect(data.totalTestMetrics.totalTime).to.be.null;
        expect(data.totalTestMetrics.averageTime).to.be.null;
    } else {
        expect(data.totalTestMetrics.totalTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num));
        expect(data.totalTestMetrics.averageTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num)); // @ts-ignore
        expect(data.totalTestMetrics.averageTime).to.equal(data.totalTestMetrics.totalTime / data.totalTestMetrics.numTests);
    }
    console.log(`✅ Total test metrics validated\n`);
}

/**
 * Recursively validates a suite and all its sub-suites
 */
function validateSuiteRecursive(suite: Suite) {

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
    assert.instanceOf(suite.tests, Map);
    assert.instanceOf(suite.subSuites, Map);

    assert.isNumber(suite.aggregateData.numTests);
    assert.isNumber(suite.aggregateData.totalTestTime);

    for (const subSuite of suite.subSuites.values()) {
        validateSuiteRecursive(subSuite);
    }
}

export { validateSuiteData, SuiteDataValidate, validateSuiteRecursive };
