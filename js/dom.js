import { CONFIG } from './config.js';

export function toggleLoading(show) {
    const spinner = document.querySelector('.loading-spinner-container');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

export function showError(message) {
    const errorDiv = document.querySelector('.error-message');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}

export function hideError() {
    const errorDiv = document.querySelector('.error-message');
    errorDiv.classList.add('hidden');
}

export function displayMovies(movies) {
    const movieGrid = document.querySelector('.movie-grid');
    
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p class="no-results">Nenhum filme encontrado</p>';
        return;
    }

    movieGrid.innerHTML = '';

    movies.forEach(movie => {
        const movieCard = document.createElement('article');
        movieCard.className = 'movie-card';

        const poster = movie.poster_path 
            ? `${CONFIG.IMAGE_URL}${movie.poster_path}`
            : 'https://via.placeholder.com/300x450/333/fff?text=Sem+Imagem';

        const year = movie.release_date 
            ? new Date(movie.release_date).getFullYear() 
            : 'N/A';

        const yearClass = year === CONFIG.CURRENT_YEAR ? 'current-year' : 'other-year';
        
        movieCard.innerHTML = `
            <div class="card-link">
                <img src="${poster}" alt="${movie.title}" class="card-poster">
                <div class="card-info">
                    <h3 class="card-title">${movie.title} <span class="year-badge ${yearClass}">${year}</span></h3>
                    <p class="card-meta">Tipo: Filme</p>
                    <p class="card-rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</p>
                </div>
            </div>
        `;

        movieGrid.appendChild(movieCard);
    });
}

export function updatePagination(currentPage, totalPages) {
    const pagination = document.querySelector('.pagination');
    const prevButton = pagination.querySelector('button:first-child');
    const nextButton = pagination.querySelector('button:last-child');
    const pageInfo = pagination.querySelector('span');

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages || totalPages === 0;
}

export function populateGenres(genres) {
    const genreSelect = document.getElementById('genre-select');
    genreSelect.innerHTML = '<option value="">Todos os Gêneros</option>';
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
}