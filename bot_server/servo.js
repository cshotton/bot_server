/*
 * examples/servo.js
 * https://github.com/101100/pca9685
 *
 * Example to turn a servo motor in a loop.
 * Javascript version.
 *
 * Copyright (c) 2015-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var i2cBus = require("i2c-bus");

var Pca9685Driver = require("pca9685").Pca9685Driver;


// PCA9685 options
var options = {
    i2c: i2cBus.openSync(1),
    address: 0x40,
    frequency: 50,
    debug: false
};


// pulse lengths in microseconds (theoretically, 1.5 ms
// is the middle of a typical servo's range)
var pulseLengths = [1300, 1500, 1700];
var steeringChannel = 0;


// variables used in servoLoop
var pwm;
var nextPulse = 0;
var timer;

const COLOR_STEPS = 100;
const COLOR_FREQ = 2*Math.PI/COLOR_STEPS;
const COLOR_CENTER = 128;
const COLOR_WIDTH = 127;

const PALETTE_LEN = COLOR_STEPS;
const MAX_VALUE = 255;
const DELAY_MS = 50;

var red = [];
var green = [];
var blue = [];

console.log (COLOR_STEPS + ", " + COLOR_FREQ);

function makeColorGradient(frequency1, frequency2, frequency3,
                         phase1, phase2, phase3,
                         center, width, len) {
    if (center == undefined)
        center = 128;
    if (width == undefined)
        width = 127;
    if (len == undefined)
        len = PALETTE_LEN;

    for (var i = 0; i < len; ++i)
    {
        red [i] = Math.sin(frequency1*i + phase1) * width + center;
        green [i] = Math.sin(frequency2*i + phase2) * width + center;
        blue [i] = Math.sin(frequency3*i + phase3) * width + center;
    }
}

// loop to cycle through pulse lengths
function servoLoop() {
    timer = setTimeout(servoLoop, DELAY_MS);
    pwm.setDutyCycle (0, red [nextPulse] / MAX_VALUE );
    pwm.setDutyCycle (1, green [nextPulse] / MAX_VALUE );
    pwm.setDutyCycle (2, blue [nextPulse] / MAX_VALUE );
//    console.log (red [nextPulse] / MAX_VALUE +"," + green[nextPulse] / MAX_VALUE + "," + blue[nextPulse] / MAX_VALUE);
    //pwm.setPulseLength(steeringChannel, nextPulse * 10 + 500);//pulseLengths[nextPulse]);
    nextPulse = (nextPulse + 1) % PALETTE_LEN;//pulseLengths.length;
}


// set-up CTRL-C with graceful shutdown
process.on("SIGINT", function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");

    if (timer) {
        clearTimeout(timer);
        timer = null;
    }

    pwm.dispose();
});

makeColorGradient (COLOR_FREQ, COLOR_FREQ, COLOR_FREQ, 0, 2, 4, COLOR_CENTER, COLOR_WIDTH, PALETTE_LEN);

// initialize PCA9685 and start loop once initialized
pwm = new Pca9685Driver(options, function startLoop(err) {
    if (err) {
        console.error("Error initializing PCA9685");
        process.exit(-1);
    }

    console.log("Starting servo loop...");
    servoLoop();
});