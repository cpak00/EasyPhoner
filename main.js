/*
 * 主进程入口
 */

const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')
util = require('util')
adb = require('./adb')
phone = require('./phone')

let mainWin
let currentUrl
let currentDevice
let currentLs
let processBar
let childProcess = []

// 开始应用执行函数
function startApp() {
    mainWindow();
    currentUrl = 'templates/index.html';
    currentDevice = [];
    currentLs = [];
    mainWin.loadFile(currentUrl)
}

// 主界面
function mainWindow() {
    // 创建窗口
    mainWin = new BrowserWindow({
        width: 900,
        height: 600,
        frame: false
    });
    // 关闭菜单
    mainWin.setMenu(null);
    // 打开开发者工具(调试用)
    //mainWin.webContents.openDevTools();
    // 关闭事件
    mainWin.on('close', onClose);
}

// 关闭事件处理
function onClose() {
    mainWin = null;
}

/*
 * 主进程事件监听
 */
ipcMain.on('command', onCommand);
ipcMain.on('connect', onConnect);
ipcMain.on('file', onFile);
ipcMain.on('push', onPush);
ipcMain.on('pull', onPull);
ipcMain.on('remove', onRemove)
ipcMain.on('progress-close', onProgressClose)

// 命令事件处理
function onCommand(event, command) {
    util.log('command', command);
    switch (command) {
        case 'close':
            app.quit();
            break;
        case 'get_device':
            adb.adbDevices((stdout) => {
                devices = phone.devicesParse(stdout);
                mainWin.send('devices', devices)
            })
            break;
    }
}

function onConnect(event, deviceID) {
    if (currentDevice != deviceID && deviceID != "") {
        currentDevice = deviceID;
        currentLs = [];
    }
}

function onFile(event, dirPath) {
    if (dirPath == '返回上一路径') {
        currentLs = currentLs.slice(0, -1);
    } else if (dirPath == ''){
    } else {
        currentLs.push(dirPath);
    }
    var path = currentLs.join('/') + '/';
    adb.adbLs(currentDevice, path, (stdout) => {
        file_list = phone.fileParse(stdout);
        mainWin.send('file_list', file_list);
        mainWin.send('file_path', currentLs);
    })
}

function onPush(event, sourcePaths) {
    if (sourcePaths == null) return;
    delete processBar;
    processBar = new BrowserWindow({
            width: 400,
            height: 200,
            frame: false,
            transparent: true
    });
    onPush_(event, sourcePaths, 0);
}

function onPush_(event, sourcePaths, i) {
    try {
        if (i >= sourcePaths.length) {
            onProgressClose();
            onFile(event, '');
            return;
        }
        sourcePath = sourcePaths[i];
        processBar.loadFile('templates/progress.html');
        processBar.setMenu(null);
        //processBar.openDevTools();
        processBar.show()
        var push = adb.adbPush(currentDevice, sourcePath, currentLs.join('/') + '/', (stdout) => {
            try {
                processBar.setTitle('上传 ' + sourcePath);
                var num = phone.processParse(stdout);
                processBar.send('progress', {
                    progress: num,
                    index: i,
                    total: sourcePaths.length
                });
            } catch (e) {
                return;
            }
        }, () => {
            onPush_(event, sourcePaths, i + 1);
        })
        childProcess.push(push);
    } catch (e) {
        return;
    }
}

function onPull(event, sourcePaths, dirPath) {
    if (dirPath == null || sourcePaths == null) return;
    delete processBar;
    processBar = new BrowserWindow({
            width: 400,
            height: 200,
            frame: false,
            transparent: true
    });
    console.log(sourcePaths+' '+dirPath);
    onPull_(event, sourcePaths, dirPath, 0);
}

function onPull_(event, sourcePaths, dirPath, i) {
    try {
        if (i >= sourcePaths.length) {
            onProgressClose();
            onFile(event, '');
            return;
        }
        sourcePath = currentLs.join('/')+'/'+sourcePaths[i];
        processBar.loadFile('templates/progress.html');
        processBar.setMenu(null);
        //processBar.openDevTools();
        processBar.show()
        var pull=adb.adbPull(currentDevice, sourcePath, dirPath, (stdout) => {
            try {
                processBar.setTitle('下载 ' + sourcePath);
                var num = phone.processParse(stdout);
                processBar.send('progress', {
                    progress: num,
                    index: i,
                    total: sourcePaths.length
                });
            } catch (e) {
                return;
            }
        }, () => {
            onPull_(event, sourcePaths, dirPath, i + 1);
        })
        childProcess.push(pull);
    } catch (e) {
        return;
    }
}

function onRemove(event, names) {
    for (i in names) {
        var name = names[i];
        var sourcePath = currentLs.join('/')+'/'+name;
        adb.adbRemove(currentDevice, sourcePath, ()=>{
        });
    }
}

function onProgressClose() {
    processBar.close();
    delete processBar;
    for (i in childProcess) {
        if (childProcess[i]) {
            childProcess[i].kill();
            delete childProcess[i];
        }
    }
    childProcess = [];
}

// 启动应用程序
app.on('ready', startApp)

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        startApp();
    }
})