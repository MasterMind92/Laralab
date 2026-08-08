import { router, useForm } from '@inertiajs/react'
import {
  DateSelectInfo,
  EventClickInfo,
} from '@fullcalendar/react'
import FullCalendar from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/classic'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import { type FormEvent, useState } from 'react'
import ReservationController from '@/actions/App/Http/Controllers/ReservationController'
import { CheckCircle2, XCircle } from 'lucide-react'
import SejourController from '@/actions/App/Http/Controllers/SejourController'
import EtatLieuxDialog, { type DommageRow } from '@/components/fullcalendar/EtatLieuxDialog'
import DemandesServiceSection, { type DemandeServiceResume } from '@/components/fullcalendar/DemandesServiceSection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

type Statut = 'en_attente' | 'validee' | 'annulee' | 'terminee'

type CalendarAppartement = {
  id: number
  numero: string
}

type CalendarClient = {
  id: number
  nom: string
  prenom: string
  telephone: string | null
  email: string | null
}

type CalendarReservation = {
  id: number
  date_debut: string
  date_fin: string
  statut: Statut
  appartement: { id: number; numero: string; equipements: { id: number; nom: string }[] } | null
  client: { id: number; nom: string; prenom: string } | null
  sejour: { id: number; statut: 'en_cours' | 'cloture'; demandes: DemandeServiceResume[] } | null
}

const STATUT_LABELS: Record<Statut, string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  annulee: 'Annulée',
  terminee: 'Terminée',
}

// Formate en UTC (et non en heure locale) pour ne pas décaler la date affichée
// selon le fuseau du navigateur : ce sont des dates de séjour, pas des instants.
function formatDateTime(value: string): string {
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  )
}

const STATUT_COLORS: Record<Statut, string> = {
  en_attente: '#eab308',
  validee: '#16a34a',
  annulee: '#dc2626',
  terminee: '#38bdf8',
}

const NEW_CLIENT_VALUE = '__new__'

type ReservationFormValues = {
  appartement_id: string
  date_debut: string
  date_fin: string
  statut: 'en_attente' | 'validee'
  client_id: string
  client: { nom: string; prenom: string; telephone: string; email: string }
}

