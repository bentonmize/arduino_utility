# arduino_utility

This is a TS CLI prototyping utility to try out a serial communication interface to an Arduino Uno.  I am using
it to try out new commands in text or a binary packet format.  It runs a looping prompt interface to take user
input and send it to the microcontroller.  

### Arguments

You can issue commands as simple text strings using the `-t` argument, or send space-delimited hex or integer values.
As an example acceptable hex input will look like this:

`0xf 0xa 0x1 0x12`

or you can send base 10 integer form:

`15 10 1 18`

### Running

When you run the CLI you will first be prompted with a list of ports to choose from.  For example:

```
0 - /dev/tty.ENACFIREE60
1 - /dev/tty.Bluetooth-Incoming-Port
2 - /dev/tty.usbmodem4401
Please select a port:
```

Typically, an Arduino is some `usbmodem*` serial port.  Enter the numeric index to connect the serial port.  The
loop should start after this, waiting to accept user input (the type of which depends on the args used when running
the CLI command).
