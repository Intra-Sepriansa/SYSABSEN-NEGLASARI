<?php

namespace App\Events;

use App\Models\Attendance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceRecorded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Attendance $attendance;

    /**
     * Create a new event instance.
     */
    public function __construct(Attendance $attendance)
    {
        $this->attendance = $attendance;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('attendance.public'),
            new PrivateChannel('attendance.admin'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->attendance->id,
            'type' => $this->attendance->type,
            'status_flag' => $this->attendance->status_flag,
            'tap_time' => $this->attendance->tap_time->toISOString(),
            'user' => [
                'id' => $this->attendance->user->id,
                'name' => $this->attendance->user->name,
            ],
            'device' => [
                'id' => $this->attendance->device->id,
                'name' => $this->attendance->device->name,
                'location' => $this->attendance->device->location,
            ]
        ];
    }

    /**
     * Get the broadcast channel name.
     */
    public function broadcastAs(): string
    {
        return 'attendance.recorded';
    }
}
