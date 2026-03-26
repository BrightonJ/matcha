import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import mockUsers from '../mocks/users.json';
import '../assets/css/search.css';

function Search() {
  const { user } = useAuth();

  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(100);
  const [minFame, setMinFame] = useState(0);
  const [locationFilter, setLocationFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');
  const [sortBy, setSortBy] = useState('match');

  const currentUserTags = ['#coffee', '#vegan'];

  const getCommonTagsCount = (userTags) => {
    return userTags.filter(tag => currentUserTags.includes(tag)).length;
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = mockUsers.filter(u => {
      const isAgeValid = u.age >= ageMin && u.age <= ageMax;
      const isFameValid = u.fameRating >= minFame;
      const isLocationValid = u.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      let hasTags = true;
      if (tagsFilter.trim() !== '') {
        const searchTags = tagsFilter.toLowerCase().split(',').map(t => t.trim());
        hasTags = searchTags.some(searchTag => 
          u.tags.some(userTag => userTag.toLowerCase().includes(searchTag))
        );
      }

      return isAgeValid && isFameValid && isLocationValid && hasTags;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'age':
          return a.age - b.age;
        case 'fame':
          return b.fameRating - a.fameRating;
        case 'location':
          return a.location.localeCompare(b.location);
        case 'tags':
          return getCommonTagsCount(b.tags) - getCommonTagsCount(a.tags);
        case 'match':
        default:
          const scoreA = a.fameRating + (getCommonTagsCount(a.tags) * 10);
          const scoreB = b.fameRating + (getCommonTagsCount(b.tags) * 10);
          return scoreB - scoreA;
      }
    });

    return result;
  }, [ageMin, ageMax, minFame, locationFilter, tagsFilter, sortBy]);

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
          <label>Min Fame Rating: {minFame}</label>
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
            placeholder="City or Zip" 
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
            <option value="fame">Fame Rating</option>
            <option value="tags">Common Tags</option>
          </select>
        </div>

        <div className="users-grid">
          {filteredAndSortedUsers.length > 0 ? (
            filteredAndSortedUsers.map((u) => (
              <UserCard key={u.id} user={u} />
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