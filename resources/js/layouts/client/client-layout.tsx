import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect } from 'react';

type LayoutProps = {
    children?: React.ReactNode
}

export default function ClientLayout({children}:LayoutProps){

    // Chargée à l'entrée dans le portail (et non au démontage) : le thème LuxStay
    // reste isolé du bundle CSS de l'interne, chargé seulement quand il sert vraiment.
    useEffect(() => {
      import("@/themes/public/index.css");
    }, []);

    return (
        <div className="portail-client-theme">
            {children}
        </div>
    );
}