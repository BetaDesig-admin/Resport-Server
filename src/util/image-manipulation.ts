import Pica from 'pica';
import {Image} from '../types/image'


export const STANDARD_IMAGE_SIZE_LIMITS = {SMALL:256,MEDIUM:512}




export function ResizeImageData(
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


    const resizedImage = document.createElement('canvas')
    resizedImage.height = resizeHight;
    resizedImage.width = resizeWidth;
    const original = new Image();
    original.src = image.base64;
    
    const originalImage = document.createElement('canvas')
    originalImage.height = image.size.height;
    originalImage.width = image.size.width;
    const ctx = originalImage.getContext("2d") as CanvasRenderingContext2D 
    ctx.fillStyle = '#fff';
    ctx.drawImage(original,0,0);
    const pica = new Pica(); 
    return pica.resize(originalImage,resizedImage).then(        
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
    )
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

