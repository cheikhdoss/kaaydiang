<?php

namespace App\Notifications;

use App\Models\AssignmentSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssignmentGradedNotification extends Notification
{
    use Queueable;

    protected $submission;

    public function __construct(AssignmentSubmission $submission)
    {
        $this->submission = $submission;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $courseTitle = $this->submission->assignment?->course?->title ?? 'votre cours';
        $assignmentTitle = $this->submission->assignment?->title ?? 'Devoir';
        $statusLabel = $this->submission->status === 'reviewed' ? 'été corrigé' : 'demande une révision';
        $score = $this->submission->score;

        $mail = (new MailMessage)
            ->subject("Mise à jour de votre devoir : {$assignmentTitle}")
            ->greeting("Bonjour {$notifiable->first_name} !")
            ->line("Bonne nouvelle ! Votre travail sur le devoir **\"{$assignmentTitle}\"** du cours **\"{$courseTitle}\"** a {$statusLabel} par votre instructeur.");

        if ($score !== null) {
            $mail->line("Note obtenue : **{$score}/100**");
        }

        if ($this->submission->instructor_feedback) {
            $mail->line("Commentaire du prof : \"{$this->submission->instructor_feedback}\"");
        }

        return $mail->action('Voir mon résultat', url('/dashboard/student/assignments'))
            ->line('Continuez vos efforts, vous progressez !')
            ->salutation('L\'équipe KayyDiang');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'submission_id' => $this->submission->id,
            'assignment_title' => $this->submission->assignment?->title,
            'status' => $this->submission->status,
            'score' => $this->submission->score,
            'message' => "Votre devoir \"{$this->submission->assignment?->title}\" a été mis à jour.",
        ];
    }
}
