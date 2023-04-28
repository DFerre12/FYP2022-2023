/*PIS page code*/
const checkPIS = document.querySelector('#readPIS');
const PISnext = document.querySelector('#PISnext');
let readPIS;
/*Don't allow user to press 'next' button unless they have checked the box*/
/*Check that checkPIS isn't null, otherwise other pages will fail to work*/
if (checkPIS != null) {
    checkPIS.addEventListener('change', (e) => {
        const readPISValue = checkPIS.value;
        sessionStorage.setItem("Read PIS", readPISValue);
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

/*set sessionStorage based on the values of the checkboxes*/
function updateClauses() {
    console.log('pretend it\'s updated');
    for (const clause of clauses) {
        if (clause.checked) {
            sessionStorage.setItem(clause.name, clause.value);
        }
    }
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
let topRowBounds;
let secRow = document.getElementsByClassName('secKeys');
let secRowBounds;
let thiRow = document.getElementsByClassName('thiKeys');
let thiRowBounds;
let botRow = document.getElementsByClassName('spaceKey');
let botRowBounds;
let rowList;
let rowBoundList;
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
let kbCount = 0;
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
//Error rates for each session on the first keyboard
let kb1unCorrSeshErrs = [];
let kb1CorrSeshErrs = [];
//Error rates for each session on the second keyboard
let kb2unCorrSeshErrs = [];
let kb2CorrSeshErrs = [];

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
    initKb();
    generateKeyCoords();
    newPhrase();
    updateDisplays();
    alert("If the keys fail to register correctly on initial load, please refresh the page");
}

function initKb() {
    topRowBounds = document.querySelector('.topRow').getBoundingClientRect();
    secRowBounds = document.querySelector('.secondRow').getBoundingClientRect();
    thiRowBounds = document.querySelector('.thirdRow').getBoundingClientRect();
    botRowBounds = document.querySelector('.bottomRow').getBoundingClientRect();
    rowBoundList = [topRowBounds, secRowBounds, thiRowBounds, botRowBounds];
    rowList = [topRow, secRow, thiRow, botRow];

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
        this.erroneousKeyX = errKeyX, this.erroneousKeyY = errKeyY,
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
            switch (currentRow[j].textContent) {
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
    controlKeyboard = `Keyboard ${kbCount.toString()} = Control`;
}

function TestKb() {
    console.log('Using test keyboard');
    adaptKeyX = [...keyX];
    adaptKeyY = [...keyY];
    createKeyObjects();
    getKeyWidth();
    testKeyboard = `Keyboard ${kbCount.toString()} = Test`;
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

//For adaptive keyboard
//Gets the initial width of the keys for each row before they have been adapted
//to make sure that they don't exceed the resize threshold
function getKeyWidth() {
    for (i = 0; i < rowBoundList.length; i++) {
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
    resizeKeyForErrors(errXIndex, expXIndex, errYIndex, expYIndex, xTouch, yTouch);
}

function resizeKeyForErrors(errXIndex, expXIndex, errYIndex, expYIndex, newXCoord, newYCoord) {
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
}

//Go through the adaptKeyX/Y arrays and make sure that the keys are sensible sizes
function checkKeySizes() {
    //Loop through the adaptKeyX array to make sure that keys aren't too big or small
    for (i = 1; i < 2; i++) {
        for (i = 0; i < adaptKeyX.length; i++) {
            let keyLeft = adaptKeyX[i];
            let keyRight = adaptKeyX[i + 1];
            //Don't be smaller than 75%
            let minKeySize = keySizeList[1] *= 0.75;
            //Don't be larger than 125%
            let maxKeySize = keySizeList[1] *= 1.25;
            if (keyRight - keyLeft < minKeySize) {
                keyRight = keyLeft + minKeySize;
            } else if (keyRight - keyLeft > maxKeySize) {
                keyLeft = keyRight - maxKeySize;
            }
        }
    }
}

//Make sure that errors from previous recording cycle aren't reused in the next adaptation cycle
function clearErrors() {
    errTouches = [];
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

//Call when user has typed a phrase
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
            kb1unCorrSeshErrs.push(avgUnCorrErrs);
            kb1CorrSeshErrs.push(avgCorrErrs);
            break;

        case (2):
            kb2unCorrSeshErrs.push(avgUnCorrErrs);
            kb2CorrSeshErrs.push(avgCorrErrs);
            break;

        default:
            break;
    }

    currKbErrs = [];

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
    switch (kbCount) {
        case (1):
            kb1SeshWPM.push(WPM);
            break;

        case (2):
            kb2SeshWPM.push(WPM);
            break;

        default:
            break;
    }

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
        checkKeySizes();
        clearErrors();
    }
}

function newSession() {
    getWPM();
    pushErrorRateToKbErrs();
    seshCount++;
    switch (kbCount) {
        //Practice keyboard will have 1 session, data collecting keyboards will have 2
        case (0):
            if (seshCount >= 1) {
                newKb();
                break;
            }
        default:
            if (seshCount > 2) {
                newKb();
                seshCount = 1;
            }
            break;
    }

    if (kbCount <= 2) {
        updateDisplays();
    }


    wordTimes = [];
}

function dispTitleScreen() {
    const newDiv = document.createElement("div");
    newDiv.id = "titleScreen";
    const newLine = document.createElement("h1");
    document.body.insertBefore(newDiv, keyboardArea);
    newLine.innerHTML = "Keyboard " + kbCount;
    newDiv.appendChild(newLine);

    const newPara = document.createElement("p");
    newPara.innerHTML = "Press next to continue to keyboard " + kbCount;
    newDiv.appendChild(newPara);

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "Next";
    nextBtn.id = "nextBtn";
    newDiv.appendChild(nextBtn);

    const titleScreen = document.getElementById("titleScreen");
    const nextBtnEl = document.getElementById("nextBtn");

    nextBtn.addEventListener("click", closeTitleScreen);

    //Styling
    titleScreen.style.margin = "20% 5% 20% 5%";
    titleScreen.style.position = "absolute";
    titleScreen.style.width = "90%";
    titleScreen.style.height = "45%";
    titleScreen.style.backgroundColor = "white";
    titleScreen.style.borderRadius = "0.5rem";
    titleScreen.style.boxShadow = "0px 1px 3px black";
    titleScreen.style.top = "0";

    nextBtnEl.style.margin = "0.5rem";
    nextBtnEl.style.position = "absolute";
    nextBtnEl.style.bottom = "0";
    nextBtnEl.style.padding = "0.5rem";
    nextBtnEl.style.textDecoration = "none";
    nextBtnEl.style.fontSize = "inherit";
    nextBtnEl.style.color = "black";
    nextBtnEl.style.backgroundColor = "white";
    nextBtnEl.style.border = "none";
    nextBtnEl.style.borderRadius = "0.5rem";
    nextBtnEl.style.boxShadow = "0px 1px 3px black";
}

function closeTitleScreen() {
    const titleScreen = document.getElementById("titleScreen");
    titleScreen.remove();
}

function newKb() {
    kbCount++;
    if (kbCount <= 2) {
        dispTitleScreen();
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
        updateDisplays();
    } else {
        dispCompScreen();
        kbCount--;
    }

}

//Update the session and keyboard count displays
function updateDisplays() {
    if (kbCount === 0) {
        kbSeshCount.textContent = "Practice session";
        phraseCounter.textContent = `Phrases typed: ${phraseCount}/3`;
        document.querySelector("title").textContent = `Practice session - 899549 Research Tool`;
    } else {
        phraseCounter.textContent = `Phrases typed: ${phraseCount}/3`;
        kbSeshCount.textContent = `Keyboard ${kbCount.toString()} - Session ${seshCount}/2`;
        document.querySelector("title").textContent = `Experiment ${kbCount} - 899549 Research Tool`;
    }
}

function dispCompScreen() {
    PIS = sessionStorage.getItem("Read PIS");
    const clause1 = sessionStorage.getItem("clause1");
    const clause2 = sessionStorage.getItem("clause2");
    const clause3 = sessionStorage.getItem("clause3");
    const clause4 = sessionStorage.getItem("clause4");
    //Store names of all arrays needed for data collection
    let dataColl = [PIS, clause1, clause2, clause3, clause4,
        controlKeyboard, testKeyboard,
        kb1SeshWPM, kb1unCorrSeshErrs, kb1CorrSeshErrs,
        kb2SeshWPM, kb2unCorrSeshErrs, kb2CorrSeshErrs];

    const newDiv = document.createElement("div");
    newDiv.id = "compScreen";
    const newLine = document.createElement("p");
    document.body.insertBefore(newDiv, keyboardArea);
    newLine.innerHTML = "Experiment complete. <span style='color: red'>IMPORTANT:</span> Please copy the information below and paste it into the first question on the questionnaire, found on the next page";
    newDiv.appendChild(newLine);

    dataColl.forEach(el => {
        const newLine = document.createElement("p");
        if (Array.isArray(el)) {
            for (i = 0; i < el.length; i++) {
                let nlText = el[i];
                newLine.innerHTML += nlText + " ";
            }

        } else {
            const nlText = document.createTextNode(el);
            newLine.appendChild(nlText);
        }
        newDiv.appendChild(newLine);

    });

    const nextBtn = document.createElement("a");
    nextBtn.innerHTML = "Next";
    nextBtn.id = "nextBtn";
    newDiv.appendChild(nextBtn);
    const pad = document.createElement("p");;
    pad.innerHTML = "";
    newDiv.appendChild(pad);

    const compScreen = document.getElementById("compScreen");
    const nextBtnEl = document.getElementById("nextBtn");

    nextBtnEl.href = "questionnaire.html";

    //Hide keyboard
    keyboardArea.style.display = "none";

    //Styling
    compScreen.style.margin = "15% 5% 15% 5%";
    compScreen.style.position = "absolute";
    compScreen.style.width = "90%";
    compScreen.style.backgroundColor = "white";
    compScreen.style.borderRadius = "0.5rem";
    compScreen.style.boxShadow = "0px 1px 3px black";
    compScreen.style.top = "0";

    nextBtnEl.style.margin = "0.5rem";
    nextBtnEl.style.padding = "0.5rem";
    nextBtnEl.style.textDecoration = "none";
    nextBtnEl.style.color = "black";
    nextBtnEl.style.backgroundColor = "white";
    nextBtnEl.style.borderRadius = "0.5rem";
    nextBtnEl.style.boxShadow = "0px 1px 3px black";
}