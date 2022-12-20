import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity } from 'react-native';
import { Accelerometer } from "expo-sensors";
import { Audio } from "expo-av";

export default function App() {
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
    z: 0,
  })
  const [subscription, setSubscription] = useState(null)
  const [open, setOpen] = useState(false)
  const sounds = {
    saber_on: require("./assets/sounds/saber_on.mp3"),
    saber_off: require("./assets/sounds/saber_off.mp3"),
    saber_swing: require("./assets/sounds/saber_swing.mp3"),
    saber_crash: require("./assets/sounds/saber_crash.mp3"),
  };
  const [swingAcceleration, setSwingAcceleration] = useState(null)
  const [loaded, setLoaded] = useState(true)

  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener((accelerometerData) => {
        setCoords(accelerometerData);
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  useEffect(() => {
    if (open) { 
      let accelerationNow = Math.sqrt(
        Math.pow(coords["x"], 2) +
          Math.pow(coords["y"], 2) +
          Math.pow(coords["z"], 2)
      );

      if (accelerationNow > 1.5) {
        if (loaded) {
          playSound("saber_swing");
        }

        setSwingAcceleration(coords)
      }
      
      if (swingAcceleration !== null) {
        let accelerationBefore = Math.sqrt(
            Math.pow(swingAcceleration["x"], 2) +
            Math.pow(swingAcceleration["y"], 2) +
            Math.pow(swingAcceleration["z"], 2)
        );

        if ((accelerationNow - accelerationBefore) / 200 < -.015 ) {
          setSwingAcceleration(null)
          playSound("saber_crash");
          
        }
      }
    }

  }, [coords])

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true)
    }, 1000)
  }, [loaded])

  async function turnOnOff(check, value) {
    if (Math.round(coords.y) == value) {
      setOpen(check)
  
      open ? playSound('saber_off') : playSound('saber_on') 
    }
  }

  async function playSound(name) {
    try {
      const { sound, status } = await Audio.Sound.createAsync(
        sounds[name],
        { shouldPlay: true },
      );

      setLoaded(false);  
      setTimeout(() => {
        sound.unloadAsync()
      }, 1000)
      
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.container}
        source={open ? require("./assets/solidbluelightsaber.png") :  require("./assets/unopenedlightsaber.jpg")}
        resizeMode="stretch"
      >
        <TouchableOpacity
          style={open ? styles.offButton : styles.onButton}
          onPress={() => open ? turnOnOff(false, 1) : turnOnOff(true, -1)}
        >
          <Text>{open ? 'Turn Off' : 'Turn On'}</Text>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStyle: {
    color: 'hotpink',
    fontSize: 20
  },
  onButton: {
    backgroundColor: 'lightgreen',
    width: 70,
    height: 70,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center'
  },
  offButton: {
    backgroundColor: '#FF0000',
    width: 70,
    height: 70,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
