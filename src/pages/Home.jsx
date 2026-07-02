import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import HeroBanner from "../components/home/HeroBanner";
import MoodSection from "../components/home/MoodSection";
import FeaturedSection from "../components/home/FeaturedSection";
import PlaylistSection from "../components/home/PlaylistSection";
import WorldwideCharts from "../components/home/WorldwideCharts";

import { useLibrary } from "../hooks/useLibrary";
import { usePlayer } from "../hooks/usePlayer";
import { useMood } from "../hooks/useMood";
import { useProfile } from "../hooks/useProfile";

import { getGreeting } from "../utils/formatters";

export default function Home() {
  const navigate = useNavigate();

  const { library, history, playlists, importFiles, toggleFavorite } = useLibrary();
  const { playMedia, currentMedia, setQueue, setQueueIndex } = usePlayer();
  const { activeMood, setMood, MOODS } = useMood();
  const { profile } = useProfile();

  const [carouselIndex, setCarouselIndex] = useState(0);

  const greetingText = useMemo(() => getGreeting(), []);

  const tracks = useMemo(
    () => library.filter(item => item.type === "audio"),
    [library]
  );

  const featuredTracks = useMemo(
    () => tracks.slice(0, 5),
    [tracks]
  );

  const currentFeatured = featuredTracks[carouselIndex] || null;

  const continueTrack = useMemo(() => {
    if (!history.length) return null;
    const id = history[0].mediaId || history[0].id;
    return library.find(item => item.id === id) || null;
  }, [history, library]);


  const handleShuffleAll = () => {
    if (!tracks.length) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setQueueIndex(0);
    playMedia(shuffled[0]);
  };

  const nextCarousel = () => {
    if (!featuredTracks.length) return;
    setCarouselIndex(prev => (prev + 1) % featuredTracks.length);
  };

  return (
    <main className="space-y-8 overflow-y-auto px-4 py-6 md:px-6 xl:px-8">

      <HeroBanner
        profile={profile}
        greetingText={greetingText}
        currentMedia={currentMedia}
        library={library}
        playlists={playlists}
        history={history}
        importFiles={importFiles}
        handleShuffleAll={handleShuffleAll}
      />

      <MoodSection
        MOODS={MOODS}
        activeMood={activeMood}
        setMood={setMood}
      />

      <FeaturedSection
        featuredTracks={featuredTracks}
        currentFeatured={currentFeatured}
        continueTrack={continueTrack}
        carouselIndex={carouselIndex}
        nextCarousel={nextCarousel}
        playMedia={playMedia}
        setQueue={setQueue}
        setQueueIndex={setQueueIndex}
      />

      <WorldwideCharts localTracks={tracks} />

      <PlaylistSection
        playlists={playlists}
        navigate={navigate}
      />

    </main>
  );
}
