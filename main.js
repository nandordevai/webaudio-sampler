const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

if (process.env.MODE === 'DEVELOPMENT') {
    try {
        require('electron-reloader')(module);
    } catch {
        //
    }
}

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 540,
        height: 400,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();
    ipcMain.on('open-save', (_e, tracks) => {
        dialog.showSaveDialog({
            defaultPath: 'kit.json',
        }).then((result) => {
            try { fs.writeFileSync(result.filePath, tracks, 'utf-8'); }
            catch(e) { alert('Failed to save the file !'); }
        });
    });
    ipcMain.on('open-load', () => {
        dialog.showOpenDialog().then((result) => {
            fs.readFile(result.filePaths[0], { encoding: 'utf-8' }, (error, data) => {
                win.webContents.send('kit-load', data);
            })
        });
    });
});

app.on('window-all-closed', () => {
    app.quit();
});
