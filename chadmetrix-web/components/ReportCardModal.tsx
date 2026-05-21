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

// ─── Константы ───────────────────────────────────────────────────────────────

// 6 ключевых метрик для карточки + их эмодзи
const KEY_METRICS: { key: string; label: string; emoji: string }[] = [
    { key: "Состояние кожи", label: "Skin Quality", emoji: "✨" },
    { key: "Глубина глазных впадин", label: "Canthal Tilt", emoji: "👁" },
    { key: "Форма подбородка и челюсти", label: "Jawline", emoji: "🦷" },
    { key: "Форма и насыщенность губ", label: "Lips", emoji: "💋" },
    { key: "Размер и форма носа", label: "Nose", emoji: "👃" },
    { key: "Пропорции лица", label: "Proportions", emoji: "📐" },
];

// Tier таблица (BP шкала — overall_score 0–10)
const TIER_MAP = [
    { min: 0, max: 3.99, label: "SH", full: "Sub-Human", emoji: "💀", color: "#e24b4a", badge: "#3a0808" },
    { min: 4.0, max: 4.99, label: "LTN", full: "Low-Tier Normie", emoji: "🌧", color: "#b085f5", badge: "#1e1040" },
    { min: 5.0, max: 5.99, label: "MTN", full: "Mid-Tier Normie", emoji: "😐", color: "#7f77dd", badge: "#16153a" },
    { min: 6.0, max: 6.99, label: "HTN", full: "High-Tier Normie", emoji: "⚡", color: "#378add", badge: "#0c1e3a" },
    { min: 7.0, max: 7.99, label: "CL", full: "Chad-Lite", emoji: "🔥", color: "#1d9e75", badge: "#0a2820" },
    { min: 8.0, max: 10, label: "Chad", full: "Chad", emoji: "👑", color: "#ba7517", badge: "#2a1a04" },
];

// Aura-имена по скору (6 ступеней)
const AURA_NAMES = ["Hollow", "Lacy", "Baseline", "Edged", "Apex", "Sovereign"];

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function getTier(score: number) {
    return (
        TIER_MAP.find((t) => score >= t.min && score <= t.max) ?? TIER_MAP[0]
    );
}

function getAura(score: number): string {
    const idx = Math.min(Math.floor((score / 10) * AURA_NAMES.length), AURA_NAMES.length - 1);
    return AURA_NAMES[idx];
}

function getMetricValue(raw: MetricRaw | number | undefined): number {
    if (raw === undefined || raw === null) return 5.0;
    if (typeof raw === "number") return raw;
    return raw.value ?? 5.0;
}

