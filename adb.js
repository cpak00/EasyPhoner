const { exec, spawn } = require('child_process')

var adbShell = function(cmd, callback) {
    console.log('cmd '+cmd);
    exec(cmd, callback);
}

exports.adbDevices = function(callback) {
    adbShell('adb devices', (err, stdout, stderr)=>{
        callback(stdout);
    })
}

exports.adbLs = function(deviceID, dirPath, callback) {
    if (deviceID == '') {
        console.log('error, deviceID is empty');
        return;
    }
    adbShell(`adb -s ${deviceID} shell ls -F -m -a `+dirPath, (err, stdout, stderr)=>{
        if (err) callback('');
        callback(stdout);
    });
}

exports.adbPush = function(deviceID, sourcePath, directDir, callback, next) {
    if (deviceID == '') {
        console.log('error, deviceID is empty');
        return;
    }
    // 解析文件名
    if (sourcePath === undefined) return;

    var filename = sourcePath.split('\\')
    filename = filename[filename.length - 1];
    // 推流
    var push = spawn(`adb`,[`-s`, `${deviceID}`,`push` ,`-p` ,`${sourcePath}`, `${directDir}${filename}`]);
    push.stdout.on('data', (data)=>{
        callback(data);
    })
    push.on('close', ()=>{
        next();
    })
    return push;
}

exports.adbPull = function(deviceID, sourcePath, directDir, callback, next) {
    if (deviceID == '') {
        console.log('error, deviceID is empty');
        return;
    }
    // 解决根目录问题
    directDir+='.'

    // 解析文件名
    if (sourcePath === undefined) return;

    var filename = sourcePath.split('/')
    filename = filename[filename.length - 1];

    console.log([`-s`, `${deviceID}`,`pull` ,`-p` ,`${sourcePath}`, `${directDir}`].join(' '))
    // 推流
    var pull = spawn(`adb`,[`-s`, `${deviceID}`,`pull` ,`-p` ,`${sourcePath}`, `${directDir}`]);
    pull.stdout.on('data', (data)=>{
        callback(data);
    })
    pull.on('close', ()=>{
        next();
    })
    return pull;
}

exports.adbRemove = function(deviceID, sourcePath, callback) {
    console.log(sourcePath);
    adbShell(`adb shell rm -r ${sourcePath}`, callback);
}