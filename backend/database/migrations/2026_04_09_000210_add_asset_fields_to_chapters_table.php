<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            if (!Schema::hasColumn('chapters', 'asset_type')) {
                $table->string('asset_type', 20)->nullable()->after('order');
            }

            if (!Schema::hasColumn('chapters', 'asset_path')) {
                $table->string('asset_path')->nullable()->after('asset_type');
            }

            if (!Schema::hasColumn('chapters', 'asset_original_name')) {
                $table->string('asset_original_name')->nullable()->after('asset_path');
            }

            if (!Schema::hasColumn('chapters', 'asset_mime_type')) {
                $table->string('asset_mime_type', 100)->nullable()->after('asset_original_name');
            }

            if (!Schema::hasColumn('chapters', 'asset_size')) {
                $table->unsignedBigInteger('asset_size')->nullable()->after('asset_mime_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('chapters', 'asset_size')) {
                $columnsToDrop[] = 'asset_size';
            }

            if (Schema::hasColumn('chapters', 'asset_mime_type')) {
                $columnsToDrop[] = 'asset_mime_type';
            }

            if (Schema::hasColumn('chapters', 'asset_original_name')) {
                $columnsToDrop[] = 'asset_original_name';
            }

            if (Schema::hasColumn('chapters', 'asset_path')) {
                $columnsToDrop[] = 'asset_path';
            }

            if (Schema::hasColumn('chapters', 'asset_type')) {
                $columnsToDrop[] = 'asset_type';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
