/*PIS page code*/
const checkPIS = document.querySelector('#readPIS');
const PISnext = document.querySelector('#PISnext');

/*Don't allow user to press 'next' button unless they have checked the box*/
/*Check that checkPIS isn't null, otherwise other pages will fail to work*/
if (checkPIS != null) {
    checkPIS.addEventListener('change', (e) => {
        PISnext.disabled = !e.target.checked;
    }, false);
}


/*When user presses the 'next' button, load next page*/
/*Check that PISnext isn't null, otherwise other pages will fail to work*/
if (PISnext != null) {
    PISnext.href = 'conform.html';/*addEventListener('click', (e) => {
        alert('worked');
    });*/
}


/*Consent form code*/

const clauses = document.querySelectorAll('form input');
const conformNext = document.querySelector('#conformNext');

for (const clause of clauses) {
    clause.addEventListener('change', checkBoxChanged);
}

function checkBoxChanged() {
    updateClauses();
    updateCheckCount();
}

/*Make this actually set sessionStorage based on the values of the checkboxes later*/
function updateClauses() {
    console.log('pretend it\'s updated');
}

/*Only let the user press next when they have accpted all of the clauses*/
function updateCheckCount() {
    let checkCount = 0;
    for (const clause of clauses) {
        if (clause.checked) {
            checkCount++;
        }
    }
    if (checkCount === clauses.length) {
        conformNext.disabled = false;
    } else {
        conformNext.disabled = true;
    }
}


//Experiment page code

//Elements
const kbSeshCount = document.querySelector('#kbSeshCount');
const phraseCounter = document.querySelector('#phraseCounter');
const phraseBox = document.getElementById('phrases');

const keyboardArea = document.getElementById('keyboard');
//Size of keyboard div (for key coordinate generation)
if (keyboardArea != null) {
    kbArea = keyboardArea.getBoundingClientRect();
}
const keyboardInput = document.getElementById('keyboardInput');

//Keyboard row divs
let topRow = document.getElementsByClassName('topKeys');
let topRowBounds = document.querySelector('.topRow').getBoundingClientRect();
let secRow = document.getElementsByClassName('secKeys');
let secRowBounds = document.querySelector('.secondRow').getBoundingClientRect();
let thiRow = document.getElementsByClassName('thiKeys');
let thiRowBounds = document.querySelector('.thirdRow').getBoundingClientRect();
let botRow = document.getElementsByClassName('spaceKey');
let botRowBounds = document.querySelector('.bottomRow').getBoundingClientRect();
let rowList = [topRow, secRow, thiRow, botRow];
let rowBoundList = [topRowBounds, secRowBounds, thiRowBounds, botRowBounds];
let keySizeList = [];

//Phrases for the user to type
let phrases = ['nymphs blitz quick vex dwarf jog', 'big fjords vex quick waltz nymph', 'junk mtv quiz graced by fox whelps',
    'brick quiz whangs jumpy veldt fox', 'two driven jocks help fax my big quiz', 'my ex pub quiz crowd gave joyful thanks', 'fake bugs put in wax jonquils drive him crazy',
    'few black taxis drive up major roads on quiet hazy nights', 'jaded zombies acted quietly but kept driving their oxen forward'];

let phraseArrLen = phrases.length;

//Store key coordinates
let keyX = [];
let keyY = [];

//Store key coordinates for adaptive keyboard
let adaptKeyX;
let adaptKeyY;

//Store number of keystrokes made with each key
let keyList = [];

//Store coordinates of most recent touch event
let touchX;
let touchY;

//Counters
//Keyboard mode: 0=Practice, 1=Control, 2=Test
let kbNum = 0;
//Current keyboard 0=Practice, 1=First keyboard, 2=Second keyboard
let kbCount = '0';
//Current session
let seshCount = '0';
//Amount of phrases typed in current session
let phraseCount = '0';
//Position of cursor on the input box
let cursorPos = 0;

//Error storage
//Store key pressed and its location when the user makes an erroneous keystroke
let errTouches = [];
//Number of erroneous keystrokes made while typing current phrase
let errKs = 0;
//Total number of keystrokes made while typing current phrase
let totKs = 0;
//Error rates for last typed phrase
let lastPhrErrs = [];
//Error rates for current keyboard
let currKbErrs = [];
//Error rate for each session on the first keyboard
let kb1SeshErrs = [];
//Error rate for each session on the second keyboard
let kb2SeshErrs = [];

