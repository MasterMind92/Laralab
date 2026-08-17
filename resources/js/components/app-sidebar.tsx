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

// Items scopes a l'entreprise du proprietaire/gerant connecte (Phase 09, multi-tenant)
// — communs aux deux roles, qui partagent desormais les memes vues.
const itemsPatrimoine: NonNullable<NavItem['sub']> = [
    { title: 'Tableau de bord', url: '/admin/proprietaire' },
    { title: 'Appartements', url: '/admin/appartements' },
    { title: 'Planning', url: '/admin/planning' },
    { title: 'Encaissements', url: '/admin/encaissements' },
    { title: 'Équipements', url: '/admin/equipements-statut' },
    { title: 'Partenaires', url: '/admin/partenaires-catalogue' },
    { title: 'Achats', url: '#' }, // Phase 06 (Comptabilité avancée)
    { title: 'Dépenses', url: '#' }, // Phase 06
    { title: 'États Financiers', url: '#' }, // Phase 06
];

const mainNavItems: NavItem[] = [
    {
        title: 'Administrateur',
        href: '/admin/entreprises',
        icon: LayoutGrid,
        roles: ['administrateur'],
        sub:[
            {
                title: "Entreprises",
                url:"/admin/entreprises",
            },
            {
                title: "Partenaires",
                url:"/admin/admin-partenaires",
            },
        ]
    },
    {
        title: 'Proprietaire',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['proprietaire'],
        sub:[
            ...itemsPatrimoine,
            {
                title: "Employés", // Elements du pole RH
                url:"/admin/employes",
            },
            {
                title: "Recrutements",// Elements du pole RH
                url:"/admin/recrutements",
            },
            {
                title: "Contrats",// Elements du pole RH
                url:"/admin/contrats",
            },
            {
                title: "Congés",// Elements du pole RH
                url:"/admin/conges",
            },
        ]
    },
    {
        title: 'Gerant',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['gerant'],
        sub: itemsPatrimoine,
    },
    {
        title: 'RH',
        href: "/admin/employes",
        icon: LayoutGrid,
        roles: ['rh'],
        sub:[
            {
                title: "Employés",
                url:"/admin/employes",
            },
            {
                title: "Recrutements",
                url:"/admin/recrutements",
            },
            {
                title: "Contrats",
                url:"/admin/contrats",
            },
            {
                title: "Congés",
                url:"/admin/conges",
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
                // Fusionne "Consultation Devis" + "Cloture Sejours" + "Facture du sejour" +
                // "Encaissements factures" : le statut de chaque facture (brouillon a
                // valider/rejeter, validee a encaisser, payee = sejour cloture cote
                // comptable) porte a lui seul ce qui distinguait ces 4 ecrans.
                title: "Consultation Devis",
                url:"/admin/factures",
            },
            {
                // Suivi des impayes/relances — different du flux valider/encaisser,
                // differe a un futur reporting.
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
                // Vue calendrier (visuelle) des reservations/sejours — complement du datatable Reservations
                title: "Planning",
                url:"/admin/planning",
            },
            {
                // Datatable: confirmer/annuler/check-in — fusionne l'ancien "Traitement Reservation-Client" + "Accueils Client"
                title: "Réservations",
                url:"/admin/reservations",
            },
            {
                // Datatable: check-in/check-out + dommages — fusionne l'ancien "Etats des lieux d'entrees/sortie" + "Gestion des casse"
                title: "Séjours",
                url:"/admin/sejours",
            },
            {
                // Datatable — remplace l'ancien "Suivi des besoins"
                title: "Demandes de service",
                url:"/admin/demandes-service",
            },
            {
                // Interface de signalement de pannes concernant les equipements de chaque appartements
                title: "Signalement des pannes",
                url:"/admin/equipements-suivi",
            },
            {
                // Generation du devis (facture brouillon) depuis un sejour cloture — Phase 03 etape A
                title: "Devis du Sejour",
                url:"/admin/devis",
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
    const { auth } = usePage<{ auth: { user: { role: string } | null; fullAccess: boolean } }>().props;
    const role = auth.user?.role;

    // fullAccess (administrateur+proprietaire+gerant, calcule cote serveur — voir
    // HandleInertiaRequests) bypass tous les poles operationnels, mais jamais le
    // bloc Administrateur lui-meme : un proprietaire/gerant n'a pas a le voir,
    // seul un compte administrateur y accede (via la correspondance de role normale).
    const visibleNavItems = mainNavItems.filter(
        (item) =>
            !item.roles ||
            (role !== undefined && item.roles.includes(role)) ||
            (auth.fullAccess && !item.roles.includes('administrateur')),
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
