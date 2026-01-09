<?php

namespace App\Filament\Resources\AttendanceRequestResource\Pages;

use App\Filament\Resources\AttendanceRequestResource;
use App\Services\AttendanceRequestService;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Validation\ValidationException;
use Throwable;

class EditAttendanceRequest extends EditRecord
{
    protected static string $resource = AttendanceRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('approveRequest')
                ->label('Setujui & Terapkan')
                ->color('success')
                ->visible(fn () => $this->record?->status === 'pending')
                ->modalHeading('Konfirmasi Persetujuan')
                ->modalDescription('Apakah Anda yakin ingin menyetujui dan menerapkan perubahan absensi ini?')
                ->modalSubmitLabel('Ya, Setujui')
                ->modalCancelButtonLabel('Batalkan')
                ->requiresConfirmation()
                ->action(function () {
                    $this->handleApproval();
                }),
            Actions\Action::make('rejectRequest')
                ->label('Tolak Pengajuan')
                ->color('danger')
                ->visible(fn () => $this->record?->status === 'pending')
                ->form([
                    Forms\Components\Textarea::make('notes_admin')
                        ->label('Alasan Penolakan')
                        ->required()
                        ->rows(4),
                ])
                ->action(function (array $data) {
                    $this->handleRejection($data['notes_admin'] ?? null);
                }),
            Actions\DeleteAction::make(),
        ];
    }

    protected function handleApproval(): void
    {
        try {
            app(AttendanceRequestService::class)->approve($this->record, auth()->user());

            $this->record->refresh();
            Notification::make()
                ->title('Pengajuan disetujui')
                ->body('Data absensi berhasil diperbarui.')
                ->success()
                ->send();
        } catch (ValidationException $exception) {
            Notification::make()
                ->title('Gagal menyetujui')
                ->body($exception->getMessage())
                ->danger()
                ->send();
        } catch (Throwable $exception) {
            report($exception);

            Notification::make()
                ->title('Terjadi kesalahan')
                ->body($exception->getMessage())
                ->danger()
                ->send();
        }
    }

    protected function handleRejection(?string $notes): void
    {
        try {
            app(AttendanceRequestService::class)->reject($this->record, auth()->user(), $notes);

            $this->record->refresh();
            Notification::make()
                ->title('Pengajuan ditolak')
                ->body('Status pengajuan diperbarui.')
                ->success()
                ->send();
        } catch (ValidationException $exception) {
            Notification::make()
                ->title('Gagal menolak')
                ->body($exception->getMessage())
                ->danger()
                ->send();
        } catch (Throwable $exception) {
            report($exception);

            Notification::make()
                ->title('Terjadi kesalahan')
                ->body($exception->getMessage())
                ->danger()
                ->send();
        }
    }
}