//Typing speed storage
//List of times taken in seconds to type 5 characters - public scope so that the backspace key can remove the last value
let WPMList = [];
//Estimated WPM calculated from each word typed
let wordTimes = [];
//Average WPM for each session for first keyboard
let kb1SeshWPM = [];
//Average WPM for each session for second keyboard
let kb2SeshWPM = [];


//Generate keyboard and start practice session when experiment page loads
if (window.location.pathname.includes('experiment.html')) {
    //newSession();
    generateKeyCoords();
    initKb();
    updateDisplays();
    newPhrase();
}

function initKb() {
    keyboardArea.addEventListener("touchstart", (e) => {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY - kbArea.top;
    });

    keyboardArea.addEventListener("touchend", () => {
        handleKeyPress();
        if (keyboardInput.value.length === phraseBox.textContent.length) {
            phraseTyped();
        };
    });
}

/*Generate coordinates for keys on standard keyboard*/
function generateKeyCoords() {
    let xCoord = 0;
    let yCoord = 0;

    for (let rows = 0; rows < rowList.length; rows++) {
        /*Iterate through rows and generate y coodinates*/
        let currentRow = rowList[rows];
        let currentRowBounds = rowBoundList[rows];
        let keyHeight = currentRowBounds.height;
        let keyWidth = currentRowBounds.width / currentRow.length;
        keyY.push(yCoord);
        xCoord = (kbArea.width - currentRowBounds.width) / 2;
        yCoord += keyHeight;

        for (let keys = 0; keys < currentRow.length; keys++) {
            /*Iterate through keys of current row and generate x coordinates*/
            keyX.push(xCoord);
            xCoord += keyWidth;
        }

        keyX.push(xCoord);
    }

    keyY.push(yCoord);
}

//Create objects to store coordinates and number of keypresses for each key
class keyObject {
    constructor(key, xInd, yInd) {
        this.key = key, this.keyXIndex = xInd, this.keyYIndex = yInd, 
        this.KPTally = 0;
    }
}

//Store details of error when user makes one using the test keyboard so that it can adapt in the next adaptation cycle
class errTouchEvnt {
    constructor(errKeyX, errKeyY, expKeyX, expKeyY, xCoords, yCoords) {
        this.erroneousKeyX = errKeyX,this.erroneousKeyY = errKeyY, 
        this.expectedKeyX = expKeyX, this.expectedKeyY = expKeyY, 
        this.x = xCoords, this.y = yCoords;
    }
}

function createKeyObjects() {
    let xInd = 0;
    let yInd = 0;
    for (let rows = 0; rows < rowList.length; rows++) {
        let currentRow = rowList[rows];
        for (let j = 0; j < currentRow.length; j++) {
            switch(currentRow[j].textContent) {
                case ('space'):
                    keyList.push(key = new keyObject(' ', xInd, yInd));
                    break;
                default:
                    keyList.push(key = new keyObject(currentRow[j].textContent.toLowerCase(), xInd, yInd));
                    break;
            }
            
            xInd++;
        }
        xInd++;
        yInd++;
    }
}

function experimentSession() {
    randomKb();
    rmKeyBorders();
    keyboardArea.addEventListener("touchend", () => {
        totKs++;

        if ((keyboardInput.value.length % 5) === 0) {
            WPMTimeList();
        }
        checkLastKey();
    });
}

/*Select 1 or 2 to give the user either the control or the test keyboard 1 = Control, 2 = Test*/
function randomKb() {
    kbNum = Math.round(Math.random() + 1);

    if (kbNum === 1) { ControlKb() }
    else if (kbNum === 2) { TestKb() };
}

function ControlKb() {
    console.log('Using control keyboard');
    controlKeyboard = `Keyboard ${kbCount} = Control`;
}

function TestKb() {
    console.log('Using test keyboard');
    adaptKeyX = [...keyX];
    adaptKeyY = [...keyY];
    createKeyObjects();
    getKeyWidth();
    testKeyboard = `Keyboard ${kbCount} = Test`;
    keyboardArea.addEventListener("touchend", checkForError);
    keyboardArea.addEventListener("touchend", checkKeyForTally);
}

