import { supabase } from './supabase.js';

const letterStyles = ["letter-1", "letter-2", "letter-3"];

const mailboxSeq = [
    "assets/illustrations/mb-1.PNG",
    "assets/illustrations/mb-2.PNG",
    "assets/illustrations/mb-3.PNG",
    "assets/illustrations/mb-4.PNG",
    "assets/illustrations/mb-5.PNG",
    "assets/illustrations/mb-6.PNG",
    "assets/illustrations/mb-7.PNG",
    "assets/illustrations/mb-8.PNG",
    "assets/illustrations/mb-9.PNG",
    "assets/illustrations/mb-10.PNG",
    "assets/illustrations/mb-11.PNG",
    "assets/illustrations/mb-12.PNG",
];

const floralSeq = [
    "assets/illustrations/floral-1.PNG",
    "assets/illustrations/floral-2.PNG",
];

const titleSeq = [
    "assets/illustrations/title-1.PNG",
    "assets/illustrations/title-2.PNG",
];

/* ─── STATE ──────────────────────────────────── */

let isMuted = false;
let animationInterval = null;

/* ─── AUDIO ──────────────────────────────────── */

const writeSnd = new Audio("assets/sounds/writeSnd.mp3");
const closeSnd = new Audio("assets/sounds/closeSnd.mp3");
const openSnd  = new Audio("assets/sounds/openSnd.mp3");

function playSound(audio) {
    if (!isMuted) {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // suppress autoplay errors
    }
}

/* ─── HELPERS ────────────────────────────────── */

function generateId() {
    return Math.random().toString(36).substring(2, 8);
}

function isPage(name) {
    return window.location.pathname.endsWith(name);
}

/* ─── SOUND TOGGLE ───────────────────────────── */

function initSoundBtn() {
    const btn = document.getElementById("soundBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        isMuted = !isMuted;
        const img = btn.querySelector("img");
        img.src = isMuted ? "assets/illustrations/sound-off.PNG" : "assets/illustrations/sound-on.PNG";
        img.alt = isMuted ? "music muted" : "music playing ~";
    });
}

/* ─── HELP MODAL ─────────────────────────────── */

function initHelpBtn() {
    const btn = document.getElementById("helpBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        document.getElementById("helpDialog").showModal();
    });
}

function closeHelp() {
    document.getElementById("helpDialog").close();
}

/* ─── ABOUT MODAL ────────────────────────────── */

function initAboutLink() {
    const link = document.getElementById("aboutLink");
    if (!link) return;
    link.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("aboutDialog").showModal();
    });
}

function closeAbout() {
    document.getElementById("aboutDialog").close();
}

/* ─── ANIMATIONS (home page only) ───────────── */

function startFloralAnimation() {
    const img = document.getElementById("floralVine1");
    if (!img) return;
    let i = 0;
    img.src = floralSeq[i];
    setInterval(() => {
        i = (i + 1) % floralSeq.length;
        img.src = floralSeq[i];
    }, 400);
}

function startTitleAnimation() {
    const img = document.getElementById("title1");
    if (!img) return;
    let i = 0;
    img.src = titleSeq[i];
    setInterval(() => {
        i = (i + 1) % titleSeq.length;
        img.src = titleSeq[i];
    }, 400);
}

function runAnimation(frames, onComplete) {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    const img = document.getElementById("mailboxClosed");
    if (!img) return;
    let i = 1;
    img.src = frames[0];
    if (frames.length === 1) { if (onComplete) onComplete(); return; }
    animationInterval = setInterval(() => {
        img.src = frames[i];
        i++;
        if (i >= frames.length) {
            clearInterval(animationInterval);
            animationInterval = null;
            if (onComplete) onComplete();
        }
    }, 150);
}

/* ─── LETTER DIALOG (home page) ─────────────── */

function chooseLetterStyle() {
    const container = document.querySelector(".letter-container");
    if (!container) return;
    container.classList.remove("letter-1", "letter-2", "letter-3");
    container.classList.add(letterStyles[Math.floor(Math.random() * letterStyles.length)]);
}

async function selectLetter() {
    // Supabase doesn't have a native random-row query, so we:
    // 1. get the total count
    // 2. pick a random offset
    // 3. fetch that one row
    const { count, error: countError } = await supabase
        .from('letters')
        .select('*', { count: 'exact', head: true });
 
    if (countError || count === 0) {
        showLetterError('no letters yet. be the first to write one.');
        return;
    }
 
    const randomOffset = Math.floor(Math.random() * count);
 
    const { data, error } = await supabase
        .from('letters')
        .select('message, from_author')
        .range(randomOffset, randomOffset)
        .single();
 
    if (error || !data) {
        showLetterError('something went wrong. try again.');
        return;
    }
 
    document.getElementById('letterDisplay').textContent = data.message;
    document.getElementById('authorDisplay').textContent = data.from_author || 'anonymous';
    chooseLetterStyle();
}
 
async function openLetterDialog() {
    playSound(openSnd);
    runAnimation(mailboxSeq, async () => {
        document.getElementById('letterDialog').showModal();
        await selectLetter();
    });
}


function closeLetter() {
    document.getElementById("letterDialog").close();
    runAnimation([...mailboxSeq].reverse(), null);
    playSound(closeSnd);
}

/* ─── POST LETTER (post page) ───────────────── */

function setPostLoading(loading) {
    const btn = document.getElementById('postBtn');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'sending...' : 'POST';
}
 
function initPostPage() {
    const postBtn = document.getElementById('postBtn');
    if (!postBtn) return;
 
    postBtn.addEventListener('click', async () => {
        const message     = document.getElementById('letterInput').value.trim();
        const from_author = document.getElementById('authorName').value.trim() || null;
 
        if (!message) {
            alert('you need to write a letter!');
            return;
        }
 
        setPostLoading(true);
 
        const { error } = await supabase
            .from('letters')
            .insert({ message, from_author });
 
        setPostLoading(false);
 
        if (error) {
            alert('something went wrong. your letter was not sent.');
            console.error(error);
            return;
        }
 
        document.getElementById('letterInput').value = '';
        document.getElementById('authorName').value  = '';
 
        const success = document.getElementById('postSuccess');
        if (success) {
            success.classList.add('visible');
            setTimeout(() => success.classList.remove('visible'), 3000);
        }
 
        playSound(writeSnd);
    });
}


/* ─── INIT ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
    initSoundBtn();
    initHelpBtn();
    initAboutLink();

    document.getElementById('closeLetterBtn')?.addEventListener('click', closeLetter);
    document.getElementById('mailboxClosed')?.addEventListener('click', openLetterDialog);

    // home page only
    if (document.getElementById("mailboxClosed")) {
        startFloralAnimation();
        startTitleAnimation();
    }

    // post page only
    if (document.getElementById("postBtn")) {
        initPostPage();
    }
});