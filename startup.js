const pkg = require('pkg')
const readline = require('readline-sync')
const fs = require('fs')
const os = require('os')
const path = require('path')
const express = require("express");
const ejs = require('ejs')
const parser = require("body-parser");
const formidable = require('formidable');
const colors = require('colors');

const VacuumDropLoc = path.join(os.homedir(), 'VacuumDrop')
const port = 3000;

let LoggedIn;
let UserWish;

PrintVacuumDrop()
StartUp()

function PrintVacuumDrop(){
    console.clear()
    console.log('VacuumDrop\n'.cyan.bold)
}

function StartUp() {
    console.log("What do you want to do?".italic)
    console.log("    1. Start VacuumDrop.")
    console.log("    2. Change Password.\n")
    
    if(!fs.existsSync(VacuumDropLoc)) 
        fs.mkdir(VacuumDropLoc, ()=>{})
        
    if(!fs.existsSync(path.join(VacuumDropLoc, 'Vacuum')))
        fs.mkdir(path.join(VacuumDropLoc, 'Vacuum'), ()=>{}) 

    if (!fs.existsSync(path.join(VacuumDropLoc, 'Password.psw')))
        fs.writeFileSync(path.join(VacuumDropLoc, 'Password.psw'), 'admin')

    while (true) {
        UserWish = parseInt(readline.question("Please enter 1 or 2: "));
        if ([1, 2].includes(UserWish)) {
            Initialize(UserWish)
            break
        } else {
            console.log("The entered input should be 1 or 2 only")
        }
    }
}

function Initialize(UserWish){
    if (UserWish == 1){
        StartServer()
    }else if (UserWish == 2){
        ChangePassword()
    }
}

function ChangePassword(){
    PrintVacuumDrop()
    let oldPassowrd = readline.question('Enter old Password: ')
    let realOldPassword = fs.readFileSync(path.join(VacuumDropLoc, 'password.psw'))
    let password;

    if (oldPassowrd == realOldPassword) {
        password = readline.question('Enter New Password: ')
        let confirmPassword = readline.question('Confirm Password: ');
        while (password != confirmPassword) {
            console.log('Entered passwords do not match')

            PrintVacuumDrop()
            password = readline.question('Enter password: ')
            confirmPassword = readline.question('Confirm Password: ')
        }
        fs.writeFile(path.join(VacuumDropLoc, 'password.psw'), password, ()=>{})

        console.log('Password changed successfully')
        readline.question('\nPress Enter...'.red)
        Reset()
    }else{
        console.log('Entered Password is incorrect')
        readline.question('\nPress Enter...'.red)
        Reset()
    }
}

function Reset(){
    console.clear()
    StartUp()
}