function rmKeyBorders() {
    for (row = 0; row < rowList.length; row++) {
        for (el = 0; el < rowList[row].length; el++) {
            rowList[row][el].style.border = 'none';
        }
    }
}

function handleKeyPress() {
    switch (kbNum) {
        case (0):
            keyPressed(keyX, keyY);
            break;
        case (1):
            keyPressed(keyX, keyY);
            break;
        case (2):
            keyPressed(adaptKeyX, adaptKeyY);
            break;
        default:
            break;
    }
}

function keyPressed(xKeyCoords, yKeyCoords) {
    /*Don't like it, infact I hate it. Please be another way...*/
    if (touchY >= yKeyCoords[0] && touchY < yKeyCoords[1]) {
        if (touchX > xKeyCoords[0] && touchX < xKeyCoords[1]) {
            keyboardInput.value += 'q';
        } else if (touchX > xKeyCoords[1] && touchX < xKeyCoords[2]) {
            keyboardInput.value += 'w';
        } else if (touchX > xKeyCoords[2] && touchX < xKeyCoords[3]) {
            keyboardInput.value += 'e';
        } else if (touchX > xKeyCoords[3] && touchX < xKeyCoords[4]) {
            keyboardInput.value += 'r';
        } else if (touchX > xKeyCoords[4] && touchX < xKeyCoords[5]) {
            keyboardInput.value += 't';
        } else if (touchX > xKeyCoords[5] && touchX < xKeyCoords[6]) {
            keyboardInput.value += 'y';
        } else if (touchX > xKeyCoords[6] && touchX < xKeyCoords[7]) {
            keyboardInput.value += 'u';
        } else if (touchX > xKeyCoords[7] && touchX < xKeyCoords[8]) {
            keyboardInput.value += 'i';
        } else if (touchX > xKeyCoords[8] && touchX < xKeyCoords[9]) {
            keyboardInput.value += 'o';
        } else if (touchX > xKeyCoords[9] && touchX < xKeyCoords[10]) {
            keyboardInput.value += 'p';
        } else {
            return false;
        }
    } else if (touchY >= yKeyCoords[1] && touchY < yKeyCoords[2]) {
        if (touchX > xKeyCoords[11] && touchX < xKeyCoords[12]) {
            keyboardInput.value += 'a';
        } else if (touchX > xKeyCoords[12] && touchX < xKeyCoords[13]) {
            keyboardInput.value += 's';
        } else if (touchX > xKeyCoords[13] && touchX < xKeyCoords[14]) {
            keyboardInput.value += 'd';
        } else if (touchX > xKeyCoords[14] && touchX < xKeyCoords[15]) {
            keyboardInput.value += 'f';
        } else if (touchX > xKeyCoords[15] && touchX < xKeyCoords[16]) {
            keyboardInput.value += 'g';
        } else if (touchX > xKeyCoords[16] && touchX < xKeyCoords[17]) {
            keyboardInput.value += 'h';
        } else if (touchX > xKeyCoords[17] && touchX < xKeyCoords[18]) {
            keyboardInput.value += 'j';
        } else if (touchX > xKeyCoords[18] && touchX < xKeyCoords[19]) {
            keyboardInput.value += 'k';
        } else if (touchX > xKeyCoords[19] && touchX < xKeyCoords[20]) {
            keyboardInput.value += 'l';
        } else {
            return false;
        }

    } else if (touchY >= yKeyCoords[2] && touchY < yKeyCoords[3]) {
        if (touchX > xKeyCoords[21] && touchX < xKeyCoords[22]) {
            keyboardInput.value += 'z';
        } else if (touchX > xKeyCoords[22] && touchX < xKeyCoords[23]) {
            keyboardInput.value += 'x';
        } else if (touchX > xKeyCoords[23] && touchX < xKeyCoords[24]) {
            keyboardInput.value += 'c';
        } else if (touchX > xKeyCoords[24] && touchX < xKeyCoords[25]) {
            keyboardInput.value += 'v';
        } else if (touchX > xKeyCoords[25] && touchX < xKeyCoords[26]) {
            keyboardInput.value += 'b';
        } else if (touchX > xKeyCoords[26] && touchX < xKeyCoords[27]) {
            keyboardInput.value += 'n';
        } else if (touchX > xKeyCoords[27] && touchX < xKeyCoords[28]) {
            keyboardInput.value += 'm';
        } else if (touchX > xKeyCoords[28] && touchX < xKeyCoords[29]) {
            checkLastKey();
            keyboardInput.value = keyboardInput.value.slice(0, cursorPos - 2);
            WPMList.pop();
        } else {
            return false;
        }
    } else if (touchY >= yKeyCoords[3] && touchY < yKeyCoords[4]) {
        if (touchX > xKeyCoords[30] && touchX < xKeyCoords[31]) {
            keyboardInput.value += ' ';
        } else {
            return false;
        }
    } else {
        return false;
    }

    updateCursorPos();
}

