/* =========================================================
   REVIEWFIRST
   Student-created reviewer + automatic quiz generator
   Works locally. No OpenAI/API key/server required.
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let reviewData = JSON.parse(
    localStorage.getItem("reviewFirstData") || "null"
) || {
    title: "",
    summary: "",
    keyPoints: [],
    terms: [],
    flashcards: [],
    quiz: []
};

let currentFlashcard = 0;

let quizIndex = 0;
let quizScore = 0;
let selectedAnswer = null;
let quizWrongItems = [];

let studyTime = 15;

let activities = JSON.parse(
    localStorage.getItem("reviewFirstActivities") || "[]"
);

const $ = id => document.getElementById(id);


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});


function initializeApp() {

    updateGreeting();
    updateDate();

    loadProfile();

    renderSavedReview();
    renderActivities();
    updateDashboard();
    renderPlanner();

    const nameInput = $("nameInput");

    if (nameInput) {
        nameInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                saveName();
            }
        });
    }

    const editNameInput = $("editNameInput");

    if (editNameInput) {
        editNameInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                changeName();
            }
        });
    }

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeProfileModal();
            closeActivityModal();
        }

    });
}


/* =========================================================
   PROFILE
========================================================= */

function showProfileSetup() {

    $("welcomeScreen")?.classList.remove("active");
    $("profileScreen")?.classList.add("active");

    setTimeout(() => {
        $("nameInput")?.focus();
    }, 250);
}


function saveName() {

    const name = $("nameInput")?.value.trim();

    if (!name) {
        showToast("Please enter your name first. ♡");
        return;
    }

    localStorage.setItem(
        "reviewFirstName",
        name
    );

    openApp();
}


function loadProfile() {

    const name =
        localStorage.getItem("reviewFirstName");

    if (!name) return;

    $("welcomeScreen")?.classList.remove("active");
    $("profileScreen")?.classList.remove("active");
    $("appScreen")?.classList.add("active");

    setName(name);
}


function openApp() {

    $("welcomeScreen")?.classList.remove("active");
    $("profileScreen")?.classList.remove("active");
    $("appScreen")?.classList.add("active");

    setName(
        localStorage.getItem("reviewFirstName")
        || "Student"
    );

    updateDashboard();
}


function setName(name) {

    [
        "dashboardName",
        "sidebarName"
    ].forEach(id => {

        if ($(id)) {
            $(id).textContent = name;
        }

    });
}


function openProfileModal() {

    const current =
        localStorage.getItem("reviewFirstName")
        || "";

    if ($("editNameInput")) {
        $("editNameInput").value = current;
    }

    $("profileModal")?.classList.add("show");

    setTimeout(() => {
        $("editNameInput")?.focus();
    }, 100);
}


function closeProfileModal() {

    $("profileModal")?.classList.remove("show");

}


