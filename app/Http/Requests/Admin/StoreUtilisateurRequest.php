<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreUtilisateurRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => $this->passwordRules(),
            // administrateur/client ne se creent jamais depuis cet ecran (voir plan Phase 09).
            'role' => ['required', 'in:proprietaire,gerant,rh,compta,logistique,maintenance,receptionniste'],
        ];
    }
}
