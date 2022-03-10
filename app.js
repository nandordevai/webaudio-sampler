// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
// https://github.com/GoogleChromeLabs/web-audio-samples

import { $ } from './lib.js';
import { Sampler } from './Sampler.js';
import { Mixer } from './Mixer.js';
import { MIDIClock } from './MIDIClock.js';
import { MIDIMessage } from './MIDIMessage.js';

const ctx = new window.AudioContext();
const mixer = {...Mixer, ctx};
mixer.init();
const sampler = {...Sampler, ctx, mixer};
sampler.init();
const clock = {...MIDIClock, ctx };
let inputs = null;
let selectedInput = null;

async function loadSamples(files) {
    for (const _ of files) {
        await sampler.loadSample(_);
    }
}

function onMidiMessage(event) {
    const msg = MIDIMessage(event);
    if (msg.type === 'clock') {
        clock.tick();
        return;
    }

    if (msg.ch !== sampler.midiCh) return;

    if (msg.type === 'noteOn') {
        sampler.play(msg.note, msg.vel / 127);
    } else if (msg.type === 'cc') {
        sampler.handleCC(msg.cc, msg.val);
    }
}

function processKeyboardInput(event) {
    if (event.target === $('.command__input')) {
        processCommand(event);
    } else if ((navigator.platform.startsWith('Mac') && event.metaKey)
        || (navigator.platform.startsWith('Win') && event.ctrlKey)) {
        if (event.key === '.') selectNextInput();
    }
}

function selectNextInput() {
    const i = selectedInput < inputs.length - 1
        ? selectedInput + 1
        : 0;
    setMIDIInput(i);
}

function setMIDIInput(i) {
    if (selectedInput !== null) inputs[selectedInput].onmidimessage = null;
    selectedInput = i;
    inputs[i].onmidimessage = onMidiMessage;
    $('.midi').innerText = inputs[i].name;
}

function processCommand(event) {
    if (event.key !== 'Enter') return;
    const cmd = event.target.value;
    if (cmd === '') return;
    const track = cmd[0];
    const param = cmd[1];
    let value = parseFloat(cmd.slice(2));
    if (isNaN(value)) {
        value = cmd.slice(2);
    }
    try {
        sampler.setTrackParam(track, param, value);
    } catch (TypeError) {
        // ignore bad command
    }
    event.target.value = '';
}

function onDragOver(event) {
    event.preventDefault();
}

function onFileDrop(event) {
    event.preventDefault();
    const files = [];
    for (const _ of event.dataTransfer.items) {
        const file = _.getAsFile();
        files.push(file.path);
    }
    loadSamples(files);
    $('.sample__empty')?.remove();
}

document.body.addEventListener('keydown', (event) => { processKeyboardInput(event); });

navigator.requestMIDIAccess()
    .then((access) => {
        inputs = Array.from(access.inputs.values());
        setMIDIInput(0);
        selectedInput = 0;
    });

setInterval(() => {
    const bpm = clock.bpm();
    if (bpm !== Infinity) {
        $('.bpm').innerText = `${bpm < 100 ? ' ' : ''}${bpm} bpm`;
        mixer.setDelayTime(1 / bpm / 60 * 1000);
    }
}, 100);

document.body.addEventListener('drop', onFileDrop);
document.body.addEventListener('dragover', onDragOver);
