// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

let buffers = [];
const samples = [
    'Kick.wav',
    'Snare.wav',
    'Closedhat.wav',
    'Clap.wav',
];

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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
delayNode.delayTime.value = .25;

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

function addToList(i) {
    // FIXME: handle more than 8 samples
    const el = document.createElement('div');
    el.classList.add('sample');
    el.innerHTML = `
        <span class="playing">*</span>
        <span class="channel">1</span>
        <span class="octave">3</span>
        <span class="note">${notes[i]}</span>
        <span class="file">${samples[i]}</span>
    `;
    document.querySelector('.samples').appendChild(el);
}

function log(msg) {
    const el = document.querySelector('.log');
    el.innerText += `${msg}\n`;
    el.scrollTop = el.scrollHeight;
}

function play(bufNum, gain) {
    const buf = buffers[bufNum];
    const bufSrc = audioCtx.createBufferSource();
    bufSrc.buffer = buf;
    bufSrc.connect(gainNode);
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    bufSrc.start(0);
    log(`started ${bufNum}`);
    document.querySelectorAll('.sample .playing')[bufNum].classList.add('active');
    bufSrc.addEventListener('ended', (_event) => {
        document.querySelectorAll('.sample .playing')[bufNum].classList.remove('active');
    });
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

loadSamples();

navigator.requestMIDIAccess()
    .then((access) => {
        const inputs = access.inputs.values();
        Array.from(inputs).forEach(_ => {
            if (_.name === 'IAC Driver Bus 1') {
                _.onmidimessage = onMidiMessage;
            }
        });
    });
