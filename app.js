// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const audioCtx = new window.AudioContext();
let buffers = [];
const samples = [
    'Kick.wav',
    'Snare.wav',
    'Closedhat.wav',
    'Clap.wav',
];
gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);

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
    const el = document.createElement('div');
    el.classList.add('sample');
    el.innerHTML = `
        <span class="playing">*</span><span class="channel">1</span><span class="octave">3</span><span class="note">${notes[i]}</span><span class="file">${samples[i]}</span>
    `;
    document.querySelector('.samples').appendChild(el);
}

function log(msg) {
    document.querySelector('.log').innerText += `${msg}\n`;
}

function play(bufNum, gain) {
    const buf = buffers[bufNum];
    const bufSrc = audioCtx.createBufferSource();
    bufSrc.buffer = buf;
    bufSrc.connect(gainNode);
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    bufSrc.start(0);
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
