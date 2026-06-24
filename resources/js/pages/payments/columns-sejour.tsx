
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
export type Sejour = {
  id: string
  status: "en cours" | "cloture" 
  id_reservation: string
  date_entree: string
  date_sortie: string
  etat_lieux_entree: string
  etat_lieux_sortie: string
  casses: string
}

export const sejour: Sejour[] = [
  {
    id: "728ed52f",
    status: "en cours",
    id_reservation: "m@example.com",
    date_entree: "2026-01-01 12:00",
    date_sortie: "2026-01-02 12:00",
    etat_lieux_entree: "ok",
    etat_lieux_sortie: "non ok",
    casses: "Oui",
  },
  
  // ...
]

export const columns_sej: ColumnDef<Sejour>[] = [
  
  {
    accessorKey: "id_reservation",
    header: "Ref Reservation",
  },
  {
    accessorKey: "status",
    header: "Statut",
  },
  {
    accessorKey: "date_entree",
    header: "Date d'entree",
  },
  {
    accessorKey: "date_sortie",
    header: "Date de Sortie",
  },
  {
    accessorKey: "etat_lieux_entree",
    header: "Statut check-in",
  },
  {
    accessorKey: "etat_lieux_sortie",
    header: "Statut Check out",
  },
  {
    accessorKey: "casses",
    header: "Amount",
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