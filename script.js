/* =========================================================
   REVIEWFIRST
   Main JavaScript
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentFile = null;
let extractedText = "";

let reviewData = {
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
let quizWrongQuestions = [];

let studyMinutes = 15;

let activities = JSON.parse(
    localStorage.getItem("reviewfirstActivities") || "[]"
);


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeDate();

    initializeUploadDropZone();

    loadUser();

    renderActivities();

    updateDashboard();

    requestNotificationPermission();

    checkReminderTimers();

    setInterval(checkReminderTimers, 30000);

});


/* =========================================================
   USER / PROFILE
========================================================= */

function loadUser() {

    const savedName = localStorage.getItem("reviewfirstName");

    if (savedName) {

        applyName(savedName);

        document.getElementById("welcomeScreen").classList.remove("active");
        document.getElementById("profileScreen").classList.remove("active");

        document.getElementById("appScreen").classList.add("active");

    } else {

        document.getElementById("welcomeScreen").classList.add("active");

    }

}


function showProfileSetup() {

    document.getElementById("welcomeScreen").classList.remove("active");

    document.getElementById("profileScreen").classList.add("active");

    setTimeout(() => {
        document.getElementById("nameInput").focus();
    }, 300);

}


function saveName() {

    const input = document.getElementById("nameInput");

    let name = input.value.trim();

    if (!name) {

        showToast(
            "Please enter your name 🌷",
            "We need your name to personalize ReviewFirst."
        );

        return;
    }

    localStorage.setItem("reviewfirstName", name);

    applyName(name);

    document.getElementById("profileScreen").classList.remove("active");

    document.getElementById("appScreen").classList.add("active");

    updateDashboard();

    showToast(
        `Welcome, ${name}! ♡`,
        "Your study space is ready."
    );

}


function applyName(name) {

    document.getElementById("dashboardName").textContent = name;
    document.getElementById("sidebarName").textContent = name;

    const hour = new Date().getHours();

    let greeting = "Good evening";

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 18) {
        greeting = "Good afternoon";
    }

    document.getElementById("helloText").textContent =
        `${greeting}, ${name} 🌷`;

}


function openProfileModal() {

    const savedName =
        localStorage.getItem("reviewfirstName") || "";

    document.getElementById("editNameInput").value = savedName;

    document.getElementById("profileModal").classList.add("show");

}


function closeProfileModal() {

    document.getElementById("profileModal").classList.remove("show");

}


function changeName() {

    const input =
        document.getElementById("editNameInput");

    const name = input.value.trim();

    if (!name) {

        showToast(
            "Name cannot be empty ♡",
            "Please enter a name."
        );

        return;
    }

    localStorage.setItem("reviewfirstName", name);

    applyName(name);

    closeProfileModal();

    showToast(
        "Profile updated 🌷",
        `I'll call you ${name} from now on.`
    );

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId, clickedButton = null) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active-page");
    }

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (clickedButton) {

        clickedButton.classList.add("active");

    } else {

        const matchingButton =
            document.querySelector(
                `.nav-btn[onclick*="${pageId}"]`
            );

        if (matchingButton) {
            matchingButton.classList.add("active");
        }

    }

    document.querySelector(".sidebar")?.classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function toggleSidebar() {

    document
        .querySelector(".sidebar")
        .classList.toggle("open");

}


/* =========================================================
   DATE
========================================================= */

function initializeDate() {

    const now = new Date();

    document.getElementById("currentDate").textContent =
        now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

}


/* =========================================================
   UPLOAD
========================================================= */

function initializeUploadDropZone() {

    const dropZone =
        document.getElementById("dropZone");

    if (!dropZone) return;

    ["dragenter", "dragover"].forEach(eventName => {

        dropZone.addEventListener(eventName, event => {

            event.preventDefault();

            dropZone.classList.add("dragging");

        });

    });

    ["dragleave", "drop"].forEach(eventName => {

        dropZone.addEventListener(eventName, event => {

            event.preventDefault();

            dropZone.classList.remove("dragging");

        });

    });


    dropZone.addEventListener("drop", event => {

        const file = event.dataTransfer.files[0];

        if (file) {
            handleFile(file);
        }

    });

}


function handleFile(file) {

    if (!file) return;

    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
        "text/plain",
        "image/jpeg",
        "image/png"
    ];

    const extension =
        file.name.split(".").pop().toLowerCase();

    const allowedExtensions =
        ["pdf", "docx", "pptx", "ppt", "txt", "jpg", "jpeg", "png"];

    if (
        !allowedTypes.includes(file.type) &&
        !allowedExtensions.includes(extension)
    ) {

        showToast(
            "File not supported ♡",
            "Please upload PDF, DOCX, PPTX, TXT, JPG, or PNG."
        );

        return;
    }

    currentFile = file;

    document.getElementById("fileName").textContent =
        file.name;

    document.getElementById("fileSize").textContent =
        formatFileSize(file.size);

    document
        .getElementById("selectedFile")
        .classList.remove("hidden");

    document
        .getElementById("magicReviewBtn")
        .classList.remove("hidden");

}


function removeFile() {

    currentFile = null;

    extractedText = "";

    document
        .getElementById("selectedFile")
        .classList.add("hidden");

    document
        .getElementById("magicReviewBtn")
        .classList.add("hidden");

    document.getElementById("fileInput").value = "";

}


function formatFileSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";

}


/* =========================================================
   MAGIC REVIEW
========================================================= */

