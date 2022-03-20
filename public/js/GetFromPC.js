function open_close_folder(folder_number){
    let Folder = document.getElementById('Folder-' + folder_number)
    let File_Link = document.getElementsByClassName("Disappear-" + folder_number);
    let Arrow = document.getElementById("Arrow-"+folder_number)

    for (let x = 0; x < File_Link.length; x+=1){
        console.log(File_Link[x].style.display)
        if (File_Link[x].style.display == 'none' || File_Link[x].style.display == ''){
            File_Link[x].style.display = 'inline'
            Arrow.style.transform = 'rotate(180deg)'
        }else{
            File_Link[x].style.display = 'none'
            Arrow.style.transform = 'rotate(0deg)'
        }
    }
}