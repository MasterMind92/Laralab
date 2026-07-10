import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "@/themes/public/index.css";

type LayoutProps = {
    children?: React.ReactNode
}

export default function ClientLayout({children}:LayoutProps){


    return (
        <>
            {children}
        </>
    );
}