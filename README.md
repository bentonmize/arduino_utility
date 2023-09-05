# arduino_utility

This is a TS CLI prototyping utility to try out a serial communication interface to an Arduino Uno that is connected to a NeoPixel Ring LED.  The goal is to write a sort of serial API to directly control the state, color, brightness, etc. externally and use it as a status display or really
for anything!  Effectively, I wanted to try to avoid baking all the logic into the microcontroller directly (fades, color changes, sequences, etc.) and push it out to a larger system, but I wasn't sure it would be fast enough for all applications.
