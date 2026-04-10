<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stocke les réponses d'un étudiant à chaque question d'un quiz.
     * Permet de corriger automatiquement et de montrer les corrections.
     */
    public function up(): void
    {
        Schema::create('quiz_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempt_id')->constrained('quiz_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('quiz_questions')->cascadeOnDelete();
            // Pour multiple_choice: tableau d'IDs d'options sélectionnées (JSON)
            // Pour true_false: 'true' ou 'false'
            // Pour short_answer: texte libre
            $table->json('answer_data');
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('points_earned')->default(0);
            $table->timestamps();

            $table->unique(['quiz_attempt_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_answers');
    }
};