function StartServer(){
    const saveLocation = VacuumDropLoc

    const app = express();

    let password = fs.readFileSync(path.join(VacuumDropLoc, "Password.psw"));
    let isPasswordIncorrect = 0;
    let clients = [];
    LoggedIn = {};
    let ip_address;

    app.use(express.static(path.join(__dirname ,'/public')))
    app.use(express.static(path.join(__dirname ,'/SVGs')))
    app.use(express.static(path.join(__dirname ,'/views')))
    app.use(express.static(path.join(VacuumDropLoc, 'Vacuum')))
    app.use(parser.urlencoded({ extended: false }))

    app.set('view engine', 'ejs')

    // GET /////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn[clientIp]){
            res.render(path.join(__dirname ,'/views/pages/Home'))
        }else {
            res.redirect('/Login')
        }
    })

    app.get("/Login", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn[clientIp]){
            res.redirect('/')
        }else {
            res.render(path.join(__dirname ,'/views/pages/login'))
        }
    })

    app.get("/GetFromPC", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn) {
            let VacuumFiles = walk(path.join(VacuumDropLoc, 'Vacuum'))
            res.render(path.join(__dirname ,'/views/pages/GetFromPC'), {
                VacuumFiles: VacuumFiles,
            })
        }else{
            res.redirect('/Login')
        }
    })

    app.get("/SendFromPhone", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn) {
            res.render(path.join(__dirname ,'/views/pages/SendFromPhone'))
        }else{
            res.redirect('/Login')
        }
    })

    app.get("/SendToVacuum", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn) {
            res.render(path.join(__dirname ,'/views/pages/SendToVacuum'))
        }else{
            res.redirect('/Login')
        }
    })

    app.get('/Logout', (req, res)=>{

        let clientIp = req.ip;
        LoggedIn[clientIp] = false;

        res.redirect('/')
    })

    // POST ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.post("/Login", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        let EnteredPassword = req.body.Password
        if (password == EnteredPassword){
            isPasswordIncorrect = false;
            LoggedIn[clientIp] = true;
            res.redirect('/')
        }else{
            res.redirect('/Login')
            isPasswordIncorrect = true;
        }

    })

    app.post("/isPasswordIncorrect", (req, res)=>{
        let isPasswordIncorrectDict = {};
        isPasswordIncorrectDict["isPasswordIncorrect"] = isPasswordIncorrect;
        let isPasswordIncorrectJSON = JSON.stringify(isPasswordIncorrectDict);

        res.json(isPasswordIncorrectJSON);
    })

    app.post("/SendData", (req, res, next)=>{
        const form = formidable();

        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }

            fs.mkdir(path.join(saveLocation, fields.BatchName), ()=>{})

            console.log("\nFiles saved at:")

            let fileCounter=0;
            for(let file in files){
                fileCounter++
            }

            let fileCounter2=0;
            for (let file in files){
                fileCounter2++
                let tempPath = files[file]["filepath"];
                let newPath = path.join(saveLocation, fields.BatchName, files[file]["originalFilename"])

                fs.rename(tempPath, newPath, ()=>{});

                if (fileCounter2<fileCounter) {
                    console.log("    "+newPath.green.bold);
                }
            }

            res.redirect('/')
        });
    })

    app.post("/SendDataToVacuum", (req, res, next)=>{
        const VacuumLocation = path.join(VacuumDropLoc, 'Vacuum')

        const form = formidable();

        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }

            fs.mkdir(path.join(VacuumLocation, fields.BatchName), ()=>{})

            console.log("\nFiles saved to Vacuum: ")

            let fileCounter=0;
            for(let file in files){
                fileCounter++
            }

            let fileCounter2=0;
            for (let file in files){
                fileCounter2++
                let tempPath = files[file]["filepath"];
                let newPath = path.join(VacuumLocation, fields.BatchName, files[file]["originalFilename"])

                fs.rename(tempPath, newPath, ()=>{});

                if (fileCounter2<fileCounter) {
                    console.log("    "+newPath.green.bold);
                }
            }

            res.redirect('/');
        });
    })

    // SERVER //////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.listen(port, ()=>{

        var address,
        ifaces = require('os').networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
        }

        PrintVacuumDrop()
        PrintInstructions()

        console.log("Goto " + ("http://" + address + ":" + port.toString() + "/").cyan.bold.underline + " in any web browser")
        console.log("in your phone or any other device to use VacuumDrop.")
    })
}

// CUSTOM FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////////////////

function CheckClient(request, clients, isLoggedIn){
    let clientIp = request.ip;
    if (!clients.includes(clientIp)) {
        clients.push(clientIp)
        isLoggedIn[clientIp] = false
    }

    return [clientIp, clients, isLoggedIn]
}

function walk(walkPath){
    let VacuumContents = fs.readdirSync(walkPath)
    let BetterContents = {}
    let FileContents = []

    VacuumContents.forEach((Content)=>{
        let ContentPath = path.join(walkPath, Content)
        let stat = fs.statSync(ContentPath)

        if (stat.isDirectory()){
            let SubContents = walk(path.join(walkPath, Content))
            FileContents.push(SubContents)
        }else{
            FileContents.push(Content)
        }
    })

    BetterContents[walkPath.split('\\').pop().split('/').pop()] = FileContents

    return BetterContents
}

function PrintInstructions(){
    console.log("VACUUMDROP INSTRUCTIONS".bold)
    console.log("\nGeneral Instructions")
    console.log("1. Please ensure that both the devices are connected\n   to the same network (i.e. Wi-Fi, Hotspot, etc)".yellow.bold)
    console.log("2. Do not use Ctrl+C for copying link, it will stop VacuumDrop.".yellow.bold)
    console.log("\nSending Files from other devices to this PC")
    console.log("1. Goto VacuumDrop using the link below on other devices.".yellow.bold)
    console.log("2. Then click on".yellow.bold + " SEND FILES FROM PHONE/NON-SERVER PC TO SERVER PC".yellow)
    console.log("3. Now send the Files.")
    console.log("\nSending Files from this PC to other devices")
    console.log("1. Goto VacuumDrop using the link below on this PC and other devices.".yellow.bold)
    console.log("2. Then click on".yellow.bold + " SEND FILES FROM THE SERVER PC VACUUM".yellow)
    console.log("3. Now on other devices click on".yellow.bold + " GET FILES FROM VACUUM".yellow)
    console.log("4. Select open The folder and download the File/Photo on other device\n".yellow.bold)
}