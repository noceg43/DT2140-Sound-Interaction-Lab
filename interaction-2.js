//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "brass";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
brass.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function accelerationChange(accx, accy, accz) {
    // playAudio()
}

// Phone flat in the hand: the brass plays.
// Tilt left/right (rotY) to change the pitch.
function rotationChange(rotx, roty, rotz) {
    playAudio(rotx, roty);
}

function mousePressed() {
    //playAudio()
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    //playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio(tiltX, tiltY) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Silent zone: if BOTH |tiltX| and |tiltY| are within LIMIT (radians), pressure = 0
    const LIMIT = 1.3;
    const xInRange = Math.abs(tiltX) <= LIMIT;
    const yInRange = Math.abs(tiltY) <= LIMIT;

    const pressure = xInRange && yInRange
        ? 0
        : map(Math.abs(tiltX), LIMIT, 60, 0.4, 1, true);
    const tube = map(tiltY, -60, 60, 0.5, 0.2, true);

    dspNode.setParamValue("/brass/blower/pressure", pressure);   // 0 - 1
    dspNode.setParamValue("/brass/brassModel/tubeLength", tube); // 0.01 - 2.5

    // Hard mute: unplug the brass from the speakers when pressure is 0,
    // so there is complete silence (no leftover tail)
    if (pressure === 0 && connected) {
        dspNode.disconnect();
        connected = false;
    } else if (pressure > 0 && !connected) {
        dspNode.connect(audioContext.destination);
        connected = true;
    }

}

let connected = true;  // brass is connected to the speakers at startup
let debugBox = null;   // DEBUG: on-page readout, remove when done

//==========================================================================================
// END
//==========================================================================================