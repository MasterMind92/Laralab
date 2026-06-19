import { z } from "zod";

export const utilisateurSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  mot_de_passe: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["admin", "manager", "utilisateur"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
});

// Extraction du type TypeScript automatique à partir du schéma Zod
export type UtilisateurFormValues = z.infer<typeof utilisateurSchema>;

export type Utilisateur = UtilisateurFormValues & {
  id_utilisateur: number;
};