function updateCursorPos() {
    cursorPos = keyboardInput.value.length + 1;
}

//When user has typed a phrase, check for uncorrected errors
function getUnCorrErrsForLastPhrase() {
    let errorCount = 0;
    //Iterate through the input box and check the values against the phrase - tally errors when found
    for (i = 0; i < keyboardInput.value.length; i++) {
        if (keyboardInput.value[i] != phraseBox.textContent[i]) {
            errorCount++;
        }
    }

    //Get error rate percentage and push into lastPhrErrs
    errPcnt = Math.round((errorCount / phraseBox.textContent.length) * 100);
    lastPhrErrs.push(errPcnt);
}

function getCorrErrsForLastPhrase() {
    errPcnt = Math.round((errKs / phraseBox.textContent.length) * 100);
    lastPhrErrs.push(errPcnt);
    totKs = 0;
    errKs = 0;
}

function checkLastKey() {
    if (keyboardInput.value[cursorPos - 2] != phraseBox.textContent[cursorPos - 2]) {
        errKs++;
    }
}

function pushPhraseErrsToKbErrs() {
    currKbErrs.push(lastPhrErrs);
    lastPhrErrs = [];
}

//Call when user has typed a phrase - needs fixing
function pushErrorRateToKbErrs() {
    let currKbUnCorrErrs = [];
    let currKbCorrErrs = [];

    //Iterate through currKbErrs and sort the values into the corresponding arrays
    for (i = 0; i < currKbErrs.length; i++) {
        for (j = 0; j < currKbErrs[i].length; j++) {
            if (j % 2 != 0) {
                currKbCorrErrs.push(currKbErrs[i][j]);
            } else if (j % 2 === 0) {
                currKbUnCorrErrs.push(currKbErrs[i][j]);
            }
        }

    }

    //Get average uncorrected error rate
    let avgUnCorrErrs = Math.round(currKbUnCorrErrs.reduce((accumulator, currentValue) =>
        accumulator + currentValue, 0) / currKbUnCorrErrs.length);

    //Get average corrected error rate
    let avgCorrErrs = Math.round(currKbCorrErrs.reduce((accumulator, currentValue) =>
        accumulator + currentValue, 0) / currKbCorrErrs.length);

    //Put values of arrays into array for currently used keyboard as objects
    switch (kbCount) {
        case (1):
            kb1SeshErrs.push({ unCorrErrRate: avgUnCorrErrs });
            kb1SeshErrs.push({ corrErrRate: avgCorrErrs })
            console.log(kb1SeshErrs);
            break;

        case (2):
            kb2SeshErrs.push({ unCorrErrRate: avgUnCorrErrs });
            kb2SeshErrs.push({ corrErrRate: avgCorrErrs });
            break;

        default:
            break;
    }

    currKbErrs = [];

}

//For adaptive keyboard
//Gets the initial width of the keys for each row before they have been adapted
//to make sure that they don't exceed the resize threshold
function getKeyWidth() {
    for (i = 0; i < rowBoundList.length; i++){
        keySizeList.push(rowBoundList[i].width / rowList[i].length);
    }
}

function checkForError() {
    let errKeyXIndex;
    let expKeyXIndex;
    let errKeyYIndex;
    let expKeyYIndex;
    //Something something check last value in input box against equivalent value in phrase box if it's not the same mark it as an error otherwise just continue
    if (keyboardInput.value[cursorPos - 2] !== phraseBox.textContent[cursorPos - 2]) {
        console.log('skill issue');


        for (j = 0; j < keyList.length; j++) {
            if (keyList[j].key === keyboardInput.value[cursorPos - 2]) {
                errKeyXIndex = keyList[j].keyXIndex;
                errKeyYIndex = keyList[j].keyYIndex;
            }
            if (keyList[j].key === phraseBox.textContent[cursorPos - 2]) {
                expKeyXIndex = keyList[j].keyXIndex;
                expKeyYIndex = keyList[j].keyYIndex;
            }
        }
    }

    if (touchX > adaptKeyX[28] && touchX < adaptKeyX[29]) {
        if (touchY >= adaptKeyY[2] && touchY < adaptKeyY[3]) {
            return;
        } else {
            errTouches.push(error = new errTouchEvnt(errKeyXIndex, errKeyYIndex,
                expKeyXIndex, expKeyYIndex,
                touchX, touchY));
        }
    } else {
        errTouches.push(error = new errTouchEvnt(errKeyXIndex, errKeyYIndex,
            expKeyXIndex, expKeyYIndex,
            touchX, touchY));
    }
}

