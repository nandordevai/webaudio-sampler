import { Reverb } from './Reverb.js';

export const Mixer = {
    ctx: null,
    delay: null,
    reverb: null,

    init() {
        const out = this.ctx.destination;

        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-50, this.ctx.currentTime);
        comp.knee.setValueAtTime(40, this.ctx.currentTime);
        comp.ratio.setValueAtTime(12, this.ctx.currentTime);
        comp.attack.setValueAtTime(0, this.ctx.currentTime);
        comp.release.setValueAtTime(0.25, this.ctx.currentTime);
        comp.connect(out);

        this.master = this.ctx.createGain();
        this.master.connect(comp);

        this.delay = this.ctx.createDelay(1.0);
        const feedback = this.ctx.createGain();
        feedback.gain.value = .2;
        this.delay.connect(feedback);
        feedback.connect(this.delay);
        this.delay.connect(this.master);
        this.delay.delayTime.value = .125;
        this.delayBus = this.ctx.createGain();
        this.delayBus.connect(this.delay);

        this.reverbBus = this.ctx.createGain();
        this.reverb = Reverb(this.ctx);
        this.reverbBus.connect(this.reverb);
        this.reverb.connect(this.master);
    },

    set delayTime(t) {
        this.delay.delayTime.setValueAtTime(t, this.ctx.currentTime);
    },
};
