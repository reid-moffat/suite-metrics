/**
 * Mutex to lock execution for concurrent operations
 */
class Mutex {

    // If the Mutex is locked
    private locked: boolean = false;

    // Queue of waiting requests
    private readonly waitingQueue: Array<{
        resolve: () => void;
        reject: (error: Error) => void;
        timeout?: NodeJS.Timeout;
    }> = [];

    /**
     * Async locks this mutex
     *
     * @param timeoutMs Milliseconds before timing out (default 1000)
     */
    public async lock(timeoutMs: number = 1000): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            } else {
                // Create the entry object with proper typing from the start
                const entry: {
                    resolve: () => void;
                    reject: (error: Error) => void;
                    timeout?: NodeJS.Timeout;
                } = { resolve, reject };

                entry.timeout = setTimeout(() => {
                    const index: number = this.waitingQueue.indexOf(entry);
                    if (index !== -1) {
                        this.waitingQueue.splice(index, 1);
                        reject(new Error('Lock timeout'));
                    }
                }, timeoutMs);

                this.waitingQueue.push(entry);
            }
        });
    }

    /**
     * Releases mutex
     */
    public unlock(): void {
        if (this.waitingQueue.length > 0) {
            const next = this.waitingQueue.shift()!;
            clearTimeout(next.timeout);
            next.resolve();
        } else {
            this.locked = false;
        }
    }

    public isLocked(): boolean {
        return this.locked;
    }
}

export default Mutex;
