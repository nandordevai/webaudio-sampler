Basic sampler implemented with Electron & WebAudio API

## Samples

Drag and drop samples on window to load. There are no configurable parameters for the samples for now (ie. no pitch or length change etc.) Files are loaded with [`decodeAudioData()`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) so they will be resampled to the `AudioContext`'s sample rate (if different).

## Commands

The format is `<track> <command> <value>` where `command` is one of:
- `d`: delay
- `r`: reverb
- `g`: gain
- `f`: filter

and value is either a number from 0 to 1 or the type of the filter (`lp`, `bp`, or `hp`).

Examples:

- `1d.5` sets the delay send on track #1 to 50% wet
- `2fhp` sets the filter on the third track to high pass
- `3f3000` sets the filter frequency on track #3 to 3,000 Hz

Parameters for delay and reverb are fixed, might be configurable later.

## MIDI

Input device can be selected with Cmd-. on Mac, Ctrl-. on Windows. Clock syncs automatically, delay time also synced to clock.

Effect parameters can be set with CC messages. CC starts with 64 for track 0 delay and increases by one for every effect on the track. Next track starts with 68 for delay etc.
