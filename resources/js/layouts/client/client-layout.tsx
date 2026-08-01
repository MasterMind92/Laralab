import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from 'react';

// import("@/themes/public/index.css");
type LayoutProps = {
    children?: React.ReactNode
}

export default function ClientLayout({children}:LayoutProps){

    useEffect(() => {
      return () => {
        import("@/themes/public/index.css");
      };
    }, []);

    return (
        <>
            {children}
        </>
    );
}