export default function Calendar({
  reservations,
  appartements,
  clients,
}: {
  reservations: CalendarReservation[]
  appartements: CalendarAppartement[]
  clients: CalendarClient[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<CalendarReservation | null>(null)
  const [checkinProcessing, setCheckinProcessing] = useState(false)
  const [statutProcessing, setStatutProcessing] = useState(false)
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false)
  const [checkoutProcessing, setCheckoutProcessing] = useState(false)
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)

  const form = useForm<ReservationFormValues>({
    appartement_id: '',
    date_debut: '',
    date_fin: '',
    statut: 'validee',
    client_id: '',
    client: { nom: '', prenom: '', telephone: '', email: '' },
  })

  const reservationsById = new Map(reservations.map((r) => [String(r.id), r]))

  const events = reservations
    .filter((r) => r.appartement && r.client)
    .map((r) => ({
      id: String(r.id),
      title: `${r.appartement!.numero} — ${r.client!.nom} ${r.client!.prenom}`,
      start: r.date_debut,
      end: r.date_fin,
      allDay: true,
      backgroundColor: STATUT_COLORS[r.statut],
      borderColor: STATUT_COLORS[r.statut],
    }))

  function handleDateSelect(selectInfo: DateSelectInfo) {
    form.reset()
    form.setData((data) => ({
      ...data,
      date_debut: selectInfo.startStr,
      date_fin: selectInfo.endStr,
    }))
    selectInfo.view.calendar.unselect()
    setDialogOpen(true)
  }

  function handleEventClick(clickInfo: EventClickInfo) {
    const reservation = reservationsById.get(clickInfo.event.id)
    if (reservation) setSelectedReservation(reservation)
  }

  function updateStatut(reservation: CalendarReservation, statut: 'validee' | 'annulee') {
    setStatutProcessing(true)
    router.patch(
      ReservationController.updateStatut(reservation.id).url,
      { statut },
      {
        preserveScroll: true,
        onFinish: () => setStatutProcessing(false),
        onSuccess: () => setSelectedReservation(null),
      },
    )
  }

  function checkin(reservation: CalendarReservation, etatLieuxEntree: string) {
    setCheckinProcessing(true)
    router.post(
      SejourController.store().url,
      { reservation_id: reservation.id, etat_lieux_entree: etatLieuxEntree },
      {
        preserveScroll: true,
        onFinish: () => setCheckinProcessing(false),
        onSuccess: () => {
          setCheckinDialogOpen(false)
          setSelectedReservation(null)
        },
      },
    )
  }

  function checkout(reservation: CalendarReservation, etatLieuxSortie: string, dommages?: DommageRow[]) {
    if (!reservation.sejour) return
    setCheckoutProcessing(true)
    router.patch(
      SejourController.checkout(reservation.sejour.id).url,
      {
        etat_lieux_sortie: etatLieuxSortie,
        dommages: dommages?.map((d) => ({ ...d, equipement_id: d.equipement_id || undefined })),
      },
      {
        preserveScroll: true,
        onFinish: () => setCheckoutProcessing(false),
        onSuccess: () => {
          setCheckoutDialogOpen(false)
          setSelectedReservation(null)
        },
      },
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    form.post(ReservationController.store().url, {
      preserveScroll: true,
      onSuccess: () => {
        form.reset()
        setDialogOpen(false)
      },
    })
  }

  const { data, setData, errors, processing } = form
  const isNewClient = data.client_id === NEW_CLIENT_VALUE || data.client_id === ''

  return (
    <div className="demo-app">
      <div className="demo-app-main">
        <FullCalendar
          className="demo-app-calendar"
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle réservation</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="appartement_id">Appartement</Label>
              <Select
                value={data.appartement_id}
                onValueChange={(value) => setData('appartement_id', value)}
              >
                <SelectTrigger id="appartement_id">
                  <SelectValue placeholder="Sélectionner un appartement" />
                </SelectTrigger>
                <SelectContent>
                  {appartements.map((appartement) => (
                    <SelectItem key={appartement.id} value={String(appartement.id)}>
                      {appartement.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.appartement_id && <p className="text-sm text-destructive">{errors.appartement_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date_debut">Arrivée</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={data.date_debut}
                  onChange={(e) => setData('date_debut', e.target.value)}
                />
                {errors.date_debut && <p className="text-sm text-destructive">{errors.date_debut}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date_fin">Départ</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={data.date_fin}
                  onChange={(e) => setData('date_fin', e.target.value)}
                />
                {errors.date_fin && <p className="text-sm text-destructive">{errors.date_fin}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="statut">Statut</Label>
              <Select value={data.statut} onValueChange={(value) => setData('statut', value as 'en_attente' | 'validee')}>
                <SelectTrigger id="statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={data.client_id}
                onValueChange={(value) => setData('client_id', value === NEW_CLIENT_VALUE ? '' : value)}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Nouveau client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_CLIENT_VALUE}>+ Nouveau client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.nom} {client.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-destructive">{errors.client_id}</p>}
            </div>

            {isNewClient && (
              <div className="grid grid-cols-2 gap-4 rounded-md border p-3">
                <div className="grid gap-2">
                  <Label htmlFor="client_nom">Nom</Label>
                  <Input
                    id="client_nom"
                    value={data.client.nom}
                    onChange={(e) => setData('client', { ...data.client, nom: e.target.value })}
                  />
                  {errors['client.nom'] && <p className="text-sm text-destructive">{errors['client.nom']}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client_prenom">Prénom</Label>
                  <Input
                    id="client_prenom"
                    value={data.client.prenom}
                    onChange={(e) => setData('client', { ...data.client, prenom: e.target.value })}
                  />
                  {errors['client.prenom'] && <p className="text-sm text-destructive">{errors['client.prenom']}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client_telephone">Téléphone</Label>
                  <Input
                    id="client_telephone"
                    value={data.client.telephone}
                    onChange={(e) => setData('client', { ...data.client, telephone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={data.client.email}
                    onChange={(e) => setData('client', { ...data.client, email: e.target.value })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={processing}>
                {processing ? 'Enregistrement...' : 'Créer la réservation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedReservation !== null} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedReservation?.appartement?.numero} — {selectedReservation?.client?.nom}{' '}
              {selectedReservation?.client?.prenom}
            </DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Dates : </span>
                {formatDateTime(selectedReservation.date_debut)} → {formatDateTime(selectedReservation.date_fin)}
              </p>
              <p>
                <span className="text-muted-foreground">Statut réservation : </span>
                {STATUT_LABELS[selectedReservation.statut]}
              </p>
              <p>
                <span className="text-muted-foreground">Séjour : </span>
                {selectedReservation.sejour
                  ? selectedReservation.sejour.statut === 'en_cours'
                    ? 'Check-in effectué'
                    : 'Clôturé'
                  : 'Pas encore de check-in'}
              </p>

              {selectedReservation.sejour?.statut === 'en_cours' && (
                <DemandesServiceSection sejourId={selectedReservation.sejour.id} demandes={selectedReservation.sejour.demandes} />
              )}

              {selectedReservation.statut === 'en_attente' && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => updateStatut(selectedReservation, 'annulee')}
                    disabled={statutProcessing}
                  >
                    <XCircle className="text-red-600" /> Annuler
                  </Button>
                  <Button onClick={() => updateStatut(selectedReservation, 'validee')} disabled={statutProcessing}>
                    <CheckCircle2 /> Confirmer
                  </Button>
                </DialogFooter>
              )}

              {selectedReservation.statut === 'validee' && !selectedReservation.sejour && (
                <DialogFooter>
                  <Button onClick={() => setCheckinDialogOpen(true)}>Effectuer le check-in</Button>
                </DialogFooter>
              )}

              {selectedReservation.sejour?.statut === 'en_cours' && (
                <DialogFooter>
                  <Button onClick={() => setCheckoutDialogOpen(true)}>Effectuer le check-out</Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedReservation && (
        <>
          <EtatLieuxDialog
            open={checkinDialogOpen}
            onOpenChange={setCheckinDialogOpen}
            title={`Check-in — ${selectedReservation.appartement?.numero ?? ''}`}
            submitLabel="Valider le check-in"
            processing={checkinProcessing}
            equipements={selectedReservation.appartement?.equipements ?? []}
            onSubmit={({ etatLieux }) => checkin(selectedReservation, etatLieux)}
          />
          <EtatLieuxDialog
            open={checkoutDialogOpen}
            onOpenChange={setCheckoutDialogOpen}
            title={`Check-out — ${selectedReservation.appartement?.numero ?? ''}`}
            submitLabel="Valider le check-out"
            processing={checkoutProcessing}
            equipements={selectedReservation.appartement?.equipements ?? []}
            showDommages
            onSubmit={({ etatLieux, dommages }) => checkout(selectedReservation, etatLieux, dommages)}
          />
        </>
      )}
    </div>
  )
}
