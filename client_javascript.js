var currentInfo = null;
var moduleCounter = 0;
var fileCounter = 0;

function send(type, data, callback, errorCallback){
  requestJSON({"type":type,"options":data}, callback, errorCallback);
  return false;
}

function saveSettings(){
  getFiles(function(files){
    getModules(function(modules){
      send("updateFiles", {"additional":files}, updateInfo);
      send("updateModules", {"modules":modules}, updateInfo);
    });
  });
}

function logRequest(type, data){
  send(type, data, logResponse);
}

function git(command){
  logRequest(command, $("#git_input").val());
}

function refresh(){
  send("info","", updateInfo, connectionDropped);
}

function requestConsole(){
  send("console","", updateConsole);
}

function logResponse(responseData){
  console.log("Server response: " + responseData);
}

function addModule(module){
  appendModuleHTML(module);
}

function addFile(file, path){
  appendModuleHTML({"file":file,"path":path});
}

function isNew(db_info){
  if(currentInfo == null){
    return true;
  } else if(db_info.name != currentInfo.name){
    return true;
  } else if(db_info.git_URL != currentInfo.git_URL){
    return true;
  } else if(db_info.version != currentInfo.version){
    return true;
  } else if(db_info.auto_update != currentInfo.auto_update){
    return true;
  } else if(db_info.online != currentInfo.online){
    return true;
  } else if(db_info.status != currentInfo.status){
    return true;
  } else if(db_info.additional.length != currentInfo.additional.length){
    return true;
  }else if(db_info.modules.length != currentInfo.modules.length){
    return true;
  }else{
    let i = 0;
    while(i < db_info.additional.length){
      if(db_info.additional[i].file != currentInfo.additional[i].file || db_info.additional[i].path != currentInfo.additional[i].path){
        return true;
      }
      i++;
    }
    i = 0;
    while(i < db_info.modules.length){
      if(db_info.modules[i] != currentInfo.modules[i]){
        return true;
      }
      i++;
    }
  }
}