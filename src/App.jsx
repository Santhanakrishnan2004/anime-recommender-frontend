
"use client"
import './index.css';
import { useState, useEffect, createContext, useContext } from "react"
import { Sun, Moon, User, Heart, List, Plus, X, Star, MonitorPlay, CheckCircle2, Calendar } from "lucide-react"
// import { Plus, X, Star } from "lucide-react"
const API_BASE = "https://anime-recommender-luyz.onrender.com"
// Theme Context
const ThemeContext = createContext()

// Auth Context
const AuthContext = createContext()

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.setAttribute("data-theme", "light")
    }

    // Check for saved user
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const toggleTheme = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    const theme = newMode ? "dark" : "light"
    localStorage.setItem("theme", theme)
    document.documentElement.setAttribute("data-theme", theme)
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <AuthContext.Provider value={{ user, setUser, showAuth, setShowAuth }}>
        <div className="app">
          <Header />
          {showAuth ? <AuthModal /> : <MainContent />}
        </div>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}

function Header() {
  const { darkMode, toggleTheme } = useContext(ThemeContext)
  const { user, setUser, setShowAuth } = useContext(AuthContext)

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return (
    <header className="app-header">
      <div
        className="container"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Anime Recommender</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>Welcome, {user.username}!</span>
              <button onClick={handleLogout} className="btn btn--primary">
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="btn btn--primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <User size={18} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function AuthModal() {
  const { darkMode } = useContext(ThemeContext)
  const { setUser, setShowAuth } = useContext(AuthContext)
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register"
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
        setShowAuth(false)
      } else {
        setError(data.error || "Authentication failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{isLogin ? "Login" : "Register"}</h2>
          <button onClick={() => setShowAuth(false)} className="btn btn--icon btn--ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input"
            required
          />

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn--primary btn--block">
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="link" style={{ marginLeft: 6 }}>
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  )
}

function MainContent() {
  const { darkMode } = useContext(ThemeContext)
  const { user } = useContext(AuthContext)
  const [currentView, setCurrentView] = useState("home")
  const [homeAnime, setHomeAnime] = useState([])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [genreFilter, setGenreFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userLists, setUserLists] = useState({
    favorites: [],
    watching: [],
    completed: [],
    planned: [],
  })

  useEffect(() => {
    loadHomeAnime()
    if (user) {
      loadUserLists()
    }
  }, [user])

  const loadHomeAnime = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/home?limit=20`)
      const data = await response.json()
      setHomeAnime(Array.isArray(data) ? data : [])
    } catch (err) {
      setError("Failed to load anime data")
    } finally {
      setLoading(false)
    }
  }

  const loadUserLists = async () => {
    if (!user) return
    try {
      const response = await fetch(`${API_BASE}/user/lists`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUserLists(data)
      }
    } catch (err) {
      console.error("Failed to load user lists:", err)
    }
  }

  useEffect(() => {
    if (query.length > 1) {
      fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setSuggestions([]))
    } else {
      setSuggestions([])
    }
  }, [query])

  const handleSelect = async (anime) => {
    setSelectedAnime(anime)
    setQuery(anime.title_romaji || "")
    setSuggestions([])

    if (anime.title_romaji) {
      try {
        const response = await fetch(`${API_BASE}/recommend?title=${encodeURIComponent(anime.title_romaji)}`)
        const data = await response.json()
        setRecommendations(Array.isArray(data) ? data : [])
      } catch (err) {
        setRecommendations([])
      }
    }
  }

  const handleFilter = async () => {
    setLoading(true)
    try {
      const url = genreFilter.trim()
        ? `${API_BASE}/filter?genres=${encodeURIComponent(genreFilter)}`
        : `${API_BASE}/home?limit=20`

      const response = await fetch(url)
      const data = await response.json()
      setHomeAnime(Array.isArray(data) ? data : [])
    } catch (err) {
      setError("Failed to filter anime")
    } finally {
      setLoading(false)
    }
  }

  if (loading && homeAnime.length === 0) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: 12 }}>Loading anime...</p>
        </div>
      </div>
    )
  }
const GENRES = [
  "Action", "Adventure", "Drama", "Sci-Fi", "Mystery", "Comedy",
  "Supernatural", "Fantasy", "Sports", "Romance", "Slice of Life",
  "Horror", "Psychological", "Thriller", "Ecchi", "Mecha",
  "Music", "Mahou Shoujo"
]

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      {/* Navigation */}
      <div style={{ marginBottom: 24 }}>
        <div className="tabs" style={{ justifyContent: "center", marginBottom: 24 }}>
          <button onClick={() => setCurrentView("home")} className={`tab ${currentView === "home" ? "is-active" : ""}`}>
            Home
          </button>
          {user && (
            <button
              onClick={() => setCurrentView("lists")}
              className={`tab ${currentView === "lists" ? "is-active" : ""}`}
            >
              <List size={18} />
              My Lists
            </button>
          )}
        </div>

        {/* Search & Filter - only show on home view */}
        {currentView === "home" && (
          <>
            <div style={{ maxWidth: 560, margin: "0 auto 16px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search anime..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input input--pill"
              />
              {suggestions.length > 0 && (
                <ul className="suggestions">
                  {suggestions.map((anime, index) => (
                    <li key={anime.id || index} className="suggestions__item" onClick={() => handleSelect(anime)}>
                      {anime.title_romaji || "Unknown Title"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

          <div style={{ maxWidth: 720, margin: "0 auto 24px" }}>
  <p style={{ marginBottom: 8, fontWeight: 600 }}>Filter by Genre:</p>
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {GENRES.map((g) => (
      <button
        key={g}
        onClick={() => {
          setGenreFilter(g)
          handleFilter()
        }}
        className={`btn btn--sm ${genreFilter === g ? "btn--primary" : "btn--ghost"}`}
        style={{ padding: "6px 12px", borderRadius: 20 }}
      >
        {g}
      </button>
    ))}
  </div>
</div>

          </>
        )}
      </div>

      {currentView === "home" ? (
        <HomeView
          homeAnime={homeAnime}
          selectedAnime={selectedAnime}
          recommendations={recommendations}
          onSelectAnime={handleSelect}
          onClearSelection={() => setSelectedAnime(null)}
          userLists={userLists}
          onUpdateLists={loadUserLists}
        />
      ) : (
        <UserListsView userLists={userLists} onUpdateLists={loadUserLists} />
      )}
    </div>
  )
}

function HomeView({
  homeAnime,
  selectedAnime,
  recommendations,
  onSelectAnime,
  onClearSelection,
  userLists,
  onUpdateLists,
}) {
  const { darkMode } = useContext(ThemeContext)

  if (selectedAnime) {
    return (
      <AnimeDetail
        anime={selectedAnime}
        recommendations={recommendations}
        onBack={onClearSelection}
        userLists={userLists}
        onUpdateLists={onUpdateLists}
        
      />
    )
  }

  return (
    <div className="container">
      <div className="poster-grid">
        {Array.isArray(homeAnime) &&
          homeAnime.map((anime, index) => (
            <AnimeCard
              key={anime.id || index}
              anime={anime}
              onClick={() => onSelectAnime(anime)}
              userLists={userLists}
              onUpdateLists={onUpdateLists}
            />
          ))}
      </div>
    </div>
  )
}

function AnimeCard({ anime, onClick, userLists, onUpdateLists }) {
  const { darkMode } = useContext(ThemeContext)
  const { user } = useContext(AuthContext)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const isInList = (listName) => {
    return userLists[listName]?.some((item) => item.anime_id === anime.id) || false
  }

  return (
    <div className="card">
      <div onClick={onClick} style={{ cursor: "pointer", position: "relative" }}>
        <img
          src={anime.cover_image || "/placeholder.jpg"}
          alt={anime.title_romaji || "Unknown"}
          className="card__img"
        />

        <div className="card__badge">★ {anime.average_score || "N/A"}</div>
        <div className="card__overlay" />
      </div>

      <div className="card__body">
        <h3 className="card__title">{anime.title_romaji || "Unknown Title"}</h3>
        <p className="card__meta">Genres: {anime.genres || "Unknown"}</p>

        {user && (
          <div style={{ marginTop: 8, position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAddMenu(!showAddMenu)
              }}
              className="btn btn--primary btn--sm btn--block"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Plus size={14} />
              Add to List
            </button>

            {showAddMenu && (
              <AddToListMenu
                anime={anime}
                userLists={userLists}
                onClose={() => setShowAddMenu(false)}
                onUpdate={onUpdateLists}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddToListMenu({ anime, userLists, onClose, onUpdate }) {
  const { darkMode } = useContext(ThemeContext)
  const { user } = useContext(AuthContext)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)

  const addToList = async (listType) => {
    if (!user) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/user/lists/${listType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          anime_id: anime.id,
          anime_title: anime.title_romaji,
          cover_image: anime.cover_image,
          score: score,
        }),
      })
      if (response.ok) {
        onUpdate()
        onClose()
      }
    } catch (err) {
      console.error("Failed to add to list:", err)
    } finally {
      setLoading(false)
    }
  }

  const isInList = (listName) => {
    return userLists[listName]?.some((item) => item.anime_id === anime.id) || false
  }

  const lists = [
    { key: "favorites", label: "Favorites", Icon: Heart },
    { key: "watching", label: "Watching", Icon: MonitorPlay },
    { key: "completed", label: "Completed", Icon: CheckCircle2 },
    { key: "planned", label: "Plan to Watch", Icon: Calendar },
  ]

  return (
    <div className="add-menu">
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Add to:</span>
          <button onClick={onClose} className="btn btn--icon btn--ghost" aria-label="Close add to list">
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          {lists.map(({ key, label, Icon }) => {
            const disabled = loading || isInList(key)
            return (
              <button
                key={key}
                onClick={() => addToList(key)}
                disabled={disabled}
                className="add-menu__item"
                style={disabled ? { opacity: 0.75, cursor: "not-allowed" } : undefined}
              >
                <Icon size={14} />
                {label} {isInList(key) && "✓"}
              </button>
            )
          })}
        </div>

        <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Your Score (1-10):</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setScore(num)}
                className={`star-button ${score >= num ? "is-on" : ""}`}
                aria-label={`Set score ${num}`}
                style={{ padding: 2 }}
              >
                <Star size={12} fill={score >= num ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnimeDetail({ anime, recommendations, onBack, userLists, onUpdateLists }) {
  const { darkMode } = useContext(ThemeContext)
  const { user } = useContext(AuthContext)
  const [showAddMenu, setShowAddMenu] = useState(false)

  return (
    <div className="container" style={{ maxWidth: 960 }}>
      <button onClick={onBack} className="btn btn--ghost" style={{ marginBottom: 16 }}>
        ← Back to Browse
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <img
              src={anime.cover_image || "/placeholder.jpg"}
              alt={anime.title_romaji || "Unknown"}
              className="detail__poster"
            />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
                {anime.title_romaji || "Unknown Title"}
              </h2>
              <p style={{ marginBottom: 12, lineHeight: 1.6 }}>{anime.description || "No description available"}</p>
              <div style={{ display: "grid", gap: 6 }}>
                <p>
                  <strong>Genres:</strong> {anime.genres || "Unknown"}
                </p>
                <p>
                  <strong>Episodes:</strong> {anime.episodes || "Unknown"}
                </p>
                <p>
                  <strong>Score:</strong> {anime.average_score || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {anime.status || "Unknown"}
                </p>
              </div>
              
              {/* Add to List button for the selected anime */}
              {user && (
                <div style={{ marginTop: 16, position: "relative" }}>
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="btn btn--primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Plus size={16} />
                    Add to List
                  </button>

                  {showAddMenu && (
                    <AddToListMenu
                      anime={anime}
                      userLists={userLists}
                      onClose={() => setShowAddMenu(false)}
                      onUpdate={onUpdateLists}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Recommendations:</h3>
            <div className="poster-grid">
              {recommendations.map((rec, index) => (
                <AnimeCard
                  key={rec.id || index}
                  anime={rec}
                  onClick={() => window.location.reload()}
                  userLists={userLists}
                  onUpdateLists={onUpdateLists}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UserListsView({ userLists, onUpdateLists }) {
  const { darkMode } = useContext(ThemeContext)
  const [activeTab, setActiveTab] = useState("favorites")

  const tabs = [
    { key: "favorites", label: "Favorites", Icon: Heart },
    { key: "watching", label: "Currently Watching", Icon: MonitorPlay },
    { key: "completed", label: "Completed", Icon: CheckCircle2 },
    { key: "planned", label: "Plan to Watch", Icon: Calendar },
  ]

  const currentList = userLists[activeTab] || []

  return (
    <div className="container">
      <div className="tabs" style={{ marginBottom: 24 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab ${activeTab === tab.key ? "is-active" : ""}`}
          >
            <tab.Icon size={16} />
            {tab.label}
            <span className="badge">
              {activeTab === tab.key ? currentList.length : (userLists[tab.key] || []).length}
            </span>
          </button>
        ))}
      </div>

      <div className="poster-grid">
        {currentList.map((item, index) => (
          <UserListItem key={item.anime_id || index} item={item} listType={activeTab} onUpdate={onUpdateLists} />
        ))}
      </div>

      {currentList.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
          <p>No anime in your {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} list yet.</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Start browsing to add some!</p>
        </div>
      )}
    </div>
  )
}

function UserListItem({ item, listType, onUpdate }) {
  const { darkMode } = useContext(ThemeContext)
  const { user } = useContext(AuthContext)

  const removeFromList = async () => {
    if (!user) return

    try {
      const response = await fetch(`${API_BASE}/user/lists/${listType}/${item.anime_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error("Failed to remove from list:", err)
    }
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <img
          src={item.cover_image || "/placeholder.jpg"}
          alt={item.anime_title || "Unknown"}
          className="card__img"
          style={{ aspectRatio: "auto", height: 256, width: "100%", objectFit: "cover" }}
        />

        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 8 }}>
          <button onClick={removeFromList} className="btn btn--icon btn--danger" aria-label="Remove from list">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="card__body">
        <h3 className="card__title">{item.anime_title || "Unknown Title"}</h3>
        {item.score > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "var(--star)" }}>
            <Star size={12} fill="currentColor" />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.score}/10</span>
          </div>
        )}
        <p className="card__meta" style={{ marginTop: 6 }}>
          Added: {item.added_date ? new Date(item.added_date).toLocaleDateString() : "Unknown"}
        </p>
      </div>
    </div>
  )
}

export default App
