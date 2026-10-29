export type SpeakerId = string | number | null;

export type TranscriptWord = {
  word: string;
  /** Seconds from the start of the audio. */
  start: number;
  end: number;
  speaker?: SpeakerId;
};

/** Normalized result object. Every on-screen figure and word comes from here. */
export type DemoResult = {
  title: string;
  model: string;
  request_seconds: number;
  audio_duration_seconds: number;
  words: TranscriptWord[];
  /**
   * Demo WAV. Either a URL, or a path relative to video/public (e.g. "demo.wav").
   * Browsers cannot read arbitrary filesystem paths, so copy the file into video/public.
   */
  demo_wav_path: string;
  /** Set only by the development placeholder. Real results must omit it. */
  is_placeholder?: boolean;
};
