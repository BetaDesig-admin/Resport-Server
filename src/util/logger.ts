import * as fs from 'fs'

export function createLogFile(name:string,text:string){    
    fs.writeFile("log-" + name + ".text", text,()=> {
        console.log("Done");
    });
}

export function createFile(name:string,text:string){    
    fs.writeFile(name, text,()=> {
        console.log("Done");
    });
}

const  stream = fs.createWriteStream("img-log.txt", {flags:'a'});
export function imgLog(name:string){
    stream.write(name + "\n");
}

export function EndLogging() {
    stream.end();
}