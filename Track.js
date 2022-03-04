import { clamp } from './lib.js';

const fxWidth = 37;
const fxHeight = 10;

export const Track = {
    num: null,
    octave: null,
    note: null,
    name: null,
    midiCh: null,
    delay: 0.0,
    reverb: 0.0,
    gain: 1.0,
    filter: {
        freq: 20000,
        type: 'lowpass',
    },
    el: null,
    buffer: null,

    createEl(html) {
        const t = document.createElement('template');
        t.innerHTML = html;
        return t.content.firstElementChild.cloneNode(true);
    },

    render() {
        this.el = this.createEl(`
            <div class="sample">
                <span class="sample__num">${this.num}</span>
                <span class="sample__bang">*</span>
                <span class="sample__channel">${this.midiCh}</span>
                <span class="sample__octave">${this.octave}</span>
                <span class="sample__note">${this.note}</span>
                <span class="sample__file">${this.name}</span>
                <span class="sample__delay sample__send"></span>
                <span class="sample__reverb sample__send"></span>
                <span class="sample__gain sample__send"></span>
                <span class="sample__filter">
                    <svg class="sample__filter-vis"
                    width="${fxWidth}" height="${fxHeight}"></svg>
                </span>
            </div>
        `);
        return this.el;
    },

    setFX(fx, val = null) {
        if (val !== null) {
            this[fx] = clamp(val, 0, 1);
        } else {
            val = this[fx];
        }
        const el = this.el.querySelector(`.sample__${fx}`);
        this.updateFXUI(el, val);
    },

    updateFXUI(el, val) {
        el.style.background = `
            linear-gradient(to right, var(--ui-light) 0%,
                var(--ui-light) ${val * 100}%,
                var(--ui-dark) ${val * 100}%)
        `;
    },

    setFilter(freq = null, type = null) {
        const fTypes = {
            lp: 'lowpass',
            hp: 'highpass',
            bp: 'bandpass',
        };
        if (freq !== null) this.filter.freq = clamp(freq, 0, 20000);
        if (type !== null) this.filter.type = fTypes[type];
        this.updateFilterUI();
    },

    updateFilterUI() {
        // TODO: draw bandpass filter with the midpoint at freq
        const oldEl = this.el.querySelector('.filter-curve');
        if (oldEl !== null) this.el.querySelector('svg').removeChild(oldEl);
        const ns = 'http://www.w3.org/2000/svg';
        const path = document.createElementNS(ns, 'path');
        const curves = {
            lowpass: (f) => `M 0 1 L ${f - 5} 1 Q ${f} 1 ${f} 10`,
            highpass: (f) => `M ${fxWidth} 1 L ${f + 5} 1 Q ${f} 1 ${f} 10`,
            bandpass: (f) => `M ${f - 5} 1 Q ${f} 1 ${f} 10 M ${f - 5} 1 Q ${f - 10} 1 ${f - 10} 10`,
        };
        const f = ((fxWidth - 1) / 20000) * this.filter.freq;
        const curve = curves[this.filter.type](f);
        path.setAttribute('d', curve);
        path.setAttribute('class', 'filter-curve');
        this.el.querySelector('svg').appendChild(path);
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
            if (['lp', 'hp', 'bp'].includes(val)) {
                this.setFilter(null, val);
            } else {
                this.setFilter(val);
            }
        } else {
            this.setFX(cfx, val);
        }
    },

    setPlaying(status) {
        const el = this.el.querySelector('.sample__bang');
        const c = 'sample__bang--active';
        if (status) {
            el.classList.add(c);
        } else {
            el.classList.remove(c);
        }
    },
};
