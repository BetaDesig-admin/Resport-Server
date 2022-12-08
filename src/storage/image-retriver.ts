import {StorageFileApi} from "@supabase/storage-js/dist/module/lib/StorageFileApi"
import { Image } from "../types/image.js";
import pkg from 'request';
import { supabaseClient, supbaseName } from "../config/supabase.js";
import { decode } from "base64-arraybuffer";
import * as fs from 'fs'
import { createFile, createLogFile, imgLog } from "../util/logger.js";


const { get } = pkg;

export function GetImageFromBucket(url:string, bucket:StorageFileApi):Promise<Image>{     
    const name:string = url.split("listing-images/")[1];
    const extention = name.replace(/^.*\.(\w+)$/,"$1");
    return bucket.download(name).then(
        async response => {
            console.log("response");
            if (response.data){
                let buffer = Buffer.from(await response.data.arrayBuffer());
                const base64 = "data:image/" + extention + ';base64,' + buffer.toString('base64');
                console.log(base64);
                console.log(response.data.type);
                const image:Image = {
                    url:url,
                    base64:base64,
                    name:name,
                    extention:extention,
                }
                return image;
            } else {
                throw response.error;
            }
        }
    );
}

export async function GetImageFromUrl(imageUrl:string):Promise<Image> {
    const name = imageUrl.replace(/^.*\/(.+)$/,"$1");
    const extention = name.replace(/^.*\.(\w+)$/,"$1");

    return new Promise<Image>((resolve, reject) => {
        pkg.defaults({encoding: null}).get(imageUrl , {},(err, res, body) => {
            if (body){
                const base64  = "data:" + res.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
                const image:Image = {
                    url:imageUrl,
                    name:name,
                    extention:extention,
                    base64:base64
                }
                resolve(image);
            } else {
                console.log("GetImageFromUrl");
                console.log(imageUrl);
                reject(err)
            }
        });
    })
}
const imageBucket = supabaseClient.storage.from("listing-images");
export async function SaveImage(image:Image):Promise<string> {
    if (image.url.includes(supbaseName)){
        console.log("Skipping");
        return image.url;
    } 
    const blob = decode(image.base64.split("base64,")[1]);
    return imageBucket.upload(sanitiseImagePath(image.name),blob).then(
        res => {
            if (!res.error || (res.error as any).statusCode == '409'){
                const urlRequest = imageBucket.getPublicUrl(image.name)
                const url = urlRequest.publicURL;
                if (url){
                    imgLog(url);
                    return url;
                } else {
                    console.log("urlRequest EROOR")
                    console.log(urlRequest)
                }
            }
            console.log("Save Error");
            console.log(res.error);
            console.log((res.error as any).statusCode);
            console.log(image.url);
            throw res.error ? res.error : imageBucket.getPublicUrl(image.name).error
        }
    );
}

function sanitiseImagePath(path:string):string {
    return path.replace(/\%/g,"p")
}