import { albums } from './data.js';

const grid = document.getElementById('gallery-grid');
const sentinel = document.getElementById('loading-sentinel');
const lightbox = document.getElementById('lightbox');
const lightboxContainer = document.getElementById('lightbox-media-container');
const closeBtn = document.getElementById('close-lightbox');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Menu & Drawer
const backBtn = document.getElementById('back-btn');
const sideDrawer = document.getElementById('side-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const closeDrawerBtn = document.getElementById('close-drawer');
const drawerItems = document.querySelectorAll('.drawer-item');
const pageTitle = document.getElementById('page-title');
const filterNav = document.querySelector('.filters');

let currentBatchEnd = 0;
const BATCH_SIZE = 24;
let currentFilter = 'all';
let filteredList = [];
let mediaFiles = []; // Currently loaded media files
let currentAlbum = null; // Name of the current album
let lightboxIndex = -1;
let favorites = new Set(JSON.parse(localStorage.getItem('gallery_favorites')) || []);

// Helper: Check if video
const isVideo = (filename) => {
    const lower = filename.toLowerCase();
    return lower.endsWith('.mov') || lower.endsWith('.mp4');
};

// Initial Setup
function init() {
    setupIntersectionObserver();
    setupEventListeners();
    renderAlbumList();
}

// Render Albums View
function renderAlbumList() {
    currentAlbum = null;
    mediaFiles = [];
    grid.innerHTML = '';
    grid.className = 'gallery-grid'; // Reset class if needed

    // UI Updates
    pageTitle.innerHTML = 'My <span class="accent">Gallery</span>';
    backBtn.style.display = 'none';
    filterNav.style.display = 'none'; // Hide filters in album view
    sentinel.style.display = 'none';

    const albumNames = Object.keys(albums).sort();

    albumNames.forEach(name => {
        const files = albums[name];
        if (files.length === 0) return;

        // Find first image for cover, or video if no images
        let coverFile = files.find(f => !isVideo(f)) || files[0];
        const coverPath = `Assets/${name}/${coverFile}`;
        const count = files.length;

        const card = document.createElement('div');
        card.className = 'album-card';
        card.innerHTML = `
            <div class="album-cover">
                ${isVideo(coverFile)
                ? `<video src="${coverPath}#t=0.1" preload="metadata" muted playsinline></video>`
                : `<img src="${coverPath}" loading="lazy" alt="${name}">`
            }
            </div>
            <div class="album-info">
                <div class="album-title">${name}</div>
                <div class="album-count">${count} items</div>
            </div>
        `;

        card.onclick = () => openAlbum(name);
        grid.appendChild(card);
    });
}

// Open Album (Gallery View)
function openAlbum(name) {
    currentAlbum = name;
    mediaFiles = albums[name];
    mediaFiles.sort();

    // UI Updates
    pageTitle.innerHTML = `${name} <span class="accent">(${mediaFiles.length})</span>`;
    backBtn.style.display = 'flex';
    filterNav.style.display = 'flex';

    updateCounts();
    updateFilter('all');
}

function updateCounts() {
    const total = mediaFiles.length;
    const videoCount = mediaFiles.filter(isVideo).length;
    const photoCount = total - videoCount;
    const favCount = favorites.size; // Note: Global favorites across all albums might allow filtering? 
    // Complexity: Favorites are just filenames in a Set. If filenames are not unique across albums, this is buggy.
    // Assuming filenames might clash, we ideally store "Album/Filename". But for now, keeping simple.

    // Update Drawer Counts
    document.getElementById('count-all').textContent = total;
    document.getElementById('count-favorites').textContent = favCount;
    document.getElementById('count-image').textContent = photoCount;
    document.getElementById('count-video').textContent = videoCount;
}

// Filtering
function updateFilter(filterType) {
    if (!currentAlbum) return;

    currentFilter = filterType;
    currentBatchEnd = 0;
    grid.innerHTML = ''; // Clear grid

    // Highlight active drawer item
    drawerItems.forEach(item => {
        item.classList.toggle('active', item.dataset.filter === filterType);
    });

    // Highlight active header filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filterType);
    });

    // Filter master list
    if (currentFilter === 'all') {
        filteredList = mediaFiles;
    } else if (currentFilter === 'video') {
        filteredList = mediaFiles.filter(isVideo);
    } else if (currentFilter === 'image') {
        filteredList = mediaFiles.filter(f => !isVideo(f));
    } else if (currentFilter === 'favorites') {
        // Filter favorites that belong to THIS album
        filteredList = mediaFiles.filter(f => favorites.has(`${currentAlbum}/${f}`));
    }

    loadMore();
    closeDrawer();
}

