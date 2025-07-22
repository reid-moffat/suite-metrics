import { Test } from "../types/structures.ts";

/**
 * Heap-based test ranking system for O(log n) insertions and O(M) top-M queries
 */
class TestRankingHeaps {

    private maxHeap: Test[] = []; // Max duration: slowest tests
    private minHeap: Test[] = []; // Min duration: fastest tests

    /**
     * Adds a test to both heaps
     */
    public addTest(test: Test): void {
        this.insertIntoMaxHeap(test);
        this.insertIntoMinHeap(test);
    }

    /**
     * Gets the N slowest tests
     */
    public getNSlowestTests(n: number): Test[] {
        if (n <= 0) return [];

        // Extract top n from max heap without destroying original heap
        return this.extractTopNFromMaxHeap(n);
    }

    /**
     * Gets the N fastest tests
     */
    public getNFastestTests(n: number): Test[] {
        if (n <= 0) return [];

        // Extract top n from min heap without destroying original heap
        return this.extractTopNFromMinHeap(n);
    }

    /**
     * Gets the slowest test
     */
    public getSlowestTest(): Test | null {
        return this.maxHeap.length > 0 ? this.maxHeap[0] : null;
    }

    /**
     * Gets the fastest test
     */
    public getFastestTest(): Test | null {
        return this.minHeap.length > 0 ? this.minHeap[0] : null;
    }


    // === MAX HEAP IMPLEMENTATION ===

    private insertIntoMaxHeap(test: Test): void {
        this.maxHeap.push(test);
        this.bubbleUpMax(this.maxHeap.length - 1);
    }

    private bubbleUpMax(index: number): void {
        while (index > 0) {
            const parentIndex = this.getParentIndex(index);

            // In max heap, parent should be >= child
            if (this.maxHeap[parentIndex].duration >= this.maxHeap[index].duration) {
                break;
            }

            // Swap with parent
            this.swapMax(index, parentIndex);
            index = parentIndex;
        }
    }

    private bubbleDownMax(index: number): void {
        while (this.hasLeftChildMax(index)) {
            let largerChildIndex = this.getLeftChildIndex(index);

            // Check if right child exists and is larger than left child
            if (this.hasRightChildMax(index) &&
                this.maxHeap[this.getRightChildIndex(index)].duration >
                this.maxHeap[largerChildIndex].duration) {
                largerChildIndex = this.getRightChildIndex(index);
            }

            // If current node is already larger than its largest child, we're done
            if (this.maxHeap[index].duration >= this.maxHeap[largerChildIndex].duration) {
                break;
            }

            // Swap with larger child
            this.swapMax(index, largerChildIndex);
            index = largerChildIndex;
        }
    }

    private extractTopNFromMaxHeap(n: number): Test[] {
        const result: Test[] = [];
        const tempHeap = [...this.maxHeap]; // Copy to avoid destroying original
        const originalLength = tempHeap.length;

        for (let i = 0; i < Math.min(n, originalLength); i++) {
            if (tempHeap.length === 0) break;

            // Extract max (root)
            result.push(tempHeap[0]);

            // Move last element to root and bubble down
            tempHeap[0] = tempHeap[tempHeap.length - 1];
            tempHeap.pop();

            if (tempHeap.length > 0) {
                this.bubbleDownMaxTemp(tempHeap, 0);
            }
        }

        return result;
    }

    private bubbleDownMaxTemp(heap: Test[], index: number): void {
        while (this.hasLeftChildTemp(heap, index)) {
            let largerChildIndex = this.getLeftChildIndex(index);

            if (this.hasRightChildTemp(heap, index) &&
                heap[this.getRightChildIndex(index)].duration >
                heap[largerChildIndex].duration) {
                largerChildIndex = this.getRightChildIndex(index);
            }

            if (heap[index].duration >= heap[largerChildIndex].duration) {
                break;
            }

            [heap[index], heap[largerChildIndex]] = [heap[largerChildIndex], heap[index]];
            index = largerChildIndex;
        }
    }


