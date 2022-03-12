export const SamplerView = {
    el: null,

    render() {
        const t = document.createElement('template');
        t.innerHTML = `
            <div>
                <div class="tracks">
                    <div class="tracks__header">
                        <div class="track">
                            <span class="track__num">#</span>
                            <span class="track__bang">*</span>
                            <span class="track__channel">c</span>
                            <span class="track__octave">o</span>
                            <span class="track__note">n</span>
                            <span class="track__file">sample</span>
                            <span class="track__delay">del</span>
                            <span class="track__reverb">rev</span>
                            <span class="track__gain">gain</span>
                            <span class="track__filter">filt</span>
                            <span class="track__remove">rem</span>
                        </div>
                    </div>
                    <div class="track__list">
                        <div class="track track__empty">Drop samples on window to load</div>
                    </div>
                </div>

                <div class="command">
                    <input type="text" class="command__input">
                </div>

                <div class="bpm">––– bpm</div>
                <div class="midi"></div>
                <div class="log"></div>
            </div>
        `;
        this.el = t.content.firstElementChild.cloneNode(true);
        document.body.appendChild(this.el)
    },

    removeTrack(num) {
        //
    },
};