async function startMagicReview() {

    if (!currentFile) {

        showToast(
            "Upload something first 📚",
            "Choose your notes before starting Magic Review."
        );

        return;
    }

    const processingBox =
        document.getElementById("processingBox");

    const magicBtn =
        document.getElementById("magicReviewBtn");

    processingBox.classList.remove("hidden");
    magicBtn.classList.add("hidden");

    const progressBar =
        document.getElementById("progressBar");

    const title =
        document.getElementById("processingTitle");

    const text =
        document.getElementById("processingText");

    try {

        progressBar.style.width = "10%";

        title.textContent = "Opening your material...";
        text.textContent = "ReviewFirst is preparing your file. ♡";

        await sleep(500);

        progressBar.style.width = "30%";

        title.textContent = "Reading your notes...";
        text.textContent = "Looking for the important information.";

        extractedText =
            await extractTextFromFile(currentFile);

        if (!extractedText || extractedText.trim().length < 30) {

            throw new Error(
                "Not enough readable text was found."
            );

        }

        progressBar.style.width = "60%";

        title.textContent = "Understanding your topic...";
        text.textContent =
            "Creating a summary based on your uploaded material.";

        await sleep(700);

        reviewData =
            buildReview(extractedText, currentFile.name);

        progressBar.style.width = "85%";

        title.textContent = "Building your reviewer...";
        text.textContent =
            "Preparing key points, terms, flashcards, and quiz questions.";

        await sleep(700);

        progressBar.style.width = "100%";

        await sleep(500);

        saveReview();

        renderReviewer();

        renderQuiz();

        renderWeakTopics();

        renderPlanner();

        updateDashboard();

        processingBox.classList.add("hidden");

        showPage("reviewerPage");

        showToast(
            "Magic Review is ready! ✨",
            `I created a reviewer from ${currentFile.name}.`
        );

    } catch (error) {

        console.error(error);

        processingBox.classList.add("hidden");

        magicBtn.classList.remove("hidden");

        showToast(
            "I couldn't read that file ♡",
            error.message ||
            "Try uploading a clearer file."
        );

    }

}


/* =========================================================
   FILE EXTRACTION
========================================================= */

async function extractTextFromFile(file) {

    const extension =
        file.name.split(".").pop().toLowerCase();


    /* TEXT */

    if (extension === "txt") {

        return await file.text();

    }


    /* IMAGE OCR */

    if (
        ["jpg", "jpeg", "png"].includes(extension)
    ) {

        return await extractImageText(file);

    }


    /* PDF */

    if (extension === "pdf") {

        return await extractPDFText(file);

    }


    /* DOCX */

    if (extension === "docx") {

        return await extractDOCXText(file);

    }


    /* PPTX */

    if (extension === "pptx") {

        return await extractPPTXText(file);

    }


    throw new Error(
        "This file format is not supported."
    );

}


/* =========================================================
   IMAGE OCR
========================================================= */

async function extractImageText(file) {

    const result =
        await Tesseract.recognize(
            file,
            "eng",
            {
                logger: message => {

                    if (
                        message.status === "recognizing text" &&
                        message.progress
                    ) {

                        const percent =
                            Math.round(
                                message.progress * 100
                            );

                        document.getElementById(
                            "progressBar"
                        ).style.width =
                            Math.min(55, percent) + "%";

                    }

                }
            }
        );

    return result.data.text;

}


/* =========================================================
   PDF
========================================================= */

async function extractPDFText(file) {

    const arrayBuffer =
        await file.arrayBuffer();

    const pdf =
        await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

    let text = "";

    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {

        const page =
            await pdf.getPage(pageNumber);

        const content =
            await page.getTextContent();

        const pageText =
            content.items
                .map(item => item.str)
                .join(" ");

        text += "\n" + pageText;

    }

    return text;

}


/* =========================================================
   DOCX
========================================================= */

async function extractDOCXText(file) {

    const arrayBuffer =
        await file.arrayBuffer();

    const result =
        await mammoth.extractRawText({
            arrayBuffer
        });

    return result.value;

}


/* =========================================================
   PPTX
========================================================= */

async function extractPPTXText(file) {

    const arrayBuffer =
        await file.arrayBuffer();

    const zip =
        await JSZip.loadAsync(arrayBuffer);

    let allText = "";

    const slideFiles =
        Object.keys(zip.files)
            .filter(path =>
                /^ppt\/slides\/slide\d+\.xml$/.test(path)
            )
            .sort((a, b) => {

                const numA =
                    parseInt(
                        a.match(/slide(\d+)/)[1]
                    );

                const numB =
                    parseInt(
                        b.match(/slide(\d+)/)[1]
                    );

                return numA - numB;

            });


    for (const slidePath of slideFiles) {

        const xml =
            await zip
                .file(slidePath)
                .async("text");

        const parser =
            new DOMParser();

        const xmlDoc =
            parser.parseFromString(
                xml,
                "application/xml"
            );

        const textNodes =
            [...xmlDoc.getElementsByTagName("a:t")];

        const slideText =
            textNodes
                .map(node => node.textContent)
                .join(" ");

        allText += "\n" + slideText;

    }

    return allText;

}


/* =========================================================
   REVIEW GENERATOR
========================================================= */

