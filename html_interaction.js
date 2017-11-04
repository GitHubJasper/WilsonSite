

$(document).ready(function(){
    connectionDropped();
    refresh();
});

window.setInterval(function(){
    requestConsole();
    refresh();
}, 1000);

function connectionDropped(){
    $(".info").hide();
    $("#loading").show();
}
  
function appendFileHTML(file) {
    let filePre = "<tr  class='file' id='file_" + fileCounter + "'> <th><input type='text' class='input' placeholder='Path' value='";
    let fileMid = "'></input></th> <th class='path'>";
    table.append(filePre + file.path + fileMid + file.file +
        '</th> <th><button onClick="send(\'download\',[\'' + file.file + '\',\'' 
        + file.path + '\'])" class="download"></button> </th> <th><button onClick="removeFile(\'' + fileCounter + '\')" class="remove"></button> </th> </tr>');
    fileCounter++;
}
  
function appendModuleHTML(module) {
    let filePre = "<tr class='module' id ='module_"+ moduleCounter +"'> <th><input type='text' class='input' placeholder='Path' value='";
    let filePost = "'></input></th> ";
    table.append(filePre + module + filePost + '<th><button onClick="removeModule([\''+ moduleCounter + '\'])" class="remove"></button> </th></tr>');
    moduleCounter++;
}

function removeModule(module){
    $("tr[id='module_" + module +"']").remove();
}
  
function removeFile(file){
    $("tr[id='file_" + file +"']").remove();
}
  
function getModules(callback){
    moduleResult = [];
    $(".module").each(function( index ) {
      moduleResult[index] = $( this).find("input").val();
    });
    callback(moduleResult);
}

function getFiles(callback){
    fileResult = [];
    $(".file").each(function( index ) {
        fileResult[index] = {"file":$( this).find(".path").first().text(),"path":$( this).find("input").val()};
    });
    callback(fileResult);
}

function updateInfo(db_info){
    $(".info").show();
    $("#loading").hide();
    if(isNew(db_info)){
        console.log("new");
        currentInfo = db_info;
        $("#name foo").text(db_info.name);
        $("#git a").text(db_info.git_URL);
        if(db_info.git_URL != null){
        $("#git a").attr("href", db_info.git_URL.slice(0,-4));
        }
        $("#version foo").text(db_info.version);
        $("#auto_update foo").text(db_info.auto_update);
        $("#status foo").text(db_info.status);

        if(db_info.online){
            $("#play").attr("onClick","logRequest('stop')");
            $("#play img").attr("src","images/pause-red.png");
        } else{
            $("#play").attr("onClick","logRequest('start')");
            $("#play img").attr("src","images/play-green.png");
            $("#console").html("");
        }
        updateAdditionalFiles(db_info);
        updateModules(db_info);
    }
}

function updateConsole(responseData){
    responseData = responseData.replace(/(?:\r\n|\r|\n)/g, '<br />');
    if(responseData != ""){
        $("#console").html($("#console").html() + responseData);
    }
}

function updateModules(db_info){
    let modules = db_info.modules;
    table = $("#modulesTable");
    table.empty();
    modules.forEach(appendModuleHTML);
}

function updateAdditionalFiles(db_info){
    let files = db_info.additional;
    table = $("#additionalTable");
    table.empty();
    files.forEach(appendFileHTML);
}