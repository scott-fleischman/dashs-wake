import { analyzeAudio, type Intensity } from "./audio-analyzer";

export interface AnalyzedAudio {
  beatIntensities: readonly Intensity[];
  beats: readonly number[];
  durationMs: number;
}

export function analyzeSamples(
  samples: Float32Array,
  sampleRateHz: number,
): AnalyzedAudio {
  const analysis = analyzeAudio({ sampleRateHz, samples });
  return {
    beatIntensities: analysis.beats.map((beat) => beat.intensity),
    beats: analysis.beats.map((beat) => beat.ms),
    durationMs: analysis.durationMs,
  };
}

interface AudioContextConstructor {
  new (): AudioContext;
}

function findAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
}

export async function analyzeAudioFile(
  file: Blob,
): Promise<AnalyzedAudio | null> {
  const AudioCtor = findAudioContextConstructor();
  if (!AudioCtor) {
    return null;
  }
  let ctx: AudioContext | undefined;
  try {
    const arrayBuffer = await file.arrayBuffer();
    ctx = new AudioCtor();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return analyzeSamples(
      audioBuffer.getChannelData(0),
      audioBuffer.sampleRate,
    );
  } catch {
    return null;
  } finally {
    if (ctx) {
      await ctx.close().catch(() => undefined);
    }
  }
}
