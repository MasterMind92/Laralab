<?php

namespace App\Http\Controllers\Concerns;

use Symfony\Component\HttpFoundation\StreamedResponse;

trait ExportsCsv
{
    /**
     * Diffuse un CSV (compatible Excel) à partir d'en-têtes et de lignes déjà formatées.
     *
     * @param  array<int, string>  $headers
     * @param  iterable<array<int, string|int|float|null>>  $rows
     */
    protected function streamCsv(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF"); // BOM UTF-8, pour qu'Excel affiche correctement les accents
            fputcsv($handle, $headers, ';', '"', '\\');

            foreach ($rows as $row) {
                fputcsv($handle, $row, ';', '"', '\\');
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
