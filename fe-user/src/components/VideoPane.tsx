import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import YouTube, { YouTubeProps } from 'react-youtube';
import { parseYouTubeId } from '../utils/youtube';

interface Props {
  youtubeUrl?: string;
  offlinePoster?: string;
}

export function VideoPane({ youtubeUrl, offlinePoster }: Props) {
  const [isOffline, setOffline] = useState(false);
  const videoId = useMemo(
    () => parseYouTubeId(youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    [youtubeUrl]
  );

  useEffect(() => {
    setOffline(false);
  }, [videoId]);

  const opts = useMemo<YouTubeProps['opts']>(
    () => ({
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        loop: 1,
        mute: 1,
        rel: 0,
        playlist: videoId,
        modestbranding: 1,
        disablekb: 1
      }
    }),
    [videoId]
  );

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: 'common.black',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {!isOffline ? (
        <YouTube
          videoId={videoId}
          opts={opts}
          onError={() => setOffline(true)}
          onReady={(event) => {
            event.target.mute();
            event.target.playVideo();
          }}
        />
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            backgroundImage: offlinePoster ? `url(${offlinePoster})` : 'none',
            backgroundSize: 'cover'
          }}
        >
          {!offlinePoster && (
            <Typography variant="h5" fontWeight={600}>
              Video offline
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default VideoPane;
