import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface VideoPlayerProps {
  videoId: string;
  onEnded: () => void;
  shouldPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onEnded, shouldPlay = false }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);
  const isReady = useRef(false);
  const hasStartedPlaying = useRef(false);

  useEffect(() => {
    // Check if YouTube API is fully loaded (YT and YT.Player must exist)
    if (!window.YT || !window.YT.Player) {
      // 1. Ensure script is loaded
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // 2. Hook into the ready callback
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousReady) previousReady();
        initializePlayer();
      };
    } else {
      // API already ready
      initializePlayer();
    }

    function initializePlayer() {
      if (isReady.current || !playerRef.current || !window.YT || !window.YT.Player) return;
      
      try {
        playerInstance.current = new window.YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1,
            'autoplay': 0, // Disable autoplay, wait for shouldPlay signal
            'controls': 1, // Show controls so user can unmute if needed
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
        isReady.current = true;
      } catch (e) {
        console.error("Error initializing YouTube player", e);
      }
    }

    function onPlayerReady(event: any) {
        // Do not auto-play, wait for shouldPlay signal
    }

    function onPlayerStateChange(event: any) {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            onEnded();
        }
    }

    return () => {};
  }, [videoId]);

  // 當 shouldPlay 為 true 且尚未開始播放時，開始播放影片
  useEffect(() => {
    if (shouldPlay && !hasStartedPlaying.current && playerInstance.current && playerInstance.current.playVideo) {
      hasStartedPlaying.current = true;
      try {
        playerInstance.current.playVideo();
      } catch (e) {
        console.error('Error starting video playback', e);
      }
    }
  }, [shouldPlay]); 

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg relative">
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
