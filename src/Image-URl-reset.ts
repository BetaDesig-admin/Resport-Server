import { supabaseClient } from "./config/supabase.js";
import { Listing } from "./types/database/listing.js";
import { ListFormat } from "typescript";
import { getAllListings } from "./database/listing-handler.js";
import { getAllLiveListings } from "./live-database/live-database-handler.js";
import { concatMap, delay, delayWhen, from, interval, mergeMap, of, timer } from "rxjs";

export function ImageUrlReset () {
    let count = 0;
    from(Promise.all([getAllListings(),getAllLiveListings()]).then(
        ([testListings,liveListings])=> {
            console.log("Got data");
            return braid(testListings,liveListings);
        }
    )).pipe(
        mergeMap(pairs => pairs), 
        concatMap(pair => of(pair).pipe(delay(10))),
        mergeMap(pair => {
            if (pair.test.images && pair.test.images.length > 0 && pair.test.images[0] == pair.live.images[0]) return of({error:null});
            pair.live.images = (pair.live.status != "deleted") ? pair.live.images : [];            
            return  supabaseClient.from<Listing>("listing").update({images:pair.live.images}).eq("id",pair.test.id).throwOnError(true);
        })
    ).subscribe((res)=> {
        console.log(res.error?.message)
    }
    )
}
ImageUrlReset (); 


function braid (testSet:Listing[],liveSet:Listing[]):{test:Listing,live:Listing}[]{
    if (testSet.length == 0) {
        return []
    } else if (testSet[0].id == liveSet[0].id) {
        return braid(testSet.slice(1),liveSet.slice(1)).concat([{test:testSet[0],live:liveSet[0]}])
    } else {
        return braid(testSet,liveSet.slice(1));
    }
}