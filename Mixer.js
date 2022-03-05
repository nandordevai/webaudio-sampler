export const Mixer = {
    ctx: null,
    delay: null,

    init() {
        const out = this.ctx.destination;
        this.master = this.ctx.createGain();
        this.master.connect(out);

        // TODO: set delay time from MIDI clock
        this.delay = this.ctx.createDelay(5.0);
        const delayFeedback = this.ctx.createGain();
        delayFeedback.gain.value = .2;
        this.delay.connect(delayFeedback);
        delayFeedback.connect(this.delay);
        this.delay.connect(out);
        this.delay.delayTime.value = .125;
        this.delayBus = this.ctx.createGain();
        this.delayBus.connect(this.delay);
    },

    setDelayTime(t) {
        this.delay.delayTime.setValueAtTime(t, this.ctx.currentTime);
    },
};
