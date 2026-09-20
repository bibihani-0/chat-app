"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        marginTop: "16px",
        padding: "8px 16px",
        borderRadius: "6px",
        border: "none",
        background: "#ef4444",
        color: "white",
        cursor: "pointer",
      }}
    >
      Log Out
    </button>
  );
}
