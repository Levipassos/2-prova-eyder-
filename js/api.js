import { CONFIG } from './config.js';

function filterMoviesByYear(movies) {
    if (!movies || !Array.isArray(movies)) return [];
    
    return movies.filter(movie => {
        if (!movie.release_date) return false;
        const movieYear = new Date(movie.release_date).getFullYear();
        return movieYear === CONFIG.CURRENT_YEAR;
    });
}

export async function fetchAllSearchResults(query) {
    let allResults = [];
    let totalPages = 1;

    try {
        const firstPageUrl = `${CONFIG.BASE_URL}/search/movie?api_key=${CONFIG.API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1&year=${CONFIG.CURRENT_YEAR}`;
        const firstResponse = await fetch(firstPageUrl);
        const firstData = await firstResponse.json();
        
        if (!firstData.results || firstData.results.length === 0) {
            return [];
        }

        totalPages = Math.min(firstData.total_pages, 3);
        allResults = [...filterMoviesByYear(firstData.results)];

        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
            const pageUrl = `${CONFIG.BASE_URL}/search/movie?api_key=${CONFIG.API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}&year=${CONFIG.CURRENT_YEAR}`;
            pagePromises.push(
                fetch(pageUrl)
                    .then(r => r.json())
                    .then(pageData => pageData.results ? filterMoviesByYear(pageData.results) : [])
            );
        }

        const pagesData = await Promise.all(pagePromises);
        pagesData.forEach(filteredPageResults => {
            allResults = [...allResults, ...filteredPageResults];
        });

        return allResults;
    } catch (error) {
        console.error('Erro ao buscar resultados:', error);
        return allResults;
    }
}

export async function fetchNormalMovies(page, genre) {
    let url = `${CONFIG.BASE_URL}/discover/movie?api_key=${CONFIG.API_KEY}&language=pt-BR&sort_by=popularity.desc&page=${page}&primary_release_year=${CONFIG.CURRENT_YEAR}`;
    
    if (genre) {
        url += `&with_genres=${genre}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results) {
        throw new Error('Resposta sem resultados');
    }

    return filterMoviesByYear(data.results);
}

export async function fetchGenres() {
    const url = `${CONFIG.BASE_URL}/genre/movie/list?api_key=${CONFIG.API_KEY}&language=pt-BR`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.genres) {
        throw new Error('Resposta sem dados de gêneros');
    }
    
    return data.genres;
}