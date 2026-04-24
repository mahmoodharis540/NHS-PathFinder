// app/contact/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ChevronDown,
} from "lucide-react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  category: string;
  building: string;
  message: string;
};

export default function ContactUsPage() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    category: "",
    building: "",
    message: "",
  });

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Replace this with your API call later
    console.log("Contact form submitted:", form);
    alert("Message sent (demo). Hook this up to your backend when ready!");
    setForm({
      fullName: "",
      email: "",
      phone: "",
      category: "",
      building: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
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

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: Form card */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="p-7">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                  <Send className="h-4 w-4 text-gray-700" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Send us a Message
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Fill out the form below and we&apos;ll get back to you as soon
                    as possible
                  </p>
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Full Name
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    className="h-11 w-full rounded-lg bg-gray-50 px-4 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Email Address
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="your.email@example.com"
                    type="email"
                    className="h-11 w-full rounded-lg bg-gray-50 px-4 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Phone Number{" "}
                    <span className="font-normal text-gray-500">(Optional)</span>
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+44 20 1234 5678"
                    type="tel"
                    className="h-11 w-full rounded-lg bg-gray-50 px-4 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Subject Category
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className="h-11 w-full appearance-none rounded-lg bg-gray-50 px-4 pr-10 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
                      required
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      <option value="patient-services">Patient Services</option>
                      <option value="appointments">Appointments</option>
                      <option value="directions">Directions / Wayfinding</option>
                      <option value="technical">Technical Support</option>
                      <option value="feedback">Feedback / Complaints</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Related Building{" "}
                    <span className="font-normal text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.building}
                      onChange={(e) => update("building", e.target.value)}
                      className="h-11 w-full appearance-none rounded-lg bg-gray-50 px-4 pr-10 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select a building</option>
                      <option value="northern-general">
                        Northern General Hospital
                      </option>
                      <option value="royal-hallamshire">
                        Royal Hallamshire Hospital
                      </option>
                      <option value="weston-park">Weston Park Hospital</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Please describe your inquiry or issue in detail..."
                    className="min-h-[140px] w-full resize-none rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            </div>
          </section>

          {/* Right column */}
          <aside className="space-y-8">
            {/* Contact details */}
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

            {/* Other ways */}
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
                  lines={[
                    "Mon - Fri: 9:30 AM - 4:00 PM",
                  ]}
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