import TrackPlayer, {Track} from 'react-native-track-player';

import playlistData from '../assets/data/playlist.json';
// @ts-expect-error – sure we can import this
// import localTrack from '../assets/resources/tew-02.m4a';

// @ts-expect-error – sure we can import this
// import localArtwork from '../assets/resources/tew-art.jpg';

export const QueueInitialTracksService = async (): Promise<void> => {
  await TrackPlayer.add([
    ...(playlistData as Track[]),
    {
      url: 'https://prototypes.mikeheavers.com/tew/tew-02.m4a',
      title: 'Tew (Explain the Name)',
      artist: 'Thomas Lodato',
      artwork: 'https://prototypes.mikeheavers.com/tew/tew-art.jpg',
      duration: 5,
    },
  ]);
};
