// Enable Immer's Map & Set support before any code runs
import { enableMapSet } from 'immer';
enableMapSet();

import SuiteMetrics from "./metrics/SuiteMetrics.ts";
import ConcurrentSuiteMetrics from "./metrics/ConcurrentSuiteMetrics.ts";
import BaseSuiteMetrics from "./metrics/BaseSuiteMetrics.ts";
import { SuiteTestMetrics, SuiteData, StructureMetadata } from "./types/returnTypes.ts";
import { Suite, Test } from "./types/structures.ts";

export default SuiteMetrics;
export { ConcurrentSuiteMetrics, BaseSuiteMetrics };
export type { Suite, Test, SuiteTestMetrics, SuiteData, StructureMetadata };