function buildReview(text, fileName) {

    const cleanText =
        cleanExtractedText(text);

    const sentences =
        splitSentences(cleanText);

    const title =
        detectTopic(cleanText, fileName);

    const keyPoints =
        generateKeyPoints(sentences);

    const terms =
        extractImportantTerms(cleanText, sentences);

    const summary =
        generateSummary(sentences, keyPoints);

    const flashcards =
        generateFlashcards(keyPoints, terms, sentences);

    const quiz =
        generateQuiz(keyPoints, terms, sentences);

    return {
        title,
        summary,
        keyPoints,
        terms,
        flashcards,
        quiz
    };

}


/* =========================================================
   TEXT CLEANING
========================================================= */

function cleanExtractedText(text) {

    return text
        .replace(/\r/g, " ")
        .replace(/\t/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .trim();

}


function splitSentences(text) {

    return text
        .split(/(?<=[.!?])\s+/)
        .map(sentence => sentence.trim())
        .filter(sentence =>
            sentence.length >= 35
        );

}


/* =========================================================
   TOPIC DETECTION
========================================================= */

function detectTopic(text, fileName) {

    const cleanedName =
        fileName
            .replace(/\.[^/.]+$/, "")
            .replace(/[_-]/g, " ")
            .trim();

    const genericNames = [
        "notes",
        "note",
        "document",
        "file",
        "image",
        "screenshot",
        "review",
        "reviewer"
    ];

    if (
        cleanedName &&
        !genericNames.includes(
            cleanedName.toLowerCase()
        )
    ) {

        return titleCase(cleanedName);

    }


    const firstLines =
        text
            .split(/[.!?\n]/)
            .map(x => x.trim())
            .filter(x =>
                x.length >= 5 &&
                x.length <= 100
            );

    if (firstLines.length > 0) {

        return titleCase(
            firstLines[0]
                .replace(/^(chapter|lesson|topic)\s*\d*[:.-]?\s*/i, "")
                .trim()
        );

    }

    return "Your Study Topic";

}


/* =========================================================
   SUMMARY
========================================================= */

function generateSummary(sentences, keyPoints) {

    if (!sentences.length) {

        return "There was not enough readable text to create a summary.";

    }

    /*
        This is an extractive summarizer.

        Instead of inventing information, it selects
        important sentences directly from the uploaded
        material.
    */

    const scored =
        sentences.map((sentence, index) => {

            let score = 0;

            const lower =
                sentence.toLowerCase();

            if (
                /\b(is|are|means|refers to|defined as|known as)\b/
                    .test(lower)
            ) {
                score += 3;
            }

            if (
                /\b(because|therefore|important|main|purpose|function|process|used|helps|includes)\b/
                    .test(lower)
            ) {
                score += 2;
            }

            if (
                /\b(first|second|third|finally|however|for example)\b/
                    .test(lower)
            ) {
                score += 1;
            }

            if (sentence.length >= 60) {
                score += 1;
            }

            if (index < 5) {
                score += 1;
            }

            return {
                sentence,
                score,
                index
            };

        });


    const selected =
        scored
            .sort((a, b) => b.score - a.score)
            .slice(
                0,
                Math.min(
                    6,
                    Math.max(3, Math.ceil(sentences.length / 8))
                )
            )
            .sort((a, b) => a.index - b.index)
            .map(item => item.sentence);


    return selected.join(" ");

}


/* =========================================================
   KEY POINTS
========================================================= */

function generateKeyPoints(sentences) {

    if (!sentences.length) {
        return [];
    }

    const scored =
        sentences.map((sentence, index) => {

            let score = 0;

            const lower =
                sentence.toLowerCase();

            const importantWords = [
                "important",
                "main",
                "purpose",
                "function",
                "process",
                "definition",
                "means",
                "refers",
                "because",
                "therefore",
                "includes",
                "example",
                "used",
                "helps",
                "causes",
                "result"
            ];

            importantWords.forEach(word => {

                if (lower.includes(word)) {
                    score++;
                }

            });

            if (index < 7) {
                score += 1;
            }

            return {
                sentence,
                score
            };

        });


    return scored
        .sort((a, b) => b.score - a.score)
        .slice(
            0,
            Math.min(8, sentences.length)
        )
        .map(item => item.sentence);

}


/* =========================================================
   TERMS
========================================================= */

function extractImportantTerms(text, sentences) {

    const terms = [];

    /*
        First look for definition patterns:
        "X is..."
        "X refers to..."
        "X means..."
    */

    sentences.forEach(sentence => {

        let match =
            sentence.match(
                /^([A-Z][A-Za-z0-9\s-]{2,40})\s+(?:is|are|refers to|means|is defined as)\s+(.{15,150})/i
            );

        if (match) {

            const term =
                match[1].trim();

            const definition =
                match[2]
                    .replace(/[.;].*$/, "")
                    .trim();

            if (
                term.length >= 3 &&
                term.split(" ").length <= 7
            ) {

                terms.push({
                    term,
                    definition
                });

            }

        }

    });


    /*
        If definitions were not found,
        use frequent meaningful words.
    */

    if (terms.length < 4) {

        const words =
            text
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, " ")
                .split(/\s+/)
                .filter(word =>
                    word.length >= 5
                );

        const stopWords = new Set([
            "about",
            "which",
            "there",
            "their",
            "these",
            "those",
            "where",
            "while",
            "would",
            "could",
            "should",
            "because",
            "through",
            "using",
            "between",
            "other",
            "being",
            "after",
            "before",
            "during",
            "also",
            "than",
            "from",
            "with",
            "that",
            "this",
            "they",
            "them",
            "have",
            "has",
            "into",
            "when",
            "what",
            "your",
            "more",
            "some",
            "such"
        ]);

        const frequency = {};

        words.forEach(word => {

            if (!stopWords.has(word)) {

                frequency[word] =
                    (frequency[word] || 0) + 1;

            }

        });


        const commonWords =
            Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);


        commonWords.forEach(([word]) => {

            const sentence =
                sentences.find(s =>
                    s.toLowerCase().includes(word)
                );

            if (sentence) {

                terms.push({
                    term: titleCase(word),
                    definition: shortenSentence(sentence, 150)
                });

            }

        });

    }


    const unique = [];

    terms.forEach(item => {

        if (
            !unique.some(
                x =>
                    x.term.toLowerCase() ===
                    item.term.toLowerCase()
            )
        ) {

            unique.push(item);

        }

    });

    return unique.slice(0, 8);

}


