export function MIDIMessage(event) {
    // if (event.data[0] >> 4 === 9) {
    //     // TODO: make gain logarithmic
    //     sampler.play(trackNum, event.data[2] / 127);
    // } else if (event.data[0] >> 4 === 8) {
    // // note off
    // } else if (event.data[0] >> 4 === 11) {
    //     // handle CC
    //     const i = (event.data[1] - 64) % this.tracks.length;
    // }
    let ch = null;
    let type = null;
    let note = null;
    let vel = null;
    let cc = null;
    let val = null;
    if (event.data[0] === 0xf8) {
        type = 'clock';
    } else {
        ch = event.data[0] & 0xf;
        const tb = event.data[0] >> 4;
        if (tb === 9) {
            type = 'noteOn';
            note = event.data[1];
            vel = event.data[2];
        } else if (tb === 8) {
            type = 'noteOff';
            note = event.data[1];
        } else if (tb === 1) {
            type = 'cc';
            cc = event.data[1];
            val = event.data[2];
        }
    }
    return {
        ch,
        type,
        note,
        vel,
        cc,
        val,
    };
}
