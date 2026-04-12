<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action');            // e.g. 'user.created', 'course.published', 'assignment.graded'
            $table->string('description');       // Human-readable description
            $table->string('model_type')->nullable();  // e.g. 'App\Models\Course'
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('properties')->nullable();    // Extra metadata
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['action', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['model_type', 'model_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