function changeName() {

    const name =
        $("editNameInput")?.value.trim();

    if (!name) {
        showToast("Please enter a name. ♡");
        return;
    }

    localStorage.setItem(
        "reviewFirstName",
        name
    );

    setName(name);

    closeProfileModal();

    showToast(
        "Your profile was updated. 🌷"
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId, button = null) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove(
                "active-page"
            );
        });

    const page = $(pageId);

    if (page) {
        page.classList.add(
            "active-page"
        );
    }

    if (button) {

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {
                btn.classList.remove(
                    "active"
                );
            });

        button.classList.add("active");

    } else {

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {

                const onclick =
                    btn.getAttribute("onclick")
                    || "";

                btn.classList.toggle(
                    "active",
                    onclick.includes(pageId)
                );

            });

    }

    if (pageId === "quizPage") {

        if (reviewData.quiz?.length) {

            if (
                $("quizContent")?.classList.contains("hidden")
                &&
                $("quizResult")?.classList.contains("hidden")
            ) {
                startQuiz();
            }

        }

    }

    if (pageId === "weakPage") {
        renderWeakTopics();
    }

    if (pageId === "plannerPage") {
        renderPlanner();
    }

    if (pageId === "activitiesPage") {
        renderActivities();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function toggleSidebar() {

    document
        .querySelector(".sidebar")
        ?.classList.toggle("open");

}


/* =========================================================
   CREATE REVIEWER
========================================================= */

function createMyReviewer() {

    const title =
        $("reviewTopic")?.value.trim();

    const summary =
        $("reviewSummary")?.value.trim();

    const keyPointsText =
        $("reviewKeyPoints")?.value.trim();

    const termsText =
        $("reviewTerms")?.value.trim();


    /* -----------------------------------------
       BASIC VALIDATION
    ----------------------------------------- */

    if (
        !title ||
        !summary ||
        !keyPointsText
    ) {

        showToast(
            "Please complete the topic, summary, and key points. ♡"
        );

        return;
    }


    const keyPoints =
        parseList(keyPointsText);

    const terms =
        parseTerms(termsText);


    if (keyPoints.length < 2) {

        showToast(
            "Add at least 2 key points so ReviewFirst can make a better quiz. 💗"
        );

        return;
    }


    if (terms.length === 0) {

        showToast(
            "Add at least 1 important term with its meaning. 💡"
        );

        return;
    }


    /* -----------------------------------------
       CREATE FLASHCARDS
    ----------------------------------------- */

    const flashcards =
        terms.map(item => ({

            question:
                `What is ${item.term}?`,

            answer:
                item.definition

        }));


    /* -----------------------------------------
       CREATE QUIZ
    ----------------------------------------- */

    const quiz =
        buildQuiz(
            title,
            summary,
            keyPoints,
            terms
        );


    /* -----------------------------------------
       SAVE REVIEW
    ----------------------------------------- */

    reviewData = {

        title,

        summary,

        keyPoints,

        terms,

        flashcards,

        quiz

    };


    localStorage.setItem(
        "reviewFirstData",
        JSON.stringify(reviewData)
    );


    /* -----------------------------------------
       RESET OLD QUIZ RESULTS
    ----------------------------------------- */

    localStorage.removeItem(
        "reviewFirstLastScore"
    );

    localStorage.removeItem(
        "reviewFirstWeakTopics"
    );


    currentFlashcard = 0;
    quizIndex = 0;
    quizScore = 0;
    quizWrongItems = [];


    /* -----------------------------------------
       RENDER
    ----------------------------------------- */

    renderSavedReview();

    updateDashboard();

    renderWeakTopics();

    resetQuizUI();


    showToast(
        `Your reviewer is ready! ${quiz.length} quiz questions created. ✨`
    );


    showPage("reviewerPage");
}


/* =========================================================
   PARSE KEY POINTS
========================================================= */

function parseList(text) {

    return text
        .split("\n")

        .map(line => {

            return line
                .replace(
                    /^\s*[-•*]\s*/,
                    ""
                )
                .replace(
                    /^\s*\d+[.)]\s*/,
                    ""
                )
                .trim();

        })

        .filter(Boolean);
}


/* =========================================================
   PARSE TERMS
========================================================= */

function parseTerms(text) {

    if (!text) {
        return [];
    }


    return text

        .split("\n")

        .map(line => line.trim())

        .filter(Boolean)

        .map(line => {

            const clean =
                line
                    .replace(
                        /^\s*[-•*]\s*/,
                        ""
                    )
                    .replace(
                        /^\s*\d+[.)]\s*/,
                        ""
                    )
                    .trim();


            const match =
                clean.match(
                    /^(.+?)\s*(?:\s+[-–—:]\s+|\s*:\s*|\s+-\s+|\t+)(.+)$/
                );


            if (match) {

                return {

                    term:
                        match[1].trim(),

                    definition:
                        match[2].trim()

                };

            }


            return null;

        })

        .filter(item =>
            item &&
            item.term &&
            item.definition
        );
}


/* =========================================================
   AUTOMATIC QUIZ GENERATOR
========================================================= */

