import "./devis.css";

/* ==========================================================================
   Types
   ========================================================================== */

export interface LigneHebergement {
  typeAppartement: string;
  nuitees: number;
  prixUnitaireHT: string; // ex: "120 000 FCFA" (déjà formaté)
  montantHT: string;
}

export interface LigneService {
  service: string;
  quantite: number;
  prixUnitaireHT: string;
  montantHT: string;
}

export interface LigneDommage {
  description: string;
  montantHT: string;
}

export interface ArticleDegradation {
  article: string;
  prix: string; // ex: "10 000-15 000 FCFA"
}

export interface DevisData {
  numeroDevis: string;
  date: string;
  validite: string;

  clientNom: string;
  clientSociete?: string;

  sejourDates: string; // ex: "12/09/2026 au 17/09/2026"
  sejourLieu: string; // ex: "Résidence X – Adresse"

  hebergement: LigneHebergement[];
  sousTotalHebergementHT: string;

  services: LigneService[];
  sousTotalServicesHT: string;

  dommages: LigneDommage[];
  sousTotalDommagesHT: string;

  depotGarantieHT: string;
  delaiRestitutionJours: number;

  totalHT: string;
  montantTvaHT?: string | null; // absent/null si la TVA n'est pas applicable
  totalTTC: string;
  acompteVerseHT?: string | null; // absent/null si aucun paiement encore perçu
  resteAPayerHT?: string | null;

  conditionVersement: string;
  conditionAnnulation: string;
  conditionEtatDesLieux: string;

  bareme: ArticleDegradation[];
}

export interface DevisProps {
  data: DevisData;
}

/* ==========================================================================
   Données par défaut (valeurs d'exemple du prototype)
   Permet d'utiliser <Devis /> sans props pour prévisualiser rapidement.
   ========================================================================== */

const DEFAULT_DATA: DevisData = {
  numeroDevis: "DEV-2026-001",
  date: "08/08/2026",
  validite: "15 jours",

  clientNom: "[Nom du client / Société]",
  clientSociete: "[Société]",

  sejourDates: "[jj/mm/aaaa] au [jj/mm/aaaa]",
  sejourLieu: "[Nom de la résidence] – [Adresse]",

  hebergement: [
    {
      typeAppartement: "Studio 2 pers.",
      nuitees: 5,
      prixUnitaireHT: "120 000 FCFA",
      montantHT: "600 000 FCFA",
    },
    {
      typeAppartement: "Taxe de séjour",
      nuitees: 5,
      prixUnitaireHT: "2 500 FCFA",
      montantHT: "12 500 FCFA",
    },
  ],
  sousTotalHebergementHT: "612 500 FCFA",

  services: [
    {
      service: "Petit-déjeuner buffet",
      quantite: 5,
      prixUnitaireHT: "15 000 FCFA",
      montantHT: "75 000 FCFA",
    },
    {
      service: "Dîner",
      quantite: 3,
      prixUnitaireHT: "35 000 FCFA",
      montantHT: "105 000 FCFA",
    },
    {
      service: "Ménage en cours de séjour",
      quantite: 1,
      prixUnitaireHT: "50 000 FCFA",
      montantHT: "50 000 FCFA",
    },
  ],
  sousTotalServicesHT: "230 000 FCFA",

  dommages: [],
  sousTotalDommagesHT: "0 FCFA",

  depotGarantieHT: "300 000 FCFA",
  delaiRestitutionJours: 7,

  totalHT: "842 500 FCFA",
  totalTTC: "1 011 000 FCFA",

  conditionVersement: "30% à la réservation, solde 7 jours avant l'arrivée.",
  conditionAnnulation:
    "Gratuite jusqu'à J-14 ; entre J-13 et J-7 : 50% ; après J-7 : 100%.",
  conditionEtatDesLieux: "Entrant et sortant, réalisés contradictoirement.",

  bareme: [
    { article: "Verre / assiette", prix: "10 000-15 000 FCFA" },
    { article: "Plat / poêle antiadhésive", prix: "25 000-50 000 FCFA" },
    { article: "Téléviseur (écran cassé)", prix: "150 000-300 000 FCFA" },
    { article: "Table / plan de travail", prix: "50 000-150 000 FCFA" },
    { article: "Remise en état (forfait)", prix: "50 000-100 000 FCFA" },
  ],
};

/* ==========================================================================
   Composant
   ========================================================================== */

