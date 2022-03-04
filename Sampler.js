import { $ } from './lib.js';
import { Track } from './Track.js';

export const Sampler = {
    tracks: [],
    midiCh: 1,
    noteNames: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    ctx: null,
    mixer: null,

    init() {
        this.noteGenerator = this.notes();
    },

    *notes() {
        let i = 0;
        let octave = 3;
        while (true) {
            if (i > 0 && i % 12 === 0);
            const note = this.noteNames[i % 12];
            i++;
            yield [octave, note];
        }
    },

    addTrack(name, buffer) {
        const [octave, note] = this.noteGenerator.next().value;
        const track = Object.assign(Object.create(Track), {
            num: this.tracks.length,
            octave,
            note,
            name,
            midiCh: this.midiCh,
            buffer
        });
        $('.sample__list').appendChild(track.render());
        track.setFX('delay');
        track.setFX('reverb');
        track.setFX('gain');
        track.setFilter();
        this.tracks.push(track);
    },

    play(note, velocity) {
        const trackNum = note - 60;
        const t = this.tracks[trackNum];
        const bufSrc = this.ctx.createBufferSource();
        bufSrc.buffer = t.buffer;

        const trackOut = this.ctx.createGain();
        trackOut.gain.setValueAtTime(velocity * t.gain,
            this.ctx.currentTime);
        trackOut.connect(this.mixer.master);

        const sendDelay = this.ctx.createGain();
        bufSrc.connect(sendDelay);
        sendDelay.gain.setValueAtTime(t.delay, this.ctx.currentTime);
        sendDelay.connect(this.mixer.delayBus);

        const filter = this.ctx.createBiquadFilter();
        filter.type = t.filter.type;
        filter.frequency.setValueAtTime(t.filter.freq, this.ctx.currentTime);
        bufSrc.connect(filter);
        filter.connect(trackOut);

        bufSrc.start(0);
        t.setPlaying(true);
        bufSrc.addEventListener('ended', (_event) => {
            t.setPlaying(false);
        });
    },

    async loadSample(path) {
        await fetch(path)
            .then(res => res.arrayBuffer())
            .then(aBuf => this.ctx.decodeAudioData(aBuf))
            .then((buffer) => {
                const name = path.split('/').slice(-1)[0].split('.')[0];
                this.addTrack(name, buffer);
            });
    },

    setTrackParam(n, param, value) {
        this.tracks[n].setParam(param, value);
    },

    handleCC(cc, val) {
        const t = Math.floor((cc - 64) / this.tracks.length);
        this.tracks[t].setFXFromCC(cc, val);
    },
};
