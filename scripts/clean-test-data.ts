import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, "$1");
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_BUSINESS_NAMES = [
  "Parlayan Oto Yıkama",
  "Bizim Mahalle Bakkalı",
  "Lezzet Durağı Lokantası",
  "Prestij Emlak & Otomotiv",
  "Bereket Toptan Gıda",
  "KodArt Dijital Ajans"
];

async function clean() {
  console.log("Cleaning specific test businesses...");
  
  // Find businesses
  const { data: businesses, error: findError } = await supabase
    .from("businesses")
    .select("id, name")
    .in("name", TEST_BUSINESS_NAMES);
    
  if (findError) {
    console.error("Error finding businesses:", findError);
    return;
  }
  
  if (!businesses || businesses.length === 0) {
    console.log("No test businesses found.");
    return;
  }
  
  console.log(`Found ${businesses.length} businesses to delete:`, businesses.map(b => b.name).join(", "));
  
  for (const b of businesses) {
    const { error: deleteError } = await supabase
      .from("businesses")
      .delete()
      .eq("id", b.id);
      
    if (deleteError) {
      console.error(`Failed to delete ${b.name}:`, deleteError);
    } else {
      console.log(`Deleted ${b.name}`);
    }
  }
  
  console.log("Done.");
}

clean();
