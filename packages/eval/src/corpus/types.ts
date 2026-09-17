/** A value the scanner is expected to find, and which detector should find it. */
export interface Expectation {
  readonly detectorId: string;
  /** The literal text, located in the sample at evaluation time. */
  readonly value: string;
}

export interface Sample {
  readonly id: string;
  readonly text: string;
  /** Empty for a negative sample: anything reported is a false positive. */
  readonly expected: readonly Expectation[];
  /** Why this sample is in the corpus, if it isn't obvious. */
  readonly note?: string;
}
