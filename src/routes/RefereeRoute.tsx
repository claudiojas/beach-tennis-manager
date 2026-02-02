import { Navigate, Outlet } from "react-router-dom";

export function RefereeRoute() {
    const authStorage = localStorage.getItem("beach-tennis-court-auth");
    const isAuthenticated = !!authStorage;

    if (!isAuthenticated) {
        return <Navigate to="/arbitro" replace />;
    }

    return <Outlet />;
}
