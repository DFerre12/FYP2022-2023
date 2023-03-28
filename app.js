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
            checkCount ++;
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
if (keyboardArea != null) {
    kbArea = keyboardArea.getBoundingClientRect();

}
const keyboardInput = document.getElementById('keyboardInput');

//Phrases for the user to type
let phrases = ['nymphs blitz quick vex dwarf jog', 'big fjords vex quick waltz nymph', 'junk mtv quiz graced by fox whelps',
 'brick quiz whangs jumpy veldt fox', 'two driven jocks help fax my big quiz', 'my ex pub quiz crowd gave joyful thanks', 'fake bugs put in wax jonquils drive him crazy', 
'few black taxis drive up major roads on quiet hazy nights', 'jaded zombies acted quietly but kept driving their oxen forward'];

let phraseArrLen = phrases.length;

//Store coordinates of most recent touch event
let touchX;
let touchY;

//Store key coordinates
let keyX = [];
let keyY = [];

//Counters
let kbCount = '1';
let seshCount = '0';
let phraseCount = '0';
let cursorPos = 0;

let errTouches = [];

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
    practiceSession();
    newPhrase();
}

if (keyboardArea != null) {
    keyboardArea.addEventListener("touchstart", (e) => {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY - kbArea.top;
    });
    
    keyboardArea.addEventListener("touchend", () => {
        keyPressed();
        checkForError();
        if (keyboardInput.value === phraseBox.textContent) {
            phraseTyped();
        };
        if ((keyboardInput.value.length % 5) === 0) {
            WPMTimeList();
        }
    });
}

function checkForError() {
    //Something something check last value in input box against equivalent value in phrase box if it's not the same mark it as an error otherwise just continue
    if (keyboardInput.value[cursorPos-1] !== phraseBox.textContent[cursorPos-1]) {
        console.log('skill issue');
        let lastErrTouches = [];
        lastErrTouches.push('Keyboard = ' + kbCount, 'Session = ' + seshCount, 'x = ' + touchX, 'y = ' + touchY);
        errTouches.push(lastErrTouches);
    };


}

//Put times into the wordTimes array so that the average WPM can be calculated later
function WPMTimeList() {
    wordTimes.push(Date.now());
    //console.log(wordTimes);
}

//CaLculate average WPM based on times in the wordTimes array
function getWPM() {
    WPMList = [];
    for (i = 0; i < wordTimes.length; i++) {
        WPMList.push((wordTimes[i+1] - wordTimes[i]) / 1000);
    }
    WPMList.pop();
    avgWordTime = WPMList.reduce((accumulator, currentValue) =>
        accumulator + currentValue, 0) / WPMList.length;
    WPM = 60 / avgWordTime;
    kb1SeshWPM.push(WPM);
    console.log(kb1SeshWPM);
}



function updateKbCount() {
    kbCount ++;
    if (kbCount > 2) {
        dispCompScreen();
    }
}


/*Generate coordinates for keys on standard keyboard*/
function generateKeyCoords() {
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
    /*Delete these lines in final version*/
    /*console.log(keyX);
    console.log(keyY);*/
}

function practiceSession() {
    kbSeshCount.textContent = `Keyboard ${kbCount} - Practice session`;
    document.querySelector('title').textContent = `Practice session ${kbCount} - 899549 Research Tool`;
    /*Call generateKb when practice session is finished*/
    if (kbSeshCount === null) {generateKb();}
}

/*Select 1 or 2 to give the user either the control or the test keyboard 1 = Control, 2 = Test*/
function generateKb() {
    kbNum = Math.round(Math.random() + 1);

    if (kbNum === 1) {ControlKb();}
    else if (kbNum === 2) {TestKb();}
}
    

function ControlKb() {
    console.log('Using control keyboard');
}

function TestKb() {
    console.log('Using test keyboard');
}


