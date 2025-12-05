// 1. Decodes the URL so it is not plain text
const API_URL = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4LW5WLWVzbEkyaEpEeER5dG4ta2Z2TUNQZEZOemUxMDFGeT0ucGgtZVJ6VUVPY1R4NUVlcTF2bE56SlVBWVZ6S28vZXhlYw==');

// ============================================
// LOGIC START
// ============================================

let allData = [];
let player = null;
let isFirstPlayAttempt = true;
let centerButtonTimer;

// --- DATA FETCH ---
fetch(API_URL).then(res => res.json()).then(data => {
    document.getElementById('loader').style.display = 'none';
    allData = data;
    switchTab('zee');
});

// --- TABS & RENDERING ---
function switchTab(tab) {
    const content = document.getElementById('content-area');
    content.innerHTML = '';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(tab !== 'search') document.getElementById('btn-' + tab)?.classList.add('active');

    if (tab === 'zee') renderFullPage('Zee Bangla Serials', 'zee');
    else if (tab === 'star') renderFullPage('Star Jalsha Serials', 'star');
}

function renderFullPage(title, keyword) {
    const container = document.getElementById('content-area');
    let items = allData.filter(d => d.category.toLowerCase().includes(keyword));
    if (items.length === 0) { container.innerHTML = `<div class="loader">No shows found.</div>`; return; }
    shuffleArray(items);
    container.innerHTML = `<div class="section-header">${title}</div><div class="video-grid">${items.map(item => createCard(item)).join('')}</div>`;
}

function createCard(item) {
    const itemString = encodeURIComponent(JSON.stringify(item));
    return `<div class="card" onclick="openEnhancedPlayer('${itemString}')">
    <img src="${item.thumbnail}" class="thumb" loading="lazy">
    <div class="info"><div class="vid-title">${item.title}</div><div class="vid-date">${formatPrettyDate(item.date)}</div></div>
    </div>`;
}

function formatPrettyDate(isoString) {
    if(!isoString) return "Recently Updated";
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) { return isoString; }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const content = document.getElementById('content-area');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (term === '') { switchTab('zee'); return; }
    let filtered = allData.filter(item => item.title.toLowerCase().includes(term));
    content.innerHTML = `<div class="section-header">Search Results</div><div class="video-grid">${filtered.map(item => createCard(item)).join('')}</div>`;
});

// ============================================
// PREMIUM PLAYER LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    player = new Plyr('#player', {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        autoplay: false,
        resetOnEnd: true
    });

    player.on('play', () => showCenterIcon('fa-play', false));
    player.on('pause', () => showCenterIcon('fa-pause', true));
});

window.openEnhancedPlayer = function(encodedItem) {
    const item = JSON.parse(decodeURIComponent(encodedItem));

    document.getElementById('video-info-title').innerText = item.title;
    document.getElementById('video-info-date').innerText = formatPrettyDate(item.date);
    document.getElementById('video-info-cat').innerText = item.category;

    player.source = {
        type: 'video',
        title: item.title,
        poster: item.thumbnail,
        sources: [{ src: item.videoUrl, type: 'video/mp4' }]
    };

    renderRecommendations(item.title);

    isFirstPlayAttempt = true;
    document.getElementById('initial-play-overlay').style.display = 'flex';
    document.getElementById('spinner-loader-screen').style.display = 'none';
    document.getElementById('browsing-layer').style.display = 'none';
    document.getElementById('player-virtual-page').style.display = 'flex';
    document.getElementById('player-virtual-page').scrollTop = 0;
}

function renderRecommendations(currentTitle) {
    const recContainer = document.getElementById('recommendations-grid');
    let recs = allData.filter(d => d.title !== currentTitle);
    shuffleArray(recs);
    recs = recs.slice(0, 12);
    recContainer.innerHTML = recs.map(item => createCard(item)).join('');
}

// --- SHARE FUNCTION ---
window.shareVideo = function() {
    const shareData = {
        title: 'Bangla Serial 24',
        text: 'Watch latest Serial videos!',
        url: 'https://serial24.github.io/'
    };
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        navigator.clipboard.writeText(shareData.url);
        alert('Link copied: ' + shareData.url);
    }
}

document.getElementById('exit-player-btn').addEventListener('click', () => {
    player.stop();
    document.getElementById('player-virtual-page').style.display = 'none';
    document.getElementById('browsing-layer').style.display = 'block';
    if (document.fullscreenElement) document.exitFullscreen();
});

document.getElementById('initial-play-btn').addEventListener('click', () => {
    if (isFirstPlayAttempt) {
        document.getElementById('initial-play-overlay').style.display = 'none';
        document.getElementById('spinner-loader-screen').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('spinner-loader-screen').style.display = 'none';
            player.play();
            isFirstPlayAttempt = false;
        }, 1000);
    }
});

function showCenterIcon(iconClass, show) {
    const btn = document.getElementById('center-play-pause-btn');
    btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
    if(show) {
        btn.style.opacity = '1';
        clearTimeout(centerButtonTimer);
        centerButtonTimer = setTimeout(() => { btn.style.opacity = '0'; }, 800);
    } else { btn.style.opacity = '0'; }
}
