import { supabaseClient } from './config/supabase.js';
import {  mergeMap, Observable,of,map,switchMap,tap, from } from 'rxjs';
import {Listing} from './types/database/listing.js'
import {Image} from './types/image.js'
import { ListingHandler } from './database/listing-handler.js';
import { GetImageFromUrl, SaveImage } from './storage/image-retriver.js';
import { EndLogging } from './util/logger.js';


let total: number = 0;
let current:number = 0;
async function transferImages() {
    console.log("Begining Transfer");
    total = 0;
    total = current;
    const listingHandler:ListingHandler = new ListingHandler(retrivelistings());
    listingHandler.onEnd = finish;
    listingHandler.listings$.pipe(
        mergeMap(listings => listings),
        mergeMap(async listing => {return {listing:listing, images: await downloadImages(listing)}}),
        mergeMap(async ({listing,images})=> updateListing(listing, await saveImages(images))),
    ).subscribe({
        next: res => {
            current++;
            
            //console.log("Finished " + current + " out of " + total); 
        },
        error: err => {
            console.log("Error");
            console.log(err);
            finish();
        }
    });
    listingHandler.getNextPatch();
}

//transferImages();

function finish() {
    EndLogging();
}

function retrivelistings () {    
   return supabaseClient.from<Listing>("listing").select("*").neq("id",2489)
}

async function downloadImages (listing:Listing): Promise<Image[]> {    
    return (listing.images) ? Promise.all(listing.images.filter(img => img.includes("http")).map(imageUrl  =>  GetImageFromUrl(imageUrl))) :  []; 
}

async function saveImages (images:Image[]):Promise<string[]> {
    return Promise.all( images.map(img => SaveImage(img))); 
}

function updateListing (listing:Listing,imageUrls:string[]) {
    console.log(listing.id);
    imageUrls.forEach(img => console.log(img))
    return supabaseClient.from<Listing>("listing").update({images:imageUrls}).eq("id",listing.id).then(
        res=>{
            if (res.error){
                console.log("updateListing");
                console.log(res.error);
                console.log(listing.id);
                imageUrls.forEach(img => console.log(img))
                throw res.error
            }
            return res
        }
    );
}