/* =========================================================
   FLASHCARDS
========================================================= */

function generateFlashcards(
    keyPoints,
    terms,
    sentences
) {

    const cards = [];


    terms.slice(0, 5).forEach(term => {

        cards.push({
            question: `What is ${term.term}?`,
            answer: term.definition
        });

    });


    keyPoints.slice(0, 5).forEach(point => {

        if (cards.length >= 10) return;

        cards.push({
            question: "What is an important idea from this topic?",
            answer: point
        });

    });


    if (!cards.length && sentences.length) {

        sentences.slice(0, 5).forEach(sentence => {

            cards.push({
                question: "What should you remember from this?",
                answer: sentence
            });

        });

    }


    return cards.slice(0, 10);

}


/* =========================================================
   QUIZ GENERATOR
========================================================= */

function generateQuiz(
    keyPoints,
    terms,
    sentences
) {

    const questions = [];


    /*
        Definition questions
    */

    terms.slice(0, 5).forEach(term => {

        const correct =
            term.definition;

        const distractors =
            terms
                .filter(
                    other =>
                        other.term !== term.term
                )
                .map(other =>
                    other.definition
                )
                .slice(0, 3);


        if (distractors.length >= 2) {

            questions.push({
                question:
                    `Which statement best describes ${term.term}?`,

                choices: shuffle([
                    correct,
                    ...distractors
                ]).slice(0, 4),

                answer: correct
            });

        }

    });


    /*
        Key point questions
    */

    keyPoints.slice(0, 5).forEach(point => {

        if (questions.length >= 8) return;

        const correct =
            point;

        const otherPoints =
            keyPoints
                .filter(p => p !== point)
                .slice(0, 3);


        if (otherPoints.length >= 2) {

            questions.push({
                question:
                    "Which statement is supported by the uploaded material?",

                choices: shuffle([
                    correct,
                    ...otherPoints
                ]).slice(0, 4),

                answer: correct
            });

        }

    });


    return questions.slice(0, 8);

}


/* =========================================================
   REVIEWER RENDER
========================================================= */

function renderReviewer() {

    document.getElementById("reviewerEmpty")
        .classList.add("hidden");

    document.getElementById("reviewerContent")
        .classList.remove("hidden");

    document.getElementById("reviewerTitle")
        .textContent =
        reviewData.title;

    document.getElementById("reviewerSubtitle")
        .textContent =
        `${reviewData.keyPoints.length} key points • ${reviewData.terms.length} important terms`;

    document.getElementById("summaryContent")
        .textContent =
        reviewData.summary;

    const keyPointsList =
        document.getElementById("keyPointsList");

    keyPointsList.innerHTML = "";

    reviewData.keyPoints.forEach(point => {

        const li =
            document.createElement("li");

        li.textContent = point;

        keyPointsList.appendChild(li);

    });


    const termsList =
        document.getElementById("termsList");

    termsList.innerHTML = "";

    reviewData.terms.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "term-card";

        card.innerHTML = `
            <strong>${escapeHTML(item.term)}</strong>
            <p>${escapeHTML(item.definition)}</p>
        `;

        termsList.appendChild(card);

    });


    currentFlashcard = 0;

    renderFlashcard();

}


function saveReview() {

    localStorage.setItem(
        "reviewfirstReview",
        JSON.stringify(reviewData)
    );

}


