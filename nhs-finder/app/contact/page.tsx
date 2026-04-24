"use client";

import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center justify-center relative">
            <Link
              href="/"
              className="absolute left-0 inline-flex items-center gap-2 rounded-md px-3 py-2 text-white/90 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>

            <div className="text-center">
              <h1 className="text-2xl font-semibold leading-tight">
                Contact Us
              </h1>
              <p className="text-sm text-white/80">
                Get in touch with our support team
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <aside className="space-y-8">
            <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
              <h3 className="text-base font-semibold text-gray-900">
                Contact Details
              </h3>

              <div className="mt-5 space-y-4">
                <ContactRow
                  title="Patient Services"
                  phone="+44 20 1234 5678"
                />
                <ContactRow
                  title="Outpatient Queries"
                  phone="+44 20 1234 5679"
                />
                <ContactRow
                  title="Critical Care"
                  phone="+44 20 1234 5680"
                />
                <ContactRow
                  title="General Intensive Therapy Unit"
                  phone="+44 20 1234 5681"
                />
                <ContactRow
                  title="Hyper Acute Stroke Unit"
                  phone="+44 20 1234 5682"
                />
                <ContactRow
                  title="Diagnostic Cardiology Department"
                  phone="+44 20 1234 5683"
                />
                <ContactRow
                  title="Emergency Care"
                  phone="+44 20 1234 5684"
                  variant="danger"
                />
                <ContactRow
                  title="Emergency Line"
                  phone="999"
                  variant="danger"
                />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
              <h3 className="text-base font-semibold text-gray-900">
                Other Ways to Reach Us
              </h3>

              <div className="mt-5 space-y-4">
                <InfoRow
                  icon={<Mail className="h-5 w-5 text-white" />}
                  title="Email"
                  lines={["support@nhspathfinder.nhs.uk"]}
                />
                <InfoRow
                  icon={<MapPin className="h-5 w-5 text-white" />}
                  title="Address"
                  lines={[
                    "Northern General Hospital",
                    "Herries Road",
                    "Sheffield",
                    "S5 7AU",
                  ]}
                />
                <InfoRow
                  icon={<Clock className="h-5 w-5 text-white" />}
                  title="Support Hours"
                  lines={["Mon - Fri: 9:30 AM - 4:00 PM"]}
                />
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ContactRow({
  title,
  phone,
  variant = "normal",
}: {
  title: string;
  phone: string;
  variant?: "normal" | "danger";
}) {
  const isDanger = variant === "danger";

  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          isDanger ? "bg-red-600" : "bg-blue-700",
        ].join(" ")}
      >
        <Phone className="h-5 w-5 text-white" />
      </div>

      <div className="min-w-0">
        <p
          className={[
            "text-sm font-semibold",
            isDanger ? "text-red-700" : "text-gray-900",
          ].join(" ")}
        >
          {title}
        </p>
        <p className="text-sm text-gray-600">{phone}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <div className="mt-1 space-y-0.5">
          {lines.map((l, idx) => (
            <p key={idx} className="text-sm text-gray-600">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
