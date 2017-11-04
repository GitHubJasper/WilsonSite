const fs = require('fs-extra');
const git = require('simple-git');
var path = require("path");
var app = require('express')();
var cp = require('child_process');
var formidable = require('formidable');
var connect = require('connect');
var serveStatic = require('serve-static');
var child;
var consoleLog= "";
db = JSON.parse(fs.readFileSync(__dirname + `/wilson_db.json`, "utf8"));

connect().use(serveStatic(__dirname)).listen(8080, function(){
    console.log('Server running on 8080...');
});
if(!fs.existsSync(__dirname + "/discord_bot")){
    fs.mkdir(__dirname + "/discord_bot");
}
app.post('/JSON', handleRequest);
app.post('/upload', handleFileUploads);
app.listen(8000);

/**
 * Collect data and pass on to respond function
 * @param {*} request 
 * @param {*} response 
 */
function handleFileUploads(request, response) {
    var form = new formidable.IncomingForm();
    form.parse(request);
    
    form.on('fileBegin', function (name, file){
        file.path = __dirname + db.folder + file.name;
    });

    form.on('file', function (name, file){
        db.additional.push({"file": file.name,"path":""});
        saveDB();
        response.setHeader("Content-Type", "text/plain");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.end(file.name);
        console.log('Uploaded ' + file.name);
    });
 }

/**
 * Collect data and pass on to respond function
 * @param {*} request 
 * @param {*} response 
 */
function handleRequest(request, response) {
    var store = '';
    request.on('data', function(data) 
    {
        store += data;
    });
    request.on('end', function() {
        respond(JSON.parse(store),response);
    });
 }

function respond(data, response){
    if(data == null && data.type == null){
            response.setHeader("Content-Type", "text/json");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end('{"error":"no data or type given"}');
        return;
    }

    db.online = child != null;
    switch(data.type){
        case "console":
            response.setHeader("Content-Type", "text/plain");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end(consoleLog);
            consoleLog = "";
        break;
        case "info":
            response.setHeader("Content-Type", "text/json");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end(JSON.stringify(db));
        break;
        case "start":
            response.setHeader("Content-Type", "text/plain");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end("Launching...");
            startBot();
        break;
        case "restart":
            response.setHeader("Content-Type", "text/plain");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end("Restarting...");
            stopBot();
            startBot();
        break;
        case "stop":
            response.setHeader("Content-Type", "text/plain");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end("Stopping...");
            stopBot();
        break;
        case "updateFiles":
            updateFiles(data.options.additional);
            saveDB();
            response.setHeader("Content-Type", "text/json");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end(JSON.stringify(db));
        break;
        case "updateModules":
            updateModules(data.options.modules);
            saveDB();
            response.setHeader("Content-Type", "text/json");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end(JSON.stringify(db));
        break;
        case "clone":
            db.status = "Cloning";
            updateURL(data.options);
            stopBot();
            while(child != null && !child.killed){
            }
            moveAdditionalTMP();
            fs.removeSync(__dirname + db.folder);
            git(__dirname + "/discord_bot").clone(db.git_URL,() => {
                moveTMPAdditional(); 
                db.status = "Installing modules";
                installModules(db.modules,() => db.status = "Ready");
                
            });
            response.setHeader("Content-Type", "text/plain");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end("Cloning from " + db.git_URL);
        break;
        case "upload":
            response.setHeader("Content-Type", "text/json");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end(JSON.stringify(db));
        break;
        case "pull":
            db.status = "Pulling";
            updateURL(data.options);
            git(__dirname + db.folder).pull('origin', 'master', {'--no-rebase': null},() => db.status = "Ready");
            response.setHeader("Content-Type", "text/plain");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.end("Pulling changes from " + db.git_URL);
        break;
    }
}

function startBot(){

    if(child != null){
        return;
    }
    child = cp.spawn("node", ["." + db.folder + "/src/bot.js",'127.0.0.1', 3030],{execArgv: ['--inspect=6001'],silent:true});
    child.on('message', function(m) {
        console.log('PARENT got message:', m);
      });
    child.stdout.on('data',
    function (data) {
            console.log(""+data + "\n");
            consoleLog += data;
        });
    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    child.on('close', function (code) {
        console.log('child process exited with code ' + code);
        consoleLog += 'Bot exited with code ' + code + "\n";
        child = null;
    });
}

function stopBot(callback){
    if(child != null){
        child.kill();
        child = null;
    }
}
function removeMissingFiles(oldFiles, newFiles){
    copy = newFiles.slice();
    removedFiles = [];
    oldFiles.forEach(function(file) {
        let match = -1;
        newFiles.forEach(function(newFile, index){
            if(file.file == newFile.file && match == -1){
                match = index;
            }
        });
        if(match == -1){
            console.log("Unlink: " + file.file);
            removedFiles.push(file);
            if(fs.existsSync(__dirname + db.folder + file.path + file.file)){
                fs.unlinkSync(__dirname + db.folder + file.path + file.file);
            }
        } else{
            copy.splice(match,1);
        }
    });

    db.additional = db.additional.filter( function( el ) {
        return removedFiles.indexOf( el ) < 0;
    });
}

function updateFiles(files){
    newFileArray = [];
    if(db.additional.length > files.length){
        removeMissingFiles(db.additional, files);
    }
    db.additional.forEach(function(file, i) {
        let match = -1;
        files.forEach(function(newFile, index){
            if(file.file == newFile.file && match == -1){
                match = index;
                if(file.path != newFile.path){
                    console.log("Moved: " + file.file);
                    fs.renameSync(__dirname + db.folder + file.path + file.file, __dirname + db.folder + newFile.path + newFile.file);
                }
            }
        });
        if(match != -1){
            newFileArray.push(files[match]);
            files.splice(match,1);
        }
    });
    db.additional = newFileArray;
}

function moveAdditionalTMP(){
    if(!fs.existsSync(__dirname + "/tmp/")){
        fs.mkdir(__dirname + "/tmp/");
    }
    db.additional.forEach(function(file, i) {
        if(fs.existsSync(__dirname + db.folder + file.path + file.file)){
            console.log("Moved: " + file.file);
            fs.renameSync(__dirname + db.folder + file.path + file.file, __dirname + "/tmp/"  + file.file);
        }
    });
}

function moveTMPAdditional(){
    db.additional.forEach(function(file, i) {
        if(fs.existsSync(__dirname + "/tmp/" + file.file)){
            console.log("Moved: " + file.file);
            fs.renameSync(__dirname + "/tmp/" + file.file, __dirname + db.folder + file.path + file.file);
        }
    });
}

function updateModules(modules){
    db.modules = db.modules.filter( function( el ) {
        return modules.indexOf( el ) != -1;
    });
    missingModules = modules.filter(function( el ) {
        return db.modules.indexOf( el ) < 0;
    });
    if(missingModules.length != 0){
        installModules(missingModules);
    }
    db.modules = db.modules.concat(missingModules);
}

function updateURL(newURL){
    if(newURL != null && newURL != "" && newURL != db.git_URL){
        db.git_URL = newURL;
        saveDB();
    }
}

function saveDB(){
    fs.writeFileSync(__dirname + `/wilson_db.json`, JSON.stringify(db));
        
}

function installModules(modules, callback){
    let count = 0;
    modules.forEach(function(module) {
        console.log('npm install --prefix ' + db.folder + " " + module);
        commandProcess = cp.exec('npm install --prefix .' + db.folder + " " + module,
        function (error, stdout, stderr) {
            count++;
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                 console.log('exec error: ' + error);
            }
            db.installed.push(module);
            if(count == modules.length){
                callback();
            }
        });
    }, this);
}
