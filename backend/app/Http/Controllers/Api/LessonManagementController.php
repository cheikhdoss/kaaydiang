<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LessonManagementController extends Controller
{
    public function store(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only add lessons to your chapters.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'blocks' => ['nullable', 'array'],
            'blocks.*.id' => ['required_with:blocks', 'string'],
            'blocks.*.type' => ['required_with:blocks', 'string', 'in:text,video,pdf'],
            'blocks.*.order' => ['nullable', 'integer', 'min:0'],
            'blocks.*.content' => ['nullable', 'string'],
            'blocks.*.video_url' => ['nullable', 'string', 'max:2048'],
            'blocks.*.video_title' => ['nullable', 'string', 'max:255'],
            'blocks.*.pdf_path' => ['nullable', 'string', 'max:2048'],
            'blocks.*.pdf_url' => ['nullable', 'string', 'max:2048'],
            'blocks.*.pdf_name' => ['nullable', 'string', 'max:255'],
            'blocks.*.pdf_size' => ['nullable', 'integer', 'min:0'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'order' => ['nullable', 'integer', 'min:0'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'is_free' => ['nullable', 'boolean'],
        ]);

        $lesson = Lesson::query()->create([
            'chapter_id' => $chapter->id,
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'blocks' => $validated['blocks'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'order' => $validated['order'] ?? 0,
            'duration' => $validated['duration'] ?? 0,
            'is_free' => $validated['is_free'] ?? false,
        ]);

        return response()->json($lesson, 201);
    }

    public function update(Request $request, Lesson $lesson)
    {
        $user = $request->user();

        if ($lesson->chapter?->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your lessons.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'blocks' => ['nullable', 'array'],
            'blocks.*.id' => ['required_with:blocks', 'string'],
            'blocks.*.type' => ['required_with:blocks', 'string', 'in:text,video,pdf'],
            'blocks.*.order' => ['nullable', 'integer', 'min:0'],
            'blocks.*.content' => ['nullable', 'string'],
            'blocks.*.video_url' => ['nullable', 'string', 'max:2048'],
            'blocks.*.video_title' => ['nullable', 'string', 'max:255'],
            'blocks.*.pdf_path' => ['nullable', 'string', 'max:2048'],
            'blocks.*.pdf_url' => ['nullable', 'string', 'max:2048'],
            'blocks.*.pdf_name' => ['nullable', 'string', 'max:255'],
            'blocks.*.pdf_size' => ['nullable', 'integer', 'min:0'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'order' => ['sometimes', 'integer', 'min:0'],
            'duration' => ['sometimes', 'integer', 'min:0'],
            'is_free' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('blocks', $validated)) {
            $existingPdfPaths = collect($lesson->blocks ?? [])
                ->pluck('pdf_path')
                ->filter(fn ($path) => is_string($path) && $path !== '')
                ->unique();

            $incomingPdfPaths = collect($validated['blocks'] ?? [])
                ->pluck('pdf_path')
                ->filter(fn ($path) => is_string($path) && $path !== '')
                ->unique();

            $pathsToDelete = $existingPdfPaths->diff($incomingPdfPaths);
            foreach ($pathsToDelete as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $lesson->update($validated);

        return response()->json($lesson);
    }

    public function uploadBlockPdf(Request $request, Lesson $lesson, string $blockId)
    {
        $user = $request->user();

        if ($lesson->chapter?->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your lessons.'], 403);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:51200', 'mimes:pdf'],
        ]);

        $blocks = collect($lesson->blocks ?? [])->values();
        $blockIndex = $blocks->search(fn ($block) => (string) ($block['id'] ?? '') === $blockId);

        if (!is_int($blockIndex)) {
            return response()->json(['message' => 'Block not found in this lesson.'], 404);
        }

        $existingBlock = (array) $blocks->get($blockIndex);
        if (($existingBlock['type'] ?? null) !== 'pdf') {
            return response()->json(['message' => 'Target block is not a PDF block.'], 422);
        }

        $existingPath = $existingBlock['pdf_path'] ?? null;
        if (is_string($existingPath) && $existingPath !== '') {
            Storage::disk('public')->delete($existingPath);
        }

        $pdf = $validated['file'];
        $storedPath = $pdf->store('lesson-block-assets', 'public');

        $updatedBlock = [
            ...$existingBlock,
            'pdf_path' => $storedPath,
            'pdf_url' => asset('storage/'.$storedPath),
            'pdf_name' => $pdf->getClientOriginalName(),
            'pdf_size' => (int) $pdf->getSize(),
        ];

        $blocks->put($blockIndex, $updatedBlock);

        $lesson->update([
            'blocks' => $blocks->all(),
        ]);

        return response()->json([
            'block' => $updatedBlock,
        ]);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        $user = $request->user();

        if ($lesson->chapter?->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your lessons.'], 403);
        }

        $pdfPaths = collect($lesson->blocks ?? [])
            ->pluck('pdf_path')
            ->filter(fn ($path) => is_string($path) && $path !== '')
            ->unique();

        foreach ($pdfPaths as $path) {
            Storage::disk('public')->delete($path);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted successfully.']);
    }

    public function reorder(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only reorder lessons in your chapters.'], 403);
        }

        $validated = $request->validate([
            'lesson_ids' => ['required', 'array', 'min:1'],
            'lesson_ids.*' => ['integer', 'distinct'],
        ]);

        $lessonIds = collect($validated['lesson_ids'])->map(fn ($id) => (int) $id)->values();

        $existingIds = Lesson::query()
            ->where('chapter_id', $chapter->id)
            ->whereIn('id', $lessonIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($existingIds->count() !== $lessonIds->count()) {
            return response()->json(['message' => 'One or more lessons do not belong to this chapter.'], 422);
        }

        foreach ($lessonIds as $index => $lessonId) {
            Lesson::query()
                ->where('id', $lessonId)
                ->where('chapter_id', $chapter->id)
                ->update(['order' => $index + 1]);
        }

        return response()->json(['message' => 'Lessons reordered successfully.']);
    }
}