// Loading Items
function loadMore() {
    if (!currentAlbum) return;

    if (currentBatchEnd >= filteredList.length) {
        sentinel.style.display = 'none';
        return;
    }
    sentinel.style.display = 'flex';
    sentinel.innerHTML = '<div class="spinner"></div>';

    const nextBatchEnd = Math.min(currentBatchEnd + BATCH_SIZE, filteredList.length);
    const batch = filteredList.slice(currentBatchEnd, nextBatchEnd);

    const fragment = document.createDocumentFragment();

    batch.forEach((filename, batchIndex) => {
        const globalIndex = currentBatchEnd + batchIndex;
        const card = createCard(filename, globalIndex);
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    currentBatchEnd = nextBatchEnd;
}

function createCard(filename, index) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.dataset.index = index;

    const srcPath = `Assets/${currentAlbum}/${filename}`;
    // const favoriteKey = `${currentAlbum}/${filename}`; // Unused if fav button removed

    // Download Button
    const dlBtn = document.createElement('a');
    dlBtn.className = 'dl-btn';
    dlBtn.href = srcPath;
    dlBtn.download = filename;
    dlBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    dlBtn.onclick = (e) => e.stopPropagation();

    let content = '';
    if (isVideo(filename)) {
        content = `
            <video src="${srcPath}#t=0.1" preload="metadata" muted playsinline></video>
            <div class="icon-play">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
        `;
    } else {
        content = `<img src="${srcPath}" loading="lazy" alt="Gallery Item">`;
    }

    card.innerHTML = content;
    // card.appendChild(favBtn); // Removed
    card.appendChild(dlBtn);

    if (isVideo(filename)) {
        const video = card.querySelector('video');
        card.addEventListener('mouseenter', () => video.play().catch(() => { }));
        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    }

    card.addEventListener('click', () => openLightbox(index));
    return card;
}

function toggleFavorite(filename, btnElement) {
    const key = `${currentAlbum}/${filename}`;
    if (favorites.has(key)) {
        favorites.delete(key);
        btnElement.classList.remove('active');
    } else {
        favorites.add(key);
        btnElement.classList.add('active');
    }
    localStorage.setItem('gallery_favorites', JSON.stringify([...favorites]));
    updateCounts();

    if (currentFilter === 'favorites') {
        const card = btnElement.closest('.media-card');
        if (card) card.remove();
    }
}

// Drawer Control
function openDrawer() {
    sideDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
}
function closeDrawer() {
    sideDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
}

// Intersection Observer
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMore();
        }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
}

// Lightbox
function openLightbox(index) {
    lightboxIndex = index;
    updateLightboxContent();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    const video = lightboxContainer.querySelector('video');
    if (video) video.pause();
}

function updateLightboxContent() {
    if (lightboxIndex < 0 || lightboxIndex >= filteredList.length) return;
    const filename = filteredList[lightboxIndex];
    const srcPath = `Assets/${currentAlbum}/${filename}`;
    lightboxContainer.innerHTML = '';

    const downloadBtn = document.getElementById('download-lightbox');
    if (downloadBtn) {
        downloadBtn.href = srcPath;
        downloadBtn.download = filename;
    }

    if (isVideo(filename)) {
        const video = document.createElement('video');
        video.src = srcPath;
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '85vh';
        lightboxContainer.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = srcPath;
        lightboxContainer.appendChild(img);
    }
}

function nextImage() {
    if (lightboxIndex < filteredList.length - 1) {
        lightboxIndex++;
        updateLightboxContent();
    }
}
function prevImage() {
    if (lightboxIndex > 0) {
        lightboxIndex--;
        updateLightboxContent();
    }
}

// Event Listeners
function setupEventListeners() {
    // Nav
    backBtn.addEventListener('click', renderAlbumList);

    // Drawer
    closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerBackdrop.addEventListener('click', closeDrawer);

    // Sidebar items
    drawerItems.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            updateFilter(filter);
        });
    });

    // Header Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            updateFilter(filter);
        });
    });

    // Lightbox
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) closeLightbox();
    });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
}

// Run
init();
