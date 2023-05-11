import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import TrackPlayer, {useActiveTrack, Event} from 'react-native-track-player';

import {Button, PlayerControls, Progress, TrackInfo} from './src/components';
import {
  QueueInitialTracksService,
  SetupService,
  PlaybackService,
} from './src/services';
//import {SetupService} from './src/services';
import * as rssParser from 'react-native-rss-parser';

import {Dirs, FileSystem} from 'react-native-file-access';
import jsmediatags from 'jsmediatags';

const FEED_URL = 'https://media.rss.com/digitalfuturestold/feed.xml';
// const FILE_URL = 'tew-02.m4a';
const FILE_URL = 'tew-rad.mp3';
const AUTHOR = 'Thomas Lodato';

const App: React.FC = () => {
  const [rssFeed, setRSSFeed] = useState(null);
  const [rssTitle, setRSSTitle] = useState(null);
  const [radEvents, setRadEvents] = useState(null);
  const [radTrackers, setRadTrackers] = useState(null);
  const [isFeedLoaded, setIsFeedLoaded] = useState(false);

  const [currentEvent, setCurrentEvent] = useState(null);

  const track = useActiveTrack();
  const isPlayerReady = useSetupPlayer();

  const handleTriggeredEvent = newEvent => {
    console.log('Triggered event:', newEvent);
    if (currentEvent !== newEvent) {
      setCurrentEvent(newEvent);
    }
  };

  useEffect(() => {
    if (rssFeed?.length > 0 && isPlayerReady && !isFeedLoaded) {
      setIsFeedLoaded(true);
      rssFeed.forEach((item: object) => {
        const track = {
          url: item.enclosures[0].url,
          title: item.title,
          artist: item.itunes.author || AUTHOR,
          artwork: item.itunes.image,
          duration: item.itunes.duration,
        };
        TrackPlayer.add(track);
      });
    }
  }, [rssFeed]);

  useEffect(() => {
    function deepLinkHandler(data: {url: string}) {
      console.log('deepLinkHandler', data.url);
    }

    async function fetchLocalFile(fileURL: string) {
      const filePath = Dirs.DocumentDir + '/' + fileURL;
      console.log('filepath', filePath);
      const text = await FileSystem.stat(filePath);
      console.log('fileinfo', text);
    }

    async function fetchRSSFeed(feedURL: string) {
      const response = await fetch(FEED_URL);
      const responseData = await response.text();
      const rss = await rssParser.parse(responseData);
      setRSSFeed(rss.items);
      setRSSTitle(rss.title);
    }

    async function fetchJSMediaTags(fileURL: string) {
      new Promise((resolve, reject) => {
        const filePath = Dirs.DocumentDir + '/' + fileURL;
        console.log('filepath', filePath);
        new jsmediatags.Reader(filePath).read({
          onSuccess: tag => {
            resolve(tag);
          },
          onError: error => {
            reject(error);
          },
        });
      })
        .then(tagInfo => {
          console.log('jsmediatag success');
          const customData = JSON.parse(tagInfo.tags.TXXX.data.data);
          console.log(customData.remoteAudioData);
          const radData = customData.remoteAudioData;
          if (radData) {
            if (radData.events) {
              setRadEvents(radData.events);
            }
            if (radData.trackingUrls) {
              setRadTrackers(radData.trackingUrls);
            }
          }

          // handle the onSuccess return
        })
        .catch(error => {
          console.error('jsmediatag error', error);
          // handle errors
        });
    }

    fetchRSSFeed(FEED_URL);
    fetchLocalFile(FILE_URL);
    fetchJSMediaTags(FILE_URL);

    // This event will be fired when the app is already open and the notification is clicked
    const subscription = Linking.addEventListener('url', deepLinkHandler);

    // When you launch the closed app from the notification or any other link
    Linking.getInitialURL().then(url => {
      //console.log('getInitialURL', url)
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isPlayerReady) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  function generateRadEvents() {
    if (radEvents) {
      return radEvents.map(
        (event: {eventTime: string; label: string}, index: number) => {
          return (
            <Text style={styles.whiteText} key={`event${index}`}>
              {event.eventTime} : {event.label}
            </Text>
          );
        },
      );
    }
  }

  function generateRadTrackers() {
    if (radTrackers) {
      return radTrackers.map((tracker: string, index: number) => {
        return (
          <Text style={styles.whiteText} key={`tracker${index}`}>
            Tracking URL: {tracker}
          </Text>
        );
      });
    }
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle={'light-content'} />
      <View style={styles.contentContainer}>
        <TrackInfo track={track} />
        <Progress live={track?.isLiveStream} radEvents={radEvents} />
      </View>
      <View style={styles.actionRowContainer}>
        <PlayerControls />
      </View>

      <View>
        {/* {rssTitle && <Text style={styles.whiteText}>{rssTitle}</Text>} */}
        {/* {radEvents && generateRadEvents()} */}
        {/* {radTrackers && generateRadTrackers()} */}
        {currentEvent && (
          <Text style={styles.whiteText}>Event: {currentEvent}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

function useSetupPlayer() {
  const [playerReady, setPlayerReady] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;
    (async () => {
      await SetupService();
      await PlaybackService();
      if (unmounted) {
        return;
      }
      setPlayerReady(true);
      const queue = await TrackPlayer.getQueue();
      if (unmounted) {
        return;
      }
      if (queue.length <= 0) {
        await QueueInitialTracksService();
      }
    })();
    return () => {
      unmounted = true;
    };
  }, []);
  return playerReady;
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#212121',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 3,
    alignItems: 'center',
  },
  topBarContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  actionRowContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  whiteText: {
    color: '#fff',
  },
});

export default App;