function checkKeyForTally() {
    //Make sure that it doen't count keystrokes again when the user presses backspace
    if (touchX > adaptKeyX[28] && touchX < adaptKeyX[29]) {
        if (touchY >= adaptKeyY[2] && touchY < adaptKeyY[3]) {
            return;
        } else {
            tallyKeyPress();
        }
    } else {
        tallyKeyPress();
    }
}

//When the user presses a key, increment its KPTally value by 1
function tallyKeyPress() {
    let lastPressedKey = keyboardInput.value[cursorPos - 2];

    for (i = 0; i < keyList.length; i++) {
        if (lastPressedKey === keyList[i].key) {
            keyList[i].KPTally++;
        } else if (lastPressedKey === ' ' && keyList[i].key === 'space') {
            keyList[i].KPTally++;
        }
    }
}

//When user has typed a phrase with the test keyboard, adapt the keys
function adaptKb() {
    //Loop through the error list and ignore errors where the user has pressed keys more than
    //one key apart from the expected key
    for (i = 0; i < errTouches.length; i++) {
        if (errTouches[i].expectedKeyX - errTouches[i].erroneousKeyX === 1 || errTouches[i].erroneousKeyX - errTouches[i].expectedKeyX === 1) {
            checkKeyForResize(errTouches[i].erroneousKeyX, errTouches[i].expectedKeyX, 
                errTouches[i].erroneousKeyY, errTouches[i].expectedKeyY, 
                errTouches[i].x, errTouches[i].y);
        } else if (errTouches[i].expectedKeyY - errTouches[i].erroneousKeyY === 1 || errTouches[i].erroneousKeyY - errTouches[i].expectedKeyY === 1) {
            console.log(errTouches[i].y);
            checkKeyForResize(errTouches[i].erroneousKeyX, errTouches[i].expectedKeyX, 
                errTouches[i].erroneousKeyY, errTouches[i].expectedKeyY, 
                errTouches[i].x, errTouches[i].y);
        }
    }

    //adapt keys based on heat map
    for (i = 0; i < keyList.length; i++) {

    }
}

//Make sure that the key edge will only move up to 1.25x (Just another ugly function)
function checkKeyForResize(errXIndex, expXIndex, errYIndex, expYIndex, xTouch, yTouch) {
    let distXFromExpKey = xTouch - adaptKeyX[expXIndex];
    //Key edge is not allowed to move right by more than this value
    let keyWidthMaxRight = keySizeList[expYIndex] * 1.25;
    //Key edge is not allowed to move left by more than this value
    let keyWidthMaxLeft = keySizeList[expYIndex] * 0.25;

    let distYFromExpKey = yTouch - adaptKeyY[expYIndex];
    let keyHeightMaxTop = rowBoundList[expYIndex].height * 1.15;
    let keyHeightMaxBottom = rowBoundList[expYIndex].height * 0.15;

    //Check if the distance between the user's touchpoint is greater than the max allowed distance
    //if it is, limit the growth to 1.25x
    //x axis
    if (distXFromExpKey > keyWidthMaxRight) {
        //If the new size exceeds 1.25x, limit it to 1.25x
        xTouch = adaptKeyX[expXIndex] + keyWidthMaxRight;
    } else if (distXFromExpKey < keyWidthMaxLeft) {
        //If the new size exceeds 0.25x, limit it to 0.25x
        xTouch = adaptKeyX[expXIndex] - keyWidthMaxLeft;
    }

    //y axis
    if (distYFromExpKey > keyHeightMaxTop) {
        //If the new size exceeds 1.25x, limit it to 1.25x
        yTouch = adaptKeyY[expYIndex] + keyHeightMaxTop;
    } else if (distYFromExpKey < keyHeightMaxBottom) {
        //If the new size exceeds 0.25x, limit it to 0.25x
        yTouch = adaptKeyY[expYIndex] - keyHeightMaxBottom;
    }

    //if (xTouch - adaptKeyX[expXIndex] > adaptKeyX[expXIndex - 1] + keyWidthMaxRight)
    resizeKey(errXIndex, expXIndex, errYIndex, expYIndex, xTouch, yTouch);
}

