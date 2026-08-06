import { router } from '@inertiajs/react'
import { type FormEvent, useState } from 'react'
import DemandeServiceController from '@/actions/App/Http/Controllers/DemandeServiceController'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type DemandeServiceResume = {
  id: number
  designation: string
  quantite: number
  prix_unitaire: string
  statut: 'demandee' | 'livree'
}

function formatFcfa(n: number): string {
  return n.toLocaleString('fr-FR')
}

// Suivi des services supplémentaires consommés pendant un séjour en cours
// (commandes d'articles/nourriture/boissons...) — visible uniquement une fois le
// check-in effectué, dans le même dialog de détail réservation.
export default function DemandesServiceSection({ sejourId, demandes }: { sejourId: number; demandes: DemandeServiceResume[] }) {
  const [designation, setDesignation] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [prixUnitaire, setPrixUnitaire] = useState('')
  const [processing, setProcessing] = useState(false)
  const [livraisonProcessingId, setLivraisonProcessingId] = useState<number | null>(null)

  const total = demandes.reduce((sum, d) => sum + d.quantite * Number(d.prix_unitaire), 0)

  function submit(e: FormEvent) {
    e.preventDefault()
    setProcessing(true)
    router.post(
      DemandeServiceController.store().url,
      { sejour_id: sejourId, designation, quantite, prix_unitaire: prixUnitaire },
      {
        preserveScroll: true,
        onFinish: () => setProcessing(false),
        onSuccess: () => {
          setDesignation('')
          setQuantite('1')
          setPrixUnitaire('')
        },
      },
    )
  }

  function marquerLivree(demandeId: number) {
    setLivraisonProcessingId(demandeId)
    router.patch(
      DemandeServiceController.update(demandeId).url,
      {},
      { preserveScroll: true, onFinish: () => setLivraisonProcessingId(null) },
    )
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-medium">Suivi des besoins</p>

      {demandes.length > 0 && (
        <div className="space-y-1.5">
          {demandes.map((demande) => (
            <div key={demande.id} className="flex items-center justify-between text-xs gap-2">
              <span className="flex-1">
                {demande.quantite}× {demande.designation}{' '}
                <span className="text-muted-foreground">({formatFcfa(demande.quantite * Number(demande.prix_unitaire))} FCFA)</span>
              </span>
              {demande.statut === 'livree' ? (
                <Badge variant="default">Livrée</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => marquerLivree(demande.id)}
                  disabled={livraisonProcessingId === demande.id}
                >
                  Marquer livrée
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs font-medium pt-1">Total : {formatFcfa(total)} FCFA</p>
        </div>
      )}

      <form onSubmit={submit} className="flex items-end gap-2 pt-1">
        <div className="flex-1 grid gap-1">
          <Label htmlFor="demande-designation" className="text-[11px]">Article</Label>
          <Input
            id="demande-designation"
            className="h-8"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Ex. Coca-Cola"
          />
        </div>
        <div className="w-16 grid gap-1">
          <Label htmlFor="demande-quantite" className="text-[11px]">Qté</Label>
          <Input
            id="demande-quantite"
            className="h-8"
            type="number"
            min={1}
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
        </div>
        <div className="w-24 grid gap-1">
          <Label htmlFor="demande-prix" className="text-[11px]">Prix unit.</Label>
          <Input
            id="demande-prix"
            className="h-8"
            type="number"
            min={0}
            step="0.01"
            value={prixUnitaire}
            onChange={(e) => setPrixUnitaire(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="h-8" disabled={processing || !designation || !prixUnitaire}>
          Ajouter
        </Button>
      </form>
    </div>
  )
}
