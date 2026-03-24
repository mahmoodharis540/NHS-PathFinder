"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import ManagePathsSection from "@/components/ManagePathsSection";
import AdminSearchDropdown from "@/components/AdminSearchDropdown";
import AdminBuildingSelect from "@/components/AdminBuildingSelect";

type Building = {
  BuildingID: number;
  BuildingName: string;
};

type ExistingMediaItem = {
  MediaID: number;
  Media: string;
  MediaDesc?: string | null;
};

type EditingPath = {
  id: number;
  pathName: string;
  buildingId: number;
  building?: string;
  startId?: number;
  endId?: number;
  startName: string;
  endName: string;
  statusId?: number;
  statusType: string;
  accessToggle: number;
  date?: string;
  description?: string;
  media?: ExistingMediaItem[];
};

function moveItem<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

type SimpleVoice = {
  name: string;
  lang: string;
};

export default function StaffPortalPage() {
  const router = useRouter();
  const t = useTranslations("staff");

  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const [editingPath, setEditingPath] = useState<EditingPath | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  const [buildingId, setBuildingId] = useState<string>("");
  const [pathName, setPathName] = useState("");
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");
  const [description, setDescription] = useState("");
  const [accessible, setAccessible] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [existingDragIndex, setExistingDragIndex] = useState<number | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const speechSupported = useMemo(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }, []);

  const ttsLanguages = useMemo(
    () => [
      { value: "en-GB", label: "English (UK)" },
      { value: "en-US", label: "English (US)" },
      { value: "pl-PL", label: "Polski (PL)" },
      { value: "fr-FR", label: "Français (FR)" },
      { value: "es-ES", label: "Español (ES)" },
    ],
    []
  );

  const [ttsLang, setTtsLang] = useState<string>("en-GB");
  const [voices, setVoices] = useState<SimpleVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  const refreshVoices = () => {
    if (typeof window === "undefined") return;
    const raw = window.speechSynthesis.getVoices?.() ?? [];
    const mapped: SimpleVoice[] = raw.map((v) => ({ name: v.name, lang: v.lang }));
    setVoices(mapped);
  };

  useEffect(() => {
    if (!speechSupported) return;

    refreshVoices();

    const handler = () => refreshVoices();
    window.speechSynthesis.onvoiceschanged = handler;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechSupported]);

  const voicesForLang = useMemo(() => {
    const langLower = ttsLang.toLowerCase();
    return voices.filter((v) => v.lang?.toLowerCase() === langLower);
  }, [voices, ttsLang]);

  useEffect(() => {
    if (!speechSupported) return;

    if (selectedVoiceName && voicesForLang.some((v) => v.name === selectedVoiceName)) return;

    if (voicesForLang.length > 0) {
      setSelectedVoiceName(voicesForLang[0].name);
      return;
    }

    const base = ttsLang.split("-")[0]?.toLowerCase();
    const baseMatch = voices.find((v) => (v.lang ?? "").toLowerCase().startsWith(base));
    if (baseMatch) {
      setSelectedVoiceName(baseMatch.name);
    } else if (voices.length > 0) {
      setSelectedVoiceName(voices[0].name);
    } else {
      setSelectedVoiceName("");
    }
  }, [speechSupported, ttsLang, voicesForLang, voices, selectedVoiceName]);

  const stopSpeaking = () => {
    if (typeof window === "undefined") return;
    try {
      window.speechSynthesis.cancel();
    } finally {
      setIsSpeaking(false);
    }
  };

  const speakDescription = () => {
    if (!speechSupported) return;

    const text = description.trim();
    if (!text) return;

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    const rawVoices = window.speechSynthesis.getVoices?.() ?? [];
    const chosen = rawVoices.find((v) => v.name === selectedVoiceName);
    if (chosen) utterance.voice = chosen;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const loadBuildings = async () => {
      setLoadingBuildings(true);
      setMessage("");
      try {
        const res = await fetch("/api/buildings");
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data: Building[] = JSON.parse(text);
        setBuildings(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setMessage(e?.message ?? t("failedLoadBuildings"));
      } finally {
        setLoadingBuildings(false);
      }
    };

    loadBuildings();
  }, [t]);

  useEffect(() => {
    if (!editingPath) return;

    setBuildingId(String(editingPath.buildingId ?? ""));
    setPathName(editingPath.pathName ?? "");
    setStartName(editingPath.startName ?? "");
    setEndName(editingPath.endName ?? "");
    setAccessible(Number(editingPath.accessToggle) === 1);
    setDescription(editingPath.description ?? "");
    setExistingMedia(editingPath.media ?? []);
    setRemovedMediaIds([]);
    setFiles([]);
    setTab("upload");
    stopSpeaking();
  }, [editingPath]);

  const clearForm = () => {
    setBuildingId("");
    setPathName("");
    setStartName("");
    setEndName("");
    setDescription("");
    setAccessible(false);
    setFiles([]);
    setExistingMedia([]);
    setRemovedMediaIds([]);
    setEditingPath(null);
    stopSpeaking();
  };

  const canSubmit = useMemo(() => {
    if (editingPath) {
      return (
        pathName.trim().length > 0 &&
        startName.trim().length > 0 &&
        endName.trim().length > 0 &&
        !isSaving
      );
    }

    return (
      pathName.trim().length > 0 &&
      startName.trim().length > 0 &&
      endName.trim().length > 0 &&
      files.length > 0 &&
      !isSaving
    );
  }, [editingPath, pathName, startName, endName, files.length, isSaving]);

  const openFilePicker = () => fileInputRef.current?.click();

  const addFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setFiles((prev) => moveItem(prev, idx, idx - 1));
  };

  const moveDown = (idx: number) => {
    if (idx >= files.length - 1) return;
    setFiles((prev) => moveItem(prev, idx, idx + 1));
  };

  const removeExistingMedia = (idx: number) => {
    setExistingMedia((prev) => {
      const item = prev[idx];
      if (item) {
        setRemovedMediaIds((old) => [...old, item.MediaID]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const moveExistingMediaUp = (idx: number) => {
    if (idx <= 0) return;
    setExistingMedia((prev) => moveItem(prev, idx, idx - 1));
  };

  const moveExistingMediaDown = (idx: number) => {
    if (idx >= existingMedia.length - 1) return;
    setExistingMedia((prev) => moveItem(prev, idx, idx + 1));
  };

  const submit = async (statusType: "Active" | "Draft") => {
    setMessage("");
    setIsSaving(true);

    try {
      const fd = new FormData();

      if (buildingId) fd.append("buildingId", buildingId);

      fd.append("pathName", pathName.trim());
      fd.append("startName", startName.trim());
      fd.append("endName", endName.trim());
      fd.append("description", description.trim());
      fd.append("statusType", statusType);
      fd.append("accessToggle", accessible ? "1" : "0");

      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      fd.append("date", date);

      fd.append(
        "existingMediaOrder",
        JSON.stringify(existingMedia.map((m) => m.MediaID))
      );
      fd.append("removedMediaIds", JSON.stringify(removedMediaIds));

      for (const f of files) fd.append("files", f);

      const url = editingPath ? `/api/manage/${editingPath.id}` : "/api/admin/path";
      const method = editingPath ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setMessage(
        editingPath
          ? "Path updated successfully."
          : statusType === "Draft"
          ? t("savedDraft")
          : t("uploadedPath")
      );

      clearForm();
      setTab("manage");
    } catch (e: any) {
      setMessage(e?.message ?? (editingPath ? "Update failed." : t("uploadFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#003087] text-white px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xl select-none hover:opacity-80 transition"
            aria-label={t("back")}
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-sm opacity-80">{t("subtitle")}</p>
          </div>
        </div>

        <Link href="/settings" className="bg-white text-[#003087] p-2 rounded-full hover:bg-gray-100 transition">
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      <div className="px-8 mt-6">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("upload")}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              tab === "upload" ? "bg-black text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            {t("uploadTab")}
          </button>

          <button
            onClick={() => setTab("manage")}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              tab === "manage" ? "bg-black text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            {t("manageTab")}
          </button>
        </div>
      </div>

      {tab === "upload" && (
        <div className="px-8 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-2">
              {editingPath ? "Edit Path" : t("uploadNewPath")}
            </h2>

            <p className="text-gray-500 mb-6">
              {editingPath ? "Update the selected path details below." : t("uploadDescription")}
            </p>

            {message && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                {message}
              </div>
            )}

            {editingPath && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Editing path ID: {editingPath.id}
              </div>
            )}

            <AdminBuildingSelect
              buildings={buildings}
              value={buildingId}
              onChange={setBuildingId}
              disabled={loadingBuildings}
              onBuildingCreated={(b) => setBuildings((prev) => [b, ...prev])}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{t("pathName")}</label>
              <input
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                placeholder={t("pathNamePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <AdminSearchDropdown
                  label={t("startPoint")}
                  placeholder={t("startPointPlaceholder")}
                  apiUrl="/api/entrances"
                  buildingId={buildingId}
                  isEntrance={1}
                  value={startName}
                  onChangeText={setStartName}
                  labelClassName="text-gray-900"
                />
              </div>

              <div>
                <AdminSearchDropdown
                  label={t("endPoint")}
                  placeholder={t("endPointPlaceholder")}
                  apiUrl="/api/destinations-search"
                  buildingId={buildingId}
                  isEntrance={0}
                  value={endName}
                  onChangeText={setEndName}
                  labelClassName="text-gray-900"
                />
              </div>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <input
                id="accessible"
                type="checkbox"
                checked={accessible}
                onChange={(e) => setAccessible(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="accessible" className="text-sm">
                {t("accessibleRoute")}
              </label>
            </div>

            {editingPath && existingMedia.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Current media</p>
                  <p className="text-xs text-gray-500">Top item shows first</p>
                </div>

                <div className="space-y-3">
                  {existingMedia.map((item, idx) => {
                    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(item.Media);

                    return (
                      <div
                        key={item.MediaID}
                        draggable
                        onDragStart={() => setExistingDragIndex(idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (existingDragIndex === null || existingDragIndex === idx) return;
                          setExistingMedia((prev) => moveItem(prev, existingDragIndex, idx));
                          setExistingDragIndex(null);
                        }}
                        onDragEnd={() => setExistingDragIndex(null)}
                        className="rounded-lg border border-gray-200 p-3 bg-white"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-gray-400 select-none">☰</span>
                            <span className="text-gray-500 w-6 text-right select-none">{idx + 1}.</span>
                            <span className="text-xs text-gray-500 truncate">
                              Media ID: {item.MediaID}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveExistingMediaUp(idx)}
                              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                              disabled={idx === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExistingMediaDown(idx)}
                              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                              disabled={idx === existingMedia.length - 1}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExistingMedia(idx)}
                              className="text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {isVideo ? (
                          <video
                            src={item.Media}
                            controls
                            className="w-full rounded-lg max-h-56 bg-black"
                          />
                        ) : (
                          <img
                            src={item.Media}
                            alt={item.MediaDesc ?? "Uploaded media"}
                            className="w-full rounded-lg max-h-56 object-cover"
                          />
                        )}

                        <p className="mt-2 text-xs text-gray-600 break-all">{item.Media}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openFilePicker();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 mb-4 cursor-pointer hover:bg-gray-50 transition"
            >
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">
                {editingPath
                  ? "Add new media files to append after the current media."
                  : t("clickToUpload")}
              </p>
              <p className="text-xs mt-1">{t("reorderBeforeUpload")}</p>
            </div>

            {files.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">New media to upload</p>
                  <p className="text-xs text-gray-500">{t("topIsFirst")}</p>
                </div>

                <div className="space-y-2">
                  {files.map((f, idx) => (
                    <div
                      key={`${f.name}-${f.size}-${idx}`}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === idx) return;
                        setFiles((prev) => moveItem(prev, dragIndex, idx));
                        setDragIndex(null);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white border-gray-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-gray-400 select-none">☰</span>
                        <span className="text-gray-500 w-6 text-right select-none">{idx + 1}.</span>
                        <div className="min-w-0">
                          <div className="truncate">{f.name}</div>
                          <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                          disabled={idx === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                          disabled={idx === files.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-600 hover:underline ml-2"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">{t("mediaDescription")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[100px]"
                placeholder={t("mediaDescriptionPlaceholder")}
              />

              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TTS language</label>
                    <select
                      value={ttsLang}
                      onChange={(e) => setTtsLang(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      disabled={!speechSupported}
                    >
                      {ttsLanguages.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Voice</label>
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      disabled={!speechSupported || voices.length === 0}
                    >
                      {voicesForLang.length > 0 ? (
                        voicesForLang.map((v) => (
                          <option key={`${v.lang}-${v.name}`} value={v.name}>
                            {v.name}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          No voices found for {ttsLang} (try another language)
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={speakDescription}
                    disabled={!speechSupported || description.trim().length === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      !speechSupported || description.trim().length === 0
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    🔊 Read description
                  </button>

                  <button
                    type="button"
                    onClick={stopSpeaking}
                    disabled={!speechSupported || !isSpeaking}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      !speechSupported || !isSpeaking
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    ⏹ Stop
                  </button>

                  {!speechSupported && (
                    <p className="text-xs text-gray-500 self-center">
                      TTS not supported in this browser.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                disabled={!canSubmit}
                onClick={() => submit("Active")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                  canSubmit ? "bg-[#003087] text-white hover:bg-blue-800" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSaving ? t("saving") : editingPath ? "Save changes" : t("uploadPath")}
              </button>

              <button
                disabled={!canSubmit}
                onClick={() => submit("Draft")}
                className={`flex-1 py-3 rounded-lg text-sm transition ${
                  canSubmit
                    ? "bg-gray-100 border border-gray-300 hover:bg-gray-200"
                    : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? t("saving") : editingPath ? "Save as draft" : t("saveDraft")}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "manage" && (
        <ManagePathsSection
          onEditPath={(path: EditingPath) => {
            setMessage("");
            setEditingPath(path);
            setTab("upload");
          }}
        />
      )}
    </div>
  );
}