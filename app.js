// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
// https://github.com/GoogleChromeLabs/web-audio-samples

import { $ } from './lib.js';
import { Sampler } from './Sampler.js';
import { Mixer } from './Mixer.js';
import { MIDIClock } from './MIDIClock.js';

const samples = ['Kick.wav', 'Snare.wav', 'Closedhat.wav', 'Clap.wav'];
const ctx = new window.AudioContext();
const mixer = Object.assign(Object.create(Mixer), { ctx });
mixer.init();
const sampler = Object.assign(Object.create(Sampler), { ctx, mixer, });
sampler.init();
const clock = Object.create(MIDIClock);

async function loadSamples() {
    const urls = samples.map(_ => `./assets/samples/${_}`);
    for (const url of urls) {
        await sampler.loadSample(url);
    }
}

function onMidiMessage(event) {
    if (event.data[0] === 0xf8) {
        clock.tick();
    }
    const ch = event.data[0] & 0xf;
    if (ch !== sampler.midiCh) return;
        const trackNum = event.data[1] - 60;
        if (event.data[0] >> 4 === 9) {
            // TODO: make gain logarithmic
            sampler.play(trackNum, event.data[2] / 127);
        } else if (event.data[0] >> 4 === 8) {
        // note off
        } else if (event.data[0] >> 4 === 11) {
            sampler.setFXFromCC(event.data);
    }
}

function processCommand(event) {
    if (event.key !== 'Enter') return;
    const cmd = event.target.value;
    const ch = cmd[0];
    const param = cmd[1];
    let value = parseFloat(cmd.slice(2));
    if (isNaN(value)) {
        value = cmd.slice(2);
    }
    // FIXME: call sampler instead
    sampler.tracks[ch].setParam(param, value);
    event.target.value = '';

}

loadSamples();
$('.command__input').addEventListener('keydown', (event) => { processCommand(event); });

// TODO: switching between inputs (like in Orca)
navigator.requestMIDIAccess()
    .then((access) => {
        const inputs = access.inputs.values();
        for (const _ of inputs) {
            if (_.name === 'IAC Driver Bus 1') {
                _.onmidimessage = onMidiMessage;
            }
        }
    });

setInterval(() => {
    $('.bpm__value').innerText = clock.bpm();
}, 1000);
