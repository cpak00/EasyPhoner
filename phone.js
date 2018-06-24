// 手机相关的处理
exports.devicesParse = (stdout)=>{
    var devices = [];

    var endl = '\r\n';
    if (process.platform.indexOf('win') >= 0) {
        endl = '\r\n';
    } else if (process.platform.indexOf('darwin') >= 0) {
        endl = '\r';
    } else {
        endl = '\n';
    }

    lines = stdout.split(endl);
    for (i in lines) {
        line = lines[i].split('\t');
        if (line.length == 2 && line[1] == "device") {
            devices.push(line[0]);
        }
    }

    return devices;
}

exports.fileParse = (stdout)=>{
    list = stdout.split(',');
    file_list = []
    dir_list = ['返回上一路径']
    for (i in list) {
        name = list[i].trim();
        if (name == './') continue;
        if (name == '../') continue;
        if (name[name.length-1] == '/' || name[name.length-1] == '@') {
            dir_list.push(name.slice(0, -1));
        } else if (name[name.length-1] == '*'){
            file_list.push(name.slice(0, -1));
        } else {
            file_list.push(name);
        }
    }
    return {file: file_list, dir: dir_list};
}

exports.processParse = (data)=>{
    if (data.indexOf('files pu')>=0) return '100%';
    if (data.length > 6) {
        var num = data.slice(1, 4).toString();
        if (!isNaN(num)) {
            return num+'%';
        } else {
            return '100%';
        }
    }
    return '0%';
}