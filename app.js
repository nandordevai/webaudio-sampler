// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

const audioCtx = new window.AudioContext();
let buffers = [];
const samples = [
    'Kick.wav',
    'Snare.wav',
    'Closedhat.wav',
];
gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);

async function loadSamples() {
    const urls = samples.map(_ => `./assets/samples/${_}`);
    const res = await Promise.all(urls.map(_ => fetch(_)));
    const aBufs = await Promise.all(res.map(_ => _.arrayBuffer()));
    buffers = await Promise.all(aBufs.map((_, i) => {
        log(`${samples[i]} loaded`);
        return audioCtx.decodeAudioData(_);
    }));
}

function log(msg) {
    document.querySelector('.log').innerText += `${msg}\n`;
}

function play(buf, gain) {
    const bufSrc = audioCtx.createBufferSource();
    bufSrc.buffer = buf;
    bufSrc.connect(gainNode);
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    bufSrc.start(0);
}

function onMidiMessage(event) {
    const channel = event.data[0] & 0xf;
    if (channel === 1) {
        const sampleNum = event.data[1] - 60;
        if (event.data[0] >> 4 === 9) {
            // TODO: make gain logarithmic
            document.querySelectorAll('.sample .playing')[sampleNum].classList.add('active');
            play(buffers[sampleNum], event.data[2] / 127);
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
