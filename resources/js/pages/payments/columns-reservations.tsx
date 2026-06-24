
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
export type reservations = {
  id_reservation: string
  id_client: string
  date_debut: string
  date_fin: string
  status: "pending" | "processing" | "success" | "failed"
  date_reserv: string
}

export const reservationss: reservations[] = [
  {
    id_reservation: "728ed52f",
    id_client: "ap9wef8ah",
    date_debut: "2020-01-10",
    date_fin: "2020-01-11",
    status: "pending",
    date_reserv: "2020-01-01",
  },
  {
    id_reservation: "728ed52f",
    id_client: "ap9wef8ah",
    date_debut: "2020-01-10",
    date_fin: "2020-01-11",
    status: "pending",
    date_reserv: "2020-01-01",
  },
  {
    id_reservation: "728ed52f",
    id_client: "ap9wef8ah",
    date_debut: "2020-01-10",
    date_fin: "2020-01-11",
    status: "pending",
    date_reserv: "2020-01-01",
  },
  // ...
]

export const columns_reserv: ColumnDef<reservations>[] = [
  {
    accessorKey: "id_reservation",
    header: "Reservation",
  },
  {
    accessorKey: "id_client",
    header: "",
  },
  {
    accessorKey: "date_debut",
    header: "Date de debut",
  },
  {
    accessorKey: "date_fin",
    header: "date de fin",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "date_reserv",
    header: "Date de reservation",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const reservations = row.original
 
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
              onClick={() => navigator.clipboard.writeText(reservations.id_reservation)}
            >
              Copier reservations ID
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