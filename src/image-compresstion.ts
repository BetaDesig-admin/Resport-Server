import {supabaseClient} from './config/supabase.js'
import {Listing} from './types/database/listing'
import * as fs from 'fs'
import { ListingHandler } from './database/listing-handler.js';
import { concatMap, delay, map, merge, mergeMap, of, tap } from 'rxjs';
import { DeleteImage, GetImageFromBucket, SaveImage } from './storage/image-retriver.js';
import { Image } from './types/image.js';
import * as t from 'typescript/lib/typescript'
import { ResizeImageData, BasicLimits, STANDARD_IMAGE_SIZE_LIMITS } from './util/image-manipulation.js';
import { compileLog, createFile, EndLogging, GetCompiledIds, Logging } from './util/logger.js';


let totalCount: number = 0;
let count: number = 0;

function CompressUserImages() {
    console.log("Begin Compression");
    const listingHandler:ListingHandler = new ListingHandler(retriveListings());
    listingHandler.listings$.pipe(
        map(listings => {
            totalCount += listings.length;
            listings.forEach(listig => {
                if (listig.id == 1924){
                    console.log("Found");
                    console.log(listig);
                }
            })
            const finsishedID = GetCompiledIds();
            const filteredListings = listings.filter(listing => !finsishedID.includes(listing.id));
            return filteredListings;
        }),
        mergeMap(listings => listings.filter(listing => listing.images && listing.images.length > 0)),
        concatMap(listing => of(listing).pipe(delay(10))),
        mergeMap(async listing => {return {listing:listing, images: await downloadImages(listing)}}),
        mergeMap(async data => {return {listing:data.listing, images: await resizeImages(data.listing,data.images)}}),
        mergeMap(async data => {return {listing:data.listing, images: await Promise.all (data.images.map(imageSet => saveImageSet(data.listing,imageSet)))}}),
    ).subscribe({
        next: res => {
            if (Logging){
                compileLog(res.listing.id);
            }
            console.log(count++ + "/" + totalCount);
        },
        error: (err)=> {
            console.log("err CompressUserImages");
            console.log(err);
            EndLogging()
        }
    }
    )
    listingHandler.onEnd = EndLogging;
    listingHandler.getNextPatch();
}

CompressUserImages()


function retriveListings() {
    return supabaseClient.from<Listing>("listing").select("*").neq("id",2489).neq("id",2323)
}

async function downloadImages(listing:Listing):Promise<Image[]> {
    return (listing.images) ? Promise.all(
        listing.images
                .filter(img => img.includes("http"))
                .map(imageUrl  =>  GetImageFromBucket(imageUrl,listing.seller))                
    ).then(
        images => {
            return images.filter<Image>(notEmpty) 
        }
    ).catch(err => {
        console.log("error when downloading image");
        return err
    }) :  []; 
}
function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    if (value === null || value === undefined) return false;
    const testDummy: TValue = value;
    return true;
  }
async function resizeImages(listing:Listing,imageData:Image[]) {
    return await Promise.all(  imageData.map(async img => {
        return await Promise.all([
            ResizeImageData(img,BasicLimits(STANDARD_IMAGE_SIZE_LIMITS.MEDIUM)),
            ResizeImageData(img,BasicLimits(STANDARD_IMAGE_SIZE_LIMITS.SMALL)),
        ]).then (
            ([standardImage,smallImage])=> {
                const imgName = img.name.replace("." + img.extention,"");
                smallImage.name = imgName + "-small." + img.extention;
                standardImage.name  = imgName + "." + img.extention;
                return {standard:standardImage,small:smallImage}
            }
        ).catch(
            err => {
                console.log("Error resizeImages");
                console.log(err);
                return err;
            }
        )
    }))
}

async function saveImageSet(listing:Listing,imageSet:{standard:Image,small:Image}):Promise<string> {
    return Promise.all([
        SaveImage(imageSet.standard,listing),
        SaveImage(imageSet.small,listing),
    ]).then(
        ([standard,small])=> {
            return standard;
        }
    ).catch(
        err => {
            console.log("Error saveImageSet");
            console.log(err);
            return err;

        }
    )
}


async function updateListings(listing:Listing,newImageUrls:string[]):Promise<Listing>{
    return supabaseClient.from<Listing>("listing").update({images:newImageUrls}).eq("id",listing.id).then(
        res => {
            if (res.error){
                console.log("updateListing");                
                console.log(newImageUrls)
                console.log(res.error);
                console.log(listing.id);
                newImageUrls.forEach(img => console.log(img))
                throw res.error
            }
            return listing;
        }
    )
}
/*
async function removeOldImages(listing:Listing) {
    return listing.images.map(img => {
        DeleteImage(img).catch(
            err => {
                console.log("Error removeOldImages");
                console.log(err);
                return err;    
            }            
        )
    })

}
*/
