#!/usr/bin/env python3
"""Reproducible PCM-WAV quality checks for research stimulus audio."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO_ROOTS = [ROOT / "assets/audio/digits", ROOT / "assets/audio/osr"]
SILENCE_DBFS = -50.0
SILENCE_LINEAR = 32767 * (10 ** (SILENCE_DBFS / 20))


def dbfs(value: float) -> float | None:
    return round(20 * math.log10(value / 32767), 2) if value > 0 else None


def inspect(path: Path) -> dict:
    raw = path.read_bytes()
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        sample_rate = wav.getframerate()
        sample_width = wav.getsampwidth()
        frames = wav.getnframes()
        payload = wav.readframes(frames)

    if sample_width != 2:
        return {"path": str(path.relative_to(ROOT)), "status": "unsupported", "bits_per_sample": sample_width * 8}

    samples = struct.unpack("<" + "h" * (len(payload) // 2), payload)
    peak = max((abs(v) for v in samples), default=0)
    rms = math.sqrt(sum(v * v for v in samples) / len(samples)) if samples else 0
    mean = sum(samples) / len(samples) if samples else 0
    clipped = sum(1 for value in samples if abs(value) >= 32767)

    active_frames = []
    for frame in range(frames):
        offset = frame * channels
        if any(abs(samples[offset + channel]) > SILENCE_LINEAR for channel in range(channels)):
            active_frames.append(frame)
    first = active_frames[0] if active_frames else frames
    last = active_frames[-1] if active_frames else -1

    return {
        "path": str(path.relative_to(ROOT)),
        "status": "analyzed",
        "sha256": hashlib.sha256(raw).hexdigest(),
        "channels": channels,
        "sample_rate_hz": sample_rate,
        "bits_per_sample": sample_width * 8,
        "duration_s": round(frames / sample_rate, 3),
        "peak_dbfs": dbfs(peak),
        "rms_dbfs": dbfs(rms),
        "dc_offset_percent": round((mean / 32767) * 100, 4),
        "clipped_samples": clipped,
        "leading_silence_s": round(first / sample_rate, 3),
        "trailing_silence_s": round((frames - 1 - last) / sample_rate, 3) if last >= 0 else round(frames / sample_rate, 3),
        "silence_threshold_dbfs": SILENCE_DBFS,
    }


def validate(rows: list[dict]) -> list[str]:
    failures = []
    if len(rows) != 17:
        failures.append(f"expected 17 WAV files, found {len(rows)}")
    for row in rows:
        path = row["path"]
        if row.get("status") != "analyzed":
            failures.append(f"{path}: unsupported encoding")
            continue
        if (row["channels"], row["sample_rate_hz"], row["bits_per_sample"]) != (1, 48000, 16):
            failures.append(f"{path}: expected mono 48 kHz 16-bit PCM")
        if row["clipped_samples"]:
            failures.append(f"{path}: contains {row['clipped_samples']} clipped samples")
        if row["peak_dbfs"] is not None and row["peak_dbfs"] > -1:
            failures.append(f"{path}: peak headroom is below 1 dB")
        if abs(row["dc_offset_percent"]) > 0.5:
            failures.append(f"{path}: DC offset exceeds 0.5%")
        if row["leading_silence_s"] > 0.3 or row["trailing_silence_s"] > 0.3:
            failures.append(f"{path}: edge silence exceeds 300 ms")
        if "/digit_" in path and row["duration_s"] >= 0.95:
            failures.append(f"{path}: digit clip is too long for a 1-second onset schedule")

    digit_rms = [row["rms_dbfs"] for row in rows if "/digit_" in row["path"] and row.get("rms_dbfs") is not None]
    if digit_rms and max(digit_rms) - min(digit_rms) > 3:
        failures.append(f"digit RMS spread exceeds 3 dB ({max(digit_rms) - min(digit_rms):.2f} dB)")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    paths = sorted(path for root in AUDIO_ROOTS for path in root.glob("*.wav"))
    rows = [inspect(path) for path in paths]
    failures = validate(rows)
    report = {
        "method": "whole-file PCM peak/RMS, DC offset, exact clipping count, and -50 dBFS edge-silence scan",
        "limitations": ["RMS is not LUFS", "file QA does not establish perceptual intelligibility or cross-device equivalence"],
        "files_analyzed": len(rows),
        "check_failures": failures,
        "status": "pass" if not failures else "fail",
        "files": rows,
    }
    payload = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")
    if failures:
        print("\n".join(failures), file=sys.stderr)
    return 1 if args.check and failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
