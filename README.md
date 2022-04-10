Basic sampler implemented with Electron & WebAudio API

## Samples

Drag and drop samples on window to load. There are no configurable parameters for the samples for now (ie. no pitch or length change etc.) Files are loaded with [`decodeAudioData()`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) so they will be resampled to the `AudioContext`'s sample rate (if different).

The sampler saves the current sample list and track settings to local storage and it tries to load them again on next start. Currently there isn’t any error checking. Saving and loading kits will probably be implemented.

## Commands

The format is `<track><command>[<value>]`.

The `track` is an integer from 0 to the maximum track number.

The `command` is one of:
- `d`: delay
- `r`: reverb
- `g`: gain
- `f`: filter
- `x`: delete track

The `value` can be a float from 0 to 1 for delay, reverb and gain. For filter, it’s either the type of the filter (`lp`, `bp`, or `hp`) or the frequency. The latter can be given as an integer from 20 to 20,000 or an integer or a float with the letter `k` appended (eg. `3.2k`, `12k`). There's no value for the delete track command, obviously.

Examples:

- `0g0.75` sets the gain (volume) on the first track to 0.75
- `1d.5` sets the delay send on track #1 to 50% wet
- `2fhp` sets the filter on the third track to high pass
- `3f3000` sets the filter frequency on track #3 to 3,000 Hz
- `4f5.5k` sets the filter frequency on track #4 to 5,500 Hz
- `2x` deletes the third track

Parameters for delay and reverb are fixed, might be configurable later.

## MIDI

Input device can be selected with Cmd-. on Mac, Ctrl-. on Windows. Clock syncs automatically, delay time also synced to clock.

Effect parameters can be set with CC messages. CC starts with 64 for track 0 delay and increases by one for every effect on the track. Next track starts with 68 for delay etc.
