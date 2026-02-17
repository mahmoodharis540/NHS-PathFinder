//imports
import LanguageSelector from "@/components/Languages";
import { useTranslations } from "next-intl";



//main function
function LoginPage() {
    //const t = useTranslations("login");
    return (



        //form
        <div className="flex flex-col items-center justify-center text-center min-h-screen px-4">

            <div className="absolute top-4 right-4">
                <LanguageSelector />
            </div>

            <h1 className="text-2xl m-4">{t("Welcome")}</h1>
            <form className="border border-gray-300 p-4 rounded">
                <label htmlFor="uname"><b>{t("Username")}</b></label>
                <input className="border border-gray-300 m-2" type="text" placeholder={t("EnterUsername")} name="uname" required></input> <br />
                <br />

                <label htmlFor="pass"><b>{t("Password")}</b></label>
                <input className="border border-gray-300 m-2" type="text" placeholder={t("EnterPassword")} name="pass" required></input><br />

                <button className="bg-blue-600 text-white border border-black px-4 py-2 rounded-md m-2" type="button">Login</button>
            </form>

        </div>

    )
}

export default LoginPage;
