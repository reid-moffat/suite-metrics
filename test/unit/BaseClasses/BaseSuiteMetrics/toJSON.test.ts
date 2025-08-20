import { createSimpleTestData } from "../../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[BaseSuiteMetrics] toJSON", function() {

    test("Basic data", function () {
        const instance = createSimpleTestData(false);

        const result: string = instance.toJSONString();

        assert.isString(result);
    });
});
