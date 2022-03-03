// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
// https://github.com/GoogleChromeLabs/web-audio-samples

import { $, $$ } from './lib.js';
import { Track } from './Track.js';
import { fxWidth, fxHeight } from './settings.js';

const logLevels = {
    info: 0,
    warning: 1,
    error: 2,
};
const currentLogLevel = 2;
let buffers = [];
const samples = ['Kick.wav', 'Snare.wav', 'Closedhat.wav', 'Clap.wav'];
const channels = [];
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ctx = new window.AudioContext();
const out = ctx.destination;
const masterGain = ctx.createGain();
const delay = ctx.createDelay(5.0);
const delayFeedback = ctx.createGain();
const delayBusGain = ctx.createGain();
delayFeedback.gain.value = .2;
delay.connect(delayFeedback);
delayFeedback.connect(delay);
masterGain.connect(out);
delay.connect(out);
delay.delayTime.value = .125;
delayBusGain.connect(delay);
const noteGenerator = notes();

function loadChannel(i) {
    const el = document.createElement('div');
    el.classList.add('sample');
    const [octave, note] = noteGenerator.next().value;
    const name = samples[i].split('.').slice(0, -1).join('.');
    const ch = Object.assign(Object.create(Track), {
        num: i,
        octave,
        note,
        name,
        midiCh: 1,
    });
    $('.sample__list').appendChild(ch.render());
    ch.setFX('delay');
    ch.setFX('reverb');
    ch.setFX('gain');
    ch.setFilter();
    channels.push(ch);
}

async function loadSamples() {
    const urls = samples.map(_ => `./assets/samples/${_}`);
    const res = await Promise.all(urls.map(_ => fetch(_)));
    const aBufs = await Promise.all(res.map(_ => _.arrayBuffer()));
    buffers = await Promise.all(aBufs.map((_, i) => {
        // log(lvl.info, `${samples[i]} loaded`);
        loadChannel(i);
        return ctx.decodeAudioData(_);
    }));
}

function log(level, msg) {
    if (level < currentLogLevel) return;
    const el = $('.log');
    el.innerText += `${msg}\n`;
    el.scrollTop = el.scrollHeight;
}

function* notes() {
    let i = 0;
    let octave = 3;
    while (true) {
        if (i > 0 && i % 12 === 0);
        const note = noteNames[i % 12];
        i++;
        yield [octave, note];
    }
}

function onMidiMessage(event) {
    const ch = event.data[0] & 0xf;
    if (ch === 1) {
        const sampleNum = event.data[1] - 60;
        if (event.data[0] >> 4 === 9) {
            // TODO: make gain logarithmic
            play(sampleNum, event.data[2] / 127);
        } else if (event.data[0] >> 4 === 8) {
        } else if (event.data[0] >> 4 === 11) {
            const i = (event.data[1] - 64) % channels.length;
            channels[i].setFXFromCC(event.data);
        }
    }
}

function play(bufNum, gain) {
    const buf = buffers[bufNum];
    const bufSrc = ctx.createBufferSource();
    bufSrc.buffer = buf;
    const sendMasterGain = ctx.createGain();
    const sendDelayGain = ctx.createGain();
    bufSrc.connect(sendDelayGain);
    sendMasterGain.gain.setValueAtTime(gain * channels[bufNum].gain, ctx.currentTime);
    sendDelayGain.gain.setValueAtTime(channels[bufNum].delay, ctx.currentTime);
    const filter = ctx.createBiquadFilter();
    filter.type = channels[bufNum].filter.type;
    filter.frequency.setValueAtTime(channels[bufNum].filter.freq, ctx.currentTime);
    bufSrc.connect(filter);
    filter.connect(sendMasterGain);
    sendMasterGain.connect(masterGain);
    sendDelayGain.connect(delayBusGain);
    bufSrc.start(0);
    log(logLevels.info, `started ${bufNum}`);
    $$('.sample__bang')[bufNum + 1].classList.add('sample__bang--active');
    bufSrc.addEventListener('ended', (_event) => {
        $$('.sample__bang')[bufNum + 1].classList.remove('sample__bang--active');
    });
}

function processCommand(event) {
    if (event.key !== 'Enter') return;
    const cmd = event.target.value;
    const ch = cmd[0];
    const param = cmd[1];
    log(logLevels.info, `cmd: ${cmd} ${ch} ${param}`);
    let value = parseFloat(cmd.slice(2));
    if (isNaN(value)) {
        value = cmd.slice(2);
    }
    channels[ch].setParam(param, value);
    event.target.value = '';
}

loadSamples();
$('.command__input').addEventListener('keydown', (event) => { processCommand(event); });

navigator.requestMIDIAccess()
    .then((access) => {
        const inputs = access.inputs.values();
        for (const _ of inputs) {
            if (_.name === 'IAC Driver Bus 1') {
                _.onmidimessage = onMidiMessage;
            }
        }
    });
