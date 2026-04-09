<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChapterManagementController extends Controller
{
    public function store(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only add chapters to your courses.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $chapter = Chapter::query()->create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order' => $validated['order'] ?? 0,
        ]);

        return response()->json($chapter, 201);
    }

    public function update(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your course chapters.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $chapter->update($validated);

        return response()->json($chapter);
    }

    public function destroy(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your course chapters.'], 403);
        }

        if ($chapter->asset_path) {
            Storage::disk('public')->delete($chapter->asset_path);
        }

        $chapter->delete();

        return response()->json(['message' => 'Chapter deleted successfully.']);
    }

    public function uploadAssets(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only upload assets to your chapters.'], 403);
        }

        $validated = $request->validate([
            'asset' => [
                'required',
                'file',
                'max:204800',
                'mimetypes:application/pdf,video/mp4,video/webm,video/quicktime,video/x-matroska',
            ],
        ]);

        $asset = $validated['asset'];
        $mimeType = (string) ($asset->getMimeType() ?? '');
        $assetType = str_starts_with($mimeType, 'video/') ? 'video' : 'pdf';

        if ($chapter->asset_path) {
            Storage::disk('public')->delete($chapter->asset_path);
        }

        $storedPath = $asset->store('chapter-assets', 'public');

        $chapter->update([
            'asset_type' => $assetType,
            'asset_path' => $storedPath,
            'asset_original_name' => $asset->getClientOriginalName(),
            'asset_mime_type' => $mimeType,
            'asset_size' => $asset->getSize(),
        ]);

        return response()->json([
            'id' => $chapter->id,
            'asset_type' => $chapter->asset_type,
            'asset_path' => $chapter->asset_path,
            'asset_url' => $chapter->asset_url,
            'asset_original_name' => $chapter->asset_original_name,
            'asset_mime_type' => $chapter->asset_mime_type,
            'asset_size' => (int) ($chapter->asset_size ?? 0),
        ]);
    }

    public function reorder(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only reorder chapters in your courses.'], 403);
        }

        $validated = $request->validate([
            'chapter_ids' => ['required', 'array', 'min:1'],
            'chapter_ids.*' => ['integer', 'distinct'],
        ]);

        $chapterIds = collect($validated['chapter_ids'])->map(fn ($id) => (int) $id)->values();

        $existingIds = Chapter::query()
            ->where('course_id', $course->id)
            ->whereIn('id', $chapterIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($existingIds->count() !== $chapterIds->count()) {
            return response()->json(['message' => 'One or more chapters do not belong to this course.'], 422);
        }

        foreach ($chapterIds as $index => $chapterId) {
            Chapter::query()
                ->where('id', $chapterId)
                ->where('course_id', $course->id)
                ->update(['order' => $index + 1]);
        }

        return response()->json(['message' => 'Chapters reordered successfully.']);
    }
}
