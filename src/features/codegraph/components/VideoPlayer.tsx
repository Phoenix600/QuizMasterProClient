import React from 'react';

interface VideoPlayerProps {
  url: string | undefined;
}

const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const getYouTubeId = (url: string | undefined): string => {
    if (!url) return "roaefAKS7oY";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "roaefAKS7oY";
  };

  const videoId = getYouTubeId(url);

  return (
    <div className="relative aspect-video w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&autoplay=0`}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube Video Player"
      />
    </div>
  );
};

export default VideoPlayer;
