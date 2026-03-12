import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RealtimeNotices } from "@/components/RealtimeNotices";

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <RealtimeNotices />
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
