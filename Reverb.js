export function Reverb(ctx) {
    const length = ctx.sampleRate * 1;
    const decay = 1;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
};
