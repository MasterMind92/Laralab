import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type EtatGeneral = 'Bon' | 'Correct' | 'À signaler'

export type EtatLieuxEquipement = { id: number; nom: string }

export type DommageRow = { description: string; montant: string }

const emptyDommage: DommageRow = { description: '', montant: '' }

// État des lieux d'entrée (check-in) et de sortie (check-out) partagent la même
// structure (état général + checklist équipements + remarques) — seul le check-out
// ajoute un repeater "dommages constatés" (showDommages), une ligne par dommage
// pour pouvoir les chiffrer individuellement en Phase 03 (facturation).
export default function EtatLieuxDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  processing,
  equipements,
  showDommages = false,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  processing: boolean
  equipements: EtatLieuxEquipement[]
  showDommages?: boolean
  onSubmit: (payload: { etatLieux: string; dommages?: DommageRow[] }) => void
}) {
  const [etatGeneral, setEtatGeneral] = useState<EtatGeneral>('Bon')
  const [fonctionnels, setFonctionnels] = useState<Record<number, boolean>>({})
  const [remarques, setRemarques] = useState('')
  const [dommages, setDommages] = useState<DommageRow[]>([])

  function toggleEquipement(id: number, checked: boolean) {
    setFonctionnels((prev) => ({ ...prev, [id]: checked }))
  }

  function addDommage() {
    setDommages((prev) => [...prev, { ...emptyDommage }])
  }

  function updateDommage(index: number, patch: Partial<DommageRow>) {
    setDommages((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function removeDommage(index: number) {
    setDommages((prev) => prev.filter((_, i) => i !== index))
  }

  function reset() {
    setEtatGeneral('Bon')
    setFonctionnels({})
    setRemarques('')
    setDommages([])
  }

  function handleSubmit() {
    const fonctionnelsNoms = equipements.filter((e) => fonctionnels[e.id] !== false).map((e) => e.nom)
    const defectueuxNoms = equipements.filter((e) => fonctionnels[e.id] === false).map((e) => e.nom)

    const lignes = [`État général : ${etatGeneral}`]
    if (fonctionnelsNoms.length) lignes.push(`Équipements fonctionnels : ${fonctionnelsNoms.join(', ')}`)
    if (defectueuxNoms.length) lignes.push(`Équipements défectueux : ${defectueuxNoms.join(', ')}`)
    lignes.push(`Remarques : ${remarques.trim() || 'RAS'}`)

    onSubmit({
      etatLieux: lignes.join('\n'),
      dommages: showDommages ? dommages.filter((d) => d.description.trim() !== '') : undefined,
    })
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

          {showDommages && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Dommages constatés</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDommage}>
                  Ajouter un dommage
                </Button>
              </div>
              <div className="space-y-2 rounded-md border p-3">
                {dommages.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun dommage signalé.</p>
                )}
                {dommages.map((dommage, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Description"
                      className="flex-1"
                      value={dommage.description}
                      onChange={(e) => updateDommage(index, { description: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Montant FCFA"
                      className="w-36"
                      value={dommage.montant}
                      onChange={(e) => updateDommage(index, { montant: e.target.value })}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDommage(index)}>
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>
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
