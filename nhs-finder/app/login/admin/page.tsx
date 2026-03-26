"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

import ManagePathsSection from "@/components/ManagePathsSection";
import AdminBuildingSelect from "@/components/AdminBuildingSelect";

type Building = {
  BuildingID: number;
  BuildingName: string;
};

type NodeSummary = {
  DestinationID: number;
  DestinationName: string;
  BuildingID: number;
  isEntrance: number;
  Accessibility: number | null;
  NodeImage: string | null;
  connectionCount: number;
  connectedNodes: string[];
};

type ExistingConnection = {
  id: string;
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  accessible: boolean;
  weight: number | null;
  source: "existing";
};

type DraftConnection = {
  id: string;
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  accessible: boolean;
  weight: number;
  source: "draft";
};

type PathApiRow = {
  PathID?: number;
  AccessToggle?: number;
  Weight?: number | null;
  BuildingID?: number;
  Destination_Path_StartToDestination?: {
    DestinationID?: number;
    DestinationName?: string;
  };
  Destination_Path_EndToDestination?: {
    DestinationID?: number;
    DestinationName?: string;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let success = false;
  try {
    success = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  return success;
}

export default function StaffPortalPage() {
  const router = useRouter();
  const t = useTranslations("staff");

  const [tab, setTab] = useState<"upload" | "manage">("upload");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [buildingId, setBuildingId] = useState("");

  const [buildingNodes, setBuildingNodes] = useState<NodeSummary[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [nodesError, setNodesError] = useState("");
  const [nodesRefreshKey, setNodesRefreshKey] = useState(0);

  const [existingConnections, setExistingConnections] = useState<ExistingConnection[]>([]);
  const [draftConnections, setDraftConnections] = useState<DraftConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");

  const [nodeName, setNodeName] = useState("");
  const [nodeAccessible, setNodeAccessible] = useState(false);
  const [nodeIsEntrance, setNodeIsEntrance] = useState(false);
  const [nodeImage, setNodeImage] = useState<File | null>(null);
  const [isSavingNode, setIsSavingNode] = useState(false);

  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");
  const [connectionWeight, setConnectionWeight] = useState("");
  const [connectionAccessible, setConnectionAccessible] = useState(false);
  const [qrEntranceId, setQrEntranceId] = useState("");
  const [qrDestinationId, setQrDestinationId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [publicBaseUrl, setPublicBaseUrl] = useState("");

  const [message, setMessage] = useState("");

  const handleEditPath = (_pathData: unknown) => {
    setMessage("");
    setTab("upload");
  };

  useEffect(() => {
    const loadBuildings = async () => {
      setLoadingBuildings(true);
      setMessage("");

      try {
        const res = await fetch("/api/buildings");
        const text = await res.text();
        if (!res.ok) throw new Error(text);

        const data = JSON.parse(text) as Building[];
        setBuildings(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, t("failedLoadBuildings")));
      } finally {
        setLoadingBuildings(false);
      }
    };

    loadBuildings();
  }, [t]);

  useEffect(() => {
    setFromNodeId("");
    setToNodeId("");
    setDraftConnections([]);
    setQrEntranceId("");
    setQrDestinationId("");
    setPatientName("");
    setPatientEmail("");
    setAppointmentTime("");
  }, [buildingId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPublicBaseUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNodes() {
      if (!buildingId) {
        setLoadingNodes(false);
        setBuildingNodes([]);
        setNodesError("");
        return;
      }

      setLoadingNodes(true);
      setNodesError("");

      try {
        const res = await fetch(`/api/admin/nodes?buildingId=${encodeURIComponent(buildingId)}`, {
          cache: "no-store",
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text);

        const data = JSON.parse(text) as NodeSummary[];
        if (!cancelled) {
          setBuildingNodes(Array.isArray(data) ? data : []);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setBuildingNodes([]);
          setNodesError(getErrorMessage(error, t("failedLoadNodes")));
        }
      } finally {
        if (!cancelled) setLoadingNodes(false);
      }
    }

    loadNodes();

    return () => {
      cancelled = true;
    };
  }, [buildingId, nodesRefreshKey, t]);

  useEffect(() => {
    let cancelled = false;

    async function loadConnections() {
      if (!buildingId) {
        setLoadingConnections(false);
        setExistingConnections([]);
        setConnectionsError("");
        return;
      }

      setLoadingConnections(true);
      setConnectionsError("");

      try {
        const res = await fetch("/api/paths", { cache: "no-store" });
        const text = await res.text();
        if (!res.ok) throw new Error(text);

        const parsed = JSON.parse(text) as { paths?: PathApiRow[] };
        const paths = Array.isArray(parsed.paths) ? parsed.paths : [];

        const mapped = paths
          .filter((item) => String(item.BuildingID ?? "") === buildingId)
          .map((item) => {
            const startId = item.Destination_Path_StartToDestination?.DestinationID;
            const endId = item.Destination_Path_EndToDestination?.DestinationID;
            const startName = item.Destination_Path_StartToDestination?.DestinationName;
            const endName = item.Destination_Path_EndToDestination?.DestinationName;

            if (
              typeof item.PathID !== "number" ||
              typeof startId !== "number" ||
              typeof endId !== "number" ||
              !startName ||
              !endName
            ) {
              return null;
            }

            return {
              id: String(item.PathID),
              fromId: startId,
              toId: endId,
              fromName: startName,
              toName: endName,
              accessible: Number(item.AccessToggle) === 1,
              weight: typeof item.Weight === "number" ? item.Weight : null,
              source: "existing" as const,
            };
          })
          .filter((item): item is ExistingConnection => item !== null);

        if (!cancelled) {
          setExistingConnections(mapped);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setExistingConnections([]);
          setConnectionsError(getErrorMessage(error, t("failedLoadConnections")));
        }
      } finally {
        if (!cancelled) setLoadingConnections(false);
      }
    }

    loadConnections();

    return () => {
      cancelled = true;
    };
  }, [buildingId, nodesRefreshKey, t]);

  const allConnections = useMemo(() => {
    return [...draftConnections, ...existingConnections];
  }, [draftConnections, existingConnections]);

  const entranceNodes = useMemo(
    () => buildingNodes.filter((node) => node.isEntrance === 1),
    [buildingNodes]
  );

  const locationNodes = useMemo(
    () => buildingNodes.filter((node) => node.isEntrance !== 1),
    [buildingNodes]
  );

  const selectedQrEntrance =
    entranceNodes.find((node) => String(node.DestinationID) === qrEntranceId) ?? null;
  const selectedQrDestination =
    locationNodes.find((node) => String(node.DestinationID) === qrDestinationId) ?? null;

  const generatedRouteUrl =
    publicBaseUrl && selectedQrEntrance && selectedQrDestination
      ? `${publicBaseUrl}/?entranceId=${selectedQrEntrance.DestinationID}&destinationId=${selectedQrDestination.DestinationID}`
      : "";

  const generatedQrUrl = generatedRouteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(generatedRouteUrl)}`
    : "";

  const generatedEmailSubject = selectedQrDestination
    ? `Your route to ${selectedQrDestination.DestinationName}`
    : "";

  const generatedEmailBody =
    selectedQrEntrance && selectedQrDestination
      ? [
          `Dear ${patientName.trim() || "Patient"},`,
          "",
          `Your appointment is at ${appointmentTime.trim() || "the scheduled time"} in ${selectedQrDestination.DestinationName}.`,
          `Your recommended starting entrance is ${selectedQrEntrance.DestinationName}.`,
          "",
          "Open the route here:",
          generatedRouteUrl,
          "",
          "Kind regards,",
          "NHS Pathfinder",
        ].join("\n")
      : "";

  const mailtoLink =
    patientEmail && generatedRouteUrl
      ? `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent(generatedEmailSubject)}&body=${encodeURIComponent(generatedEmailBody)}`
      : "";

  const clipboardEmailDraft =
    generatedEmailSubject && generatedEmailBody
      ? `${generatedEmailSubject}\n\n${generatedEmailBody}`
      : "";

  const submitNode = async () => {
    setMessage("");
    setNodesError("");

    if (!buildingId) {
      setNodesError(t("nodeBuildingRequired"));
      return;
    }

    if (!nodeName.trim()) {
      setNodesError(t("nodeNameRequired"));
      return;
    }

    setIsSavingNode(true);

    try {
      const form = new FormData();
      form.append("name", nodeName.trim());
      form.append("buildingId", buildingId);
      form.append("isEntrance", nodeIsEntrance ? "1" : "0");
      form.append("accessibility", nodeAccessible ? "1" : "0");

      if (nodeImage) {
        form.append("image", nodeImage);
      }

      const res = await fetch("/api/admin/nodes", {
        method: "POST",
        body: form,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setNodeName("");
      setNodeAccessible(false);
      setNodeIsEntrance(false);
      setNodeImage(null);
      setMessage(t("nodeCreated"));
      setNodesRefreshKey((value) => value + 1);
    } catch (error: unknown) {
      setNodesError(getErrorMessage(error, t("nodeCreateFailed")));
    } finally {
      setIsSavingNode(false);
    }
  };

  const addConnectionPreview = () => {
    setMessage("");
    setConnectionsError("");

    if (!buildingId) {
      setConnectionsError(t("connectionBuildingRequired"));
      return;
    }

    if (!fromNodeId || !toNodeId) {
      setConnectionsError(t("connectionNodesRequired"));
      return;
    }

    if (fromNodeId === toNodeId) {
      setConnectionsError(t("connectionDistinctNodesRequired"));
      return;
    }

    if (!connectionWeight.trim() || Number(connectionWeight) < 0) {
      setConnectionsError(t("connectionWeightInvalid"));
      return;
    }

    const fromNode = buildingNodes.find((node) => String(node.DestinationID) === fromNodeId);
    const toNode = buildingNodes.find((node) => String(node.DestinationID) === toNodeId);

    if (!fromNode || !toNode) {
      setConnectionsError(t("connectionNodesRequired"));
      return;
    }

    const draft: DraftConnection = {
      id: `draft-${Date.now()}`,
      fromId: fromNode.DestinationID,
      toId: toNode.DestinationID,
      fromName: fromNode.DestinationName,
      toName: toNode.DestinationName,
      accessible: connectionAccessible,
      weight: Number(connectionWeight),
      source: "draft",
    };

    setDraftConnections((current) => [draft, ...current]);
    setFromNodeId("");
    setToNodeId("");
    setConnectionWeight("");
    setConnectionAccessible(false);
    setMessage(t("connectionPreviewAdded"));
  };

  const copyEmailDraft = async () => {
    if (!clipboardEmailDraft) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clipboardEmailDraft);
        setMessage(t("emailDraftCopied"));
        return;
      }
    } catch {}

    const copied = fallbackCopyText(clipboardEmailDraft);
    setMessage(copied ? t("emailDraftCopied") : t("emailDraftCopyFailed"));
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
        <div className="px-8 mt-6 pb-10">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-2">{t("graphEditorTitle")}</h2>
            <p className="text-gray-500 mb-6">{t("graphEditorDescription")}</p>

            {message && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                {message}
              </div>
            )}

            <AdminBuildingSelect
              buildings={buildings}
              value={buildingId}
              onChange={setBuildingId}
              disabled={loadingBuildings}
              onBuildingCreated={(building) => setBuildings((current) => [building, ...current])}
            />

            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{t("addNodeTitle")}</h3>
                <p className="text-sm text-gray-600">{t("addNodeDescription")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("nodeNameLabel")}</label>
                  <input
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                    placeholder={t("nodeNamePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t("nodeImageLabel")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNodeImage(e.target.files?.[0] ?? null)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                  />
                  {nodeImage && <p className="mt-2 text-xs text-gray-500">{nodeImage.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t("nodeTypeLabel")}</label>
                  <select
                    value={nodeIsEntrance ? "1" : "0"}
                    onChange={(e) => setNodeIsEntrance(e.target.value === "1")}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                  >
                    <option value="0">{t("nodeTypeLocation")}</option>
                    <option value="1">{t("nodeTypeEntrance")}</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  id="nodeAccessible"
                  type="checkbox"
                  checked={nodeAccessible}
                  onChange={(e) => setNodeAccessible(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="nodeAccessible" className="text-sm">
                  {t("nodeAccessibleLabel")}
                </label>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={submitNode}
                  disabled={isSavingNode}
                  className="rounded-lg bg-[#003087] px-4 py-2 text-sm font-medium text-white hover:bg-[#00256a] disabled:opacity-60"
                >
                  {isSavingNode ? t("savingNode") : t("createNodeButton")}
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{t("connectionsTitle")}</h3>
                <p className="text-sm text-gray-600">{t("connectionsDescription")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("fromNodeLabel")}</label>
                  <select
                    value={fromNodeId}
                    onChange={(e) => setFromNodeId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                  >
                    <option value="">{t("selectNodePlaceholder")}</option>
                    {buildingNodes.map((node) => (
                      <option key={`from-${node.DestinationID}`} value={String(node.DestinationID)}>
                        {node.DestinationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t("toNodeLabel")}</label>
                  <select
                    value={toNodeId}
                    onChange={(e) => setToNodeId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                  >
                    <option value="">{t("selectNodePlaceholder")}</option>
                    {buildingNodes.map((node) => (
                      <option key={`to-${node.DestinationID}`} value={String(node.DestinationID)}>
                        {node.DestinationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t("connectionWeightLabel")}</label>
                  <input
                    value={connectionWeight}
                    onChange={(e) => setConnectionWeight(e.target.value)}
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                    placeholder={t("connectionWeightPlaceholder")}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  id="connectionAccessible"
                  type="checkbox"
                  checked={connectionAccessible}
                  onChange={(e) => setConnectionAccessible(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="connectionAccessible" className="text-sm">
                  {t("connectionAccessibleLabel")}
                </label>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={addConnectionPreview}
                  className="rounded-lg bg-[#003087] px-4 py-2 text-sm font-medium text-white hover:bg-[#00256a]"
                >
                  {t("addConnectionButton")}
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{t("nodesOverviewTitle")}</h3>
                <p className="text-sm text-gray-600">{t("nodesOverviewDescription")}</p>
              </div>

              {!buildingId && <p className="text-sm text-gray-500">{t("selectBuildingForNodes")}</p>}
              {buildingId && loadingNodes && <p className="text-sm text-gray-500">{t("loadingNodes")}</p>}
              {buildingId && nodesError && (
                <p className="mt-3 text-sm text-red-600 whitespace-pre-wrap">{nodesError}</p>
              )}
              {buildingId && !loadingNodes && !nodesError && buildingNodes.length === 0 && (
                <p className="text-sm text-gray-500">{t("noNodesForBuilding")}</p>
              )}

              {buildingId && !loadingNodes && buildingNodes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {buildingNodes.map((node) => (
                    <div key={node.DestinationID} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {node.NodeImage && (
                        <Image
                          src={node.NodeImage}
                          alt={node.DestinationName}
                          width={600}
                          height={240}
                          className="mb-3 h-32 w-full rounded-lg object-cover"
                        />
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{node.DestinationName}</p>
                          <p className="text-xs text-gray-400">ID: {node.DestinationID}</p>
                          <p className="text-xs text-gray-500">
                            {node.isEntrance === 1 ? t("entranceNode") : t("locationNode")}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {node.connectionCount} {node.connectionCount === 1 ? t("connectionSingle") : t("connectionPlural")}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">{t("nodeAccessibilitySummary")} </span>
                          {node.Accessibility === 1 ? t("nodeAccessibleValue") : t("nodeNotAccessibleValue")}
                        </div>
                      </div>

                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                        {t("connectedNodesLabel")}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {node.connectedNodes.length > 0 ? node.connectedNodes.join(", ") : t("noNodeConnections")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{t("connectionsListTitle")}</h3>
                <p className="text-sm text-gray-600">{t("connectionsListDescription")}</p>
              </div>

              {!buildingId && <p className="text-sm text-gray-500">{t("selectBuildingForConnections")}</p>}
              {buildingId && loadingConnections && (
                <p className="text-sm text-gray-500">{t("loadingConnections")}</p>
              )}
              {buildingId && connectionsError && (
                <p className="mt-3 text-sm text-red-600 whitespace-pre-wrap">{connectionsError}</p>
              )}
              {buildingId && !loadingConnections && !connectionsError && allConnections.length === 0 && (
                <p className="text-sm text-gray-500">{t("noConnectionsYet")}</p>
              )}

              {buildingId && !loadingConnections && allConnections.length > 0 && (
                <div className="space-y-3">
                  {allConnections.map((connection) => (
                    <div key={connection.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {connection.fromName} <span className="text-gray-400">→</span> {connection.toName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {connection.source === "draft" ? t("connectionDraftTag") : t("connectionExistingTag")}
                          </p>
                        </div>

                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {connection.accessible ? t("nodeAccessibleValue") : t("nodeNotAccessibleValue")}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-gray-700">
                        <span className="font-medium">{t("connectionWeightSummary")} </span>
                        {connection.weight ?? t("connectionWeightPending")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{t("qrEmailTitle")}</h3>
                <p className="text-sm text-gray-600">{t("qrEmailDescription")}</p>
              </div>

              {!buildingId && <p className="text-sm text-gray-500">{t("qrEmailSelectBuilding")}</p>}

              {buildingId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("qrEntranceLabel")}</label>
                      <select
                        value={qrEntranceId}
                        onChange={(e) => setQrEntranceId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                      >
                        <option value="">{t("selectNodePlaceholder")}</option>
                        {entranceNodes.map((node) => (
                          <option key={`qr-entrance-${node.DestinationID}`} value={String(node.DestinationID)}>
                            {node.DestinationName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t("qrDestinationLabel")}</label>
                      <select
                        value={qrDestinationId}
                        onChange={(e) => setQrDestinationId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                      >
                        <option value="">{t("selectNodePlaceholder")}</option>
                        {locationNodes.map((node) => (
                          <option key={`qr-destination-${node.DestinationID}`} value={String(node.DestinationID)}>
                            {node.DestinationName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">{t("patientNameLabel")}</label>
                      <input
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        placeholder={t("patientNamePlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t("patientEmailLabel")}</label>
                      <input
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        placeholder={t("patientEmailPlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t("appointmentTimeLabel")}</label>
                      <input
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        placeholder={t("appointmentTimePlaceholder")}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">{t("generatedRouteUrlLabel")}</label>
                      <input
                        readOnly
                        value={generatedRouteUrl}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-700"
                        placeholder={t("generatedRouteUrlPlaceholder")}
                      />
                    </div>
                  </div>

                  {generatedQrUrl && (
                    <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center">
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <Image
                          src={generatedQrUrl}
                          alt={t("qrPreviewAlt")}
                          width={240}
                          height={240}
                          unoptimized
                          className="h-40 w-40 rounded-lg"
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                        <a
                          href={generatedQrUrl}
                          download="patient-route-qr.png"
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-[#003087] px-4 py-2 text-sm font-medium text-white hover:bg-[#00256a] text-center"
                        >
                          {t("downloadQrButton")}
                        </a>

                        <a
                          href={generatedRouteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 text-center"
                        >
                          {t("openRouteButton")}
                        </a>

                        <a
                          href={mailtoLink || "#"}
                          onClick={(event) => {
                            if (!mailtoLink) event.preventDefault();
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-medium text-center ${
                            mailtoLink
                              ? "bg-black text-white hover:bg-gray-800"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {t("emailPatientButton")}
                        </a>

                        <button
                          type="button"
                          onClick={copyEmailDraft}
                          disabled={!clipboardEmailDraft}
                          className={`rounded-lg px-4 py-2 text-sm font-medium text-center ${
                            clipboardEmailDraft
                              ? "bg-white border border-gray-300 text-gray-900 hover:bg-gray-100"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {t("copyEmailDraftButton")}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "manage" && <ManagePathsSection onEditPath={handleEditPath} />}
    </div>
  );
}
