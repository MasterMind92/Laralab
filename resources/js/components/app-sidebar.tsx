import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { ChevronRight } from "lucide-react"
import {
    Sidebar,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

// Rôles ayant accès à tous les pôles, quel que soit leur `roles` déclaré ci-dessous
// (doit rester synchronisé avec App\Http\Middleware\EnsureUserHasRole côté backend).
const FULL_ACCESS_ROLES = ['proprietaire', 'gerant'];

const mainNavItems: NavItem[] = [
    {
        title: 'Proprietaire',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['proprietaire'],
        sub:[
            {
                title: "dashboard", // KPI proprietaire en fin de parcours
                url:"#",
            },
            {
                title: "Appartements", // listes appartements lie a l'utilisateur + CRUD
                url:"/admin/appartements",
            },
            {
                title: "Recrutement", // Elements du pole RH
                url:"#",
            },
            {
                title: "Entretien",// Elements du pole RH
                url:"#",
            },
            {
                title: "Contrats",// Elements du pole RH
                url:"#",
            },
            {
                title: "Salaires",// Elements du pole RH
                url:"#",
            },
            {
                title: "Conges",// Elements du pole RH
                url:"#",
            },
            {
                title: "Licenciement",// Elements du pole RH
                url:"#",
            },
        ]
    },
    {
        title: 'Gerant',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['gerant'],
        sub:[
            {
                title: "Appartements",
                url:"/admin/appartements",
            }
        ]
    },
    {
        title: 'RH',
        href: "/admin/ressources-humaine",
        icon: LayoutGrid,
        roles: ['rh'],
        sub:[
            {
                title: "Recrutement",
                url:"#",
            },
            {
                title: "Entretien",
                url:"#",
            },
            {
                title: "Contrats",
                url:"#",
            },
            {
                title: "Salaires",
                url:"#",
            },
            {
                title: "Conges",
                url:"#",
            },
            {
                title: "Licenciement",
                url:"#",
            },
        ]
    },
    {
        title: 'Comptabilite',
        href: "/admin/comptabilite",
        icon: LayoutGrid,
        roles: ['compta'],
        sub:[
            {
                title: "Consultation Devis",
                url:"#",
            },
            {
                title: "Cloture Sejours",
                url:"#",
            },
            {
                title: "Facture du sejour",
                url:"#",
            },
            {
                title: "Encaissements factures",
                url:"#",
            },
            {
                title: "Recouvrements factures",
                url:"#",
            },
            {
                title: "Achats",
                url:"#",
            },
            {
                title: "Depenses",
                url:"#",
            },
            {
                title: "Etats Financiers",
                url:"#",
            },
            {
                title: "Parametres de facturation",
                url:"/admin/parametres-facturation",
            },


        ]
    },
    {
        title: 'Logistique',
        href: "/admin/logistique",
        icon: LayoutGrid,
        roles: ['logistique'],
        sub:[
            {
                title: "Expression Besoins",
                url:"#",
            },
            {
                title: "Reception",
                url:"#",
            },
            {
                title: "Enregistrement",
                url:"#",
            },
            {
                title: "Affectation Equipement",
                url:"#",
            },
        ]
        
    },
    {
        title: 'Maintenance',
        href: "/admin/maintenance",
        icon: LayoutGrid,
        roles: ['maintenance'],
        sub:[
            {
                title: "Prise en charge pannes",
                url:"#",
            },
            {
                title: "Suivi interventions",
                url:"#",
            },
            {
                title: "Reparations",
                url:"#",
            },

        ]
    },
    {
        title: 'Receptionniste',
        href: "/admin/receptionniste",
        icon: LayoutGrid,
        roles: ['receptionniste'],
        sub:[
            {   
                // Interface d'edition/gestion de reservation (changement etat de la reservation (check-in/check-out) )
                title: "Planning",
                url:"/admin/planning",
            },
            {
                // Interface de reception / gestion des Reservations dans le planning (appel de confirmation + confirmation / annulation)
                title: "Traitement  Reservation-Client",
                url:"/admin/planning",
            },
            {
                title: "Accueils Client",
                url:"/admin/planning",
            },
            {
                // Interface de suivi de l'accueil client + etat des lieux (check-in)
                title: "Etats des lieux d'entrees",
                url:"/admin/planning",
            },
            {
                // Suivi des services supplementaires octroyer au client durant son sejour
                title: "Suivi des besoins",
                url:"/admin/planning",
            },
            {
                title: "Gestion des casse",
                url:"/admin/planning",
            },
            {
                // Interface de signalement de pannes concernant les equipements de chaque appartements
                title: "Signalement des pannes",
                url:"/admin/equipements-suivi",
            },
            {
                // Interface suivi de checkout
                title: "Etats des lieux de sortie",
                url:"/admin/planning",
            },
            {
                // Interface d'edition de la facture proformat du sejour
                title: "Devis du Sejour",
                url:"#",
            },
        ]
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role: string } | null } }>().props;
    const role = auth.user?.role;

    const visibleNavItems = mainNavItems.filter(
        (item) =>
            !item.roles ||
            (role !== undefined && (FULL_ACCESS_ROLES.includes(role) || item.roles.includes(role))),
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {visibleNavItems.map((item) => (
            <Collapsible
                key={item.title}
                title={item.title}
                className="group/collapsible"
            >
                <SidebarGroup>
                <SidebarGroupLabel
                    asChild
                    className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <CollapsibleTrigger>
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                    <SidebarMenu>
                        {item.sub && item.sub.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={item.isActive}>
                            {/* <a href={item.url}>{item.title}</a> */}
                            <Link href={item.url} prefetch >
                                <span>{item.title}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
                </SidebarGroup>
            </Collapsible>
            ))}
        </SidebarContent>
                {/* <NavMain items={mainNavItems} /> */}

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
