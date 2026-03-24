import axios from "axios"

export const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
})

// Перехватчик ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error)
    }
)

export async function getCurrentUser() {
    const response = await api.get("/auth/me")
    return response.data
}

export async function createAnalysis(formData: FormData) {
    const response = await api.post("/analysis", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
    return response.data
}

export async function getReports() {
    const response = await api.get("/reports")
    return response.data
}

export async function getReport(id: string) {
    const response = await api.get(`/reports/${id}`)
    return response.data
}

export async function logout() {
    const response = await api.post("/auth/logout")
    return response.data
}