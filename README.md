Basic sampler implemented with Electron & WebAudio API

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

Sample list is fixed for now, can be rewritten in `app.js`. Parameters for delay and reverb are fixed too, might be configurable later.

## MIDI

Input device can be selected with Cmd-. on Mac, Ctrl-. on Windows. Clock syncs automatically, delay time also synced to clock.

Effect parameters can be set with CC messages. CC starts with 64 for track 0 delay and increases by one for every effect on the track. Next track starts with 68 for delay etc.
