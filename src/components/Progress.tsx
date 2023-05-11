import Slider from '@react-native-community/slider';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import TrackPlayer, {useProgress} from 'react-native-track-player';

export const Progress: React.FC<{live?: boolean; radEvents?: any}> = ({
  live,
  radEvents,
  onTriggeredEvent,
}) => {
  function timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  const {position, duration} = useProgress();

  const [triggeredEvents, setTriggeredEvents] = React.useState<any>([]);

  const handlePlayerProgress = playerProgress => {
    if (radEvents?.length > 0) {
      for (const event of radEvents) {
        const eventTime = timeToSeconds(event.eventTime);
        if (
          playerProgress >= eventTime &&
          !triggeredEvents.includes(event.label)
        ) {
          setTriggeredEvents(prevEvents => [...prevEvents, event.label]);
          //console.log(`Reached event '${event.label}' at ${eventTime} seconds`);
          onTriggeredEvent(event.label);
        }
      }
    }
  };

  handlePlayerProgress(position);

  return live ? (
    <View style={styles.liveContainer}>
      <Text style={styles.liveText}>Live Stream</Text>
    </View>
  ) : (
    <>
      <Slider
        style={styles.container}
        value={position}
        minimumValue={0}
        maximumValue={duration}
        thumbTintColor="#FFD479"
        minimumTrackTintColor="#FFD479"
        maximumTrackTintColor="#FFFFFF"
        onSlidingComplete={TrackPlayer.seekTo}
      />
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{formatSeconds(position)}</Text>
        <Text style={styles.labelText}>
          {formatSeconds(Math.max(0, duration - position))}
        </Text>
      </View>
    </>
  );
};

const formatSeconds = (time: number) =>
  new Date(time * 1000).toISOString().slice(14, 19);

const styles = StyleSheet.create({
  liveContainer: {
    height: 100,
    alignItems: 'center',
    flexDirection: 'row',
  },
  liveText: {
    color: 'white',
    alignSelf: 'center',
    fontSize: 18,
  },
  container: {
    height: 40,
    width: 380,
    marginTop: 25,
    flexDirection: 'row',
  },
  labelContainer: {
    width: 370,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
});
