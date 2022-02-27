// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html

const $$ = document.querySelectorAll.bind(document);
const $ = document.querySelector.bind(document);
const lvl = {
    info: 0,
    warning: 1,
    error: 2,
};
const logLevel = 2;
let buffers = [];
const widgetWidth = 37;
const widgetHeight = 10;
const channels = [
    {
        sample: 'Kick.wav',
        gain: 1.0,
        delay: 0.0,
        reverb: 0.0,
        filter: {
            type: 'lp',
            freq: 20000,
            q: 0,
        }
    },
    {
        sample: 'Snare.wav',
        gain: 1.0,
        delay: 0.0,
        reverb: 0.3,
        filter: {
            type: 'hp',
            freq: 5000,
            q: 0,
        }
    },
    {
        sample: 'Closedhat.wav',
        gain: 1.0,
        delay: 0.0,
        reverb: 0.0,
        filter: {
            type: 'lp',
            freq: 10000,
            q: 0,
        }
    },
    {
        sample: 'Clap.wav',
        gain: 1.0,
        delay: 0.5,
        reverb: 0.0,
        filter: {
            type: 'lp',
            freq: 15000,
            q: 0,
        }
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
        <span class="sample__delay sample__send"></span>
        <span class="sample__reverb sample__send"></span>
        <span class="sample__gain sample__send"></span>
        <span class="sample__filter">
            <svg class="sample__filter-vis"
             width="${widgetWidth}" height="${widgetHeight}"></svg>
        </span>
    `;
    $('.sample__list').appendChild(el);
    setSend('delay', i);
    setSend('reverb', i);
    setSend('gain', i);
    setFilter(i);
}

function setFilter(i) {
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    const curves = {
        lp: (f) => `M 0 1 L ${f - 5} 1 Q ${f} 1 ${f} 10`,
        hp: (f) => `M ${widgetWidth} 1 L ${f + 5} 1 Q ${f} 1 ${f} 10`,
    };
    const f = ((widgetWidth - 1) / 20000) * channels[i].filter.freq;
    const curve = curves[channels[i].filter.type](f);
    path.setAttribute('d', curve);
    path.setAttribute('class', 'filter-curve');
    $$('svg')[i].appendChild(path);
}

async function loadSamples() {
    const urls = channels.map(_ => `./assets/samples/${_.sample}`);
    const res = await Promise.all(urls.map(_ => fetch(_)));
    const aBufs = await Promise.all(res.map(_ => _.arrayBuffer()));
    buffers = await Promise.all(aBufs.map((_, i) => {
        // log(lvl.info, `${samples[i]} loaded`);
        addToList(i);
        return ctx.decodeAudioData(_);
    }));
}

function log(level, msg) {
    if (level < logLevel) return;
    const el = $('.log');
    el.innerText += `${msg}\n`;
    el.scrollTop = el.scrollHeight;
}

function* notes() {
    let i = 0;
    let octave = 3;
    while (true) {
        if (i > 0 && i % 12 === 0);
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
    const buf = buffers[bufNum];
    const bufSrc = ctx.createBufferSource();
    bufSrc.buffer = buf;
    const sendMasterGain = ctx.createGain();
    const sendDelayGain = ctx.createGain();
    bufSrc.connect(sendMasterGain);
    bufSrc.connect(sendDelayGain);
    sendMasterGain.gain.setValueAtTime(gain * channels[bufNum].gain, ctx.currentTime);
    sendDelayGain.gain.setValueAtTime(channels[bufNum].delay, ctx.currentTime);
    sendMasterGain.connect(masterGain);
    sendDelayGain.connect(delayBusGain);
    bufSrc.start(0);
    // log(`started ${bufNum}`);
    $$('.sample__bang')[bufNum + 1].classList.add('sample__bang--active');
    bufSrc.addEventListener('ended', (_event) => {
        $$('.sample__bang')[bufNum + 1].classList.remove('sample__bang--active');
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
    const el = $$(`.sample__list .sample__${fx}`)[channel];
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
