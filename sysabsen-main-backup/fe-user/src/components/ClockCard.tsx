import { useEffect, useState } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/id';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

export function ClockCard() {
  const [now, setNow] = useState<Dayjs>(() => dayjs().tz('Asia/Jakarta'));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(dayjs().tz('Asia/Jakarta'));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Card sx={{ backdropFilter: 'blur(8px)' }} aria-live="polite" role="status">
      <CardContent>
        <Typography variant="h2" fontWeight={600}>
          {now.format('HH:mm:ss')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {now.format('dddd, DD MMM YYYY')}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ClockCard;
