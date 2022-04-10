const { ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('WebaudioSampler', {
    saveKit(kit) {
        ipcRenderer.send('open-save', kit);
    },
    loadKit() {
        ipcRenderer.send('open-load');
    },
    onKitLoad(func) {
        ipcRenderer.on('kit-load', (_event, data) => func(data));
    }
});
