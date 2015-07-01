// LED blink with button sample for IoT.js and node.js

var events = require('events')
  , eventEmitter = new events.EventEmitter()
  , gpio = require("iotjs-gpio")
  , gpiocfg = require("gpiocfg.js")
  , gpio_pout = ["LED1", "LED2", "LED3", "LED4", "LED5"]
  , gpio_cled = 4
  , gpio_ocnt = 5
  , gpio_pinp = ["BTN1"]
  , gpio_icnt = 1
  , intervalId
  , durationId
  ;


function map_pin(portname, ctrlcode) {
  var port = gpiomap.PINS[portname].GPIO;
  if (ctrlcode)
    port |= ctrlcode;
  return port;
}


function gpio_setpins() {
  var idx;
  var pin_ready_cnt = 0;

  function chk_pins(err) {
    pin_ready_cnt += 1;
    if (pin_ready_cnt >= gpio_ocnt+gpio_icnt) {
      eventEmitter.emit('pins_ready');
    }
  }
  var portpin;
  for (idx=0; idx<gpio_ocnt; idx++) {
    portpin = gpiocfg.openout(gpio_pout[idx]);
    gpio.pinmode(portpin, chk_pins);
  }
  for (idx=0; idx<gpio_icnt; idx++) {
    portpin = gpiocfg.openin(gpio_pinp[idx]);
    gpio.pinmode(portpin, chk_pins);
  }
}


function gpio_run() {
  var on = 1;
  var idx = 0;
  var prein = 0;
  var nowin;

  console.log("start blinking...");
  intervalId = setInterval( function() {
    var portpin = gpiocfg.map(gpio_pout[idx]);
    gpio.write(portpin, on);

    idx = idx + 1;
    if (idx >= gpio_cled) {
      idx = 0;
      on = (on + 1) % 2;
    }

    portpin = gpiocfg.map(gpio_pinp[0]);
    gpio.read(portpin, function(err, val) {
      if (err>=0) {
        nowin = val>0 ? 1 : 0;
        if (prein != nowin) {
          portpin = gpiocfg.map(gpio_pout[4]);
          gpio.write(portpin, nowin);
          prein = nowin;
        }
      }
    });

  }, 100);
}


function gpio_cleanup(timeout) {
  durationId = setTimeout( function() {
    clearInterval(intervalId);
    clearTimeout(durationId);
    console.log('blinking completed');

    var idx;
    var portname;
    var portpin;
    for (idx=0; idx<gpio_ocnt; idx++) {
      portpin = gpiocfg.map(gpio_pout[idx]);
      gpio.write(portpin, 0);
      portpin = gpiocfg.closefloat(gpio_pout[idx]);
      gpio.pinmode(portpin);
    }

    for (idx=0; idx<gpio_icnt; idx++) {
      portpin = gpiocfg.map(gpio_pinp[idx]);
      gpio.write(portpin, 0);
      portpin = gpiocfg.closefloat(gpio_pinp[idx]);
      gpio.pinmode(portpin);
    }

    eventEmitter.emit('pins_done');
  }, timeout );
}

eventEmitter.on('pins_ready', function() {
  var timeoutsec = 10;
  gpio_run();
  if (process.iotjs)
    timeoutsec = 20;
  gpio_cleanup(timeoutsec*1000);
});


eventEmitter.on('pins_done', function() {
  gpio.release();
})


gpio.initialize(function() {
  gpio_setpins();
});