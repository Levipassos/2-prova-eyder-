import { CONFIG } from './config.js';
import { state } from './state.js';
import { fetchAllSearchResults, fetchNormalMovies, fetchGenres } from './api.js';
import { toggleLoading, showError, hideError, displayMovies, updatePagination, populateGenres } from './dom.js';

async function loadGenres() {
    try {
        const genres = await fetchGenres();
        populateGenres(genres);
    } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
    }
}

async function fetchMovies() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    toggleLoading(true);
    hideError();

    try {
        let moviesToDisplay = [];
        let totalPages = 1;

        if (state.searchQuery && state.isSearchMode) {
            const startIndex = (state.currentPage - 1) * CONFIG.MOVIES_PER_PAGE;
            const endIndex = startIndex + CONFIG.MOVIES_PER_PAGE;
            moviesToDisplay = state.allSearchResults.slice(startIndex, endIndex);
            totalPages = Math.ceil(state.allSearchResults.length / CONFIG.MOVIES_PER_PAGE);
            
        } else if (state.searchQuery) {
            state.allSearchResults = await fetchAllSearchResults(state.searchQuery);
            state.totalSearchResults = state.allSearchResults.length;
            state.isSearchMode = true;
            state.currentPage = 1;
            
            if (state.allSearchResults.length === 0) {
                showError(`Nenhum filme de ${CONFIG.CURRENT_YEAR} encontrado para "${state.searchQuery}"`);
            }
            
            moviesToDisplay = state.allSearchResults.slice(0, CONFIG.MOVIES_PER_PAGE);
            totalPages = Math.ceil(state.allSearchResults.length / CONFIG.MOVIES_PER_PAGE);
            
        } else {
            state.isSearchMode = false;
            state.allSearchResults = [];
            
            moviesToDisplay = await fetchNormalMovies(state.currentPage, state.currentGenre);
            totalPages = 10;

            if (moviesToDisplay.length === 0) {
                showError(`Nenhum filme de ${CONFIG.CURRENT_YEAR} encontrado`);
            }
        }

        displayMovies(moviesToDisplay);
        updatePagination(state.currentPage, totalPages);
        
    } catch (error) {
        console.error('Erro:', error);
        showError(`Erro: ${error.message}`);
    } finally {
        state.isLoading = false;
        toggleLoading(false);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                state.searchQuery = query;
                state.currentPage = 1;
                state.isSearchMode = false;
                fetchMovies();
            } else {
                state.searchQuery = '';
                state.isSearchMode = false;
                state.allSearchResults = [];
                state.currentPage = 1;
                fetchMovies();
            }
        }
    });

    document.querySelector('.pagination button:first-child').addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            fetchMovies();
        }
    });

    document.querySelector('.pagination button:last-child').addEventListener('click', () => {
        state.currentPage++;
        fetchMovies();
    });

    document.getElementById('apply-filters').addEventListener('click', () => {
        state.currentGenre = document.getElementById('genre-select').value;
        state.searchQuery = '';
        state.isSearchMode = false;
        state.allSearchResults = [];
        state.currentPage = 1;
        fetchMovies();
        document.getElementById('filter-modal').classList.add('hidden');
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('genre-select').value = '';
        document.getElementById('search-input').value = '';
        state.currentGenre = '';
        state.searchQuery = '';
        state.isSearchMode = false;
        state.allSearchResults = [];
        state.currentPage = 1;
        fetchMovies();
        document.getElementById('filter-modal').classList.add('hidden');
    });

    document.getElementById('filter-toggle').addEventListener('click', () => {
        document.getElementById('filter-modal').classList.remove('hidden');
    });

    document.getElementById('close-filter').addEventListener('click', () => {
        document.getElementById('filter-modal').classList.add('hidden');
    });

    document.getElementById('filter-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.add('hidden');
        }
    });
}

async function init() {
    await loadGenres();
    await fetchMovies();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);