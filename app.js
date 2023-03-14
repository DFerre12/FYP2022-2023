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


/*Experiment page code*/

const kbSeshCount = document.querySelector('#kbSeshCount');
const phraseCounter = document.querySelector('#phraseCounter');
let phraseCount = '0';
const phrases = document.getElementById('phrases');
const keyboardArea = document.getElementById('keyboard');
if (keyboardArea != null) {
    kbArea = keyboardArea.getBoundingClientRect();
}
const keyboardInput = document.getElementById('keyboardInput');
let touchX;
let touchY;

/*Check that kbSeshCount isn't null, otherwise other pages will fail to work*/
if (kbSeshCount != null) {
    let kbCount = '1';
    let seshCount = '1';
    kbSeshCount.textContent = `Keyboard ${kbCount} - Session ${seshCount}/5`;
    document.querySelector('title').textContent = `Experiment ${seshCount} - 899549 Research Tool`;
}



/*Check that phraseCounter isn't null, otherwise other pages will fail to work*/
if (phraseCounter != null) {
    phraseCounter.textContent = `Phrases typed ${phraseCount}/5`;
}

/*Generate keyboard and start practice session*/

if (window.location.pathname.includes('experiment.html')) {
    generateKb();
    practiceSession();
}

function practiceSession() {
    
}

/*Select 1 or 2 to give the user either the control or the test keyboard 1 = Control, 2 = Test*/
function generateKb() {
    kbNum = Math.round(Math.random() + 1);

    if (kbNum == 1) {
        ControlKb();
    } else if (kbNum == 2) {
        TestKb();
    }
}
    

function ControlKb() {
    console.log('Using control keyboard');
}

function TestKb() {
    console.log('Using test keyboard');
}

if (keyboardArea != null) {
        keyboardArea.addEventListener("touchstart", (e) => {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY - kbArea.top;
    });
    
    keyboardArea.addEventListener("touchend", (e) => {
        console.log(touchX);
        console.log(touchY);
        keyPressed();
        if (keyboardInput.value === phrases.innerHTML) {
            phraseTyped();
        };
    });
}


function keyPressed() {
    console.log('Key\'s been pressed')
    keyboardInput.value += 'f';
}

function phraseTyped() {
    phraseCount ++;
    phraseCounter.textContent = `Phrases typed ${phraseCount}/5`;
    keyboardInput.value = '';
    newPhrase();
}

/*Generate a new phrase when the user has finished typing the current one, refer to design doc*/
function newPhrase() {
    phrases.textContent = 'New phrase';
}