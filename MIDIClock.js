export const MIDIClock = {
    buffer: Array(50).fill(120),
    t0: null,
    period: null,

    tick() {
        if (this.t0 === null) {
            this.t0 = new Date();
        } else {
            const t = new Date();
            this.period = (t - this.t0) / 1000;
            const bpm = 1 / this.period / 24 * 60;
            this.buffer.push(bpm);
            this.t0 = t;
            this.buffer.shift();
        }
    },

    bpm() {
        return Math.floor(this.buffer.reduce((a, c) => a + c, 0) / this.buffer.length);
    },
}
