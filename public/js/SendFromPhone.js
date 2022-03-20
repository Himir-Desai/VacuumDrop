let fileCounter = 1;

function AddFileInput(){
    fileCounter++;
    let FileInputDiv =  document.createElement("div");
    FileInputDiv.id = "FileInput-" + fileCounter;
    FileInputDiv.className = "FileFormFields";

    let FileInputInput = document.createElement("input")
    FileInputInput.type = "file";
    FileInputInput.name = "File-" + fileCounter;
    FileInputInput.id = "File-" + fileCounter;
    FileInputInput.className = "File";

    FileInputDiv.append(FileInputInput);
    console.log(FileInputDiv);

    document.getElementById("FileInputsDiv").append(FileInputDiv);
    document.getElementById("File-" + fileCounter).addEventListener('change', AddFileInput, {once: true})

}

document.getElementById("File-1").addEventListener('change', AddFileInput, {once: true})

//document.getElementById("File-" + fileCounter).removeEventListener('change', AddFileInput)


