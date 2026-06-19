
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
export type Appartement = {
  id: string
  numero: string
  statut: "pending" | "processing" | "success" | "failed"
  capacite: number
  prix_nuit: number
}

export const appartements: Appartement[] = [
  {
    id: "728ed52f",
    numero: "appart-001",
    statut: "pending",
    capacite: 5,
    prix_nuit: 15000,
  },
 
  // ...
]

export const columns: ColumnDef<Appartement>[] = [
  {
    accessorKey: "numero",
    header: "Status",
  },
  {
    accessorKey: "statut",
    header: "Statut",
  },
  {
    accessorKey: "capacite",
    header: "Capacite",
  },
  {
    accessorKey: "prix_nuit",
    header: "Prix",
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