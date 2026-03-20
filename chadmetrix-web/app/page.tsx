"use client";  // Важно! для использования хуков

import { Button } from "@/components/ui/button";
import { useState } from "react";  // убрали useEffect
import axios from "axios";

export default function Home() {
  const [apiMessage, setApiMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const checkBackend = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/test");
      setApiMessage(response.data.message);
    } catch (error) {
      setApiMessage("Ошибка подключения к бэкенду");
      console.error("Backend error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="space-y-4">
        <Button onClick={checkBackend} disabled={loading}>
          {loading ? "Проверка..." : "Проверить связь с бэкендом"}
        </Button>

        {apiMessage && (
          <div className="p-4 bg-green-100 text-green-700 rounded">
            {apiMessage}
          </div>
        )}
      </div>
    </main>
  );
}