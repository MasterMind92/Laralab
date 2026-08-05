import { Head, Link } from "@inertiajs/react";
import { CalendarX, MapPin, Users } from "lucide-react";
import { formatPrice } from "@/lib/data";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type Statut = "en_attente" | "validee" | "annulee" | "terminee";

type ReservationResume = {
  id: number;
  appartement: { id: number; titre: string; photo: string | null };
  date_debut: string;
  date_fin: string;
  nights: number;
  nombre_personnes: number | null;
  statut: Statut;
  total: number;
};

const STATUT_LABELS: Record<Statut, string> = {
  en_attente: "En attente de confirmation",
  validee: "Confirmée",
  annulee: "Annulée",
  terminee: "Terminée",
};

const STATUT_STYLES: Record<Statut, string> = {
  en_attente: "bg-amber-50 border-amber-200 text-amber-700",
  validee: "bg-green-50 border-green-200 text-green-700",
  annulee: "bg-red-50 border-red-200 text-red-700",
  terminee: "bg-stone-100 border-stone-200 text-stone-500",
};

function fmt(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function ReservationCard({ reservation }: { reservation: ReservationResume }) {
  return (
    <div className="bg-white border border-[rgb(var(--gold))]/15 rounded-xl overflow-hidden flex flex-col sm:flex-row">
      {reservation.appartement.photo && (
        <img
          src={reservation.appartement.photo}
          alt={reservation.appartement.titre}
          className="w-full sm:w-48 h-40 sm:h-auto object-cover"
        />
      )}
      <div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <span
            className={cn(
              "inline-block text-[10px] uppercase tracking-wider border rounded-full px-2.5 py-1 mb-2",
              STATUT_STYLES[reservation.statut]
            )}
          >
            {STATUT_LABELS[reservation.statut]}
          </span>
          <h3 className="font-['Cormorant_Garamond'] text-2xl mb-1">{reservation.appartement.titre}</h3>
          <p className="text-sm text-stone-500 flex items-center gap-1.5 mb-1">
            <MapPin size={13} className="text-[rgb(var(--gold))]" />
            {fmt(reservation.date_debut)} → {fmt(reservation.date_fin)} ({reservation.nights} nuit{reservation.nights > 1 ? "s" : ""})
          </p>
          {reservation.nombre_personnes && (
            <p className="text-sm text-stone-400 flex items-center gap-1.5">
              <Users size={13} className="text-[rgb(var(--gold))]" />
              {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-3 sm:text-right sm:border-l sm:border-[rgb(var(--gold))]/10 sm:pl-4">
          <p className="font-['Cormorant_Garamond'] text-2xl text-[rgb(var(--dark))]">
            {formatPrice(reservation.total)} <span className="text-xs font-['DM_Sans'] text-stone-400 font-light">FCFA</span>
          </p>
          <Link href={`/appartements/${reservation.appartement.id}`} className="text-xs text-[rgb(var(--gold))] hover:underline whitespace-nowrap">
            Voir l'appartement
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MyReservationsPage({ reservations }: { reservations: ReservationResume[] }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head title="Mes réservations" />
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <h1 className="font-['Cormorant_Garamond'] text-4xl font-light mb-8">Mes réservations</h1>

        {reservations.length === 0 ? (
          <div className="bg-white border border-[rgb(var(--gold))]/15 rounded-xl p-12 text-center">
            <CalendarX size={40} className="text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 mb-6">Vous n'avez pas encore de réservation.</p>
            <Link href="/appartements" className="btn-gold py-3 px-8">
              Découvrir les appartements
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
