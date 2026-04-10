<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Models\InstructorMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InstructorCourseManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_create_update_publish_and_delete_course(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);

        Sanctum::actingAs($instructor);

        $createResponse = $this->postJson('/api/instructor/courses', [
            'title' => 'Cours API Laravel',
            'description' => 'Description initiale',
            'level' => 'beginner',
            'price' => 12,
        ])->assertCreated();

        $courseId = (int) $createResponse->json('id');

        $this->putJson('/api/instructor/courses/'.$courseId, [
            'title' => 'Cours API Laravel Avance',
            'description' => 'Description mise a jour',
            'level' => 'advanced',
            'price' => 49,
            'is_published' => true,
        ])->assertOk()
            ->assertJsonPath('title', 'Cours API Laravel Avance')
            ->assertJsonPath('is_published', true);

        $this->deleteJson('/api/instructor/courses/'.$courseId)
            ->assertOk()
            ->assertJsonPath('message', 'Course deleted successfully.');

        $this->assertDatabaseMissing('courses', ['id' => $courseId]);
    }

    public function test_instructor_can_manage_chapters_and_lessons_linked_to_course(): void
    {
        Storage::fake('public');

        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);

        $course = Course::query()->create([
            'title' => 'Cours structure',
            'description' => 'Cours test',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => false,
        ]);

        Sanctum::actingAs($instructor);

        $chapterResponse = $this->postJson('/api/instructor/courses/'.$course->id.'/chapters', [
            'title' => 'Chapitre 1',
            'description' => 'Bases',
            'order' => 1,
        ])->assertCreated();

        $chapterId = (int) $chapterResponse->json('id');

        $uploadResponse = $this->postJson('/api/instructor/chapters/'.$chapterId.'/assets', [
            'asset' => UploadedFile::fake()->create('chapter-guide.pdf', 120, 'application/pdf'),
        ])->assertOk();

        $assetPath = $uploadResponse->json('asset_path');
        $this->assertNotNull($assetPath);
        $this->assertTrue(Storage::disk('public')->exists($assetPath));

        $lessonResponse = $this->postJson('/api/instructor/chapters/'.$chapterId.'/lessons', [
            'title' => 'Lecon 1',
            'content' => 'Contenu video',
            'video_url' => 'https://example.com/video.mp4',
            'duration' => 600,
            'order' => 1,
            'is_free' => true,
        ])->assertCreated();

        $lessonId = (int) $lessonResponse->json('id');

        $this->getJson('/api/instructor/courses/'.$course->id)
            ->assertOk()
            ->assertJsonPath('id', $course->id)
            ->assertJsonPath('chapters.0.id', $chapterId)
            ->assertJsonPath('chapters.0.asset_type', 'pdf')
            ->assertJsonPath('chapters.0.asset_original_name', 'chapter-guide.pdf')
            ->assertJsonPath('chapters.0.lessons.0.id', $lessonId)
            ->assertJsonPath('chapters.0.lessons.0.video_url', 'https://example.com/video.mp4');

        $this->putJson('/api/instructor/chapters/'.$chapterId, [
            'title' => 'Chapitre 1 - Mise a jour',
            'description' => 'Bases renforcees',
            'order' => 2,
        ])->assertOk()->assertJsonPath('title', 'Chapitre 1 - Mise a jour');

        $this->postJson('/api/instructor/courses/'.$course->id.'/chapters/reorder', [
            'chapter_ids' => [$chapterId],
        ])->assertOk()->assertJsonPath('message', 'Chapters reordered successfully.');

        $this->putJson('/api/instructor/lessons/'.$lessonId, [
            'title' => 'Lecon 1 - Mise a jour',
            'content' => 'Contenu revise',
            'video_url' => 'https://example.com/video-v2.mp4',
            'duration' => 900,
            'order' => 2,
            'is_free' => false,
        ])->assertOk()
            ->assertJsonPath('title', 'Lecon 1 - Mise a jour')
            ->assertJsonPath('is_free', false);

        $this->postJson('/api/instructor/chapters/'.$chapterId.'/lessons/reorder', [
            'lesson_ids' => [$lessonId],
        ])->assertOk()->assertJsonPath('message', 'Lessons reordered successfully.');

        $this->deleteJson('/api/instructor/lessons/'.$lessonId)
            ->assertOk()
            ->assertJsonPath('message', 'Lesson deleted successfully.');

        $this->assertDatabaseMissing('lessons', ['id' => $lessonId]);

        $this->deleteJson('/api/instructor/chapters/'.$chapterId)
            ->assertOk()
            ->assertJsonPath('message', 'Chapter deleted successfully.');

        $this->assertDatabaseMissing('chapters', ['id' => $chapterId]);
    }

    public function test_instructor_cannot_manage_other_instructor_courses(): void
    {
        $owner = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $otherInstructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);

        $course = Course::query()->create([
            'title' => 'Cours prive',
            'description' => 'Cours owner',
            'instructor_id' => $owner->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => false,
        ]);

        $chapter = Chapter::query()->create([
            'title' => 'Chapitre owner',
            'description' => null,
            'course_id' => $course->id,
            'order' => 1,
        ]);

        $lesson = Lesson::query()->create([
            'title' => 'Lecon owner',
            'content' => null,
            'video_url' => null,
            'chapter_id' => $chapter->id,
            'order' => 1,
            'duration' => 0,
            'is_free' => false,
        ]);

        Sanctum::actingAs($otherInstructor);

        $this->getJson('/api/instructor/courses/'.$course->id)->assertForbidden();
        $this->putJson('/api/instructor/courses/'.$course->id, ['title' => 'Hack'])->assertForbidden();
        $this->deleteJson('/api/instructor/courses/'.$course->id)->assertForbidden();

        $this->postJson('/api/instructor/courses/'.$course->id.'/chapters', [
            'title' => 'Hack chapter',
        ])->assertForbidden();

        $this->putJson('/api/instructor/chapters/'.$chapter->id, ['title' => 'Hack chapter'])->assertForbidden();
        $this->deleteJson('/api/instructor/chapters/'.$chapter->id)->assertForbidden();

        $this->postJson('/api/instructor/chapters/'.$chapter->id.'/lessons', [
            'title' => 'Hack lesson',
        ])->assertForbidden();

        $this->postJson('/api/instructor/courses/'.$course->id.'/chapters/reorder', [
            'chapter_ids' => [$chapter->id],
        ])->assertForbidden();

        $this->postJson('/api/instructor/chapters/'.$chapter->id.'/lessons/reorder', [
            'lesson_ids' => [$lesson->id],
        ])->assertForbidden();

        $this->putJson('/api/instructor/lessons/'.$lesson->id, ['title' => 'Hack lesson'])->assertForbidden();
        $this->deleteJson('/api/instructor/lessons/'.$lesson->id)->assertForbidden();
    }

    public function test_student_message_is_counted_as_unread_for_instructor_conversation(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Unread conversation course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        InstructorMessage::query()->create([
            'instructor_id' => $instructor->id,
            'student_id' => $student->id,
            'course_id' => $course->id,
            'message' => 'Bonjour professeur',
            'sender_role' => 'student',
        ]);

        Sanctum::actingAs($instructor);

        $this->getJson('/api/instructor/messages')
            ->assertOk()
            ->assertJsonPath('0.id', $student->id)
            ->assertJsonPath('0.unread_count', 1);

        $this->postJson('/api/instructor/messages/'.$student->id.'/thread/read')
            ->assertOk()
            ->assertJsonPath('message', 'Thread marked as read.');

        $this->getJson('/api/instructor/messages')
            ->assertOk()
            ->assertJsonPath('0.unread_count', 0);
    }
}
