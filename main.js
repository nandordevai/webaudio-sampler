const { app, BrowserWindow } = require('electron');

try {
	require('electron-reloader')(module);
} catch {
    //
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 440,
        height: 400,
        frame: false,
    });
    win.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});
