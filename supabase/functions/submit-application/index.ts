
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CENTRES = [
  "NITA Mombasa",
  "NITA Kisumu",
  "E-Waka Mobility Nairobi",
] as const;

const CENTRE_FOLDERS: Record<string, string> = {
  "NITA Mombasa": "nita-mombasa",
  "NITA Kisumu": "nita-kisumu",
  "E-Waka Mobility Nairobi": "e-waka-mobility-nairobi",
};

const MAX_FILE_SIZE = 500 * 1024;
const MAX_TOTAL_SIZE = 1200 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

type UploadedFile = {
  field: string;
  path: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(name: string) {
  const extension = name.toLowerCase().match(/\.(pdf|jpg|jpeg|png)$/)?.[0];
  return `${crypto.randomUUID()}${extension || ""}`;
}

async function hasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  if (
    file.type === "application/pdf" &&
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  ) {
    return true;
  }

  if (
    file.type === "image/jpeg" &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return true;
  }

  if (
    file.type === "image/png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return true;
  }

  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonResponse({
      success: false,
      error: "Please submit the application form correctly.",
    }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Required Supabase server environment variables are missing.");
    return jsonResponse({
      success: false,
      error: "The application service is not configured yet.",
    }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const uploaded: UploadedFile[] = [];

  try {
    const form = await req.formData();

    const centre = cleanText(form.get("centre"));
    const fullName = cleanText(form.get("fullName"));
    const email = cleanText(form.get("email")).toLowerCase();
    const phone = cleanText(form.get("phone")).replace(/\D/g, "");
    const gender = cleanText(form.get("gender"));
    const ageText = cleanText(form.get("age"));
    const county = cleanText(form.get("county"));
    const industrialBackground = cleanText(form.get("industrialBackground"));

    if (!CENTRES.includes(centre as typeof CENTRES[number])) {
      return jsonResponse({ success: false, error: "Select a valid training centre." }, 400);
    }

    if (fullName.length < 2 || fullName.length > 120) {
      return jsonResponse({ success: false, error: "Enter your full name." }, 400);
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return jsonResponse({ success: false, error: "Enter a valid email address." }, 400);
    }

    if (phone.length < 9 || phone.length > 15) {
      return jsonResponse({ success: false, error: "Enter a valid phone number." }, 400);
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return jsonResponse({ success: false, error: "Select a valid gender." }, 400);
    }

    const age = Number(ageText);
    if (!Number.isInteger(age) || age < 16 || age > 100) {
      return jsonResponse({ success: false, error: "Enter a valid age." }, 400);
    }

    if (!county || county.length > 100) {
      return jsonResponse({ success: false, error: "Enter your county." }, 400);
    }

    if (!["Yes", "No"].includes(industrialBackground)) {
      return jsonResponse({
        success: false,
        error: "Answer the industrial background question.",
      }, 400);
    }

    const fileFields = [
      "nationalId",
      "kcseCertificate",
      "supportingDocument",
    ];

    let totalSize = 0;

    for (const field of fileFields) {
      const entry = form.get(field);

      if (entry === null || (entry instanceof File && entry.size === 0)) {
        continue;
      }

      if (!(entry instanceof File)) {
        return jsonResponse({ success: false, error: "Invalid document upload." }, 400);
      }

      if (!ALLOWED_TYPES.includes(entry.type)) {
        return jsonResponse({
          success: false,
          error: "Documents must be PDF, JPG, or PNG files.",
        }, 400);
      }

      if (entry.size > MAX_FILE_SIZE) {
        return jsonResponse({
          success: false,
          error: "Each document must be 500 KB or smaller.",
        }, 400);
      }

      if (!(await hasValidSignature(entry))) {
        return jsonResponse({
          success: false,
          error: "A document's file content does not match its file type.",
        }, 400);
      }

      totalSize += entry.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return jsonResponse({
        success: false,
        error: "The total size of all documents must be 1.2 MB or less.",
      }, 400);
    }

    const applicationId = crypto.randomUUID();
    const folder = CENTRE_FOLDERS[centre];

    const uploadFields = [
      { field: "nationalId", column: "national_id_path" },
      { field: "kcseCertificate", column: "kcse_certificate_path" },
      { field: "supportingDocument", column: "supporting_document_path" },
    ] as const;

    const paths: Record<string, string | null> = {
      national_id_path: null,
      kcse_certificate_path: null,
      supporting_document_path: null,
    };

    for (const item of uploadFields) {
      const entry = form.get(item.field);

      if (!(entry instanceof File) || entry.size === 0) {
        continue;
      }

      const path = `${folder}/${applicationId}/${item.field}-${safeFileName(entry.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("sponsorship-documents")
        .upload(path, entry, {
          contentType: entry.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Document upload failed:", uploadError.message);
        throw new Error("A document could not be uploaded. Please try again.");
      }

      uploaded.push({ field: item.field, path });
      paths[item.column] = path;
    }

    const { error: insertError } = await supabase
      .from("applications")
      .insert({
        id: applicationId,
        centre,
        full_name: fullName,
        email,
        phone,
        gender,
        age,
        county,
        industrial_background: industrialBackground,
        status: "Pending",
        national_id_path: paths.national_id_path,
        kcse_certificate_path: paths.kcse_certificate_path,
        supporting_document_path: paths.supporting_document_path,
      });

    if (insertError) {
      if (uploaded.length > 0) {
        await supabase.storage
          .from("sponsorship-documents")
          .remove(uploaded.map((file) => file.path));
      }

      if (insertError.code === "23505") {
        return jsonResponse({
          success: false,
          error: "An application with this email address or phone number already exists.",
        }, 409);
      }

      console.error("Application insert failed:", insertError.message);
      return jsonResponse({
        success: false,
        error: "Your application could not be saved. Please try again.",
      }, 500);
    }

    return jsonResponse({
      success: true,
      applicationId,
      message: "Application submitted successfully.",
    }, 201);
  } catch (error) {
    if (uploaded.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from("sponsorship-documents")
        .remove(uploaded.map((file) => file.path));

      if (cleanupError) {
        console.error("Upload cleanup failed:", cleanupError.message);
      }
    }

    console.error(
      "Submission function failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse({
      success: false,
      error: error instanceof Error
        ? error.message
        : "Unable to submit your application. Please try again.",
    }, 500);
  }
});
