import { supabaseClient} from "../config/supabase.js";
import { Listing } from "../types/database/listing.js";
import {PostgrestFilterBuilder} from "@supabase/postgrest-js";
import { Subject } from "rxjs";


const batchSize: number = 100;


export async function getAllListings(offset:number = 0):Promise<Listing[]> {
    return supabaseClient.from<Listing>("listing").select("*").order("id").range(offset,(offset + batchSize - 1)).then(
        async res => {
            offset += batchSize;
            console.log("Test Batch Resived : " + offset);
            if (res.data) {
                if (res.data.length == batchSize){                    
                    return res.data.concat(await getAllListings(offset))
                } else {
                    return res.data;
                }
            } else {
                console.log(res.error.message)
                return [];
            }
        }
    )
}


export class ListingHandler {
    public listings$: Subject<Listing[]> = new Subject<Listing[]>();
    public onEnd:()=> void = ()=> {};
    
    private quary:PostgrestFilterBuilder<Listing>;
    private currentCount:number = 0;
    private missingData:boolean = true;



    constructor (quary:PostgrestFilterBuilder<Listing>) {
        this.quary = quary;
    }

    public isDone(){
        return !this.missingData;
    }

    public getNextPatch() {
        const tempQuary = new PostgrestFilterBuilder(this.quary);
        tempQuary.range(this.currentCount,(this.currentCount + batchSize - 1)).then(
            response => {
                if (response.data){
                    if (response.data.length != batchSize) {
                        this.missingData = false;
                        this.onEnd();
                    } else {
                        this.getNextPatch();
                    }
                    this.currentCount += batchSize;
                    this.listings$.next(response.data);                    
                }
            }
        )
    }
}