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
    constructor(key) {
        this.key = key, this.KPTally = 0;
    }
}

function createKeyObjects() {
    for (let rows = 0; rows < rowList.length; rows++) {
        let currentRow = rowList[rows];
        for (let j = 0; j < currentRow.length; j++) {
            keyList.push(key = new keyObject(currentRow[j].textContent.toLowerCase()));
            }  
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
    adaptKeyX = keyX;
    adaptKeyY = keyY;
    createKeyObjects();
    testKeyboard = `Keyboard ${kbCount} = Test`;
    keyboardArea.addEventListener("touchend", checkForError);
    keyboardArea.addEventListener("touchend", tallyKeyPress);
}

function rmKeyBorders() {
    for (row = 0; row < rowList.length; row++) {
        for (el = 0; el < rowList[row].length; el++) {
            rowList[row][el].style.border = 'none';
        }
    }
    
}

function handleKeyPress() {
    switch(kbNum) {
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
function checkForError() {
    //Something something check last value in input box against equivalent value in phrase box if it's not the same mark it as an error otherwise just continue
    if (keyboardInput.value[cursorPos - 2] !== phraseBox.textContent[cursorPos - 2]) {
        console.log('skill issue');
        let lastErrTouches = [];
        lastErrTouches.push(`Key pressed: ${keyboardInput.value.slice(cursorPos - 2, cursorPos)}`, `Expected key: ${phraseBox.textContent[cursorPos - 2]}`, `x = ${touchX}`, `y = ${touchY}`);
        errTouches.push(lastErrTouches);
    };
}

//When the user presses a key, increment its KPTally value by 1
function tallyKeyPress() {
    let lastPressedKey = keyboardInput.value[cursorPos - 2];
    console.log(lastPressedKey);
    //Make sure that it doen't count keystrokes again when the user presses backspace
    if (touchY >= adaptKeyY[2] && touchY < adaptKeyY[3]) {
        if (touchX > adaptKeyX[28] && touchX < adaptKeyX[29]) {
            return;
        }
    } else {
        for (i = 0; i < keyList.length; i++) {
        if (lastPressedKey === keyList[i].key){
            keyList[i].KPTally++;
        }
    }
    }
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

/*Generate a new phrase when the user has finished typing the current one, refer to design doc*/
function newPhrase() {
    let phraseNum = Math.round(Math.random() * (phraseArrLen - 1));
    phraseBox.textContent = phrases[phraseNum];
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
        case (0): experimentSession();
            break;
        case (1): TestKb();
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