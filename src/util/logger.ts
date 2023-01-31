import * as fs from 'fs'
import {dirname} from 'path'

export function createLogFile(name:string,text:string){    
    fs.writeFile("log-" + name + ".text", text,()=> {
        console.log("Done");
    });
}

export function createFile(name:string,text:string){    
    fs.mkdir(dirname(name),{recursive:true}, err=>{
        if (err){
            console.log("err creating folder");             
            console.log(err);

        } else {
            fs.writeFile(name, text,(err)=> {
                if(err){
                    console.log("err creating file");             
                    console.log(err);
                } else {
                    console.log("Done");
                }
            });
        }
    })
}

export let Logging:boolean = true;
const  imglogStream = fs.createWriteStream("img-log.txt", {flags:'a'});
export function imgLog(name:string){
    imglogStream.write(name + "\n");
}

export function EndLogging() {
    imglogStream.end();
    compiledStream.end();
    Logging = false;
}

const compressFile:string = "compiled-log.txt";

const compiledIds = fs.readFileSync(compressFile).toString('utf-8').split(",").filter(word=> word!= "").map(word => parseInt(word))

export function GetCompiledIds():number[]{
    return compiledIds;
}


const  compiledStream = fs.createWriteStream(compressFile, {flags:'a'});
export function compileLog(id:number){
    compiledStream.write(id + ",");
}
