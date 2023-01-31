import sharp from 'sharp';
import { shareReplay } from 'rxjs';
import {Image} from '../types/image'


export const STANDARD_IMAGE_SIZE_LIMITS = {SMALL:256,MEDIUM:512}



const base64 = "base64,";
export async function ResizeImageData(
    image:Image,
    limits:Limits ={
    maxWidth: STANDARD_IMAGE_SIZE_LIMITS.MEDIUM,
    maxHeight:STANDARD_IMAGE_SIZE_LIMITS.MEDIUM}
):Promise <Image> {    
    if (!image.size) throw new Error("");

    let resizeWidth = image.size.width;
    let resizeHight = image.size.height;

    
    if (image.size.height > limits.maxHeight || image.size.width > limits.maxWidth){
        if (image.size.width > image.size.height){
            const fac = image.size.width / limits.maxWidth;
            resizeWidth = limits.maxWidth;
            resizeHight /= fac;
        } else {
            const fac = image.size.height / limits.maxHeight;
            resizeHight = limits.maxHeight;
            resizeWidth /= fac;
        }        
    }
    resizeWidth = Math.floor(resizeWidth);
    resizeHight = Math.floor(resizeHight);

    const parts = image.base64.split(base64);
    return sharp(Buffer.from(parts[1], 'base64'))
        .resize(Math.floor(resizeWidth),Math.floor(resizeHight))
        .toBuffer()
        .then(
            resizedImageBuffer => {
                const newBase64 = parts[0] + base64 + resizedImageBuffer.toString('base64');
                return {
                    name:image.name,
                    extention:image.extention,
                    url:image.url,
                    base64:newBase64,
                    size:{
                        width:resizeWidth,
                        height:resizeHight
                    }
                }                
            }
        )
    /*
    const resizedImage = new Canvas.Canvas(resizeWidth,resizeHight);
    const original = new Canvas.Image();
    original.src = image.base64;
    
    const originalImage = new Canvas.Canvas(image.size.width,image.size.height);
    const ctx = originalImage.getContext("2d"); 
    ctx.fillStyle = '#fff';
    ctx.drawImage(original,0,0);
    const pica = new Pica(); 
    originalImage.
    return pica.resize(originalImage as any,resizedImage as any).then(        
        result => {
            const uri = result.toDataURL("image/jpeg",0.7)
            return {
                name:image.name,
                url:image.url,
                extention:image.extention,
                size:{
                    height:result.height,
                    width:result.width
                },
                base64:uri,
            }
        }
    ) */
}

export function BasicLimits(size:number):Limits {
    return {
        maxHeight:size,
        maxWidth:size
    }
}

export type Limits = {
    maxWidth:number,
    maxHeight:number
}

