/*
Welcome to LightSaberAppHuang, I will explain my process in creating this app.

To first set up this app, I had to understand what the values in the accelerometer. I learned that the sign of the values represented
the orientation of the phone and used these values to turn on and off my lightsaber. When the y coordinate was rounded to -1, it could
be turned on and when rounded to y = 1, it could be turned off. 

But then, I came across another bug. I couldn't play the sound when it turned on and off. The three main components of playing sound was loading, playing, and unloading the sound.
I tried different formats of the code, until I saw a format on the online docs that worked and sound played. 

Getting this to work, I started working on my swing sound. Getting it to work was no real biggie: I just checked if the magnitude of
the acceleration was greater than 1.5 Gs (I tested to see what a good condition was to play the sound by checking different swing speeds)
But after the swing sound played twenty times consecutively or so. I got an unknown bug that made no sense when I googled it.
I tried to get the bug again and again and realized it was probably because I didn't properly unload the sound and some 
memory might've leaked causing this bug. But when I unloaded the sound, all I heard was pretty much sound
playing for a millisecond. I inferred that the sound was loading playing and unloading at the same time even though I used the async
await syntax which should have put a delay on it. So I put a delay myself using a setTimeout function on the sound unloading function.
And to my surprise, the bug didn't appear again, which mean that the sound unloading didn't happen on top of the other two functions.

Now, tackling the last sound was the hardest as I never really had to implement physics in an app. Starting off, I knew right away I 
had to find some way to detect a large enough drop in acceleration. So I started by checking individual coordinates (x, y, z) if they
were less than a value after a delay. But I realized that this couldn't work because acceleration wasn't a single coordinate: it was
rather a combination of the three coordinates. So I used the formula to find the magnitude of acceleration sqrt(x^2 + y^2 + z^2) and
first saved the magnitude of acceleration when the swing sound is triggered. Now, saving that acceleration, with change in coordinates,
I compared the "current" acceleration to the acceleration when the user swung to make a swing sound. This makes it so that a crash sound
only happens when you swing it fast enough. Subtracting the two magnitudes and dividing by 200 (representing 200ms, a reasonable estimate
for the time of one swing), I did trial and error to find a reasonable negative value to set the condition as to play the crash sound 
(as the change in acceleration should be negative, represeting a sudden drop in acceleration).

Lastly, I worked to make the swing not overlap because it could get noisy if you swing the phone around back and forth. So I set a 
condition to play the sound (useState loaded) and when it loads, another swing cannot play. Instead, it waits 500ms to allow you
to play the sound again.

Caveats:
-The crash sound has a delay in playing which I'm unsure of why
-The crash sound also doesn't play sometimes even though you swing it fast enough. The more distance you accelerate over, the
likelier chance it has to play the sound.
-The swing sound sometimes plays twice in a row
*/

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