function keyPressed() {    
    cursorPos++;
    /*Don't like it, infact I hate it. Please be another way...*/
    if (touchY >= keyY[0] && touchY < keyY[1]) {
            if (touchX > keyX[0] && touchX < keyX[1]) {
            keyboardInput.value += 'q';
            } else if (touchX > keyX[1] && touchX < keyX[2]) {
                keyboardInput.value += 'w';
            } else if (touchX > keyX[2] && touchX < keyX[3]) {
                keyboardInput.value += 'e';
            } else if (touchX > keyX[3] && touchX < keyX[4]) {
                keyboardInput.value += 'r';
            } else if (touchX > keyX[4] && touchX < keyX[5]) {
                keyboardInput.value += 't';
            } else if (touchX > keyX[5] && touchX < keyX[6]) {
                keyboardInput.value += 'y';
            } else if (touchX > keyX[6] && touchX < keyX[7]) {
                keyboardInput.value += 'u';
            } else if (touchX > keyX[7] && touchX < keyX[8]) {
                keyboardInput.value += 'i';
            } else if (touchX > keyX[8] && touchX < keyX[9]) {
                keyboardInput.value += 'o';
            } else if (touchX > keyX[9] && touchX < keyX[10]) {
                keyboardInput.value += 'p';
            } else {
                return false;
            }
    } else if (touchY >= keyY[1] && touchY < keyY[2]) {
        if (touchX > keyX[11] && touchX < keyX[12]) {
            keyboardInput.value += 'a';
            } else if (touchX > keyX[12] && touchX < keyX[13]) {
                keyboardInput.value += 's';
            } else if (touchX > keyX[13] && touchX < keyX[14]) {
                keyboardInput.value += 'd';
            } else if (touchX > keyX[14] && touchX < keyX[15]) {
                keyboardInput.value += 'f';
            } else if (touchX > keyX[15] && touchX < keyX[16]) {
                keyboardInput.value += 'g';
            } else if (touchX > keyX[16] && touchX < keyX[17]) {
                keyboardInput.value += 'h';
            } else if (touchX > keyX[17] && touchX < keyX[18]) {
                keyboardInput.value += 'j';
            } else if (touchX > keyX[18] && touchX < keyX[19]) {
                keyboardInput.value += 'k';
            } else if (touchX > keyX[19] && touchX < keyX[20]) {
                keyboardInput.value += 'l';
            } else {
                return false;
            }

    } else if (touchY >= keyY[2] && touchY < keyY[3]) {
        if (touchX > keyX[21] && touchX < keyX[22]) {
            keyboardInput.value += 'z';
            } else if (touchX > keyX[22] && touchX < keyX[23]) {
                keyboardInput.value += 'x';
            } else if (touchX > keyX[23] && touchX < keyX[24]) {
                keyboardInput.value += 'c';
            } else if (touchX > keyX[24] && touchX < keyX[25]) {
                keyboardInput.value += 'v';
            } else if (touchX > keyX[25] && touchX < keyX[26]) {
                keyboardInput.value += 'b';
            } else if (touchX > keyX[26] && touchX < keyX[27]) {
                keyboardInput.value += 'n';
            } else if (touchX > keyX[27] && touchX < keyX[28]) {
                keyboardInput.value += 'm';
            } else if (touchX > keyX[28] && touchX < keyX[29]) {
                keyboardInput.value += 'Fix this when the error calculation thing is being built';
            } else {
                return false;
            }
    } else if (touchY >= keyY[3] && touchY < keyY[4]) {
        if (touchX > keyX[30] && touchX < keyX[31]) {
            keyboardInput.value += ' ';
        } else {
            return false;
        }
    } else {
        return false;
    }


}

function phraseTyped() {
    phraseCount ++;
    if (phraseCount > 5) {
        newSession();
        phraseCount = 1
    }
    phraseCounter.textContent = `Phrases typed: ${phraseCount}/5`;
    keyboardInput.value = '';
    wordTimes = [];
    newPhrase();
}

/*Generate a new phrase when the user has finished typing the current one, refer to design doc*/
function newPhrase() {
    phraseBox.textContent = 'New phrase';
    let phraseNum = Math.round(Math.random() * (phraseArrLen - 1));
    phraseBox.textContent = phrases[phraseNum];
}

function newSession() {
    getWPM();
    seshCount ++;
    kbSeshCount.textContent = `Keyboard ${kbCount} - Session ${seshCount}/3`;
    if (seshCount > 3) {
        updateKbCount();
        seshCount = 1;
    }
    document.querySelector('title').textContent = `Experiment ${kbCount} - 899549 Research Tool`;
    wordTimes = [];
}

function dispCompScreen() {
    //Not final
    alert('Experiment complete');
}