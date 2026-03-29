// lib/api.ts
import axios from "axios";

export const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Логирование для отладки (можно убрать в продакшене)
api.interceptors.request.use(config => {
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log('[API Response]', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('[API Error]', error.response?.status, error.config?.url, error.response?.data);

        // Редирект на логин при 401
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                const path = window.location.pathname;
                const protectedPaths = [
                    "/dashboard",
                    "/analysis",
                    "/reports",
                    "/referral",
                    "/dashboard/subscription"
                ];

                const isProtected = protectedPaths.some(p => path.startsWith(p));
                if (isProtected) {
                    window.location.href = "/login?redirect=" + encodeURIComponent(path);
                }
            }
        }
        return Promise.reject(error);
    }
);

// ========== AUTH ==========
export async function getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
}

export async function logout() {
    const response = await api.post("/auth/logout");
    return response.data;
}

// ========== PAYMENTS ==========
// Привязка карты (нулевая сумма)
export async function bindCard() {
    const response = await api.post("/payments/bind-card");
    return response.data; // { confirmation_url, payment_id }
}

// Оплата тарифа с сохранением карты (для подписок HTN/CHAD)
export async function createPaymentWithBinding(tariffId: number) {
    const response = await api.post(`/payments/create-with-binding?tariff_id=${tariffId}`);
    return response.data; // { confirmation_url, payment_id }
}

// Получение информации о привязанной карте
export async function getPaymentMethod() {
    const response = await api.get("/payments/payment-method");
    return response.data; // { has_payment_method, payment_method_id, auto_payment_enabled, ... }
}

// Отвязка карты
export async function removePaymentMethod() {
    const response = await api.delete("/payments/payment-method");
    return response.data; // { message }
}

// ========== ANALYSIS ==========
export async function createAnalysis(formData: FormData) {
    const response = await api.post("/analysis", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data; // { analysis_id, status, message }
}

export async function getAnalysis(analysisId: string) {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
}

export async function getAnalysisStatus(analysisId: string) {
    const response = await api.get(`/analysis/${analysisId}/status`);
    return response.data; // { analysis_id, status, has_report, report_id }
}

// ========== REPORTS ==========
export async function getReports() {
    const response = await api.get("/reports");
    return response.data;
}

export async function getReport(id: string) {
    const response = await api.get(`/reports/${id}`);
    return response.data;
}

// ========== REFERRALS ==========
export async function getReferralStats() {
    const response = await api.get("/referrals/stats");
    return response.data; // { invited_count, purchased_count, bonuses, referral_code }
}

// ========== TARIFFS (если добавите эндпоинт) ==========
export async function getTariffs() {
    const response = await api.get("/tariffs");
    return response.data;
}