import { CONFIG } from './config.js';
import { fetchSeriesDetails, fetchSeasonDetails } from './api.js';

let currentItemId = null;
let currentMediaType = null;

export function initDetailsPage() {
    currentItemId = getURLParam('id');
    currentMediaType = getURLParam('type');
    
    if (!validateParams()) return;
    
    loadContent();
    setupThemeToggle();
}

function validateParams() {
    if (!currentItemId) {
        showError('ID do conteúdo não encontrado na URL.');
        return false;
    }
    if (!currentMediaType) {
        showError('Tipo de conteúdo não especificado na URL.');
        return false;
    }
    return true;
}

async function loadContent() {
    showLoadingState();
    try {
        const content = await fetchContent();
        displayContent(content);
    } catch (error) {
        handleContentError(error);
    } finally {
        hideLoadingState();
    }
}

async function fetchContent() {
    switch (currentMediaType) {
        case 'movie':
            return await fetchMovieDetails();
        case 'series':
            return await fetchSeriesDetails(currentItemId);
        default:
            throw new Error(`Tipo de mídia não suportado: ${currentMediaType}`);
    }
}

async function fetchMovieDetails() {
    const url = `${CONFIG.BASE_URL}/movie/${currentItemId}?api_key=${CONFIG.API_KEY}&language=pt-BR`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Filme não encontrado');
    return await response.json();
}

function displayContent(content) {
    currentMediaType === 'movie' ? displayMovieContent(content) : displaySeriesContent(content);
    showContent();
}

function displayMovieContent(movie) {
    updatePoster(movie.poster_path, movie.title);
    updateTitle(movie.title, movie.release_date);
    updateMetadata(formatMovieMetadata(movie));
    updateRating(movie.vote_average);
    updateSynopsis(movie.overview);
    hideSeasonsSection();
}

function displaySeriesContent(series) {
    updatePoster(series.poster_path, series.name);
    updateTitle(series.name, series.first_air_date);
    updateMetadata(formatSeriesMetadata(series));
    updateRating(series.vote_average);
    updateSynopsis(series.overview);
    loadSeasons(series);
}

function formatMovieMetadata(movie) {
    const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'Gênero não disponível';
    const runtime = movie.runtime ? `${movie.runtime} min` : 'Duração não disponível';
    return `Tipo: Filme | Gênero: ${genres} | Duração: ${runtime}`;
}

function formatSeriesMetadata(series) {
    const genres = series.genres ? series.genres.map(g => g.name).join(', ') : 'Gênero não disponível';
    const seasons = series.number_of_seasons || 0;
    const episodes = series.number_of_episodes || 0;
    return `Tipo: Série | Gênero: ${genres} | Temporadas: ${seasons} | Episódios: ${episodes}`;
}

function updatePoster(posterPath, title) {
    const poster = document.querySelector('.details-poster');
    poster.src = posterPath ? `${CONFIG.IMAGE_URL}${posterPath}` : 'https://via.placeholder.com/300x450/333/fff?text=Sem+Imagem';
    poster.alt = `Pôster de ${title}`;
}

function updateTitle(title, date) {
    const titleElement = document.querySelector('.details-title');
    const year = date ? new Date(date).getFullYear() : 'N/A';
    titleElement.textContent = `${title} (${year})`;
}

function updateMetadata(metadata) {
    const meta = document.querySelector('.details-meta');
    meta.textContent = metadata;
}

function updateRating(rating) {
    const ratingElement = document.querySelector('.rating-value');
    ratingElement.textContent = rating ? rating.toFixed(1) : 'N/A';
}

function updateSynopsis(synopsis) {
    const synopsisElement = document.querySelector('.synopsis');
    const missingAlert = document.querySelector('.missing-data-alert');
    if (synopsis) {
        synopsisElement.textContent = synopsis;
        missingAlert.classList.add('hidden');
    } else {
        synopsisElement.textContent = '';
        missingAlert.classList.remove('hidden');
    }
}

