import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import API_URL from '../config/api';
import '../assets/css/search.css';

function Search() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(100);
  const [minFame, setMinFame] = useState(0);
  const [locationFilter, setLocationFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [userTags, setUserTags] = useState([]);

  // Récupérer les suggestions du backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/search/suggestions?limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des suggestions');
        }
        
        const data = await response.json();
        setUsers(data.suggestions || []);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Récupérer les tags de l'utilisateur courant
    const fetchUserTags = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tags/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const tags = await response.json();
          setUserTags(tags.map(t => `#${t.name}`));
        }
      } catch (err) {
        console.error('Erreur récupération tags:', err);
      }
    };

    fetchSuggestions();
    fetchUserTags();
  }, []);

  // Calculer le nombre de tags communs
  const getCommonTagsCount = (userTagsList) => {
    if (!userTagsList || !userTags) return 0;
    return userTagsList.filter(tag => userTags.includes(tag)).length;
  };

  // Filtrer et trier les utilisateurs
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filtre par âge (si birth_date existe)
    if (ageMin || ageMax) {
      result = result.filter(u => {
        if (!u.birth_date) return true;
        const userAge = new Date().getFullYear() - new Date(u.birth_date).getFullYear();
        const isValidMin = !ageMin || userAge >= ageMin;
        const isValidMax = !ageMax || userAge <= ageMax;
        return isValidMin && isValidMax;
      });
    }

    // Filtre par popularité
    if (minFame > 0) {
      result = result.filter(u => (u.popularity_score || 0) >= minFame);
    }

    // Filtre par localisation
    if (locationFilter) {
      result = result.filter(u => 
        u.location_city?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Filtre par tags
    if (tagsFilter.trim()) {
      const searchTags = tagsFilter.toLowerCase().split(',').map(t => t.trim());
      result = result.filter(u => 
        u.tags && searchTags.some(searchTag => 
          u.tags.some(userTag => userTag.toLowerCase().includes(searchTag))
        )
      );
    }

    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case 'age':
          const ageA = a.birth_date ? new Date().getFullYear() - new Date(a.birth_date).getFullYear() : 0;
          const ageB = b.birth_date ? new Date().getFullYear() - new Date(b.birth_date).getFullYear() : 0;
          return ageA - ageB;
        case 'fame':
          return (b.popularity_score || 0) - (a.popularity_score || 0);
        case 'location':
          return (a.location_city || '').localeCompare(b.location_city || '');
        case 'tags':
          return getCommonTagsCount(b.tags) - getCommonTagsCount(a.tags);
        case 'match':
        default:
          const scoreA = (a.popularity_score || 0) + (getCommonTagsCount(a.tags) * 10);
          const scoreB = (b.popularity_score || 0) + (getCommonTagsCount(b.tags) * 10);
          return scoreB - scoreA;
      }
    });

    return result;
  }, [users, ageMin, ageMax, minFame, locationFilter, tagsFilter, sortBy, userTags]);

  if (loading) {
    return (
      <div className="search-container">
        <div className="loading-spinner">Loading coffee lovers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="search-container">
      <aside className="search-filters">
        <h2>Filters</h2>
        <div className="filter-group">
          <label>Age Gap ({ageMin} - {ageMax})</label>
          <div className="range-inputs">
            <input 
              type="number" 
              value={ageMin} 
              onChange={(e) => setAgeMin(Number(e.target.value))} 
              min="18" 
              max="100" 
            />
            <span>-</span>
            <input 
              type="number" 
              value={ageMax} 
              onChange={(e) => setAgeMax(Number(e.target.value))} 
              min="18" 
              max="100" 
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Min Popularity: {minFame}</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={minFame} 
            onChange={(e) => setMinFame(Number(e.target.value))} 
            className="slider" 
          />
        </div>

        <div className="filter-group">
          <label>Location</label>
          <input 
            type="text" 
            placeholder="City" 
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tags (comma separated)</label>
          <input 
            type="text" 
            placeholder="#vegan, #geek..." 
            value={tagsFilter}
            onChange={(e) => setTagsFilter(e.target.value)}
          />
        </div>
      </aside>

      <section className="search-results">
        <div className="results-header">
          <h2>Suggested Matches</h2>
          <select 
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="match">Best Match</option>
            <option value="age">Age (Youngest)</option>
            <option value="location">Location (A-Z)</option>
            <option value="fame">Popularity</option>
            <option value="tags">Common Tags</option>
          </select>
        </div>

        <div className="users-grid">
          {filteredAndSortedUsers.length > 0 ? (
            filteredAndSortedUsers.map((u) => (
              <UserCard key={u.id} user={u} currentUserTags={userTags} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h3>No coffee lovers found with these exact filters.</h3>
              <p>Try widening your search criteria!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Search;