function buildQuiz(
    title,
    summary,
    keyPoints,
    terms
) {

    const questions = [];


    /* -----------------------------------------
       TERM DEFINITION QUESTIONS
    ----------------------------------------- */

    terms.forEach((item, index) => {

        const distractors =
            terms

                .filter((_, i) =>
                    i !== index
                )

                .map(
                    t => t.definition
                );


        const extraFacts =
            keyPoints.filter(
                point =>
                    !distractors.includes(
                        point
                    )
            );


        const choices =
            unique([
                item.definition,
                ...distractors,
                ...extraFacts
            ]).slice(0, 4);


        if (choices.length >= 2) {

            while (choices.length < 4) {

                choices.push(
                    `Another detail from ${title}`
                );

            }


            questions.push({

                id:
                    `q${questions.length + 1}`,

                question:
                    `What does "${item.term}" mean?`,

                choices:
                    shuffle(choices),

                answer:
                    item.definition,

                topic:
                    item.term

            });

        }

    });


    /* -----------------------------------------
       KEY POINT QUESTIONS
    ----------------------------------------- */

    keyPoints.forEach(
        (point, index) => {

            if (questions.length >= 10) {
                return;
            }


            const otherPoints =
                keyPoints

                    .filter(
                        (_, i) =>
                            i !== index
                    )

                    .slice(0, 3);


            const choices =
                unique([
                    point,
                    ...otherPoints
                ]);


            if (choices.length >= 4) {

                questions.push({

                    id:
                        `q${questions.length + 1}`,

                    question:
                        `Which statement is included in the reviewer for "${title}"?`,

                    choices:
                        shuffle(
                            choices.slice(0, 4)
                        ),

                    answer:
                        point,

                    topic:
                        point

                });

            }

        }
    );


    /* -----------------------------------------
       TERM IDENTIFICATION QUESTIONS
    ----------------------------------------- */

    terms.forEach(item => {

        if (questions.length >= 10) {
            return;
        }


        const related =
            terms

                .filter(
                    t =>
                        t.term !== item.term
                )

                .map(
                    t => t.term
                );


        const choices =
            unique([
                item.term,
                ...related
            ]).slice(0, 4);


        if (choices.length >= 2) {

            while (choices.length < 4) {

                choices.push(
                    `Term from ${title}`
                );

            }


            questions.push({

                id:
                    `q${questions.length + 1}`,

                question:
                    `Which term matches this meaning: "${item.definition}"?`,

                choices:
                    shuffle(choices),

                answer:
                    item.term,

                topic:
                    item.term

            });

        }

    });


    return questions

        .slice(0, 10)

        .map(
            (question, index) => ({

                ...question,

                id:
                    `q${index + 1}`

            })
        );
}


/* =========================================================
   ARRAY HELPERS
========================================================= */

function unique(items) {

    return [
        ...new Set(
            items
                .filter(Boolean)
                .map(String)
        )
    ];

}


function shuffle(items) {

    const array = [...items];


    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;
}


/* =========================================================
   REVIEWER RENDERING
========================================================= */

function renderSavedReview() {

    const hasReview =
        reviewData.title &&
        reviewData.summary;


    if (!hasReview) {

        $("reviewerEmpty")
            ?.classList.remove(
                "hidden"
            );

        $("reviewerContent")
            ?.classList.add(
                "hidden"
            );


        if ($("reviewerTitle")) {
            $("reviewerTitle").textContent =
                "No topic yet 📖";
        }


        if ($("reviewerSubtitle")) {
            $("reviewerSubtitle").textContent =
                "Create your own reviewer first.";
        }


        return;
    }


    $("reviewerEmpty")
        ?.classList.add(
            "hidden"
        );

    $("reviewerContent")
        ?.classList.remove(
            "hidden"
        );


    $("reviewerTitle").textContent =
        reviewData.title;


    $("reviewerSubtitle").textContent =
        "Your personal reviewer is ready. Study it, then test yourself! ♡";


    $("summaryContent").textContent =
        reviewData.summary;


    /* -----------------------------------------
       KEY POINTS
    ----------------------------------------- */

    const keyPointsList =
        $("keyPointsList");

    if (keyPointsList) {

        keyPointsList.innerHTML = "";

        reviewData.keyPoints
            .forEach(point => {

                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    point;

                keyPointsList.appendChild(
                    li
                );

            });

    }


    /* -----------------------------------------
       TERMS
    ----------------------------------------- */

    const termsList =
        $("termsList");

    if (termsList) {

        termsList.innerHTML = "";

        reviewData.terms
            .forEach(item => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "term-card";


                card.innerHTML = `
                    <strong>
                        ${escapeHTML(item.term)}
                    </strong>

                    <p>
                        ${escapeHTML(item.definition)}
                    </p>
                `;


                termsList.appendChild(
                    card
                );

            });

    }


    renderFlashcard();

    resetQuizUI();
}


/* =========================================================
   REVIEW TABS
========================================================= */

