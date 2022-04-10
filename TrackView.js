const fxWidth = getComputedStyle(document.documentElement).getPropertyValue('--fx-width-raw');
const fxHeight = 10;

export const TrackView = {
    el: null,

    startPlaying() {
        this.el.querySelector('.track__bang').classList.add('track__bang--active');
    },

    stopPlaying() {
        this.el.querySelector('.track__bang').classList.remove('track__bang--active');
    },

    render(target, track) {
        const t = document.createElement('template');
        t.innerHTML = `
            <div class="track">
                <span class="track__num">${track.num}</span>
                <span class="track__bang">*</span>
                <span class="track__channel">${track.midiCh}</span>
                <span class="track__octave">${track.octave}</span>
                <span class="track__note">${track.note}</span>
                <span class="track__file">${track.name}</span>
                <span class="track__delay track__send"></span>
                <span class="track__reverb track__send"></span>
                <span class="track__gain track__send"></span>
                <span class="track__filter">
                    <svg class="track__filter-vis"
                    width="${fxWidth}" height="${fxHeight}"></svg>
                </span>
            </div>
        `;
        this.el = t.content.firstElementChild.cloneNode(true);
        target.appendChild(this.el);
    },

    setFX(fx, val = null) {
        const el = this.el.querySelector(`.track__${fx}`);
        el.style.background = `
            linear-gradient(to right, var(--ui-light) 0%,
                var(--ui-light) ${val * 100}%,
                var(--ui-dark) ${val * 100}%)
        `;
    },

    updateFilterUI(filter) {
        const oldEl = this.el.querySelector('.filter-curve');
        if (oldEl !== null) this.el.querySelector('svg').removeChild(oldEl);
        const ns = 'http://www.w3.org/2000/svg';
        const path = document.createElementNS(ns, 'path');
        const curves = {
            lp: (f) => `M 0 1 L ${f - 5} 1 Q ${f} 1 ${f} 10`,
            hp: (f) => `M ${fxWidth} 1 L ${f + 5} 1 Q ${f} 1 ${f} 10`,
            bp: (f) => `M ${f} 1 Q ${f + 5} 1 ${f + 5} 10 M ${f} 1 Q ${f - 5} 1 ${f - 5} 10`,
        };
        // log scale magic formula
        const f = ((fxWidth - 1 + 10) / 4.4) * Math.log10(filter.freq) - 10;
        const curve = curves[filter.type](f);
        path.setAttribute('d', curve);
        path.setAttribute('class', 'filter-curve');
        this.el.querySelector('svg').appendChild(path);
    },

    setNumber(n) {
        this.el.querySelector('.track__num').innerHTML = n;
    },

    bang(status) {
        const el = this.el.querySelector('.track__bang');
        const c = 'track__bang--active';
        if (status) {
            el.classList.add(c);
        } else {
            el.classList.remove(c);
        }
    },
};
