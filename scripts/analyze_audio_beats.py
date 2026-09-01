"""Estimate a playable beat grid from an audio or video file.

Requires FFmpeg on PATH and NumPy. The script decodes media to mono PCM,
builds a spectral-flux onset envelope, estimates tempo by autocorrelation,
and aligns a constant beat grid to the strongest onsets.
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

import numpy as np


SAMPLE_RATE = 22_050
FRAME_SIZE = 2_048
HOP_SIZE = 256


def decode_audio(path: Path, duration: float) -> np.ndarray:
    command = [
        "ffmpeg",
        "-v",
        "error",
        "-i",
        str(path),
        "-t",
        str(duration),
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        "-f",
        "f32le",
        "pipe:1",
    ]
    result = subprocess.run(command, check=True, stdout=subprocess.PIPE)
    return np.frombuffer(result.stdout, dtype="<f4")


def onset_envelope(samples: np.ndarray) -> np.ndarray:
    if samples.size < FRAME_SIZE:
        raise ValueError("Audio is too short to analyze")

    frame_count = 1 + (samples.size - FRAME_SIZE) // HOP_SIZE
    frames = np.lib.stride_tricks.sliding_window_view(samples, FRAME_SIZE)[
        ::HOP_SIZE
    ][:frame_count]
    windowed = frames * np.hanning(FRAME_SIZE)
    spectrum = np.log1p(np.abs(np.fft.rfft(windowed, axis=1)))
    flux = np.maximum(0.0, np.diff(spectrum, axis=0)).sum(axis=1)
    flux = np.pad(flux, (1, 0))
    flux -= np.median(flux)
    flux = np.maximum(flux, 0.0)
    flux = np.convolve(flux, np.ones(3) / 3, mode="same")
    scale = np.percentile(flux, 95)
    return flux / scale if scale > 0 else flux


def tempo_candidates(envelope: np.ndarray, min_bpm: float, max_bpm: float):
    frames_per_second = SAMPLE_RATE / HOP_SIZE
    min_lag = int(round(frames_per_second * 60 / max_bpm))
    max_lag = int(round(frames_per_second * 60 / min_bpm))
    centered = envelope - envelope.mean()
    scores = []
    for lag in range(min_lag, max_lag + 1):
        left = centered[:-lag]
        right = centered[lag:]
        denominator = np.linalg.norm(left) * np.linalg.norm(right)
        score = float(np.dot(left, right) / denominator) if denominator else 0.0
        scores.append((score, lag, frames_per_second * 60 / lag))
    scores.sort(reverse=True)

    selected = []
    for score, lag, bpm in scores:
        if all(abs(bpm - item[2]) >= 1.0 for item in selected):
            selected.append((score, lag, bpm))
        if len(selected) == 5:
            break
    return selected


def aligned_beats(envelope: np.ndarray, lag: int, duration: float):
    phase_scores = []
    for phase in range(lag):
        phase_scores.append(float(envelope[phase::lag].sum()))
    phase = int(np.argmax(phase_scores))

    beats = []
    search_radius = max(2, int(round(lag * 0.12)))
    for expected in range(phase, envelope.size, lag):
        start = max(0, expected - search_radius)
        end = min(envelope.size, expected + search_radius + 1)
        local = start + int(np.argmax(envelope[start:end]))
        timestamp = local * HOP_SIZE / SAMPLE_RATE
        if 0.25 <= timestamp <= duration:
            beats.append((timestamp, float(envelope[local])))
    return beats


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("media", type=Path)
    parser.add_argument("--duration", type=float, default=60.0)
    parser.add_argument("--min-bpm", type=float, default=45.0)
    parser.add_argument("--max-bpm", type=float, default=100.0)
    args = parser.parse_args()

    samples = decode_audio(args.media, args.duration)
    envelope = onset_envelope(samples)
    candidates = tempo_candidates(envelope, args.min_bpm, args.max_bpm)
    best_score, best_lag, best_bpm = candidates[0]
    beats = aligned_beats(envelope, best_lag, args.duration)

    print(f"analyzed_seconds={samples.size / SAMPLE_RATE:.3f}")
    print("tempo_candidates=" + ", ".join(
        f"{bpm:.3f} BPM (score {score:.3f})" for score, _, bpm in candidates
    ))
    print(f"selected_bpm={best_bpm:.3f}")
    print("beat_times=[")
    for index in range(0, len(beats), 8):
        row = ", ".join(f"{time:.3f}" for time, _ in beats[index:index + 8])
        print(f"    {row},")
    print("]")
    print("onset_strengths=[")
    for index in range(0, len(beats), 8):
        row = ", ".join(f"{strength:.2f}" for _, strength in beats[index:index + 8])
        print(f"    {row},")
    print("]")


if __name__ == "__main__":
    main()
