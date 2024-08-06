import { expect } from 'chai';
import { GenerateArray } from 'generate-arrays';

suite("Test suite", () => {
    test("Test test", () => {
        expect(true).to.equal(true);
    });

    test("Test test 2", () => {
        const arr = GenerateArray.counting(1, 10, 1);
        expect(arr).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
});