async function loadSeasons(series) {
    const seasonsSection = document.querySelector('.seasons-section');
    const seasonList = document.querySelector('.season-list');
    
    if (!series.seasons || series.seasons.length === 0) {
        seasonsSection.classList.add('hidden');
        return;
    }

    seasonsSection.classList.remove('hidden');
    seasonList.innerHTML = '';

    const sortedSeasons = getSortedSeasons(series.seasons);
    const seasonsToLoad = sortedSeasons.slice(0, 3);

    for (const season of seasonsToLoad) {
        await loadSeason(series.id, season, seasonList);
    }
}

function getSortedSeasons(seasons) {
    return [...seasons]
        .filter(season => season.season_number !== 0)
        .sort((a, b) => a.season_number - b.season_number);
}

async function loadSeason(seriesId, season, container) {
    try {
        const seasonDetails = await fetchSeasonDetails(seriesId, season.season_number);
        displaySeason(seasonDetails, container);
    } catch (error) {
        console.error(`Erro ao carregar temporada ${season.season_number}:`, error);
        displaySeasonBasic(season, container);
    }
}

function displaySeason(seasonDetails, container) {
    const seasonItem = document.createElement('div');
    seasonItem.className = 'season-item';
    seasonItem.innerHTML = generateSeasonHTML(seasonDetails);
    container.appendChild(seasonItem);
}

function displaySeasonBasic(season, container) {
    const seasonItem = document.createElement('div');
    seasonItem.className = 'season-item';
    seasonItem.innerHTML = generateBasicSeasonHTML(season);
    container.appendChild(seasonItem);
}

function generateSeasonHTML(seasonDetails) {
    const episodesHTML = seasonDetails.episodes
        .map(episode => generateEpisodeHTML(episode))
        .join('');
    return `
        <details>
            <summary>
                <strong>Temporada ${seasonDetails.season_number}</strong>
                <span class="season-meta">${seasonDetails.episodes.length} episódios</span>
            </summary>
            <div class="episode-list">${episodesHTML}</div>
        </details>
    `;
}

function generateBasicSeasonHTML(season) {
    return `
        <details>
            <summary>
                <strong>Temporada ${season.season_number}</strong>
                <span class="season-meta">${season.episode_count} episódios</span>
            </summary>
            <div class="episode-list"><p>Informações detalhadas não disponíveis</p></div>
        </details>
    `;
}

function generateEpisodeHTML(episode) {
    const synopsisHTML = episode.overview ? `<p class="episode-synopsis">${episode.overview}</p>` : '';
    return `
        <div class="episode-item">
            <div class="episode-header">
                <span class="episode-number">Ep. ${episode.episode_number}</span>
                <span class="episode-title">${episode.name}</span>
                <span class="episode-rating">⭐ ${episode.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>${synopsisHTML}
        </div>
    `;
}

function showLoadingState() {
    toggleLoading(true);
    hideError();
    hideContent();
}

function hideLoadingState() {
    toggleLoading(false);
}

function showContent() {
    document.querySelector('.details-section').classList.remove('hidden');
}

function hideContent() {
    document.querySelector('.details-section').classList.add('hidden');
}

function hideSeasonsSection() {
    document.querySelector('.seasons-section').classList.add('hidden');
}

function toggleLoading(show) {
    const spinner = document.querySelector('.loading-spinner-container');
    show ? spinner.classList.remove('hidden') : spinner.classList.add('hidden');
}

function getURLParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function handleContentError(error) {
    console.error('Erro ao carregar detalhes:', error);
    showError('Erro ao carregar os detalhes do conteúdo.');
}

function showError(message) {
    const errorDiv = document.querySelector('.error-message');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.querySelector('.error-message').classList.add('hidden');
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '🌙';
        }
    });
}

document.addEventListener('DOMContentLoaded', initDetailsPage);