function showReviewTab(
    tabId,
    button
) {

    document
        .querySelectorAll(
            ".review-tab-content"
        )
        .forEach(tab => {

            tab.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(
            ".review-tab"
        )
        .forEach(tab => {

            tab.classList.remove(
                "active"
            );

        });


    $(tabId)?.classList.add(
        "active"
    );

    button?.classList.add(
        "active"
    );
}


/* =========================================================
   FLASHCARDS
========================================================= */

function renderFlashcard() {

    if (
        !reviewData.flashcards ||
        !reviewData.flashcards.length
    ) {
        return;
    }


    const card =
        reviewData.flashcards[
            currentFlashcard
        ];


    if (!$("flashcardQuestion")) {
        return;
    }


    $("flashcardQuestion").textContent =
        card.question;


    $("flashcardAnswer").textContent =
        card.answer;


    $("flashcardCounter").textContent =
        `${currentFlashcard + 1} / ${reviewData.flashcards.length}`;


    $("flashcard")
        ?.classList.remove(
            "flipped"
        );
}


function flipFlashcard() {

    $("flashcard")
        ?.classList.toggle(
            "flipped"
        );

}


function previousFlashcard() {

    if (
        !reviewData.flashcards?.length
    ) {
        return;
    }


    currentFlashcard =
        (
            currentFlashcard -
            1 +
            reviewData.flashcards.length
        )
        %
        reviewData.flashcards.length;


    renderFlashcard();
}


function nextFlashcard() {

    if (
        !reviewData.flashcards?.length
    ) {
        return;
    }


    currentFlashcard =
        (
            currentFlashcard + 1
        )
        %
        reviewData.flashcards.length;


    renderFlashcard();
}


/* =========================================================
   QUIZ UI
========================================================= */

function resetQuizUI() {

    if (!$("quizEmpty")) {
        return;
    }


    const hasQuiz =
        Array.isArray(
            reviewData.quiz
        )
        &&
        reviewData.quiz.length > 0;


    $("quizEmpty")
        .classList.toggle(
            "hidden",
            hasQuiz
        );


    $("quizContent")
        .classList.add(
            "hidden"
        );


    $("quizResult")
        .classList.add(
            "hidden"
        );


    if (hasQuiz) {

        $("quizTopicLabel").textContent =
            reviewData.title;


        $("questionNumber").textContent =
            `Question 1 of ${reviewData.quiz.length}`;


        $("quizScore").textContent =
            "0";
    }

}


/* =========================================================
   START QUIZ
========================================================= */

function startQuiz() {

    if (
        !reviewData.quiz?.length
    ) {

        resetQuizUI();

        return;
    }


    quizIndex = 0;

    quizScore = 0;

    selectedAnswer = null;

    quizWrongItems = [];


    $("quizEmpty")
        ?.classList.add(
            "hidden"
        );


    $("quizResult")
        ?.classList.add(
            "hidden"
        );


    $("quizContent")
        ?.classList.remove(
            "hidden"
        );


    renderQuestion();
}


/* =========================================================
   RENDER QUESTION
========================================================= */

function renderQuestion() {

    const question =
        reviewData.quiz[
            quizIndex
        ];


    if (!question) {
        return;
    }


    selectedAnswer = null;


    $("quizTopicLabel").textContent =
        reviewData.title;


    $("questionNumber").textContent =
        `Question ${quizIndex + 1} of ${reviewData.quiz.length}`;


    $("quizScore").textContent =
        quizScore;


    $("questionText").textContent =
        question.question;


    $("quizProgressBar").style.width =
        `${(quizIndex / reviewData.quiz.length) * 100}%`;


    const choices =
        $("answerChoices");


    choices.innerHTML = "";


    question.choices
        .forEach(
            (choice, index) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "choice-btn";


                button.dataset.answer =
                    choice;


                button.innerHTML = `
                    <span>
                        ${String.fromCharCode(
                            65 + index
                        )}
                    </span>

                    ${escapeHTML(choice)}
                `;


                button.addEventListener(
                    "click",
                    () => {

                        selectAnswer(
                            choice,
                            button
                        );

                    }
                );


                choices.appendChild(
                    button
                );

            }
        );


    $("nextQuestionBtn").disabled =
        true;


    $("nextQuestionBtn").textContent =
        quizIndex ===
        reviewData.quiz.length - 1

            ? "Finish Quiz ✨"

            : "Next Question →";
}


/* =========================================================
   SELECT ANSWER
========================================================= */

function selectAnswer(
    answer,
    button
) {

    if (
        selectedAnswer !== null
    ) {
        return;
    }


    selectedAnswer =
        answer;


    const question =
        reviewData.quiz[
            quizIndex
        ];


    const buttons =
        [
            ...document.querySelectorAll(
                "#answerChoices .choice-btn"
            )
        ];


    buttons.forEach(
        btn => {
            btn.disabled = true;
        }
    );


    if (
        answer === question.answer
    ) {

        quizScore++;

        button.classList.add(
            "correct"
        );

    } else {

        button.classList.add(
            "wrong"
        );


        quizWrongItems.push(
            question
        );


        const correctButton =
            buttons.find(
                btn =>
                    btn.dataset.answer ===
                    question.answer
            );


        correctButton?.classList.add(
            "correct"
        );

    }


    $("quizScore").textContent =
        quizScore;


    $("nextQuestionBtn").disabled =
        false;
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

    if (
        selectedAnswer === null
    ) {
        return;
    }


    if (
        quizIndex <
        reviewData.quiz.length - 1
    ) {

        quizIndex++;

        renderQuestion();

        return;
    }


    finishQuiz();
}


/* =========================================================
   FINISH QUIZ
========================================================= */

function finishQuiz() {

    const total =
        reviewData.quiz.length;


    const percentage =
        Math.round(
            (quizScore / total) *
            100
        );


    const wrong =
        total - quizScore;


    /* -----------------------------------------
       SAVE SCORE
    ----------------------------------------- */

    localStorage.setItem(
        "reviewFirstLastScore",

        JSON.stringify({

            score:
                quizScore,

            total,

            percentage,

            date:
                new Date().toISOString()

        })
    );


    /* -----------------------------------------
       SAVE WEAK TOPICS
    ----------------------------------------- */

    const weakTopics =
        quizWrongItems.map(
            question =>
                question.topic ||
                "Review this question"
        );


    localStorage.setItem(
        "reviewFirstWeakTopics",

        JSON.stringify(
            weakTopics
        )
    );


    /* -----------------------------------------
       SHOW RESULTS
    ----------------------------------------- */

    $("quizContent")
        .classList.add(
            "hidden"
        );


    $("quizResult")
        .classList.remove(
            "hidden"
        );


    $("finalScore").textContent =
        `${percentage}%`;


    $("correctAnswers").textContent =
        quizScore;


    $("wrongAnswers").textContent =
        wrong;


    if (percentage >= 80) {

        $("resultMessage").textContent =
            "Amazing! You really know your reviewer. 🌷";

    }

    else if (percentage >= 60) {

        $("resultMessage").textContent =
            "Good work! Review the missed parts once more. 💗";

    }

    else {

        $("resultMessage").textContent =
            "That's okay. Let's use your mistakes to know what to review first. ♡";

    }


    $("quizProgressBar").style.width =
        "100%";


    updateDashboard();

    renderWeakTopics();
}


/* =========================================================
   RESTART QUIZ
========================================================= */

function restartQuiz() {

    startQuiz();

}


/* =========================================================
   WEAK TOPICS
========================================================= */

function renderWeakTopics() {

    const weakTopics =
        JSON.parse(
            localStorage.getItem(
                "reviewFirstWeakTopics"
            ) || "[]"
        );


    const lastScore =
        JSON.parse(
            localStorage.getItem(
                "reviewFirstLastScore"
            ) || "null"
        );


    if (!reviewData.title) {

        $("weakTopicName").textContent =
            "No topic yet";


        $("weakTopicMessage").textContent =
            "Create a reviewer and take a quiz first.";


        $("focusLevel").textContent =
            "—";


        $("weakList").innerHTML =
            emptyWeakHTML();


        return;
    }


    $("weakTopicName").textContent =
        reviewData.title;


    if (!lastScore) {

        $("weakTopicMessage").textContent =
            "Take a quiz to discover your weak areas.";


        $("focusLevel").textContent =
            "—";


        $("weakList").innerHTML =
            emptyWeakHTML();


        return;
    }


    const percentage =
        lastScore.percentage;


    $("focusLevel").textContent =
        percentage >= 80
            ? "Low"
            : percentage >= 60
                ? "Medium"
                : "High";


    $("weakTopicMessage").textContent =
        weakTopics.length

            ? `You missed ${weakTopics.length} question${weakTopics.length === 1 ? "" : "s"}. These are your current review areas.`

            : "No missed questions in your latest quiz. Great job! ♡";


    if (!weakTopics.length) {

        $("weakList").innerHTML = `

            <div class="empty-state">

                <div>🌟</div>

                <h3>
                    No weak topics right now
                </h3>

                <p>
                    You answered everything correctly in your latest quiz.
                </p>

            </div>

        `;

        return;
    }


    const counts = {};


    weakTopics.forEach(
        topic => {

            counts[topic] =
                (counts[topic] || 0) + 1;

        }
    );


    $("weakList").innerHTML =

        Object.entries(counts)

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )

            .map(
                ([topic, count]) => `

                    <div class="weak-item">

                        <div>

                            <strong>
                                ${escapeHTML(topic)}
                            </strong>

                            <p>
                                Review this part again before your next quiz.
                            </p>

                        </div>

                        <span>
                            ${count}
                            miss${count === 1 ? "" : "es"}
                        </span>

                    </div>

                `
            )

            .join("");
}


