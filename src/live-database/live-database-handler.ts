import * as supebase from "@supabase/supabase-js";
import { Listing } from "../types/database/listing.js";

const supabaseClient = supebase.createClient("https://xgpcwxsbbzmkryutzsld.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjMwNjUyMzI2LCJleHAiOjE5NDYyMjgzMjZ9.Pka6Tm027Brvnz39Q_LM1gewk2_n10ydx4GgH57MYeA", {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
});

const batchSize = 200;


export async function getAllLiveListings(offset:number = 0):Promise<Listing[]> {
    return supabaseClient.from<Listing>("listing").select("*").order("id").range(offset,(offset + batchSize - 1)).then(
        async res => {
            offset += batchSize;
            console.log("Live Batch Resived : " + offset);
            if (res.data) {
                if (res.data.length == batchSize){                    
                    return res.data.concat(await getAllLiveListings(offset))
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