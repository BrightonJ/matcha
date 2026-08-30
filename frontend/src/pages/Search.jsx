import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import UserCard from '../components/UserCard';
import { useAuth } from '../context/AuthContext';
import '../assets/css/search.css';

function Search() {
  const { user } = useAuth();
  const [originalUsers, setOriginalUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [filters, setFilters] = useState({ 
    ageMin: 18, ageMax: 80, popularityMin: 0, popularityMax: 1000, distance: 5000, tags: '', orderBy: 'popularity_score', orderDirection: 'DESC'
  });
  
  const token = localStorage.getItem('token');

  const loadSuggestions = async (loadMore = false) => {
    if (!loadMore) setLoading(true);
    try {
      const currentOffset = loadMore ? offset + 20 : 0;
      const response = await fetch(`${API_URL}/search/suggestions?limit=20&offset=${currentOffset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const newUsers = data.suggestions || [];
        
        if (loadMore) {
          setOriginalUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id));
            return [...prev, ...uniqueNewUsers];
          });
          setOffset(currentOffset);
        } else {
          setOriginalUsers(newUsers);
          setOffset(0);
        }
        
        setHasMore(newUsers.length >= 20);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (loadMore = false) => {
    if (!loadMore) {
      setIsSearching(true);
      setLoading(true);
    }
    
    try {
      const currentOffset = loadMore ? offset + 20 : 0;
      const searchParams = { ...filters, offset: currentOffset, limit: 20 };
      if (user?.latitude && user?.longitude) {
        searchParams.latitude = user.latitude;
        searchParams.longitude = user.longitude;
      }

      const queryParams = new URLSearchParams(searchParams).toString();
      const response = await fetch(`${API_URL}/search?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newUsers = data.users || [];
        
        if (loadMore) {
          setOriginalUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id));
            return [...prev, ...uniqueNewUsers];
          });
          setOffset(currentOffset);
        } else {
          setOriginalUsers(newUsers);
          setOffset(0);
        }
        
        setHasMore(newUsers.length >= 20);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (hasMore && !loading) {
          if (isSearching) handleSearch(true);
          else loadSuggestions(true);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, isSearching, offset, filters]);

  const calculateLocalDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (originalUsers.length === 0) {
      setDisplayedUsers([]);
      return;
    }

    let filtered = [...originalUsers];

    const minAge = filters.ageMin === '' ? 18 : Number(filters.ageMin);
    const maxAge = filters.ageMax === '' ? 100 : Number(filters.ageMax);
    const minPop = filters.popularityMin === '' ? 0 : Number(filters.popularityMin);
    const maxPop = filters.popularityMax === '' ? 1000 : Number(filters.popularityMax);

    filtered = filtered.filter(u => u.age >= minAge && u.age <= maxAge);
    filtered = filtered.filter(u => u.popularity_score >= minPop && u.popularity_score <= maxPop);
    
    if (user?.latitude && user?.longitude) {
      filtered = filtered.filter(u => {
        if (!u.latitude || !u.longitude) return true;
        const dist = calculateLocalDistance(user.latitude, user.longitude, u.latitude, u.longitude);
        return dist <= Number(filters.distance);
      });
    }

    if (filters.tags.trim() !== '') {
      const searchTags = filters.tags.split(',').map(t => t.trim().toLowerCase());
      filtered = filtered.filter(u => {
        if (!u.tags) return false;
        const userTags = u.tags.map(t => t.replace('#', '').toLowerCase());
        return searchTags.every(st => userTags.includes(st));
      });
    }

    filtered.sort((a, b) => {
      let valA, valB;
      
      if (filters.orderBy === 'common_tags') {
        valA = a.common_tags || 0;
        valB = b.common_tags || 0;
      } else if (filters.orderBy === 'location_city') {
        valA = a.location_city || '';
        valB = b.location_city || '';
        return filters.orderDirection === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (filters.orderBy === 'age') {
        valA = Number(a.age) || 0;
        valB = Number(b.age) || 0;
      } else {
        valA = Number(a[filters.orderBy]) || 0;
        valB = Number(b[filters.orderBy]) || 0;
      }
      
      return filters.orderDirection === 'ASC' ? valA - valB : valB - valA;
    });

    setDisplayedUsers(filtered);
  }, [filters, originalUsers, user]);

  const resetSearch = () => {
    setIsSearching(false);
    setOffset(0);
    setHasMore(true);
    setFilters({ ageMin: 18, ageMax: 80, popularityMin: 0, popularityMax: 1000, distance: 5000, tags: '', orderBy: 'popularity_score', orderDirection: 'DESC' });
    loadSuggestions();
  };

  const handleSortChange = (e) => {
    const newOrder = e.target.value;
    if (newOrder === 'age_asc') {
      setFilters({...filters, orderBy: 'age', orderDirection: 'ASC'});
    } else if (newOrder === 'age_desc') {
      setFilters({...filters, orderBy: 'age', orderDirection: 'DESC'});
    } else {
      setFilters({...filters, orderBy: newOrder, orderDirection: 'DESC'});
    }
  };

  return (
    <div className="search-container">
      <div className="search-filters">
        <h2>Filtres</h2>
        <div className="filter-group">
          <label>Âge ({filters.ageMin} - {filters.ageMax} ans)</label>
          <div className="range-inputs">
            <input type="number" min="18" max="100" value={filters.ageMin} onChange={(e) => setFilters({...filters, ageMin: e.target.value})} />
            <span>-</span>
            <input type="number" min="18" max="100" value={filters.ageMax} onChange={(e) => setFilters({...filters, ageMax: e.target.value})} />
          </div>
        </div>

        <div className="filter-group">
          <label>Fame Rating ({filters.popularityMin} - {filters.popularityMax})</label>
          <div className="range-inputs">
            <input type="number" min="0" max="1000" value={filters.popularityMin} onChange={(e) => setFilters({...filters, popularityMin: e.target.value})} />
            <span>-</span>
            <input type="number" min="0" max="1000" value={filters.popularityMax} onChange={(e) => setFilters({...filters, popularityMax: e.target.value})} />
          </div>
        </div>

        <div className="filter-group">
          <label>Distance Max ({filters.distance} km)</label>
          <input className="slider" type="range" min="1" max="5000" value={filters.distance} onChange={(e) => setFilters({...filters, distance: e.target.value})} />
        </div>

        <div className="filter-group">
          <label>Tags communs (ex: geek,vegan)</label>
          <input type="text" placeholder="Séparés par virgule" value={filters.tags} onChange={(e) => setFilters({...filters, tags: e.target.value})} />
        </div>

        <button className="apply-filters-btn" onClick={() => handleSearch(false)}>Recherche Globale</button>
        {isSearching && (
          <button className="apply-filters-btn" style={{ backgroundColor: '#ccc', marginTop: '0.5rem' }} onClick={resetSearch}>Retour aux Suggestions</button>
        )}
      </div>

      <div className="search-results">
        <div className="results-header">
          <h2>{isSearching ? 'Résultats de recherche' : 'Suggestions'}</h2>
          
          <select className="sort-select" onChange={handleSortChange}>
            <option value="popularity_score">Trier par Popularité</option>
            <option value="age_asc">Trier par Âge (Croissant)</option>
            <option value="age_desc">Trier par Âge (Décroissant)</option>
            <option value="location_city">Trier par Localisation</option>
            <option value="common_tags">Trier par Tags communs</option>
          </select>
        </div>

        {loading && displayedUsers.length === 0 ? (
          <div className="loading-spinner">Recherche de profils...</div>
        ) : (
          <>
            <div className="users-grid">
              {displayedUsers.length > 0 ? (
                displayedUsers.map(u => <UserCard key={u.id} user={u} />)
              ) : (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666" }}>Aucun profil ne correspond à vos critères.</p>
              )}
            </div>
            
            {loading && displayedUsers.length > 0 && (
              <div style={{ textAlign: 'center', margin: '2rem 0', gridColumn: "1 / -1" }}>
                <p>Chargement des profils suivants...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;