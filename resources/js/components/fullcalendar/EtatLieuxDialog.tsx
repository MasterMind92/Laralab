import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type EtatGeneral = 'Bon' | 'Correct' | 'À signaler'

export type EtatLieuxEquipement = { id: number; nom: string }

// État des lieux d'entrée (check-in) et de sortie (check-out) partagent la même
// structure (état général + checklist équipements + remarques) — seul le check-out
// ajoute un champ "dégâts constatés" dédié (showCasses).
export default function EtatLieuxDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  processing,
  equipements,
  showCasses = false,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  processing: boolean
  equipements: EtatLieuxEquipement[]
  showCasses?: boolean
  onSubmit: (payload: { etatLieux: string; casses?: string }) => void
}) {
  const [etatGeneral, setEtatGeneral] = useState<EtatGeneral>('Bon')
  const [fonctionnels, setFonctionnels] = useState<Record<number, boolean>>({})
  const [remarques, setRemarques] = useState('')
  const [casses, setCasses] = useState('')

  function toggleEquipement(id: number, checked: boolean) {
    setFonctionnels((prev) => ({ ...prev, [id]: checked }))
  }

  function reset() {
    setEtatGeneral('Bon')
    setFonctionnels({})
    setRemarques('')
    setCasses('')
  }

  function handleSubmit() {
    const fonctionnelsNoms = equipements.filter((e) => fonctionnels[e.id] !== false).map((e) => e.nom)
    const defectueuxNoms = equipements.filter((e) => fonctionnels[e.id] === false).map((e) => e.nom)

    const lignes = [`État général : ${etatGeneral}`]
    if (fonctionnelsNoms.length) lignes.push(`Équipements fonctionnels : ${fonctionnelsNoms.join(', ')}`)
    if (defectueuxNoms.length) lignes.push(`Équipements défectueux : ${defectueuxNoms.join(', ')}`)
    lignes.push(`Remarques : ${remarques.trim() || 'RAS'}`)

    onSubmit({ etatLieux: lignes.join('\n'), casses: showCasses ? casses.trim() || undefined : undefined })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>État général du logement</Label>
            <Select value={etatGeneral} onValueChange={(value) => setEtatGeneral(value as EtatGeneral)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bon">Bon</SelectItem>
                <SelectItem value="Correct">Correct</SelectItem>
                <SelectItem value="À signaler">À signaler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {equipements.length > 0 && (
            <div className="grid gap-2">
              <Label>Équipements</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {equipements.map((eq) => (
                  <label key={eq.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={fonctionnels[eq.id] !== false}
                      onCheckedChange={(checked) => toggleEquipement(eq.id, checked === true)}
                    />
                    {eq.nom}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Décochez un équipement s'il est défectueux.</p>
            </div>
          )}

          {showCasses && (
            <div className="grid gap-2">
              <Label htmlFor="casses">Dégâts constatés</Label>
              <textarea
                id="casses"
                rows={3}
                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                value={casses}
                onChange={(e) => setCasses(e.target.value)}
                placeholder="Aucun si rien à signaler"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="etat-lieux-remarques">Remarques</Label>
            <textarea
              id="etat-lieux-remarques"
              rows={3}
              className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
              value={remarques}
              onChange={(e) => setRemarques(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={processing}>
            {processing ? 'Enregistrement...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
