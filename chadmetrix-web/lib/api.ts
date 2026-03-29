// lib/api.ts
import axios from "axios";

export const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
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

// AUTH
export async function getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
}

export async function logout() {
    const response = await api.post("/auth/logout");
    return response.data;
}

// PAYMENTS
export async function bindCard() {
    const response = await api.post("/payments/bind-card");
    return response.data;
}

export async function createOnetimePayment(tariffId: number) {
    const response = await api.post(`/payments/create-onetime?tariff_id=${tariffId}`);
    return response.data;
}

export async function createPaymentWithBinding(tariffId: number) {
    const response = await api.post(`/payments/create-with-binding?tariff_id=${tariffId}`);
    return response.data;
}

export async function getPaymentMethod() {
    const response = await api.get("/payments/payment-method");
    return response.data;
}

export async function removePaymentMethod() {
    const response = await api.delete("/payments/payment-method");
    return response.data;
}

// ANALYSIS
export async function createAnalysis(formData: FormData) {
    const response = await api.post("/analysis", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

export async function getAnalysis(analysisId: string) {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
}

export async function getAnalysisStatus(analysisId: string) {
    const response = await api.get(`/analysis/${analysisId}/status`);
    return response.data;
}

// REPORTS
export async function getReports() {
    const response = await api.get("/reports");
    return response.data;
}

export async function getReport(id: string) {
    const response = await api.get(`/reports/${id}`);
    return response.data;
}

// REFERRALS
export async function getReferralStats() {
    const response = await api.get("/referrals/stats");
    return response.data;
}