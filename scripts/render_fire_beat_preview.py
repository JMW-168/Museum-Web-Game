"""Render the Station 1 beat schedule as clicks over the game music."""

from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np


SAMPLE_RATE = 44_100


def read_beat_times(source: Path) -> list[float]:
    text = source.read_text(encoding="utf-8")
    match = re.search(r"fireBeatTimes:\s*\[(.*?)\]\s*,", text, re.DOTALL)
    if not match:
        raise ValueError(f"fireBeatTimes not found in {source}")
    return [float(value) for value in re.findall(r"\d+\.\d+", match.group(1))]


def write_click_track(path: Path, beats: list[float], duration: float) -> None:
    samples = np.zeros(round(duration * SAMPLE_RATE), dtype=np.float32)
    click_length = round(0.045 * SAMPLE_RATE)
    click_time = np.arange(click_length) / SAMPLE_RATE
    click = np.sin(2 * np.pi * 1_650 * click_time) * np.exp(-click_time * 75)

    for beat in beats:
        start = round(beat * SAMPLE_RATE)
        end = min(samples.size, start + click.size)
        if start < samples.size:
            samples[start:end] += click[: end - start]

    pcm = np.clip(samples * 0.82, -1, 1)
    pcm = (pcm * 32_767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("js/minigames/StationDemoGame.js"))
    parser.add_argument("--music", type=Path, default=Path("assets/sounds/station-fire-theme.mp3"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--duration", type=float, default=60.0)
    parser.add_argument("--music-volume", type=float, default=0.2)
    args = parser.parse_args()

    beats = read_beat_times(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="museum-fire-beats-") as temp_dir:
        click_track = Path(temp_dir) / "clicks.wav"
        write_click_track(click_track, beats, args.duration)
        filter_graph = (
            f"[0:a]atrim=0:{args.duration},volume={args.music_volume}[music];"
            "[1:a]volume=0.8[clicks];"
            "[music][clicks]amix=inputs=2:duration=first:normalize=0[out]"
        )
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-v",
                "error",
                "-i",
                str(args.music),
                "-i",
                str(click_track),
                "-filter_complex",
                filter_graph,
                "-map",
                "[out]",
                "-c:a",
                "libmp3lame",
                "-b:a",
                "192k",
                str(args.output),
            ],
            check=True,
        )

    print(f"beats={len(beats)}")
    print(f"preview={args.output.resolve()}")


if __name__ == "__main__":
    main()
