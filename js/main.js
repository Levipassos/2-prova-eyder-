import { CONFIG } from './config.js';
import { state } from './state.js';
import { 
    fetchAllSearchResults, 
    fetchNormalMovies, 
    fetchGenres,
    fetchAllSeriesSearchResults,
    fetchNormalSeries,
    fetchSeriesGenres
} from './api.js';
import { 
    toggleLoading, 
    showError, 
    hideError, 
    displayMixedContent,
    updatePagination, 
    populateGenres,
    populateSeriesGenres 
} from './dom.js';

async function loadGenres() {
    try {
        const [movieGenres, seriesGenres] = await Promise.all([
            fetchGenres(),
            fetchSeriesGenres()
        ]);
        populateGenres(movieGenres);
        populateSeriesGenres(seriesGenres);
    } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
    }
}

async function fetchContent() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    toggleLoading(true);
    hideError();

    try {
        let moviesToDisplay = [];
        let seriesToDisplay = [];
        let totalPages = 1;

        if (state.searchQuery && state.isSearchMode) {
            const startIndex = (state.currentPage - 1) * CONFIG.MOVIES_PER_PAGE;
            const endIndex = startIndex + CONFIG.MOVIES_PER_PAGE;
            
            let allResults = [...state.allSearchResults, ...state.allSeriesSearchResults];
            
            if (state.currentType) {
                allResults = allResults.filter(item => item.type === state.currentType);
            }
            
            const paginatedResults = allResults.slice(startIndex, endIndex);
            moviesToDisplay = paginatedResults.filter(item => item.type === 'movie');
            seriesToDisplay = paginatedResults.filter(item => item.type === 'series');
            totalPages = Math.ceil(allResults.length / CONFIG.MOVIES_PER_PAGE);
            
        } else if (state.searchQuery) {
            const [movies, series] = await Promise.all([
                fetchAllSearchResults(state.searchQuery),
                fetchAllSeriesSearchResults(state.searchQuery)
            ]);
            
            state.allSearchResults = movies.map(movie => ({...movie, type: 'movie'}));
            state.allSeriesSearchResults = series.map(seriesItem => ({...seriesItem, type: 'series'}));
            
            let allResults = [...state.allSearchResults, ...state.allSeriesSearchResults];
            
            if (state.currentType) {
                allResults = allResults.filter(item => item.type === state.currentType);
            }
            
            state.totalSearchResults = allResults.length;
            state.isSearchMode = true;
            state.currentPage = 1;
            
            if (state.totalSearchResults === 0) {
                showError(`Nenhum conteúdo de ${CONFIG.CURRENT_YEAR} encontrado para "${state.searchQuery}"`);
            }
            
            const paginatedResults = allResults.slice(0, CONFIG.MOVIES_PER_PAGE);
            moviesToDisplay = paginatedResults.filter(item => item.type === 'movie');
            seriesToDisplay = paginatedResults.filter(item => item.type === 'series');
            totalPages = Math.ceil(allResults.length / CONFIG.MOVIES_PER_PAGE);
            
        } else {
            state.isSearchMode = false;
            state.allSearchResults = [];
            state.allSeriesSearchResults = [];
            
            if (state.currentType === 'movie' || state.currentType === '') {
                moviesToDisplay = await fetchNormalMovies(state.currentPage, state.currentGenre);
            }
            
            if (state.currentType === 'series' || state.currentType === '') {
                seriesToDisplay = await fetchNormalSeries(state.currentPage, state.currentGenre);
            }
            
            totalPages = 10;

            if (moviesToDisplay.length === 0 && seriesToDisplay.length === 0) {
                showError(`Nenhum conteúdo de ${CONFIG.CURRENT_YEAR} encontrado`);
            }
        }

        displayMixedContent(moviesToDisplay, seriesToDisplay);
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
                fetchContent();
            } else {
                state.searchQuery = '';
                state.isSearchMode = false;
                state.allSearchResults = [];
                state.allSeriesSearchResults = [];
                state.currentPage = 1;
                fetchContent();
            }
        }
    });

    document.querySelector('.pagination button:first-child').addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            fetchContent();
        }
    });

    document.querySelector('.pagination button:last-child').addEventListener('click', () => {
        state.currentPage++;
        fetchContent();
    });

    document.getElementById('apply-filters').addEventListener('click', () => {
        state.currentGenre = document.getElementById('genre-select').value;
        state.currentType = document.getElementById('type-select').value;
        state.searchQuery = '';
        state.isSearchMode = false;
        state.allSearchResults = [];
        state.allSeriesSearchResults = [];
        state.currentPage = 1;
        fetchContent();
        document.getElementById('filter-modal').classList.add('hidden');
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('genre-select').value = '';
        document.getElementById('type-select').value = '';
        document.getElementById('search-input').value = '';
        state.currentGenre = '';
        state.currentType = '';
        state.searchQuery = '';
        state.isSearchMode = false;
        state.allSearchResults = [];
        state.allSeriesSearchResults = [];
        state.currentPage = 1;
        fetchContent();
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
    await fetchContent();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);