fetch("/isPasswordIncorrect", {
    method: 'POST'
})
    .then(response => response.json())
    .then(passwordIsIncorrect => {
        console.log(passwordIsIncorrect);
        passwordIsIncorrect = JSON.parse(passwordIsIncorrect)
        if (passwordIsIncorrect["isPasswordIncorrect"]){
            document.getElementById("PasswordIncorrectDiv").style.display = "flex";
        }
    });