function resizeKey(errXIndex, expXIndex, errYIndex, expYIndex, newXCoord, newYCoord, resizeThresh) {
    //Check which side the erroneous key is on so that the right coordinates are changed
    if (errXIndex < expXIndex) {
        //reduce value of left coordinate
        adaptKeyX[expXIndex] = newXCoord;
    } else if (errXIndex > expXIndex) {
        //increase value of right coordinate
        adaptKeyX[errXIndex] = newXCoord;
    }

    if (errYIndex < expYIndex) {
        //reduce value of upper coordinate
        adaptKeyY[expYIndex] = newYCoord;
    } else if (errYIndex > expYIndex) {
        //increase value of lower coordinate
        adaptKeyY[errYIndex] = newYCoord;
    }
    //remove in final version
    clearErrors();
}

//Go through the adaptKeyX/Y arrays and make sure that the keys are sensible sizes
//Also adapt keys based on the number of times they've been pressed
function resizeFromHeatMap() {
    let keyResizeWeights = [];
    for (i = 0; i < keyList.length; i++) {
        keyResizeWeights.push([keyList[i].keyXIndex, keyList[i].keyYIndex, 
            keyList[i].KPTally]);
    }
}

function clearErrors() {
    errTouches = [];
}

//Put times into the wordTimes array so that the average WPM can be calculated later
function WPMTimeList() {
    wordTimes.push(Date.now());
}

//CaLculate average WPM based on times in the wordTimes array
function getWPM() {
    for (i = 0; i < wordTimes.length; i++) {
        WPMList.push((wordTimes[i + 1] - wordTimes[i]) / 1000);
    }
    WPMList.pop();
    let avgWordTime = WPMList.reduce((accumulator, currentValue) =>
        accumulator + currentValue, 0) / WPMList.length;
    WPM = 60 / avgWordTime;
    kb1SeshWPM.push(WPM);
    //console.log(kb1SeshWPM);
    wordTimes = [];
}

function phraseTyped() {
    getUnCorrErrsForLastPhrase();
    getCorrErrsForLastPhrase();
    pushPhraseErrsToKbErrs();
    phraseCount++;
    if (phraseCount === 3) {
        newSession();
        phraseCount = 0;
    }
    updateDisplays();
    keyboardInput.value = '';
    wordTimes = [];
    newPhrase();
}

//Generate a new phrase when the user has finished typing the current one
function newPhrase() {
    let phraseNum = Math.round(Math.random() * (phraseArrLen - 1));
    phraseBox.textContent = phrases[phraseNum];
    //If user is using the adaptive keyboard, call the adaptKb function when the user has typed a phrase
    if (kbNum === 2) {
        adaptKb();
        clearErrors();
    }
}

function newSession() {
    getWPM();

    seshCount++;
    if (seshCount > 3) {
        newKb();
        seshCount = 1;
    }

    updateDisplays();

    wordTimes = [];
}

function newKb() {
    pushErrorRateToKbErrs();
    kbCount++;
    updateDisplays();
    if (kbCount > 2) {
        dispCompScreen();
    }
    switch (kbNum) {
        case (0):
            experimentSession();
            break;
        case (1):
            TestKb();
            break;
        case (2):
            ControlKb();
            keyboardArea.removeEventListener("touchend", checkForError);
            keyboardArea.removeEventListener("touchend", tallyKeyPress);
            break;
        default: break;
    }
}

//Update the session and keyboard count displays
function updateDisplays() {
    phraseCounter.textContent = `Phrases typed: ${phraseCount}/3`;
    kbSeshCount.textContent = `Keyboard ${kbCount} - Session ${seshCount}/3`;
    document.querySelector('title').textContent = `Experiment ${kbCount} - 899549 Research Tool`;
}

function dispCompScreen() {
    //Not final
    alert('Experiment complete');
}