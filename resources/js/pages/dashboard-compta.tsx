import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { columns_sej, sejour } from './payments/columns-sejour';
import { facture, columns_fact } from './payments/columns-facture';
import { DataTable } from "./payments/data-table"
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


// async function getData(): Promise<Payment> {
//   // Fetch data from your API here.
//   return [
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "success",
//       email: "brice@idt.ci",
//     },
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "pending",
//       email: "marvin@example.com",
//     },
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "failed",
//       email: "yenan@example.com",
//     },
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "pending",
//       email: "kodjane@example.com",
//     },
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "pending",
//       email: "m@example.com",
//     },
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "pending",
//       email: "m@example.com",
//     },
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "pending",
//       email: "m@example.com",
//     },
//     // ...
//   ]
// }

export default function Dashboard() {
    // const [data, setData] = useState<Payment[]>([])
    // useEffect(()=>{
    //     getData().then(setData)
    // },[]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card>
                            <CardHeader>
                                <CardTitle>Taux Occupation</CardTitle>
                                <CardDescription></CardDescription>
                        
                            </CardHeader>
                            <CardContent>
                                <div className="text-6xl font-bold">
                                    50%
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-lg flex justify-between">
                                    <div className="">
                                        Nb d'Appartements occupés :  2 sur 4
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chiffre d'affaire Mensuel</CardTitle>
                                <CardDescription></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className=" flex justify-between">
                                    <div className="text-6xl font-bold">
                                        1.000.000
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-lg flex justify-between">
                                    <div className="">
                                        Augmentation de 10% 
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alertes</CardTitle>
                                {/* <CardDescription>Card Description</CardDescription> */}
                            </CardHeader>
                            <CardContent>
                                <div className=" flex justify-between">
                                    <div className="text-6xl font-bold">
                                        10
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-lg flex justify-between">
                                    <div className="">
                                        5 Urgentes
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <Tabs defaultValue="sejour" className="w-full">
                        <TabsList>
                            <TabsTrigger value="sejour">Consultation des devis</TabsTrigger>
                            <TabsTrigger value="facture">Cloture de sejours</TabsTrigger>
                            <TabsTrigger value="facture">Factures</TabsTrigger>
                            <TabsTrigger value="facture">Encaissements</TabsTrigger>
                            <TabsTrigger value="facture">Recouvrement</TabsTrigger>
                            <TabsTrigger value="facture">Achats</TabsTrigger>
                            <TabsTrigger value="facture">Depenses</TabsTrigger>
                            <TabsTrigger value="facture">Etats Financiers</TabsTrigger>
                        </TabsList>
                        <TabsContent value="sejour">
                             <DataTable columns={columns_sej} data={sejour} />
                        </TabsContent>
                        <TabsContent value="facture">
                             <DataTable columns={columns_fact} data={facture} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
