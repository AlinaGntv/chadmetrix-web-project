import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout as apiLogout } from "@/lib/api"

interface User {
    id: number
    email: string
    full_name: string
    avatar_url?: string
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const data = await getCurrentUser()
            setUser(data)
        } catch {
            // Используем _ вместо error, так как ошибка нам не нужна
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const loginWithGoogle = () => {
        window.location.href = "/api/auth/login/google"
    }

    const logout = async () => {
        try {
            await apiLogout()
            setUser(null)
            router.push("/login")
        } catch (error) {
            console.error("Ошибка выхода:", error)
        }
    }

    return {
        user,
        isLoading,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
    }
}