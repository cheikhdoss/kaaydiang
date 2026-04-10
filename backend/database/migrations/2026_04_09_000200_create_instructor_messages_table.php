<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->text('message');
            $table->string('sender_role', 20)->default('instructor');
            $table->timestamps();

            $table->index(['instructor_id', 'student_id']);
            $table->index(['instructor_id', 'student_id', 'sender_role'], 'inst_msg_sender_role_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_messages');
    }
};
