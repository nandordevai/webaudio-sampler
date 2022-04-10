import { clamp } from './lib.js';
import { TrackView } from './TrackView.js';

export const Track = (num) => ({
    num,
    octave: null,
    note: null,
    name: null,
    path: null,
    midiCh: null,
    delay: 0.0,
    reverb: 0.0,
    gain: 1.0,
    buffer: null,
    filter: {
        freq: 20000,
        type: 'lp',
    },
    view: {...TrackView},

    setFX(fx, val = null) {
        if (val !== null) {
            this[fx] = clamp(val, 0, 1);
        } else {
            val = this[fx];
        }
        this.view.setFX(fx, val);
    },

    setFilter(freq = null, type = null) {
        if (freq !== null) this.filter.freq = clamp(freq, 20, 20000);
        if (type !== null) this.filter.type = type;
        this.view.updateFilterUI(this.filter);
    },

    setFXFromCC(cc, val) {
        const param = ['d', 'r', 'g', 'f'][Math.floor((cc - 64) / 4)];
        const value = param === 'f' ? val / 127 * 20000 : val / 127;
        this.setParam(param, value);
    },

    setParam(param, val) {
        const fx = ['delay', 'reverb', 'gain', 'filter'];
        const cfx = fx.find(_ => _[0] === param.toLowerCase());
        if (cfx === 'filter') {
            if (val.toString().slice(-1).toLowerCase() === 'k') {
                val = parseFloat(val.slice(0, -1)) * 1000;
            }
            if (['lp', 'hp', 'bp'].includes(val)) {
                this.setFilter(null, val);
            } else {
                this.setFilter(val);
            }
        } else {
            this.setFX(cfx, val);
        }
    },

    set playing(value) {
        this.view.bang(value);
    },
});
