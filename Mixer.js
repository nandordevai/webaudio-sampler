export const Mixer = {
    ctx: null,

    init() {
        const out = this.ctx.destination;
        this.master = this.ctx.createGain();
        this.master.connect(out);

        // TODO: set delay time from MIDI clock
        const delay = this.ctx.createDelay(5.0);
        const delayFeedback = this.ctx.createGain();
        delayFeedback.gain.value = .2;
        delay.connect(delayFeedback);
        delayFeedback.connect(delay);
        delay.connect(out);
        delay.delayTime.value = .125;
        this.delayBus = this.ctx.createGain();
        this.delayBus.connect(delay);
    },
};