function emptyWeakHTML() {

    return `

        <div class="empty-state">

            <div>🌷</div>

            <h3>
                No weak topics yet
            </h3>

            <p>
                Your weak topics will appear after your quiz.
            </p>

        </div>

    `;

}


/* =========================================================
   STUDY PLANNER
========================================================= */

function setStudyTime(
    minutes,
    button
) {

    studyTime =
        minutes;


    document
        .querySelectorAll(
            ".time-option"
        )
        .forEach(btn => {

            btn.classList.remove(
                "active"
            );

        });


    button?.classList.add(
        "active"
    );


    renderPlanner();
}


function renderPlanner() {

    if (!$("plannerTasks")) {
        return;
    }


    const title =
        reviewData.title ||
        "your current subject";


    let tasks;


    /* -----------------------------------------
       15 MINUTES
    ----------------------------------------- */

    if (studyTime === 15) {

        tasks = [

            [
                "📖",
                "Review your summary",
                "5 minutes"
            ],

            [
                "🃏",
                "Study your flashcards",
                "5 minutes"
            ],

            [
                "📝",
                "Answer a quick quiz",
                "5 minutes"
            ]

        ];

    }


    /* -----------------------------------------
       30 MINUTES
    ----------------------------------------- */

    else if (studyTime === 30) {

        tasks = [

            [
                "📖",
                "Read your summary and key points",
                "8 minutes"
            ],

            [
                "🃏",
                "Practice the flashcards",
                "10 minutes"
            ],

            [
                "📝",
                "Take the quiz",
                "8 minutes"
            ],

            [
                "💡",
                "Review your mistakes",
                "4 minutes"
            ]

        ];

    }


    /* -----------------------------------------
       1 HOUR
    ----------------------------------------- */

    else {

        tasks = [

            [
                "📖",
                "Study the summary and key points",
                "15 minutes"
            ],

            [
                "💡",
                "Study important terms",
                "10 minutes"
            ],

            [
                "🃏",
                "Practice flashcards",
                "15 minutes"
            ],

            [
                "📝",
                "Take the quiz",
                "10 minutes"
            ],

            [
                "🧠",
                "Review weak topics",
                "10 minutes"
            ]

        ];

    }


    $("plannerTitle").textContent =

        studyTime === 60

            ? "1-Hour Study Plan"

            : `${studyTime}-Minute Study Plan`;


    $("plannerTasks").innerHTML =

        tasks

            .map(
                task => `

                    <div class="planner-task">

                        <span>
                            ${task[0]}
                        </span>

                        <div>

                            <strong>
                                ${task[1]}
                            </strong>

                            <small>
                                ${task[2]}
                            </small>

                        </div>

                    </div>

                `
            )

            .join("");


    if (
        reviewData.title
    ) {

        $("plannerTasks")
            .insertAdjacentHTML(
                "afterbegin",

                `

                <div class="planner-note">

                    💗 Topic:
                    <strong>
                        ${escapeHTML(title)}
                    </strong>

                </div>

                `
            );

    }

}


