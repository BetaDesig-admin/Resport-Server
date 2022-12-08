import { supabaseClient} from "../config/supabase.js";
import { Listing } from "../types/database/listing.js";
import {PostgrestFilterBuilder} from "@supabase/postgrest-js";
import { Subject } from "rxjs";


export function getAllListings () {
   return supabaseClient.from<Listing>("listing").select("*").then(
    response => (response.data) ? response.data : []
   );
}


export class ListingHandler {
    public listings$: Subject<Listing[]> = new Subject<Listing[]>();
    public onEnd:()=> void = ()=> {};
    
    private quary:PostgrestFilterBuilder<Listing>;
    private currentCount:number = 0;
    private batchSize: number = 200;
    private missingData:boolean = true;



    constructor (quary:PostgrestFilterBuilder<Listing>) {
        this.quary = quary;
    }

    public isDone(){
        return !this.missingData;
    }

    public getNextPatch() {
        console.log("Getting batch");
        console.log("From " + this.currentCount + " to " + (this.currentCount + this.batchSize));
        const tempQuary = new PostgrestFilterBuilder(this.quary);
        tempQuary.range(this.currentCount,(this.currentCount + this.batchSize - 1)).then(
            response => {
                if (response.data){
                    console.log("size " + response.data.length);
                    if (response.data.length != this.batchSize) {
                        console.log("Last batch")
                        this.missingData = false;
                        this.onEnd();
                    } else {
                        this.getNextPatch();
                    }
                    this.currentCount += this.batchSize;
                    this.listings$.next(response.data);                    
                }
            }
        )
    }
}