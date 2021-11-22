const terminal = (params, data)=>{
    var mysqldump = require('child_process').spawn("mysqldump", params);
    var text = '';
    mysqldump.stdout.on('data', (data)=>{
        if(data) text += data.toString();
    });

    mysqldump.on('exit', (code)=>{
        return data(text);
    });
}

module.exports = terminal;