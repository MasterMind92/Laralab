
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
export type Client = {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
}

export const clt: Client[] = [
  {
    id: "728ed52f",
    nom: "Dalo",
    prenom: "Marc",
    email: "m@example.com",
    telephone: "0747427163",
  },
  
  // ...
]

export const columns_clt: ColumnDef<Client>[] = [
  {
    accessorKey: "nom",
    header: "Nom",
  },
  {
    accessorKey: "prenom",
    header: "Prenom",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "telephone",
    header: "Telphone",
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