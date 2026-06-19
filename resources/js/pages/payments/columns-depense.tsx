
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
export type Depense = {
  id: string
  montant: number
  libelle: string
  date_depense: string
  categorie: string
  compta_valid: string
}

export const depense: Depense[] = [
  {
    id: "728ed52f",
    montant: 105000,
    libelle: "reparation",
    date_depense: "2026-01-01 12:00",
    categorie: "appartement",
    compta_valid: "Djekiss",
  },
  {
    id: "728ed52f",
    montant: 10000,
    libelle: "reparation",
    date_depense: "2026-01-01 12:00",
    categorie: "appartements",
    compta_valid: "Rimka Bceao",
  },
  
  // ...
]

export const columns_dep: ColumnDef<Depense>[] = [
  {
    accessorKey: "montant",
    header: "Montant",
  },
  
  {
    accessorKey: "date_depense",
    header: "Date depense",
  },
  {
    accessorKey: "categorie",
    header: "Categorie",
  },
  {
    accessorKey: "compta_valid",
    header: "Comptable Validateur",
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