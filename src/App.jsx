import { useEffect } from "react"
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import StaffAuth from "./pages/StaffAuth"
import StaffLayout from "./pages/satfflayout"
import StaffDashboard from "./pages/satffdashboard"
import StaffProfile from "./pages/StaffProfile"
import StaffKyc from "./pages/StaffKyc"
import { StaffBusinessDetails, StaffBusinessDirectory, StaffBusinessForm } from "./pages/StaffBusinesses"
import AdminLogin from "./pages/AdminLogin"
import AdminLayout from "./pages/AdminLayout"
import AdminDashboard from "./pages/AdminDashboard"
import AdminProfile from "./pages/AdminProfile"
import AdminStaff, { AdminStaffEdit } from "./pages/AdminStaff"
import AdminStaffRegistration from "./pages/AdminStaffRegistration"
import AdminBusinesses, { AdminBusinessForm } from "./pages/AdminBusinesses"
import AdminStaffBusinesses from "./pages/AdminStaffBusinesses"
import AdminStaffKyc from "./pages/AdminStaffKyc"
import AdminMessages from "./pages/AdminMessages"
import StaffMessages from "./pages/StaffMessages"
import BrowseDistricts from "./pages/BrowseDistricts"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import LenisScroll from "./components/Lenis"

// Public website pages share the Navbar and Footer
function SiteLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    )
}

// Start each new page at the top (hash links like /#about are left alone)
function ScrollToTop() {
    const { pathname, hash } = useLocation()
    useEffect(() => {
        if (!hash) window.dispatchEvent(new Event("afx:scroll-to-top"))
    }, [pathname, hash])
    return null
}

export default function App() {
    return (
        <>
            <LenisScroll />
            <ScrollToTop />
            <Routes>
                <Route element={<SiteLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/browse-districts" element={<BrowseDistricts />} />
                </Route>

                {/* Full-screen pages, no Navbar or Footer */}
                <Route path="/staff" element={<StaffAuth />} />
                <Route path="/staff/dashboard" element={<StaffLayout />}>
                    <Route index element={<StaffDashboard />} />
                </Route>
                <Route path="/staff/profile" element={<StaffLayout />}>
                    <Route index element={<StaffProfile />} />
                </Route>
                <Route path="/staff/kyc" element={<StaffLayout />}>
                    <Route index element={<StaffKyc />} />
                </Route>
                <Route path="/staff/messages" element={<StaffLayout />}>
                    <Route index element={<StaffMessages />} />
                </Route>
                <Route path="/staff/businesses" element={<StaffLayout />}>
                    <Route index element={<StaffBusinessDirectory />} />
                    <Route path="new" element={<StaffBusinessForm />} />
                    <Route path=":businessId" element={<StaffBusinessDetails />} />
                    <Route path=":businessId/edit" element={<StaffBusinessForm editing />} />
                </Route>
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="staff" element={<AdminStaff />} />
                    <Route path="staff/register" element={<AdminStaffRegistration />} />
                    <Route path="staff/:staffId/edit" element={<AdminStaffEdit />} />
                    <Route path="staff/:staffId" element={<AdminStaff />} />
                    <Route path="staff-reports" element={<AdminStaffBusinesses />} />
                    <Route path="staff-kyc" element={<AdminStaffKyc />} />
                    <Route path="businesses" element={<AdminBusinesses />} />
                    <Route path="businesses/new" element={<AdminBusinessForm />} />
                    <Route path="businesses/:businessId" element={<AdminBusinesses />} />
                    <Route path="businesses/:businessId/edit" element={<AdminBusinessForm editing />} />
                    <Route path="messages" element={<AdminMessages />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}