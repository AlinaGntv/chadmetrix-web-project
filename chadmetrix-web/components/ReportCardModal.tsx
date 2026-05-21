"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

// ─── Типы ────────────────────────────────────────────────────────────────────

interface MetricRaw {
    value: number;
    comment?: string;
}

interface ReportCardModalProps {
    open: boolean;
    onClose: () => void;
    overallScore: number;
    potentialScore: number;
    category: string | null;
    metrics: Record<string, MetricRaw | number> | null;
    photoUrl: string | null;
}

// ─── 6 ключевых метрик ───────────────────────────────────────────────────────

const KEY_METRICS: { key: string; label: string }[] = [
    { key: "Состояние кожи", label: "Состояние кожи" },
    { key: "Глубина глазных впадин", label: "Кантальный тилт" },
    { key: "Форма подбородка и челюсти", label: "Линия челюсти" },
    { key: "Форма и насыщенность губ", label: "Губы" },
    { key: "Размер и форма носа", label: "Нос" },
    { key: "Пропорции лица", label: "Пропорции" },
];

// ─── Tier таблица ─────────────────────────────────────────────────────────────

const TIER_MAP = [
    { min: 0, max: 3.99, label: "SH", full: "Sub-Human", emoji: "💀" },
    { min: 4.0, max: 4.99, label: "LTN", full: "Низкий нормис", emoji: "🌧" },
    { min: 5.0, max: 5.99, label: "MTN", full: "Средний нормис", emoji: "😐" },
    { min: 6.0, max: 6.99, label: "HTN", full: "Высокий нормис", emoji: "⚡" },
    { min: 7.0, max: 7.99, label: "CL", full: "Чад-лайт", emoji: "🔥" },
    { min: 8.0, max: 10, label: "Chad", full: "Чад", emoji: "👑" },
];

// Aura-имена по скору
const AURA_NAMES = ["НОЛЬ", "ПОЙДЕТ", "ОБЫЧНЫЙ", "МОДЕЛЬ-ТИР", "СЫН БАРЕТТА", "БОГ"];

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function getTier(score: number) {
    return TIER_MAP.find((t) => score >= t.min && score <= t.max) ?? TIER_MAP[0];
}

function getAura(score: number): string {
    const idx = Math.min(
        Math.floor((score / 10) * AURA_NAMES.length),
        AURA_NAMES.length - 1
    );
    return AURA_NAMES[idx];
}

function getMetricValue(raw: MetricRaw | number | undefined): number {
    if (raw === undefined || raw === null) return 5.0;
    if (typeof raw === "number") return raw;
    return raw.value ?? 5.0;
}