function loadSavedReview() {

    const saved =
        localStorage.getItem(
            "reviewfirstReview"
        );

    if (!saved) return;

    try {

        reviewData =
            JSON.parse(saved);

        renderReviewer();

        renderQuiz();

        renderWeakTopics();

        renderPlanner();

    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   REVIEW TABS
========================================================= */

function showReviewTab(tabId, button) {

    document
        .querySelectorAll(".review-tab-content")
        .forEach(tab =>
            tab.classList.remove("active")
        );

    document
        .querySelectorAll(".review-tab")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    document
        .getElementById(tabId)
        .classList.add("active");

    button.classList.add("active");

}


/* =========================================================
   FLASHCARDS
========================================================= */

function renderFlashcard() {

    const card =
        reviewData.flashcards[currentFlashcard];

    if (!card) return;

    const flashcard =
        document.getElementById("flashcard");

    flashcard.classList.remove("flipped");

    document.getElementById(
        "flashcardQuestion"
    ).textContent =
        card.question;

    document.getElementById(
        "flashcardAnswer"
    ).textContent =
        card.answer;

    document.getElementById(
        "flashcardCounter"
    ).textContent =
        `${currentFlashcard + 1} / ${reviewData.flashcards.length}`;

}


function flipFlashcard() {

    document
        .getElementById("flashcard")
        .classList.toggle("flipped");

}


function nextFlashcard() {

    if (!reviewData.flashcards.length) return;

    currentFlashcard++;

    if (
        currentFlashcard >=
        reviewData.flashcards.length
    ) {
        currentFlashcard = 0;
    }

    renderFlashcard();

}


function previousFlashcard() {

    if (!reviewData.flashcards.length) return;

    currentFlashcard--;

    if (currentFlashcard < 0) {

        currentFlashcard =
            reviewData.flashcards.length - 1;

    }

    renderFlashcard();

}


/* =========================================================
   QUIZ
========================================================= */

function renderQuiz() {

    if (!reviewData.quiz ||
        !reviewData.quiz.length) {

        document
            .getElementById("quizEmpty")
            .classList.remove("hidden");

        document
            .getElementById("quizContent")
            .classList.add("hidden");

        return;
    }

    document
        .getElementById("quizEmpty")
        .classList.add("hidden");

    document
        .getElementById("quizResult")
        .classList.add("hidden");

    document
        .getElementById("quizContent")
        .classList.remove("hidden");

    startQuiz();

}


function startQuiz() {

    quizIndex = 0;
    quizScore = 0;
    selectedAnswer = null;
    quizWrongQuestions = [];

    showQuizQuestion();

}


function showQuizQuestion() {

    const quiz =
        reviewData.quiz[quizIndex];

    if (!quiz) return;

    selectedAnswer = null;

    document.getElementById(
        "questionNumber"
    ).textContent =
        `Question ${quizIndex + 1} of ${reviewData.quiz.length}`;

    document.getElementById(
        "quizScore"
    ).textContent =
        quizScore;

    document.getElementById(
        "quizTopicLabel"
    ).textContent =
        reviewData.title;

    document.getElementById(
        "questionText"
    ).textContent =
        quiz.question;


    const choices =
        document.getElementById(
            "answerChoices"
        );

    choices.innerHTML = "";


    quiz.choices.forEach(choice => {

        const button =
            document.createElement("button");

        button.className = "choice-btn";

        button.textContent = choice;

        button.onclick = () =>
            selectAnswer(button, choice);

        choices.appendChild(button);

    });


    document.getElementById(
        "nextQuestionBtn"
    ).disabled = true;

    document.getElementById(
        "quizProgressBar"
    ).style.width =
        `${((quizIndex + 1) / reviewData.quiz.length) * 100}%`;

}


function selectAnswer(button, choice) {

    if (selectedAnswer !== null) return;

    selectedAnswer = choice;

    const quiz =
        reviewData.quiz[quizIndex];

    document
        .querySelectorAll(".choice-btn")
        .forEach(btn => {

            btn.disabled = true;

            if (
                btn.textContent ===
                quiz.answer
            ) {

                btn.classList.add("correct");

            }

        });


    if (choice === quiz.answer) {

        button.classList.add("correct");

        quizScore++;

    } else {

        button.classList.add("wrong");

        quizWrongQuestions.push(quiz);

    }


    document.getElementById(
        "quizScore"
    ).textContent =
        quizScore;

    document.getElementById(
        "nextQuestionBtn"
    ).disabled = false;

}


function nextQuestion() {

    quizIndex++;

    if (
        quizIndex >=
        reviewData.quiz.length
    ) {

        finishQuiz();

        return;
    }

    showQuizQuestion();

}


function finishQuiz() {

    const total =
        reviewData.quiz.length;

    const percentage =
        Math.round(
            (quizScore / total) * 100
        );

    document
        .getElementById("quizContent")
        .classList.add("hidden");

    document
        .getElementById("quizResult")
        .classList.remove("hidden");

    document.getElementById(
        "finalScore"
    ).textContent =
        percentage + "%";

    document.getElementById(
        "correctAnswers"
    ).textContent =
        quizScore;

    document.getElementById(
        "wrongAnswers"
    ).textContent =
        total - quizScore;


    let message =
        "Keep going! Every review session helps. 🌷";

    if (percentage >= 80) {

        message =
            "Amazing! You understand a lot of this topic. ✨";

    } else if (percentage >= 60) {

        message =
            "Good job! A little more review can make it stronger. 💗";

    }


    document.getElementById(
        "resultMessage"
    ).textContent =
        message;


    saveQuizResult(
        percentage,
        quizWrongQuestions
    );

    renderWeakTopics();

    renderPlanner();

    updateDashboard();

}


function restartQuiz() {

    document
        .getElementById("quizResult")
        .classList.add("hidden");

    document
        .getElementById("quizContent")
        .classList.remove("hidden");

    startQuiz();

}


/* =========================================================
   QUIZ STORAGE
========================================================= */

function saveQuizResult(
    percentage,
    wrongQuestions
) {

    const result = {

        topic: reviewData.title,

        percentage,

        wrongQuestions,

        date: new Date().toISOString()

    };

    localStorage.setItem(
        "reviewfirstQuizResult",
        JSON.stringify(result)
    );

}


/* =========================================================
   WEAK TOPICS
========================================================= */

function renderWeakTopics() {

    const saved =
        localStorage.getItem(
            "reviewfirstQuizResult"
        );

    const weakList =
        document.getElementById("weakList");

    weakList.innerHTML = "";


    if (!saved) {

        weakList.innerHTML = `
            <div class="empty-state">
                <div>🌷</div>
                <h3>No weak topics yet</h3>
                <p>
                    Your weak areas will appear after you take a quiz.
                </p>
            </div>
        `;

        document.getElementById(
            "weakTopicName"
        ).textContent =
            reviewData.title || "No topic yet";

        document.getElementById(
            "focusLevel"
        ).textContent = "—";

        return;

    }


    const result =
        JSON.parse(saved);

    const wrongQuestions =
        result.wrongQuestions || [];

    document.getElementById(
        "weakTopicName"
    ).textContent =
        result.topic;


    let focus = "Light";

    if (result.percentage < 60) {
        focus = "High";
    } else if (result.percentage < 80) {
        focus = "Medium";
    }


    document.getElementById(
        "focusLevel"
    ).textContent =
        focus;


    document.getElementById(
        "weakTopicMessage"
    ).textContent =
        wrongQuestions.length
            ? `You missed ${wrongQuestions.length} question(s). These areas deserve another review.`
            : "You answered everything correctly. Keep practicing to maintain it!";


    if (!wrongQuestions.length) {

        weakList.innerHTML = `
            <div class="empty-state">
                <div>🎉</div>
                <h3>No weak areas detected!</h3>
                <p>
                    You answered all questions correctly.
                </p>
            </div>
        `;

        return;
    }


    wrongQuestions.forEach((question, index) => {

        const item =
            document.createElement("div");

        item.className = "weak-item";

        item.innerHTML = `
            <div class="weak-item-icon">
                🧠
            </div>

            <div class="weak-item-info">
                <strong>Review Question ${index + 1}</strong>
                <p>
                    ${escapeHTML(question.question)}
                </p>
            </div>

            <div class="weak-bar">
                <div style="width: 80%;"></div>
            </div>
        `;

        weakList.appendChild(item);

    });

}


/* =========================================================
   STUDY PLANNER
========================================================= */

function setStudyTime(minutes, button) {

    studyMinutes = minutes;

    document
        .querySelectorAll(".time-option")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    button.classList.add("active");

    renderPlanner();

}


function renderPlanner() {

    const title =
        document.getElementById(
            "plannerTitle"
        );

    const tasks =
        document.getElementById(
            "plannerTasks"
        );

    if (!title || !tasks) return;


    title.textContent =
        studyMinutes === 60
            ? "1-Hour Study Plan"
            : `${studyMinutes}-Minute Study Plan`;


    let plan = [];


    const weakExists =
        localStorage.getItem(
            "reviewfirstQuizResult"
        );


    if (studyMinutes === 15) {

        plan = [

            {
                title: "Quick Review",
                time: "5 min",
                description: "Read your summary."
            },

            {
                title: "Key Points",
                time: "5 min",
                description: "Review the most important ideas."
            },

            {
                title: "Flashcards",
                time: "5 min",
                description: "Test your memory."
            }

        ];

    } else if (studyMinutes === 30) {

        plan = [

            {
                title: "Read Summary",
                time: "7 min",
                description: "Understand the main idea."
            },

            {
                title: "Review Key Points",
                time: "8 min",
                description: "Focus on important concepts."
            },

            {
                title: weakExists
                    ? "Focus on Weak Topics"
                    : "Review Important Terms",
                time: "8 min",
                description: weakExists
                    ? "Spend extra time on missed questions."
                    : "Memorize important vocabulary."
            },

            {
                title: "Flashcards",
                time: "7 min",
                description: "Recall the information without looking."
            }

        ];

    } else {

        plan = [

            {
                title: "Read the Summary",
                time: "10 min",
                description: "Get the big picture first."
            },

            {
                title: "Deep Review",
                time: "15 min",
                description: "Study the key points carefully."
            },

            {
                title: weakExists
                    ? "Weak Topic Practice"
                    : "Important Terms",
                time: "15 min",
                description: weakExists
                    ? "Review the concepts you missed."
                    : "Practice the important terms."
            },

            {
                title: "Flashcards",
                time: "10 min",
                description: "Practice active recall."
            },

            {
                title: "Mini Quiz",
                time: "10 min",
                description: "Check what you remember."
            }

        ];

    }


    tasks.innerHTML = "";


    plan.forEach((task, index) => {

        const item =
            document.createElement("div");

        item.className = "plan-task";

        item.innerHTML = `

            <div class="plan-task-number">
                ${index + 1}
            </div>

            <div class="plan-task-info">
                <strong>${task.title}</strong>
                <span>${task.description}</span>
            </div>

            <strong>
                ${task.time}
            </strong>

        `;

        tasks.appendChild(item);

    });

}


function markPlanDone() {

    showToast(
        "Study plan started! 🌷",
        "Take it one step at a time. You've got this. ♡"
    );

}


/* =========================================================
   ACTIVITIES
========================================================= */

function openActivityModal() {

    document
        .getElementById("activityModal")
        .classList.add("show");


    const tomorrow =
        new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    document.getElementById(
        "activityDate"
    ).value =
        formatDateInput(tomorrow);


    document.getElementById(
        "activityTime"
    ).value =
        "19:00";


    setTimeout(() => {

        document.getElementById(
            "activityName"
        ).focus();

    }, 200);

}


function closeActivityModal() {

    document
        .getElementById("activityModal")
        .classList.remove("show");

}


function saveActivity() {

    const name =
        document.getElementById(
            "activityName"
        ).value.trim();

    const date =
        document.getElementById(
            "activityDate"
        ).value;

    const time =
        document.getElementById(
            "activityTime"
        ).value;

    const reminder =
        parseInt(
            document.getElementById(
                "activityReminder"
            ).value
        );


    if (!name || !date || !time) {

        showToast(
            "Almost there ♡",
            "Please complete the activity, date, and time."
        );

        return;
    }


    const activityDateTime =
        new Date(
            `${date}T${time}:00`
        );


    if (
        activityDateTime.getTime() <=
        Date.now()
    ) {

        showToast(
            "Choose a future time 🌷",
            "The activity date and time should be in the future."
        );

        return;
    }


    const activity = {

        id:
            Date.now().toString(),

        name,

        date,

        time,

        reminder,

        completed: false,

        notified: false,

        createdAt:
            new Date().toISOString()

    };


    activities.push(activity);

    saveActivities();

    renderActivities();

    updateDashboard();

    closeActivityModal();

    resetActivityForm();

    scheduleActivityReminder(activity);


    showToast(
        "Reminder saved! 🔔",
        `${name} is scheduled for ${formatActivityDate(activity)}.`
    );

}


function resetActivityForm() {

    document.getElementById(
        "activityName"
    ).value = "";

}


/* =========================================================
   ACTIVITY STORAGE
========================================================= */

function saveActivities() {

    localStorage.setItem(
        "reviewfirstActivities",
        JSON.stringify(activities)
    );

}


/* =========================================================
   ACTIVITY RENDER
========================================================= */

let currentActivityFilter = "all";


function renderActivities() {

    const list =
        document.getElementById(
            "activitiesList"
        );

    const dashboard =
        document.getElementById(
            "dashboardActivities"
        );


    if (!list) return;


    const sorted =
        [...activities].sort(
            (a, b) =>
                getActivityDate(a) -
                getActivityDate(b)
        );


    const filtered =
        sorted.filter(
            activity =>
                activityMatchesFilter(
                    activity,
                    currentActivityFilter
                )
        );


    list.innerHTML = "";


    if (!filtered.length) {

        list.innerHTML = `
            <div class="empty-state">
                <div>🌷</div>
                <h3>No activities here</h3>
                <p>
                    Add a school activity or deadline to get started.
                </p>
            </div>
        `;

    } else {

        filtered.forEach(activity => {

            list.appendChild(
                createActivityCard(activity)
            );

        });

    }


    renderDashboardActivities(sorted);

    updateActivityBadge();

}


function renderDashboardActivities(sorted) {

    const container =
        document.getElementById(
            "dashboardActivities"
        );

    if (!container) return;


    const upcoming =
        sorted
            .filter(a => !a.completed)
            .filter(a =>
                getActivityDate(a) >= Date.now()
            )
            .slice(0, 3);


    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-state small">
                <div>🌷</div>
                <p>No upcoming activities yet.</p>
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    upcoming.forEach(activity => {

        container.appendChild(
            createActivityCard(
                activity,
                true
            )
        );

    });

}


function createActivityCard(
    activity,
    dashboard = false
) {

    const card =
        document.createElement("div");

    card.className =
        "activity-card" +
        (activity.completed
            ? " completed"
            : "");


    const activityDate =
        getActivityDate(activity);


    card.innerHTML = `

        <button
            class="activity-check"
            onclick="toggleActivity('${activity.id}')"
            title="Mark complete"
        >
            ${activity.completed ? "✓" : "○"}
        </button>


        <div class="activity-info">

            <strong>
                ${escapeHTML(activity.name)}
            </strong>

            <p>
                🔔 ${reminderText(activity.reminder)}
            </p>

        </div>


        <div class="activity-time">

            <strong>
                ${formatActivityDate(activity)}
            </strong>

            <span>
                ${formatTime(activity.time)}
            </span>

        </div>


        ${
            dashboard
                ? ""
                : `
                <div class="activity-actions">

                    <button
                        class="small-action delete-action"
                        onclick="deleteActivity('${activity.id}')"
                        title="Delete"
                    >
                        🗑
                    </button>

                </div>
                `
        }

    `;

    return card;

}


/* =========================================================
   ACTIVITY FILTER
========================================================= */

function filterActivities(filter, button) {

    currentActivityFilter = filter;

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    button.classList.add("active");

    renderActivities();

}


function activityMatchesFilter(
    activity,
    filter
) {

    const date =
        getActivityDate(activity);

    const now =
        new Date();

    const todayStart =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        ).getTime();

    const tomorrowStart =
        todayStart +
        24 * 60 * 60 * 1000;

    const dayAfterTomorrow =
        tomorrowStart +
        24 * 60 * 60 * 1000;


    if (filter === "completed") {
        return activity.completed;
    }


    if (activity.completed) {
        return false;
    }


    if (filter === "today") {

        return (
            date >= todayStart &&
            date < tomorrowStart
        );

    }


    if (filter === "tomorrow") {

        return (
            date >= tomorrowStart &&
            date < dayAfterTomorrow
        );

    }


    if (filter === "upcoming") {

        return date >= dayAfterTomorrow;

    }


    return true;

}


/* =========================================================
   ACTIVITY ACTIONS
========================================================= */

function toggleActivity(id) {

    const activity =
        activities.find(
            item => item.id === id
        );

    if (!activity) return;

    activity.completed =
        !activity.completed;

    saveActivities();

    renderActivities();

    updateDashboard();


    showToast(
        activity.completed
            ? "Activity completed! 🎉"
            : "Activity marked as active.",
        activity.name
    );

}


function deleteActivity(id) {

    const activity =
        activities.find(
            item => item.id === id
        );

    if (!activity) return;


    activities =
        activities.filter(
            item => item.id !== id
        );

    saveActivities();

    renderActivities();

    updateDashboard();


    showToast(
        "Activity removed.",
        "The reminder has been deleted."
    );

}


/* =========================================================
   REMINDERS
========================================================= */

function requestNotificationPermission() {

    if (
        "Notification" in window &&
        Notification.permission === "default"
    ) {

        /*
            We don't force the permission immediately.
            The browser can ask when needed.
        */

    }

}


function askForNotifications() {

    if (!("Notification" in window)) {

        showToast(
            "Notifications aren't supported.",
            "Your activity will still appear on the dashboard."
        );

        return;

    }


    Notification.requestPermission()
        .then(permission => {

            if (permission === "granted") {

                showToast(
                    "Notifications enabled! 🔔",
                    "ReviewFirst can now remind you."
                );

            }

        });

}


function scheduleActivityReminder(activity) {

    askForNotifications();

    checkSingleReminder(activity);

}


function checkReminderTimers() {

    activities.forEach(activity => {

        checkSingleReminder(activity);

    });

}


function checkSingleReminder(activity) {

    if (activity.completed) return;

    if (activity.notified) return;


    const activityTime =
        getActivityDate(activity);


    const reminderTime =
        activityTime -
        activity.reminder * 60 * 1000;


    const now =
        Date.now();


    /*
        If the reminder time has arrived,
        notify the student.
    */

    if (
        now >= reminderTime &&
        now < activityTime + 60 * 1000
    ) {

        notifyActivity(activity);

    }

}


function notifyActivity(activity) {

    activity.notified = true;

    saveActivities();

    const message =
        `${activity.name} — ${formatTime(activity.time)}`;


    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            "🔔 ReviewFirst Reminder",
            {
                body:
                    `Don't forget: ${message}`,
                icon: ""
            }
        );

    }


    showToast(
        "🔔 Activity Reminder",
        `Don't forget: ${message}`
    );

}


