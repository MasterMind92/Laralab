
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
export type Facture = {
  id: string
  status: "pending" | "processing" | "success" | "failed"
  montant_ht: number
  montant_ttc: number
  date_edition: string
  id_sejour: string
}

export const facture: Facture[] = [
  {
    id: "728ed52f",
    status: "pending",
    montant_ht: 10000,
    montant_ttc: 11800,
    date_edition: "2025-03-10",
    id_sejour: "SEJ-12345",
  }
  // ...
]

export const columns_fact: ColumnDef<Facture>[] = [
  {
    accessorKey: "id_sejour",
    header: "Reference Sejour",
  },
  {
    accessorKey: "montant_ht",
    header: "Montant HT",
  },
  {
    accessorKey: "montant_ttc",
    header: "Montant TTC",
  },
  {
    accessorKey: "date_edition",
    header: "Date Edition",
  },
  {
    accessorKey: "status",
    header: "Statut",
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