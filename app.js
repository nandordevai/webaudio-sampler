// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
// https://github.com/GoogleChromeLabs/web-audio-samples

import { $ } from './lib.js';
import { Sampler } from './Sampler.js';
import { Mixer } from './Mixer.js';
import { MIDIClock } from './MIDIClock.js';
import { MIDIMessage } from './MIDIMessage.js';

const ctx = new window.AudioContext();
const mixer = Object.assign(Object.create(Mixer), { ctx });
mixer.init();
const sampler = Object.assign(Object.create(Sampler), { ctx, mixer });
sampler.init();
const clock = Object.assign(Object.create(MIDIClock), { ctx });
let inputs = null;
let selectedInput = null;

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
    if ((navigator.platform.startsWith('Mac') && event.metaKey)
        || (navigator.platform.startsWith('Win') && event.ctrlKey)) {
        if (event.code === 'Period') selectNextInput();
        else if (event.code === 'KeyS') {
            WebaudioSampler.saveKit(localStorage.tracks);
        } else if (event.code === 'KeyO') {
            WebaudioSampler.loadKit();
        }
    } else if (event.target === $('.command__input')) {
        processCommand(event);
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
    if (param.toLowerCase() === 'x') {
        sampler.removeTrack(track);
    } else {
        let value = cmd.slice(2);
        try {
            sampler.setTrackParam(track, param, value);
            const trackData = JSON.parse(localStorage.tracks);
            trackData[track][param] = value;
            localStorage.tracks = JSON.stringify(trackData);
        } catch (TypeError) {
            // ignore bad command
        }
    }
    event.target.value = '';
}

function onDragOver(event) {
    event.preventDefault();
}

function onFileDrop(event) {
    event.preventDefault();
    for (const _ of event.dataTransfer.items) {
        const file = _.getAsFile();
        sampler.loadSample(file.path);
    }
}

navigator.requestMIDIAccess()
    .then((access) => {
        inputs = Array.from(access.inputs.values());
        setMIDIInput(0);
        selectedInput = 0;
    });

setInterval(() => {
    const bpm = clock.bpm();
    if (bpm !== Infinity) {
        sampler.bpm = bpm;
    }
}, 100);

document.body.addEventListener('drop', onFileDrop);
document.body.addEventListener('dragover', onDragOver);
document.body.addEventListener('keydown', (event) => { processKeyboardInput(event); });

if (typeof localStorage.tracks === 'undefined') localStorage.tracks = JSON.stringify([]);

sampler.loadSaved();

WebaudioSampler.onKitLoad((data) => {
    localStorage.tracks = data;
    sampler.loadSaved();
});
