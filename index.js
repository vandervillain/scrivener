var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, Menu = _a.Menu;
var path = require('path');
var url = require('url');
var win;
function ready() {
    Menu.setApplicationMenu(null);
    createWindow();
}
function createWindow() {
    win = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.webContents.openDevTools();
    win.on('closed', function () {
        win = null;
    });
}
app.on('ready', ready);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (win === null) {
        createWindow();
    }
});
//# sourceMappingURL=index.js.map