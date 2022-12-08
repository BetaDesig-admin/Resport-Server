import {supabaseClient} from './config/supabase.js'
import {Listing} from './types/database/listing'
import * as fs from 'fs'



function CompressUserImages() {
    console.log("Hallow world");
    supabaseClient.from<Listing>("listing").select("*").eq("id",10421).then( 
        res => {
            console.log(res);
            res.data?.forEach(
                listing => handleListing(listing)
            )
        }
    )
    return "?"
}

CompressUserImages()


function retriveListings() {

}

function downloadImages() {

}

function transformImages() {

}

function saveImages() {

}

function removeOldImages() {

}

function updateListings(){
    
}






const imageBucket = supabaseClient.storage.from("listing-images");
function handleListing(listing:Listing) {
    console.log(listing);
    listing.images.forEach(
        imageUrl => {            
            const fileName:string = imageUrl.split("listing-images/")[1]
            const extention = "image/png";
            console.log("File name");
            console.log(fileName);
            imageBucket.download(fileName).then(
                async response => {
                    console.log("response");
                    if (response.data){
                        let buffer = Buffer.from(await response.data.arrayBuffer());
                        const base64 = "data:" + extention + ';base64,' + buffer.toString('base64');
                        console.log(base64);
                        console.log(response.data.type);
                    }
                }
            );
        }
    )
}

