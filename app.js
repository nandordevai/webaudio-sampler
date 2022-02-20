// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html

let buffers = [];
const channels = [
    {
        sample: 'Kick.wav',
        gain: 1.0,
        delay: 0.0,
        reverb: 0.0,
    },
    {
        sample: 'Snare.wav',
        gain: 1.0,
        delay: 0.0,
        reverb: 0.3,
    },
    {
        sample: 'Closedhat.wav',
        gain: 1.0,
        delay: 0.0,
        reverb: 0.0,
    },
    {
        sample: 'Clap.wav',
        gain: 1.0,
        delay: 0.5,
        reverb: 0.0,
    },
];

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
noteGenerator = notes();

function addToList(i) {
    const el = document.createElement('div');
    el.classList.add('sample');
    const [octave, note] = noteGenerator.next().value;
    const name = channels[i].sample.split('.').slice(0, -1).join('.');
    el.innerHTML = `
        <span class="sample__num">${i}</span>
        <span class="sample__bang">*</span>
        <span class="sample__channel">1</span>
        <span class="sample__octave">${octave}</span>
        <span class="sample__note">${note}</span>
        <span class="sample__file">${name}</span>
        <span class="sample__delay sample__slider"></span>
        <span class="sample__reverb sample__slider"></span>
        <span class="sample__gain sample__slider"></span>
    `;
    document.querySelector('.sample__list').appendChild(el);
    setSend('delay', i);
    setSend('reverb', i);
    setSend('gain', i);
}

async function loadSamples() {
    const urls = channels.map(_ => `./assets/samples/${_.sample}`);
    const res = await Promise.all(urls.map(_ => fetch(_)));
    const aBufs = await Promise.all(res.map(_ => _.arrayBuffer()));
    buffers = await Promise.all(aBufs.map((_, i) => {
        // log(`${samples[i]} loaded`);
        addToList(i);
        return ctx.decodeAudioData(_);
    }));
}

function log(msg) {
    const el = document.querySelector('.log');
    el.innerText += `${msg}\n`;
    el.scrollTop = el.scrollHeight;
}

function* notes() {
    let i = 0;
    let octave = 2;
    while (true) {
        if (i % 12 === 0) octave++;
        note = noteNames[i % 12];
        i++;
        yield [octave, note];
    }
}

function onMidiMessage(event) {
    const channel = event.data[0] & 0xf;
    if (channel === 1) {
        const sampleNum = event.data[1] - 60;
        if (event.data[0] >> 4 === 9) {
            // TODO: make gain logarithmic
            play(sampleNum, event.data[2] / 127);
        } else if (event.data[0] >> 4 === 8) {
        } else if (event.data[0] >> 4 === 11) {
            setSendFromCC(event.data);
        }
    }
}

function play(bufNum, gain) {
    // the routing is completely wrong now but hey :)
    const buf = buffers[bufNum];
    const bufSrc = ctx.createBufferSource();
    bufSrc.buffer = buf;
    bufSrc.connect(masterGain);
    bufSrc.connect(delayBusGain);
    masterGain.gain.setValueAtTime(gain * channels[bufNum].gain, ctx.currentTime);
    delayBusGain.gain.setValueAtTime(channels[bufNum].delay, ctx.currentTime);
    bufSrc.start(0);
    // log(`started ${bufNum}`);
    document.querySelectorAll('.sample__bang')[bufNum + 1].classList.add('sample__bang--active');
    bufSrc.addEventListener('ended', (_event) => {
        document.querySelectorAll('.sample__bang')[bufNum + 1].classList.remove('sample__bang--active');
    });
}

function processCommand(event) {
    if (event.key !== 'Enter') return;
    const command = event.target.value;
    const channel = command[0];
    const param = command[1];
    const value = parseFloat(command.slice(2));
    setParam(channel, param, value);
    event.target.value = '';
}

function setParam(channel, param, value) {
    if (param.toLowerCase() === 'd') {
        setSend('delay', channel, value);
    } else if (param.toLowerCase() === 'r') {
        setSend('reverb', channel, value);
    } else if (param.toLowerCase() === 'g') {
        setSend('gain', channel, value);
    }
}

function setSend(fx, channel, value = null) {
    if (value !== null) {
        channels[channel][fx] = value;
    } else {
        value = channels[channel][fx];
    }
    const el = document.querySelectorAll(`.sample__list .sample__${fx}`)[channel];
    el.style.background = `
        linear-gradient(to right, var(--ui-light) 0%,
            var(--ui-light) ${value * 100}%,
            var(--ui-dark) ${value * 100}%)
    `;
}

function setSendFromCC(cc) {
    const i = (cc[1] - 64) % channels.length;
    const fx = cc[1] - 64 >= channels.length ? 'reverb' : 'delay';
    setSend(fx, i, cc[2] / 127);
}

loadSamples();
document.querySelector('.command__input').addEventListener('keydown', (event) => { processCommand(event); });

navigator.requestMIDIAccess()
    .then((access) => {
        const inputs = access.inputs.values();
        for (const _ of inputs) {
            if (_.name === 'IAC Driver Bus 1') {
                _.onmidimessage = onMidiMessage;
            }
        }
    });
