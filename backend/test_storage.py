from app.services.storage_service import (
    SUPABASE_URL,
    SUPABASE_BUCKET,
)

print("Supabase URL configured:", bool(SUPABASE_URL))
print("Supabase bucket:", SUPABASE_BUCKET)