/* =========================================================
   ACTIVITY DATE HELPERS
========================================================= */

function getActivityDate(activity) {

    return new Date(
        `${activity.date}T${activity.time}:00`
    ).getTime();

}


function formatActivityDate(activity) {

    const date =
        new Date(
            `${activity.date}T${activity.time}:00`
        );

    const today =
        new Date();

    const tomorrow =
        new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    if (
        date.toDateString() ===
        today.toDateString()
    ) {

        return "Today";

    }


    if (
        date.toDateString() ===
        tomorrow.toDateString()
    ) {

        return "Tomorrow";

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


function formatTime(time) {

    const [hour, minute] =
        time.split(":");

    const date =
        new Date();

    date.setHours(
        Number(hour),
        Number(minute)
    );

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function reminderText(minutes) {

    if (minutes === 0) {
        return "Reminder at activity time";
    }

    if (minutes === 1440) {
        return "Reminder 1 day before";
    }

    if (minutes === 60) {
        return "Reminder 1 hour before";
    }

    return `Reminder ${minutes} minutes before`;

}


function formatDateInput(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const topic =
        reviewData.title ||
        "None yet";

    document.getElementById(
        "currentTopic"
    ).textContent =
        topic;


    const savedQuiz =
        localStorage.getItem(
            "reviewfirstQuizResult"
        );

    if (savedQuiz) {

        const result =
            JSON.parse(savedQuiz);

        document.getElementById(
            "lastScore"
        ).textContent =
            result.percentage + "%";

    }


    const upcoming =
        activities.filter(
            activity =>
                !activity.completed &&
                getActivityDate(activity) >= Date.now()
        );


    document.getElementById(
        "upcomingCount"
    ).textContent =
        upcoming.length;


    const weak =
        savedQuiz
            ? JSON.parse(savedQuiz)
                .wrongQuestions.length
            : 0;


    document.getElementById(
        "weakCount"
    ).textContent =
        weak;


    updateActivityBadge();

}


function updateActivityBadge() {

    const badge =
        document.getElementById(
            "activityBadge"
        );

    if (!badge) return;

    const count =
        activities.filter(
            activity =>
                !activity.completed &&
                getActivityDate(activity) >= Date.now()
        ).length;

    badge.textContent =
        count;

}


/* =========================================================
   UTILITIES
========================================================= */

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );

}


function shuffle(array) {

    const copy =
        [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];

    }

    return copy;

}


function titleCase(text) {

    return text
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ");

}


function shortenSentence(
    sentence,
    maxLength
) {

    if (sentence.length <= maxLength) {
        return sentence;
    }

    return sentence.substring(
        0,
        maxLength
    ).trim() + "...";

}


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(title, message) {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const toast =
        document.createElement("div");

    toast.className = "toast";

    toast.innerHTML = `
        <strong>${escapeHTML(title)}</strong>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);


    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform =
            "translateX(30px)";

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 4000);

}


/* =========================================================
   INITIAL SAVED REVIEW
========================================================= */

setTimeout(() => {

    loadSavedReview();

    updateDashboard();

}, 100);


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            document.activeElement?.id ===
            "nameInput"
        ) {

            saveName();

        }

    }
);