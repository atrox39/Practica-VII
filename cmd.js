const terminal = (params, data)=>{
    var cmd = require('child_process').exec("mysql "+params, (err, stdout, stderr)=>{
        if(err) throw err;
        if(stderr) throw stderr;
        data(stdout);
    });
}

module.exports = terminal;