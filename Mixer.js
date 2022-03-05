export const Mixer = {
    ctx: null,
    delay: null,

    init() {
        const out = this.ctx.destination;
        this.master = this.ctx.createGain();
        this.master.connect(out);

        this.delay = this.ctx.createDelay(1.0);
        const feedback = this.ctx.createGain();
        feedback.gain.value = .2;
        this.delay.connect(feedback);
        feedback.connect(this.delay);
        this.delay.connect(out);
        this.delay.delayTime.value = .125;
        this.delayBus = this.ctx.createGain();
        this.delayBus.connect(this.delay);
    },

    setDelayTime(t) {
        this.delay.delayTime.setValueAtTime(t, this.ctx.currentTime);
    },
};