    // === MIN HEAP ===

    private insertIntoMinHeap(test: Test): void {
        this.minHeap.push(test);
        this.bubbleUpMin(this.minHeap.length - 1);
    }

    private bubbleUpMin(index: number): void {
        while (index > 0) {
            const parentIndex = this.getParentIndex(index);

            // In min heap, parent should be <= child
            if (this.minHeap[parentIndex].duration <= this.minHeap[index].duration) {
                break;
            }

            // Swap with parent
            this.swapMin(index, parentIndex);
            index = parentIndex;
        }
    }

    private bubbleDownMin(index: number): void {
        while (this.hasLeftChildMin(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);

            // Check if right child exists and is smaller than left child
            if (this.hasRightChildMin(index) &&
                this.minHeap[this.getRightChildIndex(index)].duration <
                this.minHeap[smallerChildIndex].duration) {
                smallerChildIndex = this.getRightChildIndex(index);
            }

            // If current node is already smaller than its smallest child, we're done
            if (this.minHeap[index].duration <= this.minHeap[smallerChildIndex].duration) {
                break;
            }

            // Swap with smaller child
            this.swapMin(index, smallerChildIndex);
            index = smallerChildIndex;
        }
    }

    private extractTopNFromMinHeap(n: number): Test[] {
        const result: Test[] = [];
        const tempHeap = [...this.minHeap]; // Copy to avoid destroying original
        const originalLength = tempHeap.length;

        for (let i = 0; i < Math.min(n, originalLength); i++) {
            if (tempHeap.length === 0) break;

            // Extract min (root)
            result.push(tempHeap[0]);

            // Move last element to root and bubble down
            tempHeap[0] = tempHeap[tempHeap.length - 1];
            tempHeap.pop();

            if (tempHeap.length > 0) {
                this.bubbleDownMinTemp(tempHeap, 0);
            }
        }

        return result;
    }

    private bubbleDownMinTemp(heap: Test[], index: number): void {
        while (this.hasLeftChildTemp(heap, index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);

            if (this.hasRightChildTemp(heap, index) &&
                heap[this.getRightChildIndex(index)].duration <
                heap[smallerChildIndex].duration) {
                smallerChildIndex = this.getRightChildIndex(index);
            }

            if (heap[index].duration <= heap[smallerChildIndex].duration) {
                break;
            }

            [heap[index], heap[smallerChildIndex]] = [heap[smallerChildIndex], heap[index]];
            index = smallerChildIndex;
        }
    }


    // === UTILITY METHODS ===

    private getParentIndex(index: number): number {
        return Math.floor((index - 1) / 2);
    }

    private getLeftChildIndex(index: number): number {
        return 2 * index + 1;
    }

    private getRightChildIndex(index: number): number {
        return 2 * index + 2;
    }

    private hasLeftChildMax(index: number): boolean {
        return this.getLeftChildIndex(index) < this.maxHeap.length;
    }

    private hasRightChildMax(index: number): boolean {
        return this.getRightChildIndex(index) < this.maxHeap.length;
    }

    private hasLeftChildMin(index: number): boolean {
        return this.getLeftChildIndex(index) < this.minHeap.length;
    }

    private hasRightChildMin(index: number): boolean {
        return this.getRightChildIndex(index) < this.minHeap.length;
    }

    private hasLeftChildTemp(heap: Test[], index: number): boolean {
        return this.getLeftChildIndex(index) < heap.length;
    }

    private hasRightChildTemp(heap: Test[], index: number): boolean {
        return this.getRightChildIndex(index) < heap.length;
    }

    private swapMax(index1: number, index2: number): void {
        [this.maxHeap[index1], this.maxHeap[index2]] = [this.maxHeap[index2], this.maxHeap[index1]];
    }

    private swapMin(index1: number, index2: number): void {
        [this.minHeap[index1], this.minHeap[index2]] = [this.minHeap[index2], this.minHeap[index1]];
    }
}