export default function Devis({ data = DEFAULT_DATA }: DevisProps) {
  return (
    <div className="devis-document">
      {/* PAGE 1 */}
      <div className="page">
        <div className="header">
          <h1>DEVIS</h1>
          <p>Résidence hôtelière</p>
        </div>

        <div className="info-grid">
          <div className="info-grid-item">
            <label>N° Devis</label>
            <span>{data.numeroDevis}</span>
          </div>
          <div className="info-grid-item">
            <label>Date</label>
            <span>{data.date}</span>
          </div>
          <div className="info-grid-item">
            <label>Validité</label>
            <span>{data.validite}</span>
          </div>
        </div>

        <div className="client-stay-grid">
          <div>
            <div className="label">Client</div>
            <div className="name">{data.clientNom}</div>
            {data.clientSociete && (
              <div className="detail">{data.clientSociete}</div>
            )}
          </div>
          <div>
            <div className="label">Séjour</div>
            <div className="name">{data.sejourDates}</div>
            <div className="detail">{data.sejourLieu}</div>
          </div>
        </div>

        <div>
          <div className="section-title">1. Hébergement</div>
          <table>
            <thead>
              <tr>
                <th>Type d&apos;appartement</th>
                <th className="right">Nuitées</th>
                <th className="right">Prix unit. HT</th>
                <th className="right">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {data.hebergement.map((ligne, i) => (
                <tr key={i}>
                  <td>{ligne.typeAppartement}</td>
                  <td className="center">{ligne.nuitees}</td>
                  <td className="right">{ligne.prixUnitaireHT}</td>
                  <td className="right">{ligne.montantHT}</td>
                </tr>
              ))}
              <tr className="highlight">
                <td colSpan={3} style={{ textAlign: "right" }}>
                  Sous-total hébergement
                </td>
                <td className="right subtotal">
                  {data.sousTotalHebergementHT}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div className="section-title">
            2. Services supplémentaires (optionnels)
          </div>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th className="right">Quantité</th>
                <th className="right">Prix unit. HT</th>
                <th className="right">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((ligne, i) => (
                <tr key={i}>
                  <td>{ligne.service}</td>
                  <td className="center">{ligne.quantite}</td>
                  <td className="right">{ligne.prixUnitaireHT}</td>
                  <td className="right">{ligne.montantHT}</td>
                </tr>
              ))}
              <tr className="highlight">
                <td colSpan={3} style={{ textAlign: "right" }}>
                  Sous-total services
                </td>
                <td className="right subtotal">{data.sousTotalServicesHT}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.dommages.length > 0 && (
          <div>
            <div className="section-title">3. Dommages constatés</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="right">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {data.dommages.map((ligne, i) => (
                  <tr key={i}>
                    <td>{ligne.description}</td>
                    <td className="right">{ligne.montantHT}</td>
                  </tr>
                ))}
                <tr className="highlight">
                  <td style={{ textAlign: "right" }}>Sous-total dommages</td>
                  <td className="right subtotal">{data.sousTotalDommagesHT}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="guarantee-box">
          <div className="section-title">4. Dépôt de garantie</div>
          <p>
            Caution demandée à l&apos;arrivée :{" "}
            <strong>{data.depotGarantieHT}</strong> (non prélevée sauf
            sinistre).
            <br />
            Restituée sous {data.delaiRestitutionJours} jours ouvrés après
            départ, déduction faite des réparations.
          </p>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="page">
        <div className="page2-header">
          <h2>DEVIS (suite)</h2>
          <div className="number">{data.numeroDevis}</div>
        </div>

        <div>
          <div className="section-title">5. Récapitulatif</div>
          <table className="summary-table">
            <tbody>
              <tr>
                <td>Hébergement</td>
                <td>{data.sousTotalHebergementHT}</td>
              </tr>
              <tr>
                <td>Services supplémentaires</td>
                <td>{data.sousTotalServicesHT}</td>
              </tr>
              <tr className="total-ht">
                <td>Total HT</td>
                <td>{data.totalHT}</td>
              </tr>
              {data.montantTvaHT && (
                <tr>
                  <td>TVA</td>
                  <td>{data.montantTvaHT}</td>
                </tr>
              )}
              <tr className="total-ttc">
                <td>Total TTC</td>
                <td>{data.totalTTC}</td>
              </tr>
              {data.acompteVerseHT && (
                <tr>
                  <td>Acompte déjà versé</td>
                  <td>-{data.acompteVerseHT}</td>
                </tr>
              )}
              {data.resteAPayerHT && (
                <tr className="total-ttc">
                  <td>Reste à payer</td>
                  <td>{data.resteAPayerHT}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="conditions">
          <div className="section-title">6. Conditions générales</div>
          <div>
            <strong>Versement :</strong> {data.conditionVersement}
          </div>
          <div>
            <strong>Annulation :</strong> {data.conditionAnnulation}
          </div>
          <div>
            <strong>État des lieux :</strong> {data.conditionEtatDesLieux}
          </div>
        </div>

        <div className="damage-box">
          <div className="section-title">
            Barème indicatif des dégradations
          </div>
          <table className="damage-table">
            <thead>
              <tr>
                <th>Article</th>
                <th className="right">Prix HT</th>
              </tr>
            </thead>
            <tbody>
              {data.bareme.map((item, i) => (
                <tr key={i}>
                  <td>{item.article}</td>
                  <td className="right">{item.prix}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="damage-note">
            Seul le remplacement ou réparation effective sera facturé sur
            justificatif.
          </p>
        </div>

        <div className="signature-section">
          <div className="signature-label">Bon à émettre :</div>
          <div className="signature-grid">
            <div className="signature-box">
              Cachet et signature
              <br />
              Précédés de « Lu et approuvé »
            </div>
            <div className="signature-box right">Date</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_DATA as defaultDevisData };
