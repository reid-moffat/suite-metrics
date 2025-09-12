/**
 *
 */
abstract class Cache {

    private lastRebuildTestCount: number = 0;

    protected constructor() {}

    protected isValid(): boolean {
        // TODO: compare to total test count
        return true;
    }
}

export default Cache;