function markPlanDone() {

    const completed =

        Number(
            localStorage.getItem(
                "reviewFirstStudySessions"
            ) || 0
        ) + 1;


    localStorage.setItem(
        "reviewFirstStudySessions",
        completed
    );


    showToast(
        `Study plan started! Session ${completed} is saved. 🌷`
    );

}


/* =========================================================
   ACTIVITIES / REMINDERS
========================================================= */

function openActivityModal() {

    $("activityModal")
        ?.classList.add(
            "show"
        );


    setTimeout(() => {

        $("activityName")
            ?.focus();

    }, 100);

}


function closeActivityModal() {

    $("activityModal")
        ?.classList.remove(
            "show"
        );

}


function saveActivity() {

    const name =
        $("activityName")?.value.trim();

    const date =
        $("activityDate")?.value;

    const time =
        $("activityTime")?.value;

    const reminder =
        Number(
            $("activityReminder")?.value || 0
        );


    if (!name || !date) {

        showToast(
            "Please add an activity name and date. 🔔"
        );

        return;
    }


    const item = {

        id:
            Date.now(),

        name,

        date,

        time,

        reminder,

        completed:
            false

    };


    activities.push(item);


    activities.sort(
        (a, b) =>

            `${a.date} ${a.time || "00:00"}`
                .localeCompare(
                    `${b.date} ${b.time || "00:00"}`
                )
    );


    localStorage.setItem(
        "reviewFirstActivities",
        JSON.stringify(
            activities
        )
    );


    if ($("activityName")) {
        $("activityName").value = "";
    }

    if ($("activityDate")) {
        $("activityDate").value = "";
    }

    if ($("activityTime")) {
        $("activityTime").value = "";
    }


    closeActivityModal();

    renderActivities();

    updateDashboard();


    showToast(
        "Activity saved. You got this! 💗"
    );

}


