import { CONFIG } from './config.js';

export function toggleLoading(show) {
    const spinner = document.querySelector('.loading-spinner-container');
    show ? spinner.classList.remove('hidden') : spinner.classList.add('hidden');
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

        movieCard.innerHTML = `
            <a href="detalhes.html?id=${movie.id}&type=movie" class="card-link">
                <img src="${poster}" alt="${movie.title}" class="card-poster">
                <div class="card-info">
                    <h3 class="card-title">${movie.title}</h3>
                    <p class="card-meta">Tipo: Filme | Ano: ${year}</p>
                    <p class="card-rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</p>
                </div>
            </a>
        `;

        movieGrid.appendChild(movieCard);
    });
}

export function displaySeries(seriesList) {
    const movieGrid = document.querySelector('.movie-grid');
    
    if (!seriesList || seriesList.length === 0) {
        movieGrid.innerHTML = '<p class="no-results">Nenhuma série encontrada</p>';
        return;
    }

    movieGrid.innerHTML = '';

    seriesList.forEach(series => {
        const seriesCard = document.createElement('article');
        seriesCard.className = 'movie-card';

        const poster = series.poster_path 
            ? `${CONFIG.IMAGE_URL}${series.poster_path}`
            : 'https://via.placeholder.com/300x450/333/fff?text=Sem+Imagem';

        const year = series.first_air_date 
            ? new Date(series.first_air_date).getFullYear() 
            : 'N/A';

        const episodesInfo = series.number_of_episodes ? 
            ` | Episódios: ${series.number_of_episodes}` : '';
        
        seriesCard.innerHTML = `
            <a href="detalhes.html?id=${series.id}&type=series" class="card-link">
                <img src="${poster}" alt="${series.name}" class="card-poster">
                <div class="card-info">
                    <h3 class="card-title">${series.name}</h3>
                    <p class="card-meta">Tipo: Série | Ano: ${year}${episodesInfo}</p>
                    <p class="card-rating">⭐ ${series.vote_average?.toFixed(1) || 'N/A'}</p>
                </div>
            </a>
        `;

        movieGrid.appendChild(seriesCard);
    });
}

export function displayMixedContent(movies, series) {
    const movieGrid = document.querySelector('.movie-grid');
    const allContent = [];
    
    if (movies && movies.length > 0) {
        movies.forEach(movie => {
            allContent.push({
                ...movie,
                type: 'movie',
                displayTitle: movie.title,
                displayYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'
            });
        });
    }
    
    if (series && series.length > 0) {
        series.forEach(seriesItem => {
            allContent.push({
                ...seriesItem,
                type: 'series',
                displayTitle: seriesItem.name,
                displayYear: seriesItem.first_air_date ? new Date(seriesItem.first_air_date).getFullYear() : 'N/A'
            });
        });
    }
    
    if (allContent.length === 0) {
        movieGrid.innerHTML = '<p class="no-results">Nenhum conteúdo encontrado</p>';
        return;
    }

    allContent.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    movieGrid.innerHTML = '';

    allContent.forEach(item => {
        const card = document.createElement('article');
        card.className = 'movie-card';

        const poster = item.poster_path 
            ? `${CONFIG.IMAGE_URL}${item.poster_path}`
            : 'https://via.placeholder.com/300x450/333/fff?text=Sem+Imagem';

        const typeLabel = item.type === 'movie' ? 'Filme' : 'Série';
        const episodesInfo = item.type === 'series' && item.number_of_episodes ? 
            ` | Episódios: ${item.number_of_episodes}` : '';
        
        card.innerHTML = `
            <a href="detalhes.html?id=${item.id}&type=${item.type}" class="card-link">
                <img src="${poster}" alt="${item.displayTitle}" class="card-poster">
                <div class="card-info">
                    <h3 class="card-title">${item.displayTitle}</h3>
                    <p class="card-meta">Tipo: ${typeLabel} | Ano: ${item.displayYear}${episodesInfo}</p>
                    <p class="card-rating">⭐ ${item.vote_average?.toFixed(1) || 'N/A'}</p>
                </div>
            </a>
        `;

        movieGrid.appendChild(card);
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

export function populateSeriesGenres(genres) {
    const genreSelect = document.getElementById('genre-select');
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = `${genre.name} (Séries)`;
        genreSelect.appendChild(option);
    });
}