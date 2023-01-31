
import { Image } from "../types/image.js";
import pkg from 'request';
import { supabaseClient, supbaseName } from "../config/supabase.js";
import { decode } from "base64-arraybuffer";
import { imgLog } from "../util/logger.js";
import sizeOf from "image-size"
import { Listing } from "../types/database/listing.js";

const { get } = pkg;
const imageBucket = supabaseClient.storage.from("listing-images");

export function GetImageFromBucket(url:string,sellerID:number):Promise<Image | null>{     
    url = sanitiseImagePath(url);
    const name:string = url.replace(/^.*\/(.*\..*)$/,"$1");
    const extention = name ? name.replace(/^.*\.(\w+)$/,"$1") : "txt";
    if (extention == "txt") console.log("Weird error with " + url)
    return imageBucket.download(sellerID + "/" + name).then(
        async response => {
            if (response.data){
                let buffer = Buffer.from(await response.data.arrayBuffer());
                if (buffer.length == 0) return null;
                try {                
                    var dimensions = sizeOf(buffer);
                const base64 = "data:image/" + extention + ';base64,' + buffer.toString('base64');
                const image:Image = {
                    url:url,
                    base64:base64,
                    name:name,
                    extention:extention,
                    size:{
                        width:dimensions.width!,
                        height:dimensions.height!
                    }
                }
                return image;
                } catch (error) {
                    imgLog(url + " Error: " + error)
                    return null;
                }
            } else {
                console.log("Error occured when getting image from bucket");
                console.log(sellerID + "/" + name);
                console.log(response.error);
                imgLog(url + " Error: " + response.error)
                return null;
            }
        }
    );
}

export async function GetImageFromUrl(imageUrl:string):Promise<Image> {
    const name = imageUrl.replace(/^.*\/(.*\..*)$/,"$1");
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

export async function DeleteImage(imageUrl:string) {
    const name:string = imageUrl.split("listing-images/")[1];
    return imageBucket.remove([name]).catch(
        err => {
            console.log("Error when deleting image: " + imageUrl);
            console.log(err);
            return err;
        }
    );
}



export async function SaveImage(image:Image, listing:Listing):Promise<string> {
    image.name = sanitiseImagePath(image.name);
    const blob = decode(image.base64.split("base64,")[1]);
    const path = listing.seller +"/" + listing.id + "/" + image.name; 
    return imageBucket.upload(path,blob).then(
        res => {
            if (!res.error || (res.error as any).statusCode == '409'){
                const urlRequest = imageBucket.getPublicUrl(path)
                const url = urlRequest.publicURL;
                if (url){
                    return url;
                } else {
                    console.log("urlRequest EROOR")
                    console.log(urlRequest)
                }
            }
            throw res.error ? res.error : imageBucket.getPublicUrl(image.name).error
        }
    );
}

function sanitiseImagePath(path:string):string {
    return path.replace(/\%/g,"p")
}