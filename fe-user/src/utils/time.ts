import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/id';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

export function formatTapTime(isoDate: string) {
  return dayjs(isoDate).tz('Asia/Jakarta').format('dddd, DD MMM YYYY | HH:mm:ss');
}

export function formatClock(date: dayjs.Dayjs) {
  return {
    time: date.format('HH:mm:ss'),
    date: date.format('dddd, DD MMM YYYY')
  };
}

export function calculateLatencyMs(tapTime: string) {
  const serverTime = dayjs(tapTime).valueOf();
  return Math.max(0, Date.now() - serverTime);
}

export function relativeFromNow(date: string) {
  return dayjs(date).fromNow();
}