// Яркость бара: тусклый серый → белый в зависимости от скора
function barOpacity(score: number): string {
    if (score >= 7) return "rgba(255,255,255,0.85)";
    if (score >= 5) return "rgba(255,255,255,0.45)";
    return "rgba(255,255,255,0.18)";
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export function ReportCardModal({
    open,
    onClose,
    overallScore,
    potentialScore,
    category,
    metrics,
    photoUrl,
}: ReportCardModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    const tier = getTier(overallScore);
    const potTier = getTier(potentialScore);
    const aura = getAura(overallScore);

    const overallDisplay = Math.round(overallScore * 10);
    const potentialDisplay = Math.round(potentialScore * 10);

    const keyMetrics = KEY_METRICS.map(({ key, label }) => {
        const val = getMetricValue(metrics?.[key]);
        return { label, val, display: Math.round(val * 10), pct: val * 10 };
    });

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.80)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                animation: "cmFadeIn 0.18s ease",
            }}
        >
            <style>{`
                @keyframes cmFadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes cmSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
            `}</style>

            {/* Карточка */}
            <div style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "380px",
                maxHeight: "90vh",
                overflowY: "auto",
                animation: "cmSlideUp 0.22s ease",
                position: "relative",
                boxShadow: "0 0 60px -15px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.7)",
            }}>

                {/* Закрыть */}
                <button
                    onClick={onClose}
                    aria-label="Закрыть"
                    style={{
                        position: "absolute", top: "14px", right: "14px", zIndex: 10,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: "50%",
                        width: "30px", height: "30px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "rgba(255,255,255,0.4)",
                        transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    }}
                >
                    <X size={14} />
                </button>

                {/* ── Хедер: аватар + tier ── */}
                <div style={{
                    padding: "2rem 1.5rem 1.25rem",
                    textAlign: "center",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
                    borderRadius: "24px 24px 0 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    {/* Аватар */}
                    <div style={{
                        width: "90px", height: "90px",
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.12)",
                        margin: "0 auto 1.1rem",
                        overflow: "hidden",
                        background: "#0a0a0a",
                        position: "relative",
                        boxShadow: "0 0 30px rgba(255,255,255,0.05)",
                    }}>
                        {photoUrl ? (
                            <Image
                                src={photoUrl}
                                alt="Фото анализа"
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="90px"
                            />
                        ) : (
                            <div style={{
                                width: "100%", height: "100%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "32px", color: "rgba(255,255,255,0.15)",
                            }}>
                                👤
                            </div>
                        )}
                    </div>

                    {/* Tier */}
                    <div style={{
                        fontSize: "21px", fontWeight: 700,
                        color: "#fff", letterSpacing: "-0.02em",
                    }}>
                        Тир{" "}
                        <span style={{ color: "rgba(255,255,255,0.9)" }}>{tier.label}</span>
                        {" "}<span style={{ fontSize: "17px" }}>{tier.emoji}</span>
                    </div>

                    {/* Badge */}
                    <div style={{
                        display: "inline-block", marginTop: "7px",
                        padding: "3px 12px",
                        borderRadius: "99px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        fontSize: "11px", fontWeight: 500,
                        color: "rgba(255,255,255,0.55)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase" as const,
                    }}>
                        {tier.full}
                    </div>
                </div>

                {/* ── Aura + Potential ── */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "1px", background: "rgba(255,255,255,0.06)",
                    margin: "1rem 1.25rem 0",
                    borderRadius: "14px", overflow: "hidden",
                }}>
                    <InfoCell label="Аура" value={aura} />
                    <InfoCell label="Потенциал тир" value={`${potTier.label} ${potTier.emoji}`} />
                </div>

                {/* ── Overall + Potential scores ── */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "1px", background: "rgba(255,255,255,0.06)",
                    margin: "0.75rem 1.25rem 0",
                    borderRadius: "14px", overflow: "hidden",
                }}>
                    <ScoreCell
                        label="Оценка"
                        display={overallDisplay}
                        pct={overallScore * 10}
                        score={overallScore}
                    />
                    <ScoreCell
                        label="Потенциал"
                        display={potentialDisplay}
                        pct={potentialScore * 10}
                        score={potentialScore}
                        dimBar
                    />
                </div>

                {/* ── 6 метрик ── */}
                <div style={{ padding: "0.75rem 1.25rem 0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                        {keyMetrics.map(({ label, val, display, pct }) => (
                            <div key={label} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "12px",
                                padding: "0.75rem 0.9rem",
                            }}>
                                <div style={{
                                    fontSize: "10px", fontWeight: 500,
                                    color: "rgba(255,255,255,0.35)",
                                    marginBottom: "3px",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.06em",
                                }}>
                                    {label}
                                </div>
                                <div style={{
                                    fontSize: "24px", fontWeight: 700,
                                    color: "#fff", lineHeight: 1, marginBottom: "8px",
                                }}>
                                    {display}
                                </div>
                                <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                                    <div style={{
                                        width: `${pct}%`, height: "100%",
                                        background: barOpacity(val),
                                        borderRadius: "99px",
                                        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Футер / watermark ── */}
                <div style={{
                    textAlign: "center",
                    padding: "1rem 1.25rem 1.25rem",
                    marginTop: "0.5rem",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.18)",
                    letterSpacing: "0.04em",
                }}>
                    {category && (
                        <span style={{ marginRight: "8px", color: "rgba(255,255,255,0.25)" }}>
                            {category} ·{" "}
                        </span>
                    )}
                    chadmetrix.ru
                </div>
            </div>
        </div>
    );
}

// ─── Вспомогательные ячейки ───────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem 1rem" }}>
            <div style={{ fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.35)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                {label}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                {value}
            </div>
        </div>
    );
}

function ScoreCell({ label, display, pct, score, dimBar = false }: {
    label: string; display: number; pct: number; score: number; dimBar?: boolean;
}) {
    const fill = dimBar ? "rgba(255,255,255,0.30)" : barOpacity(score);
    return (
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem 1rem" }}>
            <div style={{ fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.35)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                {label}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: "8px" }}>
                {display}
                <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.25)", marginLeft: "2px" }}>/100</span>
            </div>
            <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                    width: `${pct}%`, height: "100%",
                    background: fill, borderRadius: "99px",
                    transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                }} />
            </div>
        </div>
    );
}