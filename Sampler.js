import { $ } from './lib.js';
import { Track } from './Track.js';

export const Sampler = {
    tracks: [],
    midiCh: 0,
    noteNames: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    ctx: null,
    mixer: null,
    playingBufs: [],

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

    addTrack(path, name, buffer) {
        const [octave, note] = this.noteGenerator.next().value;
        const track = {...Track,
            num: this.tracks.length,
            octave,
            note,
            path,
            name,
            midiCh: this.midiCh,
            buffer
        };
        track.init();
        const el = track.render();
        $('.sample__list').appendChild(el);
        el.querySelector('.sample__remove').addEventListener('click', () => { this.removeTrack(track); });
        track.setFX('delay');
        track.setFX('reverb');
        track.setFX('gain');
        track.setFilter();
        this.tracks.push(track);
        return track;
    },

    removeTrack(track) {
        this.tracks.splice(track.num, 1);
        for (let [i, _] of this.tracks.entries()) {
            _.num = i;
            _.el.querySelector('.sample__num').innerText = i;
        }
        track.el.remove();
        localStorage.samples = JSON.stringify(this.tracks.map(_ => _.path));
    },

    play(note, velocity) {
        // TODO: velocity curve
        const trackNum = note - 60;
        const t = this.tracks[trackNum];
        const bufSrc = this.ctx.createBufferSource();
        bufSrc.buffer = t.buffer;

        const trackOut = this.ctx.createGain();
        trackOut.gain.setValueAtTime(velocity * t.gain, this.ctx.currentTime);
        trackOut.connect(this.mixer.master);

        const filter = this.ctx.createBiquadFilter();
        filter.type = t.filter.type;
        filter.frequency.setValueAtTime(t.filter.freq, this.ctx.currentTime);
        bufSrc.connect(filter);
        filter.connect(trackOut);

        const sendDelay = this.ctx.createGain();
        filter.connect(sendDelay);
        sendDelay.gain.setValueAtTime(t.gain * t.delay, this.ctx.currentTime);
        sendDelay.connect(this.mixer.delayBus);

        const sendReverb = this.ctx.createGain();
        filter.connect(sendReverb);
        sendReverb.gain.setValueAtTime(t.gain * t.reverb, this.ctx.currentTime);
        sendReverb.connect(this.mixer.reverbBus);

        bufSrc.start(0);
        this.playingBufs.push(bufSrc);
        t.setPlaying(true);
        bufSrc.addEventListener('ended', (_event) => {
            this.playingBufs = this.playingBufs.filter(_ => _ !== bufSrc);
            t.setPlaying(false);
        });
    },

    async loadSample(path) {
        let track = null;
        await fetch(path)
            .then(res => res.arrayBuffer())
            .then(aBuf => this.ctx.decodeAudioData(aBuf))
            .then((buffer) => {
                const name = path.split('/').slice(-1)[0].split('.')[0];
                track = this.addTrack(path, name, buffer);
            });
        return track.note;
    },

    setTrackParam(n, param, value) {
        this.tracks[n].setParam(param, value);
    },

    allNoteOff() {
        // TODO: cut off delay
        for (const _ of this.playingBufs) {
            _.stop();
        }
    },

    handleCC(cc, val) {
        if (cc === 123 && val === 0) {
            this.allNoteOff();
        } else {
            const t = Math.floor((cc - 64) / this.tracks.length);
            this.tracks[t].setFXFromCC(cc, val);
        }
    },
};
