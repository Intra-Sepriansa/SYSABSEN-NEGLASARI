import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import YouTube, { YouTubeProps } from 'react-youtube';

interface Props {
  videoId: string;
  offlinePoster?: string;
}

export function VideoPane({ videoId, offlinePoster }: Props) {
  const [isOffline, setOffline] = useState(false);

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

  const handleError: YouTubeProps['onError'] = () => {
    setOffline(true);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 3,
        overflow: 'hidden',
        minHeight: 360,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) => theme.shadows[4]
      }}
    >
      {!isOffline ? (
        <YouTube
          videoId={videoId}
          opts={opts}
          onError={handleError}
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
            <Typography variant="h4" fontWeight={600}>
              Video offline
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default VideoPane;
