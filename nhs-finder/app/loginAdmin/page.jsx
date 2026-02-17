"use client";


import Languages from "@/components/Languages";
import { useTranslations } from "next-intl";


function LoginPage() {
  const t = useTranslations("login");

  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <div className="absolute top-4 right-4">
        <Languages />
      </div>

      <div className="flex flex-col items-center justify-center text-center min-h-screen px-4">
        <h1 className="text-2xl m-4">{t("Welcome")}</h1>

        <form className="border border-gray-300 p-4 rounded bg-white text-black">
          <label htmlFor="uname">
            <b>{t("Username")}</b>
          </label>
          <input className="border border-gray-300 m-2 p-1" type="text" placeholder={t("EnterUsername")} name="uname"required />
          <br />
          <br />

          <label htmlFor="pass">
            <b>{t("Password")}</b>
          </label>
          <input className="border border-gray-300 m-2 p-1" type="password" placeholder={t("EnterPassword")} name="pass" required />
          <br />

          <button className="bg-blue-600 text-white border border-black px-4 py-2 rounded-md m-2" type="button"> {t("Login")} </button>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;