// Цвет бара: красный < 5, фиолетовый 5–6.9, зелёный ≥ 7
function barColor(score: number): string {
    if (score >= 7) return "#1d9e75";
    if (score >= 5) return "#7f77dd";
    return "#e24b4a";
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

    // Закрытие по Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    // Блокируем скролл body
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    const tier = getTier(overallScore);
    const potTier = getTier(potentialScore);
    const aura = getAura(overallScore);
    const overallDisplay = Math.round(overallScore * 10);

    // Собираем 6 метрик
    const keyMetrics = KEY_METRICS.map(({ key, label, emoji }) => {
        const val = getMetricValue(metrics?.[key]);
        return { label, emoji, val, display: Math.round(val * 10), pct: val * 10 };
    });

    return (
        /* Оверлей */
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                animation: "cmFadeIn 0.18s ease",
            }}
        >
            <style>{`
                @keyframes cmFadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes cmSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
                .cm-bar-fill { transition: width 0.6s cubic-bezier(.4,0,.2,1); }
            `}</style>

            {/* Карточка */}
            <div
                style={{
                    background: "#0b0b14",
                    borderRadius: "24px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    width: "100%",
                    maxWidth: "400px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    animation: "cmSlideUp 0.22s ease",
                    position: "relative",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                }}
            >
                {/* Кнопка закрытия */}
                <button
                    onClick={onClose}
                    aria-label="Закрыть"
                    style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        zIndex: 10,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#888",
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                >
                    <X size={15} />
                </button>

                {/* Хедер: аватар + tier */}
                <div style={{ padding: "2rem 1.5rem 1.25rem", textAlign: "center", background: "linear-gradient(180deg, #12121f 0%, #0b0b14 100%)", borderRadius: "24px 24px 0 0" }}>
                    {/* Аватар */}
                    <div style={{
                        width: "96px", height: "96px",
                        borderRadius: "50%",
                        border: `3px solid ${tier.color}40`,
                        margin: "0 auto 1rem",
                        overflow: "hidden",
                        background: "#1a1a2e",
                        position: "relative",
                        boxShadow: `0 0 24px ${tier.color}30`,
                    }}>
                        {photoUrl ? (
                            <Image src={photoUrl} alt="Фото анализа" fill style={{ objectFit: "cover" }} sizes="96px" />
                        ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", color: "#3a3a55" }}>
                                👤
                            </div>
                        )}
                    </div>

                    {/* Tier label */}
                    <div style={{ fontSize: "22px", fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
                        Tier{" "}
                        <span style={{ color: tier.color }}>{tier.label}</span>{" "}
                        <span style={{ fontSize: "18px" }}>{tier.emoji}</span>
                    </div>

                    {/* Badge */}
                    <div style={{
                        display: "inline-block",
                        marginTop: "6px",
                        padding: "3px 12px",
                        borderRadius: "99px",
                        background: tier.badge,
                        border: `1px solid ${tier.color}40`,
                        fontSize: "11px",
                        fontWeight: 500,
                        color: tier.color,
                        letterSpacing: "0.04em",
                    }}>
                        {tier.full}
                    </div>
                </div>

                {/* Aura + Potential */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,0.06)", margin: "0 1.25rem", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ background: "#111122", padding: "0.9rem 1rem" }}>
                        <div style={{ fontSize: "11px", color: "#6b6b8a", marginBottom: "4px" }}>💎 Aura</div>
                        <div style={{ fontSize: "17px", fontWeight: 600, color: "#fff" }}>{aura}</div>
                    </div>
                    <div style={{ background: "#111122", padding: "0.9rem 1rem" }}>
                        <div style={{ fontSize: "11px", color: "#6b6b8a", marginBottom: "4px" }}>🦋 Potential Tier</div>
                        <div style={{ fontSize: "17px", fontWeight: 600, color: potTier.color }}>{potTier.label}</div>
                    </div>
                </div>

                {/* Overall + метрики */}
                <div style={{ padding: "1rem 1.25rem" }}>

                    {/* Overall большой */}
                    <div style={{
                        background: "#111122",
                        borderRadius: "14px",
                        padding: "1rem",
                        marginBottom: "0.75rem",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                    }}>
                        <ScoreBlock label="⭐ Overall" val={overallScore} display={overallDisplay} />
                        <ScoreBlock label="✨ Potential" val={potentialScore} display={Math.round(potentialScore * 10)} accent />
                    </div>

                    {/* 6 метрик */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                        {keyMetrics.map(({ label, emoji, val, display, pct }) => (
                            <div key={label} style={{
                                background: "#111122",
                                borderRadius: "12px",
                                padding: "0.75rem 0.9rem",
                            }}>
                                <div style={{ fontSize: "11px", color: "#6b6b8a", marginBottom: "3px" }}>
                                    {emoji} {label}
                                </div>
                                <div style={{ fontSize: "24px", fontWeight: 600, color: "#fff", lineHeight: 1, marginBottom: "6px" }}>
                                    {display}
                                </div>
                                <div style={{ height: "4px", background: "#1e1e30", borderRadius: "99px", overflow: "hidden" }}>
                                    <div
                                        className="cm-bar-fill"
                                        style={{ width: `${pct}%`, height: "100%", background: barColor(val), borderRadius: "99px" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Категория / watermark */}
                    <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "12px", color: "#3a3a55" }}>
                        {category && <span style={{ marginRight: "8px", color: "#555" }}>{category}</span>}
                        chad<span style={{ color: "#7f77dd" }}>metrix</span>.ru
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Вспомогательный блок скора ───────────────────────────────────────────────

function ScoreBlock({ label, val, display, accent = false }: {
    label: string; val: number; display: number; accent?: boolean;
}) {
    const color = accent ? "#7f77dd" : barColor(val);
    return (
        <div>
            <div style={{ fontSize: "11px", color: "#6b6b8a", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
            </div>
            <div style={{ fontSize: "30px", fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: "6px" }}>
                {display}
            </div>
            <div style={{ height: "4px", background: "#1e1e30", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${display}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
            </div>
        </div>
    );
}