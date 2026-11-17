'use client';
// Tone.js powered audio playback for ear-training cards.
import * as Tone from 'tone';

let synthSingle: Tone.Synth | null = null;
let synthPoly: Tone.PolySynth | null = null;

async function ensure() {
  await Tone.start();
  if (!synthSingle) synthSingle = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  if (!synthPoly) synthPoly = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' } }).toDestination();
}

const midiToName = (m: number) => Tone.Frequency(m, 'midi').toNote();

export async function playInterval(semitones: number, root = 60) {
  await ensure();
  const now = Tone.now();
  const notes = [midiToName(root), midiToName(root + semitones)];
  synthSingle!.triggerAttackRelease(notes[0], '0.5', now);
  synthSingle!.triggerAttackRelease(notes[1], '0.5', now + 0.6);
}

export async function playMode(intervals: number[], root = 60) {
  await ensure();
  const now = Tone.now();
  intervals.forEach((iv, i) => {
    synthSingle!.triggerAttackRelease(midiToName(root + iv), '0.35', now + i * 0.4);
  });
}

export async function playTexture(voces: any[]) {
  await ensure();
  const now = Tone.now();
  for (const v of voces) {
    const delay = (v.delay ?? 0) as number;
    if (v.pattern === 'melody') {
      (v.notes as number[]).forEach((n, i) => {
        synthSingle!.triggerAttackRelease(midiToName(n), '0.45', now + delay + i * 0.5);
      });
    } else if (v.pattern === 'chords') {
      (v.notes as number[][]).forEach((chord, i) => {
        synthPoly!.triggerAttackRelease(chord.map(midiToName), '0.5', now + delay + i * 0.5);
      });
    } else if (v.pattern === 'arpeggio') {
      const n = v.notes as number[];
      // Repeat pattern
      for (let rep = 0; rep < 5; rep++) {
        n.forEach((note, i) => {
          synthSingle!.triggerAttackRelease(midiToName(note), '0.2', now + delay + rep * (n.length * 0.2) + i * 0.2);
        });
      }
    }
  }
}

export async function playAudioCard(type: string, metadata: any) {
  if (!metadata) return;
  if (type === 'audio_interval') return playInterval(metadata.semitonos ?? metadata.semitones ?? 0);
  if (type === 'audio_mode') return playMode(metadata.intervals ?? []);
  if (type === 'audio_texture') return playTexture(metadata.voces ?? []);
}
