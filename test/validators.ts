import { expect } from 'chai';
import { SuiteData, RecursiveSuiteData } from "suite-metrics";

// Required data to validate (total & average time differ each run)
type SuiteDataValidate = {
    name: string;
    parentSuites: string[] | null;
    childSuites: string[] | null;
    testMetrics: {
        numTests: number;
    }
};

/**
 * Validates suite data
 *
 * @param data Suite data returned from the metrics
 * @param expected Expected suite data (note: total and average time are left out since these vary each time)
 */
const validateSuiteData = (data: SuiteData, expected: SuiteDataValidate) => {

    console.log(`Validating suite metrics:\nResult: ${JSON.stringify(data, null, 4)}\nExpected: ${JSON.stringify(expected, null, 4)}`);

    expect(data).to.be.an('object');
    expect(data).to.have.all.keys(['name', 'parentSuites', 'childSuites', 'testMetrics']);
    console.log(`\n✅ Structure validated`);

    expect(data.name).to.be.a('string');
    expect(data.name).to.equal(expected.name);
    expect(data.parentSuites).to.deep.equal(expected.parentSuites);
    expect(data.subSuites).to.deep.equal(expected.childSuites);
    console.log(`✅ Metadata validated`);

    expect(data.testMetrics).to.have.all.keys(['numTests', 'totalTime', 'averageTime']);
    expect(data.testMetrics.numTests).to.equal(expected.testMetrics.numTests);

    if (expected.testMetrics.numTests === 0) {
        expect(data.testMetrics.totalTime).to.be.null;
        expect(data.testMetrics.averageTime).to.be.null;
    } else {
        expect(data.testMetrics.totalTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num));
        expect(data.testMetrics.averageTime).to.be.a('number').and.be.above(0).and.satisfy((num: number) => Number.isInteger(num)); // @ts-ignore
        expect(data.testMetrics.averageTime).to.equal(data.testMetrics.totalTime / data.testMetrics.numTests);
    }
    console.log(`✅ Test metrics validated\n`);
}

// Required data to validate (total & average time differ each run)
type RecursiveSuiteDataValidate = {
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
const validateRecursiveSuiteData = (data: RecursiveSuiteData, expected: RecursiveSuiteDataValidate) => {

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

export { validateSuiteData, SuiteDataValidate, validateRecursiveSuiteData, RecursiveSuiteDataValidate };
