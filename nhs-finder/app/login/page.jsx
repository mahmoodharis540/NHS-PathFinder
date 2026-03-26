"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Languages from "@/components/Languages";
import { useTranslations } from "next-intl";

function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const [error, setError] = useState("");

  async function loginFunc(e) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);
    const pass = formData.get("pass");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pass }),
    });

    if (!res.ok) {
      setError("Something went wrong. Please try again later.");
      return;
    }

    const data = await res.json();

    if (data.success) {
      router.replace("/login/admin");
    } else {
      setError("Incorrect password. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <div className="absolute top-4 left-4">
        <Languages />
      </div>
      <div className="flex flex-col items-center justify-center text-center min-h-screen px-4">
        <h1 className="text-2xl m-4">{t("Welcome")}</h1>

        <form
          onSubmit={loginFunc}
          className="rounded border border-gray-300 bg-white p-4 text-black dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <label htmlFor="pass">
            <b>{t("Password")}</b>
          </label>
          <input
            className="m-2 border border-gray-300 p-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            type="password"
            placeholder={t("EnterPassword")}
            name="pass"
            required
          />

          {error && (
            <p className="text-red-600 text-sm mt-1 mb-1">{error}</p>
          )}

          <br />
          <button
            className="bg-blue-600 text-white border border-black px-4 py-2 rounded-md m-2"
            type="submit"
          >
            {t("Login")}
          </button>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;
