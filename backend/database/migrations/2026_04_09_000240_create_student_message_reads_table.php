<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_message_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained('assignment_submissions')->cascadeOnDelete();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'conversation_id']);
            $table->index(['student_id', 'last_read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_message_reads');
    }
};
