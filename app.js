// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

let buffers = [];
const samples = [
    'Kick.wav',
    'Snare.wav',
    'Closedhat.wav',
    'Clap.wav',
];

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const audioCtx = new window.AudioContext();
const out = audioCtx.destination;
const gainNode = audioCtx.createGain();
const delayNode = audioCtx.createDelay(5.0);
const delayFeedbackNode = audioCtx.createGain();
delayFeedbackNode.gain.value = .1;
delayNode.connect(delayFeedbackNode);
delayFeedbackNode.connect(delayNode);
gainNode.connect(delayNode);
gainNode.connect(out);
delayNode.connect(out);
delayNode.delayTime.value = .125;
noteGenerator = notes();

function addToList(i) {
    const el = document.createElement('div');
    el.classList.add('sample');
    const [octave, note] = noteGenerator.next().value;
    el.innerHTML = `
        <span class="sample__bang">*</span>
        <span class="sample__channel">1</span>
        <span class="sample__octave">${octave}</span>
        <span class="sample__note">${note}</span>
        <span class="sample__file">${samples[i]}</span>
    `;
    document.querySelector('.samples').appendChild(el);
}

async function loadSamples() {
    const urls = samples.map(_ => `./assets/samples/${_}`);
    const res = await Promise.all(urls.map(_ => fetch(_)));
    const aBufs = await Promise.all(res.map(_ => _.arrayBuffer()));
    buffers = await Promise.all(aBufs.map((_, i) => {
        // log(`${samples[i]} loaded`);
        addToList(i);
        return audioCtx.decodeAudioData(_);
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
        }
    }
}

function play(bufNum, gain) {
    const buf = buffers[bufNum];
    const bufSrc = audioCtx.createBufferSource();
    bufSrc.buffer = buf;
    bufSrc.connect(gainNode);
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    bufSrc.start(0);
    log(`started ${bufNum}`);
    document.querySelectorAll('.sample__bang')[bufNum].classList.add('sample__bang--active');
    bufSrc.addEventListener('ended', (_event) => {
        document.querySelectorAll('.sample__bang')[bufNum].classList.remove('sample__bang--active');
    });
}

loadSamples();

navigator.requestMIDIAccess()
    .then((access) => {
        const inputs = access.inputs.values();
        for (const _ of inputs) {
            if (_.name === 'IAC Driver Bus 1') {
                _.onmidimessage = onMidiMessage;
            }
        }
    });