function renderActivities(
    filter = "all"
) {

    if (!$("activitiesList")) {
        return;
    }


    const now =
        new Date();


    const today =
        formatDateInput(now);


    const tomorrowDate =
        new Date(now);


    tomorrowDate.setDate(
        tomorrowDate.getDate() + 1
    );


    const tomorrow =
        formatDateInput(
            tomorrowDate
        );


    let list =
        [...activities];


    if (filter === "today") {

        list =
            list.filter(
                activity =>
                    activity.date === today &&
                    !activity.completed
            );

    }


    if (filter === "tomorrow") {

        list =
            list.filter(
                activity =>
                    activity.date === tomorrow &&
                    !activity.completed
            );

    }


    if (filter === "upcoming") {

        list =
            list.filter(
                activity =>
                    activity.date >= today &&
                    !activity.completed
            );

    }


    if (filter === "completed") {

        list =
            list.filter(
                activity =>
                    activity.completed
            );

    }


    if (!list.length) {

        $("activitiesList").innerHTML = `

            <div class="empty-state">

                <div>🌷</div>

                <h3>
                    No activities here
                </h3>

                <p>
                    Add your school tasks so you don't forget them.
                </p>

            </div>

        `;

    }

    else {

        $("activitiesList").innerHTML =

            list

                .map(
                    activity => `

                        <div class="activity-item ${activity.completed ? "completed" : ""}">

                            <div>

                                <strong>
                                    ${escapeHTML(activity.name)}
                                </strong>

                                <p>
                                    📅
                                    ${escapeHTML(
                                        formatDisplayDate(
                                            activity.date
                                        )
                                    )}

                                    ${
                                        activity.time
                                            ? ` • ⏰ ${escapeHTML(
                                                formatTime(
                                                    activity.time
                                                )
                                            )}`
                                            : ""
                                    }

                                </p>

                            </div>

                            <button
                                class="secondary-btn"
                                onclick="toggleActivity(${activity.id})"
                            >

                                ${
                                    activity.completed
                                        ? "Undo"
                                        : "✓ Done"
                                }

                            </button>

                        </div>

                    `
                )

                .join("");

    }


    updateActivityBadge();

    renderDashboardActivities();
}


function filterActivities(
    filter,
    button
) {

    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(btn => {

            btn.classList.remove(
                "active"
            );

        });


    button?.classList.add(
        "active"
    );


    renderActivities(
        filter
    );
}


function toggleActivity(id) {

    const item =
        activities.find(
            activity =>
                activity.id === id
        );


    if (!item) {
        return;
    }


    item.completed =
        !item.completed;


    localStorage.setItem(
        "reviewFirstActivities",
        JSON.stringify(
            activities
        )
    );


    renderActivities();

    updateDashboard();

}


