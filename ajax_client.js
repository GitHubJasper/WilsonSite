function requestJSON(requestData, callback, errorCallback){
    $.ajax
    ({
        type: "POST",
        url: "http://localhost:8000/JSON",
        crossDomain:true,
        timeout: 5000,
        data:JSON.stringify(requestData)
    }).done(
        (data) => {if(data.error == null) callback(data)}
    ).fail(
        (error) => {if(errorCallback != null) errorCallback(error)}
    );
}

function uploadFile(){
    var formData = new FormData();
    formData.append('file', $('#fileSelector')[0].files[0]);
  
    $.ajax({
      url : 'http://localhost:8000/upload',
      type : 'POST',
      data : formData,
      processData: false,
      contentType: false,
      success : function(data) {
          console.log(data);
          addFile(data,"");
      }
    });
  }