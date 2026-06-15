import { useState, useMemo } from "react";
import UserCard from "../components/UserCard";
import { calculateAge } from "../utils/age";
import mockUsers from "../mocks/users.json";
import "../assets/css/search.css";

function Search() {
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(100);
  const [minFame, setMinFame] = useState(0);
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("match");

  const allAvailableTags = useMemo(() => {
    const tags = new Set();
    mockUsers.forEach(u => {
      if (u.tags && Array.isArray(u.tags)) {
        u.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags);
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const filteredAndSortedUsers = useMemo(() => {
    const myProfile = JSON.parse(localStorage.getItem('mockProfileData') || '{}');
    const myTags = JSON.parse(localStorage.getItem('mockProfileTags') || '[]');
    
    const myGender = myProfile.gender || 'male';
    const myPref = myProfile.sexualPreferences || 'bisexual';

    let result = mockUsers.filter(user => {
      if (myPref !== 'bisexual' && user.gender !== myPref) return false;
      if (user.sexual_preferences !== 'bisexual' && user.sexual_preferences !== myGender) return false;

      const userAge = calculateAge(user.birth_date) || 25;
      if (userAge < ageMin || userAge > ageMax) return false;
      if ((user.popularity_score || 0) < minFame) return false;
      if (locationFilter && !user.location_city?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      
      if (selectedTags.length > 0) {
        const userTags = user.tags || [];
        const hasAllTags = selectedTags.every(tag => userTags.includes(tag));
        if (!hasAllTags) return false;
      }
      return true;
    });

    const getCommonTagsCount = (userTags) => {
      if (!userTags || myTags.length === 0) return 0;
      return userTags.filter(tag => myTags.includes(tag)).length;
    };

    result.sort((a, b) => {
      switch (sortBy) {
        case "age": return (calculateAge(a.birth_date) || 25) - (calculateAge(b.birth_date) || 25);
        case "fame": return (b.popularity_score || 0) - (a.popularity_score || 0);
        case "tags": return getCommonTagsCount(b.tags) - getCommonTagsCount(a.tags);
        default: return (b.popularity_score || 0) - (a.popularity_score || 0);
      }
    });

    return result;
  }, [ageMin, ageMax, minFame, locationFilter, selectedTags, sortBy]);

  return (
    <div className="search-container">
      <aside className="search-filters">
        <h2>Filters</h2>
        <div className="filter-group">
          <label>Age Gap ({ageMin} - {ageMax})</label>
          <div className="range-inputs">
            <input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} min="18" max="100"/>
            <span>-</span>
            <input type="number" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} min="18" max="100"/>
          </div>
        </div>
        <div className="filter-group">
          <label>Min Popularity: {minFame}</label>
          <input type="range" min="0" max="100" value={minFame} onChange={(e) => setMinFame(Number(e.target.value))} className="slider"/>
        </div>
        <div className="filter-group">
          <label>Location</label>
          <input type="text" placeholder="City" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}/>
        </div>
        <div className="filter-group">
          <label>Interests (Tags)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
            {allAvailableTags.map(tag => (
              <button 
                key={tag} 
                onClick={() => toggleTag(tag)}
                style={{ 
                  padding: '5px 10px', 
                  borderRadius: '15px', 
                  border: '1px solid var(--color-matcha)',
                  backgroundColor: selectedTags.includes(tag) ? 'var(--color-matcha)' : 'white',
                  color: selectedTags.includes(tag) ? 'white' : 'var(--color-matcha)'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="search-results">
        <div className="results-header">
          <h2>Suggested Matches</h2>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="match">Best Match</option>
            <option value="age">Age (Youngest)</option>
            <option value="fame">Popularity</option>
            <option value="tags">Common Tags</option>
          </select>
        </div>
        <div className="users-grid">
          {filteredAndSortedUsers.length > 0 ? (
            filteredAndSortedUsers.map((u) => <UserCard key={u.id} user={u} />)
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
              <h3>No profile matches your strict criteria.</h3>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Search;