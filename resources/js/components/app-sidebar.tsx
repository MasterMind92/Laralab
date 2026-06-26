import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
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

const mainNavItems: NavItem[] = [
    {
        title: 'Proprietaire',
        href: dashboard(),
        icon: LayoutGrid,
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
        title: 'Gerant',
        href: "#",
        icon: LayoutGrid,
        sub:[
            {
                title: "test",
                url:"#",
            }
        ]
    },
    {
        title: 'RH',
        href: "ressources-humaine",
        icon: LayoutGrid,
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
        href: "comptabilite",
        icon: LayoutGrid,
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
                title: "Factures",
                url:"#",
            },
            {
                title: "Encaissements",
                url:"#",
            },
            {
                title: "Recouvrement",
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
            

        ]
    },
    {
        title: 'Logistique',
        href: "comptabilite",
        icon: LayoutGrid,
        sub:[
            {
                title: "Expression Besoins",
                url:"#",
            },
            {
                title: "Recepeiton",
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
        href: "comptabilite",
        icon: LayoutGrid,
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
        title: 'Commercial',
        href: "/commercial",
        icon: LayoutGrid,
        sub:[
            {
                title: "Planning",
                url:"#",
            },
            {
                title: "Traitement  Reservation-Client",
                url:"#",
            },
            {
                title: "Accueils Client",
                url:"#",
            },
            {
                title: "Etats des lieux",
                url:"#",
            },
            {
                title: "Suivi des besoins",
                url:"#",
            },
            {
                title: "Gestion des casse",
                url:"#",
            },
            {
                title: "Signalement des pannes",
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
        {mainNavItems.map((item) => (
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
                            <a href={item.url}>{item.title}</a>
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
