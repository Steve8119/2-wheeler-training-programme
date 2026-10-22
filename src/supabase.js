
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yrbnzjlvsbnnedmwuzmh.supabase.co";
const supabaseKey = "sb_publishable_LMPuDRUOG4fuCaYSct1DRQ_GLKLpRC_";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
