import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import UserCard from '../components/UserCard';
import '../assets/css/search.css';

function SearchProd() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ 
    ageMin: 18, 
    ageMax: 80, 
    popularityMin: 0, 
    popularityMax: 1000,
    tags: '',
    orderBy: 'popularity_score',
    orderDirection: 'DESC'
  });
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/search?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.users || []);
  };

  useEffect(() => { fetchUsers(); }, [filters]);

  return (
    <div className="search-container">
      <div className="filters-bar">
        <input type="number" placeholder="Âge Min" onChange={(e) => setFilters({...filters, ageMin: e.target.value})} />
        <input type="number" placeholder="Âge Max" onChange={(e) => setFilters({...filters, ageMax: e.target.value})} />
        <input type="text" placeholder="Tags (ex: geek,sport)" onChange={(e) => setFilters({...filters, tags: e.target.value})} />
        
        <select onChange={(e) => setFilters({...filters, orderBy: e.target.value})}>
          <option value="popularity_score">Popularité</option>
          <option value="age">Âge</option>
          <option value="location_city">Localisation</option>
        </select>
        
        <button onClick={fetchUsers}>Appliquer</button>
      </div>

      <div className="results-grid">
        {users.length > 0 ? users.map(u => <UserCard key={u.id} user={u} />) : <p>Aucun profil trouvé.</p>}
      </div>
    </div>
  );
}

export default SearchProd;