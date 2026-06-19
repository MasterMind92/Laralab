
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Employe = {
  id: string
  nom: string
  prenom: string
  poste: string
  date_embauche: string
  salaire_base: string
  actif: string
}

export const emp: Employe[] = [
  {
    id: "728ed52f",
    nom: "Element",
    prenom: "Pimpant",
    poste: "Plombier",
    date_embauche: "2025-06-01",
    salaire_base: "80000",
    actif: "Oui",
  },
  
  // ...
]

export const columns_emp: ColumnDef<Employe>[] = [
  {
    accessorKey: "nom",
    header: "Nom",
  },
  {
    accessorKey: "prenom",
    header: "Prenom",
  },
  {
    accessorKey: "poste",
    header: "Poste",
  },
  {
    accessorKey: "date_embauche",
    header: "Date Embauche",
  },
  {
    accessorKey: "salaire_base",
    header: "Salaire de Base",
  },
  {
    accessorKey: "actif",
    header: "Actif ?",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copier payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Details</DropdownMenuItem>
            <DropdownMenuItem>Mettre a jour</DropdownMenuItem>
            <DropdownMenuItem><span className="text-red-500"> Supprimer</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]