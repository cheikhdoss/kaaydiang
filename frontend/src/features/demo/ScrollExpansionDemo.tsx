import { useState, useEffect } from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

interface MediaAbout {
  overview: string;
  conclusion: string;
}

interface MediaContent {
  src: string;
  poster?: string;
  background: string;
  title: string;
  subtitle: string;
  about: MediaAbout;
}

interface MediaContentCollection {
  [key: string]: MediaContent;
}

const sampleMediaContent: MediaContentCollection = {
  video: {
    src: 'https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8',
    poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1280&h=720&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop&q=80',
    title: 'Apprenez sans limites',
    subtitle: 'E-Learning Platform',
    about: {
      overview: 'Découvrez notre plateforme e-learning innovante qui s\'adapte à votre rythme d\'apprentissage. Grâce à notre interface interactive, vous pouvez accéder à des centaines de cours de qualité.',
      conclusion: 'KayyDiang révolutionne l\'apprentissage en ligne avec des vidéos haute qualité, des quiz interactifs et un suivi de progression personnalisé.',
    },
  },
  image: {
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1280&h=720&fit=crop&q=80',
    background: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&h=1080&fit=crop&q=80',
    title: 'Excellence Académique',
    subtitle: 'Education Reimagined',
    about: {
      overview: 'Notre plateforme offre une expérience d\'apprentissage immersive avec des cours conçus par les meilleurs experts du domaine.',
      conclusion: 'Rejoignez des milliers d\'apprenants qui ont déjà transformé leur carrière grâce à KayyDiang.',
    },
  },
};

const MediaContent = ({ mediaType }: { mediaType: 'video' | 'image' }) => {
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-white">À propos de cette plateforme</h2>
      <p className="text-lg mb-8 text-gray-300">{currentMedia.about.overview}</p>
      <p className="text-lg mb-8 text-gray-300">{currentMedia.about.conclusion}</p>
    </div>
  );
};

const ScrollExpansionDemo = () => {
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mediaType]);

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setMediaType('video')}
          className={`px-4 py-2 rounded-lg transition-all ${
            mediaType === 'video'
              ? 'bg-white text-black'
              : 'bg-black/50 text-white border border-white/30 hover:bg-white/10'
          }`}
        >
          Video
        </button>
        <button
          onClick={() => setMediaType('image')}
          className={`px-4 py-2 rounded-lg transition-all ${
            mediaType === 'image'
              ? 'bg-white text-black'
              : 'bg-black/50 text-white border border-white/30 hover:bg-white/10'
          }`}
        >
          Image
        </button>
      </div>

      <ScrollExpandMedia
        mediaType={mediaType}
        mediaSrc={currentMedia.src}
        posterSrc={mediaType === 'video' ? currentMedia.poster : undefined}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        subtitle={currentMedia.subtitle}
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

export default ScrollExpansionDemo;