function updateActivityBadge() {

    const today =
        formatDateInput(
            new Date()
        );


    const count =
        activities.filter(
            activity =>
                !activity.completed &&
                activity.date >= today
        ).length;


    if ($("activityBadge")) {

        $("activityBadge").textContent =
            count;

    }

}


function renderDashboardActivities() {

    if (!$("dashboardActivities")) {
        return;
    }


    const today =
        formatDateInput(
            new Date()
        );


    const upcoming =

        activities

            .filter(
                activity =>
                    !activity.completed &&
                    activity.date >= today
            )

            .sort(
                (a, b) =>
                    `${a.date} ${a.time || "00:00"}`
                        .localeCompare(
                            `${b.date} ${b.time || "00:00"}`
                        )
            )

            .slice(0, 3);


    if (!upcoming.length) {

        $("dashboardActivities").innerHTML = `

            <div class="empty-state small">

                <div>🌷</div>

                <p>
                    No upcoming activities yet.
                </p>

            </div>

        `;

        return;
    }


    $("dashboardActivities").innerHTML =

        upcoming

            .map(
                activity => `

                    <div class="activity-preview-item">

                        <strong>
                            ${escapeHTML(
                                activity.name
                            )}
                        </strong>

                        <span>

                            ${escapeHTML(
                                formatDisplayDate(
                                    activity.date
                                )
                            )}

                            ${
                                activity.time
                                    ? ` • ${escapeHTML(
                                        formatTime(
                                            activity.time
                                        )
                                    )}`
                                    : ""
                            }

                        </span>

                    </div>

                `
            )

            .join("");
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    if (!$("currentTopic")) {
        return;
    }


    $("currentTopic").textContent =
        reviewData.title ||
        "None yet";


    const weak =
        JSON.parse(
            localStorage.getItem(
                "reviewFirstWeakTopics"
            ) || "[]"
        );


    $("weakCount").textContent =
        weak.length;


    const lastScore =
        JSON.parse(
            localStorage.getItem(
                "reviewFirstLastScore"
            ) || "null"
        );


    $("lastScore").textContent =

        lastScore
            ? `${lastScore.percentage}%`
            : "—";


    const today =
        formatDateInput(
            new Date()
        );


    $("upcomingCount").textContent =

        activities.filter(
            activity =>
                !activity.completed &&
                activity.date >= today
        ).length;


    renderDashboardActivities();

    updateActivityBadge();
}


/* =========================================================
   GREETING
========================================================= */

function updateGreeting() {

    const hour =
        new Date().getHours();


    let greeting =
        "Good evening 🌷";


    if (hour < 12) {

        greeting =
            "Good morning 🌷";

    }

    else if (hour < 18) {

        greeting =
            "Good afternoon 🌷";

    }


    if ($("helloText")) {

        $("helloText").textContent =
            greeting;

    }

}


/* =========================================================
   DATE
========================================================= */

function updateDate() {

    if (!$("currentDate")) {
        return;
    }


    $("currentDate").textContent =

        new Date().toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function formatDateInput(date) {

    const y =
        date.getFullYear();


    const m =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const d =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${y}-${m}-${d}`;
}


function formatDisplayDate(value) {

    const date =
        new Date(
            `${value}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatTime(value) {

    const [
        hour,
        minute
    ] =
        value
            .split(":")
            .map(Number);


    const date =
        new Date();


    date.setHours(
        hour,
        minute,
        0,
        0
    );


    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const container =
        $("toastContainer");


    if (!container) {
        return;
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast";


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () =>
            toast.classList.add(
                "show"
            ),
        20
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () =>
                    toast.remove(),
                300
            );

        },
        3000
    );
}


/* =========================================================
   SECURITY / HTML HELPER
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


/* =========================================================
   OLD FUNCTION COMPATIBILITY
========================================================= */

/*
   These functions stay here temporarily so that
   any old button or saved HTML does not produce
   "function not defined" errors.

   Upload Notes itself is no longer used.
*/


function startMagicReview() {

    createMyReviewer();

}


function removeFile() {

    const input =
        $("fileInput");


    if (input) {
        input.value = "";
    }

}


function handleFile() {

    showToast(
        "Upload Notes has been replaced with Create Reviewer. ✍️"
    );

}