const fxWidth = 37;
const fxHeight = 10;

export const TrackView = {
    num: null,
    el: null,

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
                <span class="sample__remove">rem</span>
            </div>
        `);
        return this.el;
    },

    setFX(fx, val = null) {
        const el = this.el.querySelector(`.sample__${fx}`);
        this.updateFXUI(el, val);
        el.style.background = `
            linear-gradient(to right, var(--ui-light) 0%,
                var(--ui-light) ${val * 100}%,
                var(--ui-dark) ${val * 100}%)
        `;
    },

    updateFilterUI() {
        const oldEl = this.el.querySelector('.filter-curve');
        if (oldEl !== null) this.el.querySelector('svg').removeChild(oldEl);
        const ns = 'http://www.w3.org/2000/svg';
        const path = document.createElementNS(ns, 'path');
        const curves = {
            lowpass: (f) => `M 0 1 L ${f - 5} 1 Q ${f} 1 ${f} 10`,
            highpass: (f) => `M ${fxWidth} 1 L ${f + 5} 1 Q ${f} 1 ${f} 10`,
            bandpass: (f) => `M ${f} 1 Q ${f + 5} 1 ${f + 5} 10 M ${f} 1 Q ${f - 5} 1 ${f - 5} 10`,
        };
        // log scale magic formula
        const f = ((fxWidth - 1 + 10) / 4.4) * Math.log10(this.filter.freq) - 10;
        const curve = curves[this.filter.type](f);
        path.setAttribute('d', curve);
        path.setAttribute('class', 'filter-curve');
        this.el.querySelector('svg').appendChild(path);
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
