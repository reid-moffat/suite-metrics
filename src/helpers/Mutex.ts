class Mutex {

    private locked: boolean = false;

    private waitingQueue: (() => void)[] = [];

    public async lock(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            } else {
                this.waitingQueue.push(resolve);
            }
        });
    }

    public unlock(): void {
        if (this.waitingQueue.length > 0) {
            const next = this.waitingQueue.shift()!;
            next();
        } else {
            this.locked = false;
        }
    }
}

export default Mutex;
