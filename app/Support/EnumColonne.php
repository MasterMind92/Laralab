<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Modifie le jeu de valeurs d'une colonne `enum()` existante, sur tous les pilotes.
 *
 * MySQL et SQLite acceptent `$table->enum(...)->change()`. PostgreSQL non : Laravel y
 * représente un enum par un `varchar(255)` + contrainte CHECK, et compile le `->change()`
 * en `alter column "x" type varchar(255) check (...)` — SQL invalide. Sur pgsql on
 * supprime donc la (les) contrainte(s) CHECK portant sur la colonne, on change le
 * varchar (nullabilité, défaut), puis on recrée la contrainte avec le nouvel ensemble.
 *
 * Les CHECK sont retrouvées via pg_constraint plutôt que par leur nom conventionnel
 * (`{table}_{colonne}_check`) : après un `renameColumn()`, Postgres réécrit l'expression
 * de la contrainte mais garde son ANCIEN nom. Le préfixe de table de la connexion
 * (`resi_` sur pgsql) est appliqué à la main, le SQL brut ne passant pas par le builder.
 */
class EnumColonne
{
    /**
     * @param  list<string>  $valeurs
     */
    public static function changer(string $table, string $colonne, array $valeurs, ?string $defaut = null, bool $nullable = false): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            Schema::table($table, function (Blueprint $t) use ($colonne, $valeurs, $defaut, $nullable) {
                $t->enum($colonne, $valeurs)->nullable($nullable)->default($defaut)->change();
            });

            return;
        }

        $tablePrefixee = DB::getTablePrefix().$table;

        $contraintes = DB::select(
            "select con.conname
             from pg_constraint con
             join pg_class rel on rel.oid = con.conrelid
             join pg_namespace ns on ns.oid = rel.relnamespace
             join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
             where con.contype = 'c' and ns.nspname = current_schema() and rel.relname = ? and att.attname = ?",
            [$tablePrefixee, $colonne]
        );

        foreach ($contraintes as $contrainte) {
            DB::statement(sprintf('alter table "%s" drop constraint "%s"', $tablePrefixee, $contrainte->conname));
        }

        Schema::table($table, function (Blueprint $t) use ($colonne, $defaut, $nullable) {
            $t->string($colonne)->nullable($nullable)->default($defaut)->change();
        });

        $liste = implode(', ', array_map(fn (string $v) => DB::getPdo()->quote($v), $valeurs));

        DB::statement(sprintf(
            'alter table "%s" add constraint "%s" check ("%s" in (%s))',
            $tablePrefixee,
            "{$tablePrefixee}_{$colonne}_check",
            $colonne,
            $liste
        ));
    }
}
